import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const protectedPrefixes = ['/doctor', '/receptionist', '/pharmacist', '/admin'];

const roleRouteMap: Record<string, string> = {
  DOCTOR: '/doctor',
  RECEPTIONIST: '/receptionist',
  PHARMACIST: '/pharmacist',
  ADMIN: '/admin',
};

/**
 * Next.js 16 Proxy (formerly Middleware).
 *
 * NextAuth's `auth()` wrapper returns a `NextMiddleware`-compatible function
 * which populates `req.auth` with the current session. We export it as the
 * default export — Next.js 16 accepts either `export default` or a named
 * `export function proxy` from this file.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  const isLoginPage = pathname === '/login' || pathname === '/';
  const session = req.auth;

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !session?.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect authenticated users away from login / landing page
  if (isLoginPage && session?.user) {
    const role = session.user.role || 'DOCTOR';
    const redirectPath = roleRouteMap[role] || '/doctor';
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }

  // Role-based access control on protected routes
  if (isProtected && session?.user) {
    const role = session.user.role;
    const allowedPrefix = roleRouteMap[role];
    if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
      return NextResponse.redirect(new URL(allowedPrefix, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth API routes)
     * - _next/static (static assets)
     * - _next/image (image optimisation)
     * - favicon.ico, *.png, *.svg (static files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.svg$).*)',
  ],
};
