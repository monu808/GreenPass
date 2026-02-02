import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Validate environment variables
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const hasRedisCredentials = !!(url && token);

if (!hasRedisCredentials) {
  console.warn(
    'Warning: Upstash Redis credentials not configured. Rate limiting will be disabled. ' +
    'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your .env file to enable rate limiting.'
  );
}

// Initialize Redis client only if credentials are available
export const redis = hasRedisCredentials ? new Redis({
  url: url!,
  token: token!,
}) : null;

// Create rate limiter instances for different route types
// 100 requests per minute for general routes
export const generalRatelimit = hasRedisCredentials ? new Ratelimit({
  redis: redis!,
  limiter: Ratelimit.slidingWindow(100, '60 s'),
  analytics: true,
  prefix: '@upstash/ratelimit/general',
}) : null;

// 10 requests per minute for weather routes
export const weatherRatelimit = hasRedisCredentials ? new Ratelimit({
  redis: redis!,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: true,
  prefix: '@upstash/ratelimit/weather',
}) : null;
