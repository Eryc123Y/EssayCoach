import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  applyRefreshedRequestCookies,
  authCookieOptions,
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

// Set while a page load retries once after its refresh token was refused.
const RETRY_COOKIE = 'session_refresh_retry';

/**
 * Build a redirect on the host the browser used. request.nextUrl carries
 * Next's internal host (localhost), so a URL built from it would send users on
 * any other host to the wrong origin. Next's middleware adapter needs an
 * absolute Location, so a relative one is not an option. Next still rewrites
 * loopback hosts (127.0.0.1, ::1) to localhost in redirects; real hostnames and
 * proxy-supplied hosts are kept.
 */
function redirectOnRequestHost(request: NextRequest, location: string) {
  const firstValue = (header: string) => request.headers.get(header)?.split(',')[0]?.trim();
  const host = firstValue('x-forwarded-host') || firstValue('host');
  const protocol = firstValue('x-forwarded-proto') || request.nextUrl.protocol.replace(/:$/, '');
  let base = request.nextUrl.origin;
  if (host && /^[A-Za-z0-9.\-\[\]:]+$/.test(host) && (protocol === 'http' || protocol === 'https')) {
    base = `${protocol}://${host}`;
  }
  return NextResponse.redirect(new URL(location, base), 307);
}

function redirectToSignIn(request: NextRequest) {
  const query = new URLSearchParams({ callbackUrl: request.nextUrl.pathname });
  const response = redirectOnRequestHost(request, `/auth/sign-in/?${query.toString()}`);
  response.cookies.set(RETRY_COOKIE, '', { ...authCookieOptions, maxAge: 0 });
  return response;
}

/**
 * Reload the same page once. A background request may have rotated the
 * refresh token a moment before this navigation, which still carried the old
 * one; by the time the browser follows this redirect it holds the new cookies.
 */
function retryOnce(request: NextRequest) {
  const response = redirectOnRequestHost(request, `${request.nextUrl.pathname}${request.nextUrl.search}`);
  response.cookies.set(RETRY_COOKIE, '1', { ...authCookieOptions, maxAge: 10 });
  return response;
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
    const response = forwardRefreshed(request, session.refreshed);
    if (request.cookies.get(RETRY_COOKIE)) {
      response.cookies.set(RETRY_COOKIE, '', { ...authCookieOptions, maxAge: 0 });
    }
    return response;
  }

  // A refused refresh can mean a concurrent request already rotated the token,
  // so cookies are never cleared here: that response could race and erase the
  // winner's new cookies. Signing in again overwrites stale ones.
  if (!session.accessToken) {
    if (session.rejected && !request.cookies.get(RETRY_COOKIE)) return retryOnce(request);
    return redirectToSignIn(request);
  }

  const response = NextResponse.next();
  if (request.cookies.get(RETRY_COOKIE)) {
    response.cookies.set(RETRY_COOKIE, '', { ...authCookieOptions, maxAge: 0 });
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)', '/api/v2/:path*']
};
