import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that do not require authentication
const PUBLIC_PATHS = new Set([
  '/login',
  '/forgot-password',
  '/reset-password',
  '/accept-invite',
  '/api/v1/health',
]);

// Routes only the agent token can access (no user session required)
const AGENT_PATHS = ['/api/v1/agent/'];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/api/auth/')) return true;
  // Allow Next.js internals and static assets
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/favicon')) return true;
  return false;
}

function isAgentPath(pathname: string): boolean {
  return AGENT_PATHS.some((p) => pathname.startsWith(p));
}

// Edge-compatible JWT token check
// Checks for the existence of the NextAuth session token cookie.
// Note: Full cryptographic verification still happens in the Route Handlers.
function hasSessionCookie(request: NextRequest): boolean {
  const isSecure = process.env.NODE_ENV === 'production' || request.nextUrl.protocol === 'https:';
  const cookieName = isSecure ? '__Secure-better-auth.session_token' : 'better-auth.session_token';

  return request.cookies.has(cookieName);
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

  // All other paths: require a valid user session cookie
  // Edge runtime cannot dynamically load Node.js crypto for full validation
  // so we perform a lightweight presence check here. Full validation in route.
  if (!hasSessionCookie(request)) {
    // API routes get JSON 401; page routes redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
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
