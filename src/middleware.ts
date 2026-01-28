import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generalRatelimit, weatherRatelimit } from '@/lib/redis';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to /api routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 1. CSRF Protection for POST/PUT/PATCH/DELETE
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && process.env.NODE_ENV === 'production') {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    let isValidOrigin = false;
    if (origin && host) {
      try {
        const originHostname = new URL(origin).hostname;
        const requestHostname = host.split(':')[0];
        isValidOrigin = originHostname === requestHostname;
      } catch {
        isValidOrigin = false;
      }
    }

    if (!isValidOrigin) {
      return new NextResponse(
        JSON.stringify({ error: 'CSRF protection: Invalid or missing origin' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 2. Rate Limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'anonymous';
  
  // Determine limit based on route
  const isWeatherRoute = pathname.includes('/weather-check') || 
                         pathname.includes('/weather-monitor') || 
                         pathname.includes('/test-weather') || 
                         pathname.includes('/auto-weather');
  
  const ratelimit = isWeatherRoute ? weatherRatelimit : generalRatelimit;
  
  try {
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      const now = Date.now();
      const retryAfter = Math.ceil((reset - now) / 1000);

      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests', 
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.` 
        }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          } 
        }
      );
    }
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fallback: allow request if rate limiting fails
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configure matcher
export const config = {
  matcher: '/api/:path*',
};
