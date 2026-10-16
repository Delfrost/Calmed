import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const roleRouteMap: Record<string, string> = {
  DOCTOR: '/doctor',
  RECEPTIONIST: '/receptionist',
  PHARMACIST: '/pharmacist',
  ADMIN: '/admin',
  NURSE: '/nurse',
};

const protectedPrefixes = Object.values(roleRouteMap);

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
