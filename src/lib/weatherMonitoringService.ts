import { weatherService, destinationCoordinates, WeatherData } from '@/lib/weatherService';
import { getDbService } from '@/lib/databaseService';
import { Destination } from '@/types';
import { broadcast } from './messagingService';

/**
 * Interface definition for a weather monitoring service.
 */
interface WeatherMonitoringService {
  checkWeatherNow: () => Promise<void>;
  isRunning: boolean;
}

/**
 * Service for monitoring weather conditions across all registered destinations.
 * Handles periodic checks, data caching, and alert generation.
 */
class WeatherMonitor implements WeatherMonitoringService {
  private lastCheckedData: Map<string, WeatherData & { timestamp: number }> = new Map();
  private lastApiCall: number = 0;
  private apiCallDelay: number = 10000; // 10 seconds between API calls
  private checkInterval: number = 21600000; // 6 hours threshold for freshness
  public readonly isRunning: boolean = true; // Service is always active (handled by app-load or external cron)
  private isScanning: boolean = false;

  /**
   * Triggers an immediate check of weather conditions for all destinations.
   * Respects rate limiting and cache freshness to minimize API usage.
   * 
   * @returns {Promise<void>} Resolves when the monitoring cycle is complete.
   */
  async checkWeatherNow(): Promise<void> {
    if (this.isScanning) {
      console.log('🔒 Weather scan already in progress. Skipping.');
      return;
    }

    this.isScanning = true;

    try {
      console.log('🔍 Checking weather conditions...', new Date().toLocaleTimeString());

      const dbService = getDbService();
      // Get all destinations
      const destinations = await dbService.getDestinations();

      if (!destinations || destinations.length === 0) {
        console.log('⚠️ No destinations found for weather monitoring');
        return;
      }

      // 1. Batch-fetch existing weather data from DB for all destinations at once
      const destinationIds = destinations.map(d => d.id);
      const latestWeatherBatch = await dbService.getWeatherDataForDestinations(destinationIds);
      const sixHoursInMs = 6 * 60 * 60 * 1000;
      const now = Date.now();

      // Check weather for each destination with rate limiting
      for (const dbDestination of destinations) {
        try {
          const destination = dbService.transformDbDestinationToDestination(dbDestination);
          
          // 2. Use prefetched batch data for freshness checks
          const latestWeather = latestWeatherBatch.get(destination.id);

          if (latestWeather && latestWeather.recorded_at) {
            const recordedAt = new Date(latestWeather.recorded_at).getTime();

            // Update local cache immediately with DB data as a baseline
            this.lastCheckedData.set(destination.id, {
              temperature: latestWeather.temperature,
              humidity: latestWeather.humidity,
              pressure: latestWeather.pressure,
              weatherMain: latestWeather.weather_main,
              weatherDescription: latestWeather.weather_description,
              windSpeed: latestWeather.wind_speed,
              windDirection: latestWeather.wind_direction,
              visibility: latestWeather.visibility,
              cityName: destination.name,
              icon: '01d', // Default icon for DB records
              timestamp: recordedAt
            });

            // Check if this data is fresh enough (6 hours)
            if (recordedAt > now - sixHoursInMs) {
              const minutesOld = Math.round((now - recordedAt) / 60000);
              console.log(`✅ Weather for ${destination.name} is fresh (${minutesOld} min old). Skipping external API call.`);
              continue;
            }
          }

          const coordinates = destinationCoordinates[destination.id] ||
            destinationCoordinates[destination.name?.toLowerCase().replace(/\s+/g, '')] ||
            destinationCoordinates[destination.name?.toLowerCase()];

          if (!coordinates) {
            console.log(`⚠️ No coordinates found for ${destination.name}. Skipping.`);
            continue;
          }

          console.log(`🌐 FETCHING fresh weather data from Tomorrow.io for ${destination.name}...`);

          // Rate limiting: ensure minimum delay between API calls
          const currentApiTime = Date.now();
          if (currentApiTime - this.lastApiCall < this.apiCallDelay) {
            const waitTime = this.apiCallDelay - (currentApiTime - this.lastApiCall);
            console.log(`⏱️ Rate limiting: waiting ${waitTime}ms before API call...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }

          this.lastApiCall = Date.now();

          const weatherData = await weatherService.getWeatherByCoordinates(
            coordinates.lat,
            coordinates.lon,
            coordinates.name || destination.name
          );

          if (!weatherData) {
            console.log(`❌ Failed to get weather data for ${destination.name} - using last available data`);

            // Try to use cached data for alerts if API fails
            const cachedData = this.lastCheckedData.get(destination.id);
            if (cachedData) {
              console.log(`📋 Using last available weather data for ${destination.name} (from ${new Date(cachedData.timestamp).toLocaleTimeString()})`);
              // Process cached data for alerts but don't save to database again
              this.processWeatherAlerts(destination, cachedData, false);
            } else {
              console.log(`❌ No data available for ${destination.name}, skipping...`);
            }
            continue;
          }

          // Cache the successful data
          this.lastCheckedData.set(destination.id, {
            ...weatherData,
            timestamp: Date.now()
          });

          // Process weather data and alerts
          await this.processWeatherAlerts(destination, weatherData, true);

        } catch (error) {
          console.error(`❌ Error checking weather for ${dbDestination.name}:`, error);
        }
      }

      console.log('✅ Weather monitoring cycle completed');

    } catch (error) {
      console.error('❌ Error in weather monitoring:', error);
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Analyzes weather data to determine if alerts should be generated.
   * If alerts are generated, they are saved to the database and broadcast via SSE.
   * 
   * @param {Destination} destination - The destination being checked.
   * @param {WeatherData} weatherData - Current weather conditions.
   * @param {boolean} [saveToDatabase=true] - Whether to persist the check results to the DB.
   */
  private async processWeatherAlerts(destination: Destination, weatherData: WeatherData, saveToDatabase: boolean = true): Promise<void> {
    try {
      const alertCheck = weatherService.shouldGenerateAlert(weatherData);
      let alertLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
      let alertMessage: string | null = null;
      let alertReason: string | null = null;

      if (alertCheck.shouldAlert) {
        // Determine severity based on conditions
        if (weatherData.temperature > 45 || weatherData.temperature < -10) {
          alertLevel = 'critical';
        } else if (weatherData.windSpeed > 25 || weatherData.visibility < 300) {
          alertLevel = 'critical';
        } else if (weatherData.temperature > 40 || weatherData.temperature < 0) {
          alertLevel = 'high';
        } else if (weatherData.windSpeed > 18 || (weatherData.precipitationProbability && weatherData.precipitationProbability > 85)) {
          alertLevel = 'high';
        } else if (weatherData.visibility < 1000) {
          alertLevel = 'high';
        } else if (weatherData.windSpeed > 12 || (weatherData.uvIndex && weatherData.uvIndex > 9)) {
          alertLevel = 'medium';
        } else {
          alertLevel = 'low';
        }

        alertMessage = `${alertCheck.reason}. Current: ${weatherData.temperature}°C, ${weatherData.weatherDescription}. Wind: ${weatherData.windSpeed}m/s. ${weatherData.uvIndex ? `UV: ${weatherData.uvIndex}. ` : ''}${weatherData.precipitationProbability ? `Rain chance: ${weatherData.precipitationProbability}%.` : ''}`;
        alertReason = alertCheck.reason;

        console.log(`⚠️ Weather alert generated for ${destination.name}: ${alertLevel.toUpperCase()}`);
        console.log(`   Reason: ${alertCheck.reason}`);
      } else {
        console.log(`✅ Weather conditions normal for ${destination.name}`);
      }

      // Save weather data with alert info to database only if requested
      if (saveToDatabase) {
        const dbService = getDbService();
        await dbService.saveWeatherData({
          destination_id: destination.id,
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          pressure: weatherData.pressure,
          weather_main: weatherData.weatherMain,
          weather_description: weatherData.weatherDescription,
          wind_speed: weatherData.windSpeed,
          wind_direction: weatherData.windDirection,
          visibility: weatherData.visibility,
          recorded_at: new Date().toISOString(),
          alert_level: alertLevel,
          alert_message: alertMessage || undefined,
          alert_reason: alertReason || undefined
        });

        // After saving, broadcast the update to all connected clients (distributed)
        await broadcast({
          type: 'weather_update',
          destinationId: destination.id,
          weather: {
            temperature: weatherData.temperature,
            humidity: weatherData.humidity,
            weatherMain: weatherData.weatherMain,
            weatherDescription: weatherData.weatherDescription,
            windSpeed: weatherData.windSpeed,
          },
          alert: alertLevel !== 'none' ? {
            level: alertLevel,
            message: alertMessage,
          } : null,
          timestamp: new Date().toISOString()
        });
      }

      // Log current weather summary
      console.log(`   📊 ${destination.name}: ${weatherData.temperature}°C, ${weatherData.weatherDescription}, Wind: ${weatherData.windSpeed}m/s${weatherData.uvIndex ? `, UV: ${weatherData.uvIndex}` : ''}${weatherData.precipitationProbability ? `, Rain: ${weatherData.precipitationProbability}%` : ''}`);

    } catch (error) {
      console.error(`Error processing weather alerts for ${destination.name}:`, error);
    }
  }
}

// Create singleton instance using global to persist across HMR in development
const MONITOR_KEY = Symbol.for('greenpass.weather_monitor');
let weatherMonitoringService: WeatherMonitor;

const globalWithMonitor = global as typeof globalThis & {
  [MONITOR_KEY]?: WeatherMonitor;
};

if (typeof global !== 'undefined') {
  if (!globalWithMonitor[MONITOR_KEY]) {
    globalWithMonitor[MONITOR_KEY] = new WeatherMonitor();
  }
  weatherMonitoringService = globalWithMonitor[MONITOR_KEY]!;
} else {
  weatherMonitoringService = new WeatherMonitor();
}

export { weatherMonitoringService };
export type { WeatherMonitoringService };