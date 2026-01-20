import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Validate environment variables
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  const missing = [];
  if (!url) missing.push('UPSTASH_REDIS_REST_URL');
  if (!token) missing.push('UPSTASH_REDIS_REST_TOKEN');
  
  throw new Error(
    `Missing required Upstash Redis credentials: ${missing.join(', ')}. ` +
    'Please ensure these environment variables are set in your .env file.'
  );
}

// Initialize Redis client
export const redis = new Redis({
  url,
  token,
});

// Create rate limiter instances for different route types
// 100 requests per minute for general routes
export const generalRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '60 s'),
  analytics: true,
  prefix: '@upstash/ratelimit/general',
});

// 10 requests per minute for weather routes
export const weatherRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: true,
  prefix: '@upstash/ratelimit/weather',
});
