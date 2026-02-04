import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { WeatherData } from './weatherService';

// Initialize Redis client - gracefully handle missing credentials
let redis: Redis | null = null;

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (url && token) {
  try {
    redis = new Redis({
      url,
      token,
    });
  } catch (error) {
    console.warn('Failed to initialize Redis client:', error);
    redis = null;
  }
} else {
  const missing = [];
  if (!url) missing.push('UPSTASH_REDIS_REST_URL');
  if (!token) missing.push('UPSTASH_REDIS_REST_TOKEN');
  
  console.warn(
    `Missing Upstash Redis credentials: ${missing.join(', ')}. ` +
    'Redis caching will be disabled. Please set these environment variables to enable caching.'
  );
}

// Create rate limiter instances for different route types
// 100 requests per minute for general routes
export const generalRatelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '60 s'),
  analytics: true,
  prefix: '@upstash/ratelimit/general',
}) : null;

// 10 requests per minute for weather routes
export const weatherRatelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: true,
  prefix: '@upstash/ratelimit/weather',
}) : null;

// Weather caching configuration
const WEATHER_CACHE_TTL = parseInt(process.env.WEATHER_CACHE_TTL_SECONDS || '1800'); // 30 minutes default
const WEATHER_CACHE_KEY_PREFIX = 'weather';

/**
 * Retrieves weather data from Redis cache.
 * @param destinationId - The destination ID to cache weather data for
 * @returns Promise<WeatherData | null> - Cached weather data or null if not found/error
 */
export async function getWeatherFromCache(destinationId: string): Promise<WeatherData | null> {
  // Check if Redis is available
  if (!redis) {
    console.warn('Redis client not available - weather cache disabled');
    return null;
  }

  try {
    const cacheKey = `${WEATHER_CACHE_KEY_PREFIX}:${destinationId}`;
    const cachedData = await redis.get(cacheKey);
    
    if (!cachedData) {
      return null;
    }

    // Parse and validate the cached data
    const weatherData = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
    
    // Basic validation to ensure it's a WeatherData object
    if (weatherData && typeof weatherData.temperature === 'number' && typeof weatherData.humidity === 'number') {
      return weatherData as WeatherData;
    }
    
    return null;
  } catch (error) {
    // Graceful error handling - return null to allow fallback to API
    console.warn('Redis cache retrieval failed:', error);
    return null;
  }
}

/**
 * Stores weather data in Redis cache with TTL.
 * @param destinationId - The destination ID to cache weather data for
 * @param weatherData - The weather data to cache
 * @returns Promise<boolean> - True if successfully cached, false on error
 */
export async function setWeatherToCache(destinationId: string, weatherData: WeatherData): Promise<boolean> {
  // Check if Redis is available
  if (!redis) {
    console.warn('Redis client not available - weather cache disabled');
    return false;
  }

  try {
    const cacheKey = `${WEATHER_CACHE_KEY_PREFIX}:${destinationId}`;
    const serializedData = JSON.stringify(weatherData);
    
    await redis.set(cacheKey, serializedData, { ex: WEATHER_CACHE_TTL });
    return true;
  } catch (error) {
    // Graceful error handling - log but don't fail the operation
    console.warn('Redis cache storage failed:', error);
    return false;
  }
}

/**
 * Invalidates weather cache for a specific destination.
 * @param destinationId - The destination ID to invalidate cache for
 * @returns Promise<boolean> - True if successfully invalidated, false on error
 */
export async function invalidateWeatherCache(destinationId: string): Promise<boolean> {
  // Check if Redis is available
  if (!redis) {
    console.warn('Redis client not available - weather cache disabled');
    return false;
  }

  try {
    const cacheKey = `${WEATHER_CACHE_KEY_PREFIX}:${destinationId}`;
    await redis.del(cacheKey);
    return true;
  } catch (error) {
    console.warn('Redis cache invalidation failed:', error);
    return false;
  }
}

/**
 * Invalidates all weather cache entries.
 * @returns Promise<boolean> - True if successfully invalidated, false on error
 */
export async function invalidateAllWeatherCache(): Promise<boolean> {
  // Check if Redis is available
  if (!redis) {
    console.warn('Redis client not available - weather cache disabled');
    return false;
  }

  try {
    const pattern = `${WEATHER_CACHE_KEY_PREFIX}:*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    return true;
  } catch (error) {
    console.warn('Redis bulk cache invalidation failed:', error);
    return false;
  }
}
