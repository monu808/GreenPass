import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiting map
// Key: IP address, Value: Array of timestamps
const rateLimitMap = new Map<string, number[]>();

// Configuration
const GENERAL_LIMIT = 100; // 100 requests
const WEATHER_LIMIT = 10;   // 10 requests
const WINDOW_MS = 60 * 1000; // 1 minute

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [ip, timestamps] of rateLimitMap.entries()) {
      const validTimestamps = timestamps.filter(t => now - t < WINDOW_MS);
      if (validTimestamps.length === 0) {
        rateLimitMap.delete(ip);
      } else {
        rateLimitMap.set(ip, validTimestamps);
      }
    }
    lastCleanup = now;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to /api routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 1. CSRF Protection for POST/PUT/DELETE
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    // In production, we should check if origin matches our host
    // For local development, we're more lenient but still check presence
    if (origin && host && !origin.includes(host) && process.env.NODE_ENV === 'production') {
      return new NextResponse(
        JSON.stringify({ error: 'CSRF protection: Invalid origin' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 2. Rate Limiting
  cleanup();

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'anonymous';
  const now = Date.now();
  
  // Get existing timestamps for this IP
  let timestamps = rateLimitMap.get(ip) || [];
  
  // Filter out timestamps outside the current window
  timestamps = timestamps.filter(t => now - t < WINDOW_MS);
  
  // Determine limit based on route
  const isWeatherRoute = pathname.includes('/weather-check') || 
                         pathname.includes('/weather-monitor') || 
                         pathname.includes('/test-weather') || 
                         pathname.includes('/auto-weather');
  const limit = isWeatherRoute ? WEATHER_LIMIT : GENERAL_LIMIT;

  if (timestamps.length >= limit) {
    const oldestTimestamp = timestamps[0];
    const retryAfter = Math.ceil((WINDOW_MS - (now - oldestTimestamp)) / 1000);

    return new NextResponse(
      JSON.stringify({ 
        error: 'Too many requests', 
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.` 
      }),
      { 
        status: 429, 
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString()
        } 
      }
    );
  }

  // Add current timestamp and update map
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  return NextResponse.next();
}

// Configure matcher
export const config = {
  matcher: '/api/:path*',
};
