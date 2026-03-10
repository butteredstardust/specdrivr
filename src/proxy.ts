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

// Routes that do not require authentication
const PUBLIC_PATHS = new Set([
  '/login',
  '/forgot-password',
  '/reset-password',
  '/accept-invite',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/accept-invite',
  '/api/health',
]);

// Routes only the agent token can access (no user session required)
const AGENT_PATHS = ['/api/v1/agent/'];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Allow Next.js internals and static assets
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/favicon')) return true;
  return false;
}

function isAgentPath(pathname: string): boolean {
  return AGENT_PATHS.some((p) => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security headers on every response
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // Only apply to API routes
  if (pathname.startsWith('/api/')) {
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

    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', reset.toString());
  }

  // Always allow public paths through
  if (isPublic(pathname)) return response;

  // Agent-only paths: validate Bearer token format only (full token validation in route)
  if (isAgentPath(pathname)) {
    const auth_header = request.headers.get('authorization');
    if (!auth_header?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Agent token required' } },
        { status: 401 }
      );
    }
    return response;
  }

  // NextAuth v5 session requires node environment but middleware proxy runs in Edge Runtime.
  // Using dynamic import or auth check is better left to app/api Route Handlers and pages.
  // Note: We've removed `await auth()` from the proxy middleware.
  // Individual Route Handlers (app/api/**/route.ts) are responsible for calling `const session = await auth();` and checking permissions.

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
