import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  if (pathname === '/connections' || pathname.startsWith('/connections/')) {
    return NextResponse.redirect(new URL('/connect', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/dashboard', '/connections/:path*', '/connections'],
};
