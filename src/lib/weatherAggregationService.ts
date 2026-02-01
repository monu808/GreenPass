import { weatherService, destinationCoordinates, WeatherData } from './weatherService';
import { getDbService } from './databaseService';
import { 
  getWeatherFromCache, 
  setWeatherToCache, 
  invalidateWeatherCache, 
  invalidateAllWeatherCache 
} from './redis';
import { logger } from './logger';

/**
 * Cache statistics for monitoring and observability
 */
interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  totalRequests: number;
}

/**
 * Weather aggregation service that orchestrates data retrieval from multiple sources
 * with intelligent caching and fallback mechanisms.
 */
interface WeatherAggregationService {
  getWeatherForDestination(destinationId: string): Promise<WeatherData | null>;
  getWeatherForMultipleDestinations(destinationIds: string[]): Promise<Map<string, WeatherData | null>>;
  refreshWeatherData(destinationId: string): Promise<WeatherData | null>;
  invalidateByDestination(destinationId: string): Promise<boolean>;
  invalidateByRegion(region: string): Promise<boolean>;
  invalidateAll(): Promise<boolean>;
  getCacheStatus(): CacheStats;
}

/**
 * Implementation of the weather aggregation service
 */
class WeatherAggregator implements WeatherAggregationService {
  private static instance: WeatherAggregator;
  private cacheStats: CacheStats = {
    hits: 0,
    misses: 0,
    errors: 0,
    totalRequests: 0
  };

  private constructor() {}

  public static getInstance(): WeatherAggregator {
    if (!WeatherAggregator.instance) {
      WeatherAggregator.instance = new WeatherAggregator();
    }
    return WeatherAggregator.instance;
  }

  /**
   * Retrieves weather data for a specific destination with intelligent fallback
   * @param destinationId - The destination identifier
   * @returns Promise<WeatherData | null> - Weather data or null if unavailable
   */
  async getWeatherForDestination(destinationId: string): Promise<WeatherData | null> {
    this.cacheStats.totalRequests++;
    
    try {
      logger.debug(`🔍 Aggregation service: Getting weather for ${destinationId}`);

      // 1. Try Redis cache first
      const cachedData = await getWeatherFromCache(destinationId);
      if (cachedData) {
        this.cacheStats.hits++;
        logger.debug(`✅ Cache hit for ${destinationId} via aggregation service`);
        return cachedData;
      }

      this.cacheStats.misses++;
      logger.debug(`❌ Cache miss for ${destinationId} - checking other sources`);

      // 2. Try to get coordinates for the destination
      const coordinates = destinationCoordinates[destinationId] ||
        destinationCoordinates[destinationId.toLowerCase().replace(/\s+/g, '')] ||
        destinationCoordinates[destinationId.toLowerCase()];

      if (!coordinates) {
        logger.warn(`⚠️ No coordinates found for ${destinationId}`);
        return await this.getFallbackFromDatabase(destinationId);
      }

      // 3. Try Tomorrow.io API
      const apiData = await weatherService.getWeatherByCoordinates(
        coordinates.lat,
        coordinates.lon,
        coordinates.name || destinationId,
        undefined, // No AbortSignal
        destinationId // Pass destinationId as cacheKey
      );

      if (apiData) {
        logger.debug(`✅ API success for ${destinationId} - caching result`);
        await setWeatherToCache(destinationId, apiData);
        return apiData;
      }

      // 4. Fallback to database
      return await this.getFallbackFromDatabase(destinationId);

    } catch (error) {
      this.cacheStats.errors++;
      logger.error(`❌ Error in aggregation service for ${destinationId}:`, error);
      
      // Final fallback to database
      return await this.getFallbackFromDatabase(destinationId);
    }
  }

  /**
   * Retrieves weather data for multiple destinations in parallel
   * @param destinationIds - Array of destination identifiers
   * @returns Promise<Map<string, WeatherData | null>> - Map of destination IDs to weather data
   */
  async getWeatherForMultipleDestinations(destinationIds: string[]): Promise<Map<string, WeatherData | null>> {
    logger.debug(`🔍 Batch weather request for ${destinationIds.length} destinations`);
    
    const results = new Map<string, WeatherData | null>();
    
    // Process destinations in parallel batches to avoid overwhelming the API
    const batchSize = 5; // Process 5 destinations at a time
    for (let i = 0; i < destinationIds.length; i += batchSize) {
      const batch = destinationIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (destinationId) => {
        const weatherData = await this.getWeatherForDestination(destinationId);
        return { destinationId, weatherData };
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ destinationId, weatherData }) => {
        results.set(destinationId, weatherData);
      });

      // Small delay between batches to be respectful of rate limits
      if (i + batchSize < destinationIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const successCount = Array.from(results.values()).filter(data => data !== null).length;
    logger.debug(`✅ Batch weather request completed: ${successCount}/${destinationIds.length} successful`);
    
    return results;
  }

