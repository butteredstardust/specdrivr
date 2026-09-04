import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that do not require authentication
const PUBLIC_PATHS = new Set([
  '/login',
  '/signup',
  '/debug',
  '/forgot-password',
  '/reset-password',
  '/accept-invite',
  '/api/v1/health',
  '/api/health',
  '/api/health/live',
]);

// Routes only the agent token can access (no user session required)
const AGENT_PATHS = ['/api/v1/agent/'];

const localWindows = new Map<string, { count: number; resetAt: number }>();

function localRateLimit(key: string, limit: number, windowMs = 60_000): number | null {
  const now = Date.now();
  const current = localWindows.get(key);
  if (!current || current.resetAt <= now) {
    localWindows.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  current.count += 1;
  return current.count > limit ? current.resetAt : null;
}

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/api/auth/')) return true;
  // Allow Next.js internals and static assets
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/favicon')) return true;
  // Allow any file with an extension (static assets)
  if (pathname.includes('.')) return true;
  return false;
}

function isAgentPath(pathname: string): boolean {
  return AGENT_PATHS.some((p) => pathname.startsWith(p));
}

// Edge-compatible JWT token check
// Checks for the existence of the Better Auth session token cookie.
// Note: Full cryptographic verification still happens in the Route Handlers.
function hasSessionCookie(request: NextRequest): boolean {
  const isSecure = process.env.NODE_ENV === 'production' || request.nextUrl.protocol === 'https:';
  const cookieName = isSecure ? '__Secure-better-auth.session_token' : 'better-auth.session_token';

  return request.cookies.has(cookieName);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const correlationId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', correlationId);

  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/health')) {
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const sessionIdentity =
      request.cookies.get('__Secure-better-auth.session_token')?.value ??
      request.cookies.get('better-auth.session_token')?.value;
    const identity = sessionIdentity ?? forwardedFor ?? 'unknown';
    const tier = pathname.startsWith('/api/auth/') ? 'auth' : 'api';
    const resetAt = localRateLimit(`${tier}:${identity}`, tier === 'auth' ? 10 : 100);
    if (resetAt) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))),
            'X-Request-ID': correlationId,
          },
        }
      );
    }
  }

  // Security headers on every response
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('X-Request-ID', correlationId);
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

  // Always allow public paths through
  if (isPublic(pathname)) {
    response.headers.set('x-proxy-status', 'public');
    return response;
  }

  // Agent-only paths: validate Bearer token format only (full token validation in route)
  if (isAgentPath(pathname)) {
    const auth_header = request.headers.get('authorization');
    if (!auth_header?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Agent token required' } },
        { status: 401, headers: { 'X-Request-ID': correlationId } }
      );
    }
    return response;
  }

  // All other paths: require a valid user session cookie
  // Edge runtime cannot dynamically load Node.js crypto for full validation
  // so we perform a lightweight presence check here. Full validation in route.
  if (!hasSessionCookie(request)) {
    // API routes get JSON 401; page routes redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401, headers: { 'X-Request-ID': correlationId } }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    const redirect = NextResponse.redirect(loginUrl);
    redirect.headers.set('X-Request-ID', correlationId);
    return redirect;
  }

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
