import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth-utils';

// Routes that don't require authentication
const publicRoutes = ['/auth/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Get session from cookies and validate it
  const user = await getSessionUser();

  // If user is authenticated and trying to access login page, redirect to dashboard
  if (user && pathname.startsWith('/auth/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is not authenticated and trying to access protected route, redirect to login
  if (!user && !isPublicRoute && pathname !== '/') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Role-based access control for admin routes
  if (pathname.startsWith('/admin/')) {
    // Must be authenticated
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Must be admin
    if (!user.isAdmin) {
      return NextResponse.redirect(new URL('/403', request.url));
    }
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
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};