  /**
   * Forces a fresh data fetch for a destination and updates the cache
   * @param destinationId - The destination identifier
   * @returns Promise<WeatherData | null> - Fresh weather data or null if unavailable
   */
  async refreshWeatherData(destinationId: string): Promise<WeatherData | null> {
    logger.debug(`🔄 Forcing refresh for ${destinationId}`);
    
    try {
      // Invalidate existing cache first
      await invalidateWeatherCache(destinationId);
      
      // Get coordinates
      const coordinates = destinationCoordinates[destinationId] ||
        destinationCoordinates[destinationId.toLowerCase().replace(/\s+/g, '')] ||
        destinationCoordinates[destinationId.toLowerCase()];

      if (!coordinates) {
        logger.warn(`⚠️ No coordinates found for refresh of ${destinationId}`);
        return null;
      }

      // Force fresh API call by bypassing cache
      const apiData = await weatherService.getWeatherByCoordinates(
        coordinates.lat,
        coordinates.lon,
        coordinates.name || destinationId,
        undefined, // No AbortSignal
        destinationId // Pass destinationId as cacheKey
      );

      if (apiData) {
        logger.debug(`✅ Fresh data obtained for ${destinationId} - caching result`);
        await setWeatherToCache(destinationId, apiData);
        return apiData;
      }

      logger.warn(`❌ Failed to get fresh data for ${destinationId}`);
      return null;

    } catch (error) {
      logger.error(`❌ Error refreshing weather data for ${destinationId}:`, error);
      return null;
    }
  }

  /**
   * Invalidates cache for a specific destination
   * @param destinationId - The destination identifier
   * @returns Promise<boolean> - True if successful, false on error
   */
  async invalidateByDestination(destinationId: string): Promise<boolean> {
    logger.debug(`🗑️ Invalidating cache for ${destinationId}`);
    return await invalidateWeatherCache(destinationId);
  }

  /**
   * Invalidates cache for all destinations in a geographic region
   * @param region - The region name (e.g., 'himachal', 'kashmir')
   * @returns Promise<boolean> - True if successful, false on error
   */
  async invalidateByRegion(region: string): Promise<boolean> {
    logger.debug(`🗑️ Invalidating cache for region: ${region}`);
    
    try {
      const regionLower = region.toLowerCase();
      let invalidatedCount = 0;

      // Find all destinations in the region
      for (const [destId, coords] of Object.entries(destinationCoordinates)) {
        const destName = coords.name?.toLowerCase() || destId.toLowerCase();
        
        // Check if destination name contains the region name
        if (destName.includes(regionLower)) {
          const success = await invalidateWeatherCache(destId);
          if (success) {
            invalidatedCount++;
          }
        }
      }

      logger.debug(`✅ Invalidated cache for ${invalidatedCount} destinations in ${region}`);
      return true;
    } catch (error) {
      logger.error(`❌ Error invalidating region cache for ${region}:`, error);
      return false;
    }
  }

  /**
   * Invalidates all weather cache entries
   * @returns Promise<boolean> - True if successful, false on error
   */
  async invalidateAll(): Promise<boolean> {
    logger.debug(`🗑️ Invalidating all weather cache`);
    return await invalidateAllWeatherCache();
  }

  /**
   * Returns current cache statistics for monitoring
   * @returns CacheStats - Current cache performance metrics
   */
  getCacheStatus(): CacheStats {
    const hitRate = this.cacheStats.totalRequests > 0 
      ? (this.cacheStats.hits / this.cacheStats.totalRequests * 100).toFixed(2)
      : '0.00';

    logger.debug(`📊 Cache stats: ${hitRate}% hit rate (${this.cacheStats.hits}/${this.cacheStats.totalRequests})`);
    
    return { ...this.cacheStats };
  }

  /**
   * Fallback method to get weather data from database
   * @param destinationId - The destination identifier
   * @returns Promise<WeatherData | null> - Database weather data or null
   */
  private async getFallbackFromDatabase(destinationId: string): Promise<WeatherData | null> {
    try {
      logger.debug(`🗄️ Checking database fallback for ${destinationId}`);
      
      const dbService = getDbService();
      const latestWeather = await dbService.getLatestWeatherData(destinationId);

      if (latestWeather && latestWeather.recorded_at) {
        logger.debug(`✅ Database fallback found for ${destinationId}`);
        
        return {
          temperature: latestWeather.temperature,
          humidity: latestWeather.humidity,
          pressure: latestWeather.pressure,
          weatherMain: latestWeather.weather_main,
          weatherDescription: latestWeather.weather_description,
          windSpeed: latestWeather.wind_speed,
          windDirection: latestWeather.wind_direction,
          visibility: latestWeather.visibility,
          cityName: destinationId, // Use destinationId as fallback name
          icon: '01d', // Default icon
          uvIndex: undefined,
          cloudCover: undefined,
          precipitationProbability: undefined,
          precipitationType: undefined
        };
      }

      logger.debug(`❌ No database fallback available for ${destinationId}`);
      return null;
    } catch (error) {
      logger.error(`❌ Database fallback error for ${destinationId}:`, error);
      return null;
    }
  }

  /**
   * Resets cache statistics (useful for testing or monitoring resets)
   */
  resetStats(): void {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalRequests: 0
    };
  }
}

// Create and export singleton instance
export const weatherAggregationService = WeatherAggregator.getInstance();

// Export types and class for testing
export { WeatherAggregator };
export type { WeatherAggregationService, CacheStats, WeatherData };
