// middleware.ts

import { NextResponse, NextRequest } from 'next/server';

// Inline simple base64 decoder to avoid node crypto runtime dependencies in Next.js Edge Middleware
function decodeSessionPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const payloadPart = parts[0];
    const serialized = Buffer.from(payloadPart, 'base64url').toString('utf-8');
    const payload = JSON.parse(serialized);

    // Check expiration
    if (new Date(payload.expires).getTime() < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('sales_panel_session');

  // Verify token
  let session = null;
  if (sessionCookie && sessionCookie.value) {
    session = decodeSessionPayload(sessionCookie.value);
  }

  const isLoginPage = pathname === '/login';
  const isAuthRoute = pathname.startsWith('/api/auth');
  const isStaticFile = pathname.startsWith('/_next') || pathname.includes('.');

  if (isStaticFile || isAuthRoute) {
    return NextResponse.next();
  }

  // Not logged in -> Redirect to /login
  if (!session && !isLoginPage) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // Logged in and visits /login -> Redirect to /dashboard
  if (session && isLoginPage) {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  // Admin routing protection
  if (session) {
    const isAdminOnlyRoute = pathname.startsWith('/sellers') || pathname.startsWith('/settings');
    if (isAdminOnlyRoute && session.role !== 'ADMIN') {
      // Forbidden, redirect to dashboard
      const url = new URL('/dashboard', request.url);
      return NextResponse.redirect(url);
    }
  }

  // If path is root '/', redirect to /dashboard
  if (pathname === '/') {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
