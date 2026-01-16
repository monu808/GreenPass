import { weatherService, destinationCoordinates } from '@/lib/weatherService';
import { dbService } from '@/lib/databaseService';
import { Destination } from '@/types';

interface WeatherMonitoringService {
  isRunning: boolean;
  intervalId: NodeJS.Timeout | null;
  start: () => void;
  stop: () => void;
  checkWeatherNow: () => Promise<void>;
}

class WeatherMonitor implements WeatherMonitoringService {
  isRunning = false;
  intervalId: NodeJS.Timeout | null = null;
  private lastCheckedData: Map<string, any> = new Map();
  private lastApiCall: number = 0;
  private apiCallDelay: number = 10000; // 10 seconds between API calls
  private checkInterval: number = 21600000; // 6 hours between monitoring cycles (6 * 60 * 60 * 1000)

  start() {
    if (this.isRunning) {
      console.log('⚡ Weather monitoring is already running');
      return;
    }

    console.log('🌤️ Starting weather monitoring service...');
    console.log(`⏱️ Using monitoring interval: ${this.checkInterval}ms (${this.checkInterval/3600000} hours)`);
    console.log(`⏱️ Using API call delay: ${this.apiCallDelay}ms between destinations`);
    this.isRunning = true;

    // Check immediately when starting
    this.checkWeatherNow();

    // Set up the recurring interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = setInterval(() => {
      console.log('⏰ Scheduled weather monitoring cycle starting...');
      this.checkWeatherNow();
    }, this.checkInterval);

    console.log('✅ Weather monitoring service initialized');
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚡ Weather monitoring is not running');
      return;
    }

    console.log('🛑 Stopping weather monitoring service...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('✅ Weather monitoring stopped');
  }

  async checkWeatherNow(): Promise<void> {
    try {
      console.log('🔍 Checking weather conditions...', new Date().toLocaleTimeString());

      // Get all destinations
      const destinations = await dbService.getDestinations();
      
      if (!destinations || destinations.length === 0) {
        console.log('⚠️ No destinations found for weather monitoring');
        return;
      }

      // Check weather for each destination with rate limiting
      for (const destination of destinations) {
        try {
          // Always check the database first to have some data (even if old)
          const latestWeather = await dbService.getLatestWeatherData(destination.id);
          
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
              timestamp: recordedAt
            });

            // Check if this data is fresh enough (6 hours)
            const sixHoursAgo = Date.now() - this.checkInterval;
            if (recordedAt > sixHoursAgo) {
              const minutesOld = Math.round((Date.now() - recordedAt) / 60000);
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
          const now = Date.now();
          if (now - this.lastApiCall < this.apiCallDelay) {
            const waitTime = this.apiCallDelay - (now - this.lastApiCall);
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
          console.error(`❌ Error checking weather for ${destination.name}:`, error);
        }
      }

      console.log('✅ Weather monitoring cycle completed');

    } catch (error) {
      console.error('❌ Error in weather monitoring:', error);
    }
  }

  // Helper method to process weather alerts
  private async processWeatherAlerts(destination: any, weatherData: any, saveToDatabase: boolean = true): Promise<void> {
    try {
      const alertCheck = weatherService.shouldGenerateAlert(weatherData);
      let alertLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
      let alertMessage: string | null = null;
      let alertReason: string | null = null;

      if (alertCheck.shouldAlert) {
        // Determine severity based on conditions
        if (weatherData.temperature > 45 || weatherData.temperature < -10) {
          alertLevel = 'critical';
        } else if (weatherData.windSpeed > 20 || weatherData.visibility < 500) {
          alertLevel = 'critical';
        } else if (weatherData.temperature > 40 || weatherData.temperature < 0) {
          alertLevel = 'high';
        } else if (weatherData.windSpeed > 15 || (weatherData.precipitationProbability && weatherData.precipitationProbability > 80)) {
          alertLevel = 'high';
        } else if (weatherData.windSpeed > 10 || (weatherData.uvIndex && weatherData.uvIndex > 8)) {
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
        await dbService.saveWeatherData(destination.id, weatherData, {
          level: alertLevel,
          message: alertMessage || undefined,
          reason: alertReason || undefined
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

if (typeof global !== 'undefined') {
  if (!(global as any)[MONITOR_KEY]) {
    (global as any)[MONITOR_KEY] = new WeatherMonitor();
  }
  weatherMonitoringService = (global as any)[MONITOR_KEY];
} else {
  weatherMonitoringService = new WeatherMonitor();
}

export { weatherMonitoringService };
export type { WeatherMonitoringService };
