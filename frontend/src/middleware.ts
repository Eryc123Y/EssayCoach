import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  applyRefreshedRequestCookies,
  resolveSession,
  setSessionCookies,
  type SessionTokens
} from '@/lib/auth-session';

// Routes that manage the session themselves; logout renews only to revoke.
const SESSION_ROUTES = new Set([
  '/api/v2/auth/login',
  '/api/v2/auth/login-with-jwt',
  '/api/v2/auth/refresh',
  '/api/v2/auth/logout',
  '/api/v2/auth/register'
]);

function forwardRefreshed(request: NextRequest, tokens: SessionTokens) {
  applyRefreshedRequestCookies(request, tokens);
  const response = NextResponse.next({ request: { headers: request.headers } });
  setSessionCookies(response, tokens);
  return response;
}

function redirectToSignIn(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/auth/sign-in';
  url.search = '';
  url.searchParams.set('callbackUrl', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

/**
 * The middleware is the only place that renews sessions, for dashboard pages
 * and API route handlers alike. Route handlers run in a separate module scope,
 * so renewing there too would let a page load and an API call rotate the same
 * refresh token independently, and one of them would lose.
 */
export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/api/v2/')) {
    if (SESSION_ROUTES.has(pathname.replace(/\/$/, ''))) return NextResponse.next();
    const session = await resolveSession(request);
    // Without a renewed token the backend answers 401 itself.
    return session.refreshed ? forwardRefreshed(request, session.refreshed) : NextResponse.next();
  }

  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  const session = await resolveSession(request);

  if (session.refreshed) {
    return forwardRefreshed(request, session.refreshed);
  }

  // A refused refresh can mean a concurrent request already rotated the token,
  // so cookies are never cleared here: that response could race and erase the
  // winner's new cookies. Signing in again overwrites stale ones.
  if (!session.accessToken) {
    return redirectToSignIn(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)', '/api/v2/:path*']
};
