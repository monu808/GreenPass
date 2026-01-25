import { LRUCache } from 'lru-cache';

// Cache configuration constants
const WEATHER_TTL = 1000 * 60 * 10; // 10 minutes
const DESTINATION_TTL = 1000 * 60 * 60; // 1 hour
const POLICY_CONFIG_TTL = 1000 * 60 * 60 * 24; // 24 hours

// Typed Cache Instances
export const weatherCache = new LRUCache<string, Record<string, unknown>>({
  max: 500,
  ttl: WEATHER_TTL,
});

export const destinationCache = new LRUCache<string, Record<string, unknown>>({
  max: 100,
  ttl: DESTINATION_TTL,
});

export const policyConfigCache = new LRUCache<string, Record<string, unknown>>({
  max: 50,
  ttl: POLICY_CONFIG_TTL,
});

export const ecologicalIndicatorCache = new LRUCache<string, Record<string, unknown>>({
  max: 500,
  ttl: WEATHER_TTL, // Same TTL as weather for now
});

/**
 * Cache-aware wrapper for fetching data
 */
export async function withCache<T>(
  cache: LRUCache<string, T>,
  key: string,
  fetchFn: () => Promise<T | null>
): Promise<T | null> {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const fresh = await fetchFn();
  if (fresh !== null) {
    cache.set(key, fresh);
  }
  return fresh;
}

/**
 * Invalidation helpers
 */
export const invalidateCache = {
  weather: (destinationId?: string) => {
    if (destinationId) weatherCache.delete(destinationId);
    else weatherCache.clear();
  },
  destination: (destinationId?: string) => {
    if (destinationId) destinationCache.delete(destinationId);
    else destinationCache.clear();
  },
  policyConfig: () => policyConfigCache.clear(),
  all: () => {
    weatherCache.clear();
    destinationCache.clear();
    policyConfigCache.clear();
    ecologicalIndicatorCache.clear();
  }
};
