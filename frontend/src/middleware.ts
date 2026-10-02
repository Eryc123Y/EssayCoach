import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  applyRefreshedRequestCookies,
  resolveSession,
  setSessionCookies
} from '@/lib/auth-session';

function redirectToSignIn(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/auth/sign-in';
  url.search = '';
  url.searchParams.set('callbackUrl', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export default async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  const session = await resolveSession(request);

  if (session.refreshed) {
    applyRefreshedRequestCookies(request, session.refreshed);
    const response = NextResponse.next({ request: { headers: request.headers } });
    setSessionCookies(response, session.refreshed);
    return response;
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
