import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth/login');

  if (req.nextUrl.pathname.startsWith('/api/agent') || req.nextUrl.pathname.startsWith('/api/webhooks')) {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith('/projects') || req.nextUrl.pathname === '/') {
    if (!req.auth && !isAuthPage) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }
  return NextResponse.next();
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}