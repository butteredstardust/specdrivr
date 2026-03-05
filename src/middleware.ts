import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/auth/login'];

const COOKIE_NAME = 'specdrivr_session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes to use their own authentication (X-Agent-Token, etc.)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Read the session cookie value directly — no DB or bcrypt in Edge Runtime.
  // Full user validation (DB lookup, active-flag check) happens in server components / API routes.
  const sessionCookie = request.cookies.get(COOKIE_NAME);
  const isLoggedIn = !!sessionCookie?.value;

  // If user is authenticated and trying to access login page, redirect to dashboard
  if (isLoggedIn && pathname.startsWith('/auth/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is not authenticated and trying to access protected route, redirect to login
  if (!isLoggedIn && !isPublicRoute && pathname !== '/') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};