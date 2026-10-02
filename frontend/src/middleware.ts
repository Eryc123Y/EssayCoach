import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  applyRefreshedRequestCookies,
  clearSessionCookies,
  resolveSession,
  setSessionCookies
} from '@/lib/auth-session';

function redirectToSignIn(request: NextRequest, clearCookies: boolean) {
  const url = request.nextUrl.clone();
  url.pathname = '/auth/sign-in';
  url.search = '';
  url.searchParams.set('callbackUrl', request.nextUrl.pathname);
  const response = NextResponse.redirect(url);
  if (clearCookies) clearSessionCookies(response);
  return response;
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

  if (!session.accessToken || session.rejected) {
    return redirectToSignIn(request, Boolean(session.rejected));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
