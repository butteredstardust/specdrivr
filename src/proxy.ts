import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';


// Create a new ratelimiter, that allows 100 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: redis as never,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
});

export async function proxy(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Determine IP
    const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1') || '127.0.0.1';

    // Check rate limit
    const { success, limit, reset, remaining } = await ratelimit.limit(
      `ratelimit_${ip}`
    );

    // Return early if rate limit is exceeded
    if (!success) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', reset.toString());

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
