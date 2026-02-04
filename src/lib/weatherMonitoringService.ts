import { weatherService, destinationCoordinates, WeatherData } from '@/lib/weatherService';
import { getDbService } from '@/lib/databaseService';
import { Destination } from '@/types';
import { distributedBroadcast } from './messagingService';
import { weatherAggregationService } from './weatherAggregationService';
import { logger } from '@/lib/logger'; // ✅ NEW IMPORT

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
  private checkInterval: number = 21600000; // 6 hours threshold for freshness
  public readonly isRunning: boolean = true; // Service is always active (handled by app-load or external cron)
  private isScanning: boolean = false;

  /**
   * Triggers an immediate check of weather conditions for all destinations.
   * Uses the weather aggregation service for efficient data retrieval with caching.
   * @returns {Promise<void>} Resolves when the monitoring cycle is complete.
   */
  async checkWeatherNow(): Promise<void> {
    if (this.isScanning) {
      logger.warn('🔒 Weather scan already in progress. Skipping.');
      return;
    }

    this.isScanning = true;

    try {
      logger.info('🔍 Checking weather conditions...', { 
        component: 'WeatherMonitor', 
        operation: 'checkWeatherNow',
        metadata: { timestamp: new Date().toLocaleTimeString() }
      });

      const dbService = getDbService();
      // Get all destinations
      const destinations = await dbService.getDestinations();

      if (!destinations || destinations.length === 0) {
        logger.warn('⚠️ No destinations found for weather monitoring');
        return;
      }

      // Extract destination IDs for batch processing
      const destinationIds = destinations.map(dest => dest.id);
      
      logger.info(`🌐 Batch fetching weather data for ${destinations.length} destinations via aggregation service...`);
      
      // Use aggregation service for batch processing
      const weatherResults = await weatherAggregationService.getWeatherForMultipleDestinations(destinationIds);
      
      // Process results for each destination
      for (const dbDestination of destinations) {
        try {
          const destination = dbService.transformDbDestinationToDestination(dbDestination);
          const weatherData = weatherResults.get(destination.id);

          if (!weatherData) {
            logger.error(`❌ Failed to get weather data for ${destination.name} via aggregation service`);
            
            // Try to use cached data for alerts if available
            const cachedData = this.lastCheckedData.get(destination.id);
            if (cachedData) {
              logger.warn(`📋 Using last available weather data for ${destination.name} (from ${new Date(cachedData.timestamp).toLocaleTimeString()})`);
              this.processWeatherAlerts(destination, cachedData, false);
            } else {
              logger.warn(`❌ No data available for ${destination.name}, skipping...`);
            }
            continue;
          }

          // Cache the successful data locally
          this.lastCheckedData.set(destination.id, {
            ...weatherData,
            timestamp: Date.now()
          });

          // Process weather data and alerts
          await this.processWeatherAlerts(destination, weatherData, true);

        } catch (error) {
          logger.error(`❌ Error processing weather for ${dbDestination.name}:`, error);
        }
      }

      // Log cache statistics for monitoring
      const cacheStats = weatherAggregationService.getCacheStatus();
      const hitRate = cacheStats.totalRequests > 0 
        ? (cacheStats.hits / cacheStats.totalRequests * 100).toFixed(2)
        : '0.00';
      logger.info(`📊 Cache performance: ${hitRate}% hit rate (${cacheStats.hits}/${cacheStats.totalRequests} requests)`);

      logger.info('✅ Weather monitoring cycle completed');

    } catch (error) {
      logger.error('❌ Error in weather monitoring:', error);
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Analyzes weather data to determine if alerts should be generated.
   * If alerts are generated, they are saved to the database and broadcast via SSE.
   * * @param {Destination} destination - The destination being checked.
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

        logger.warn(`⚠️ Weather alert generated for ${destination.name}: ${alertLevel.toUpperCase()}`);
        logger.warn(`   Reason: ${alertCheck.reason}`);
      } else {
        logger.debug(`✅ Weather conditions normal for ${destination.name}`);
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

        // After saving, invalidate cache for this destination to ensure fresh data on next request
        await weatherAggregationService.invalidateByDestination(destination.id);
        
        // Broadcast the update to all connected clients (distributed)
        await distributedBroadcast({
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

      // Log current weather summary (Info level for visibility during dev, suppressed in prod)
      logger.info(`   📊 ${destination.name}: ${weatherData.temperature}°C, ${weatherData.weatherDescription}, Wind: ${weatherData.windSpeed}m/s${weatherData.uvIndex ? `, UV: ${weatherData.uvIndex}` : ''}${weatherData.precipitationProbability ? `, Rain: ${weatherData.precipitationProbability}%` : ''}`);

    } catch (error) {
      logger.error(`Error processing weather alerts for ${destination.name}:`, error);
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