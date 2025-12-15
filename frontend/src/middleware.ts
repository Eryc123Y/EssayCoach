import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const pathname = nextUrl.pathname;

  // Bypass our checks for auth endpoints and static assets
  if (pathname.includes('/auth/login/')) return NextResponse.next();
  if (pathname.startsWith('/_next')) return NextResponse.next();

  // const isProtected = pathname.startsWith('/dashboard');
  // if (!isProtected) return NextResponse.next();

  // all sites except login require authentication
  const access = cookies.get('access_token')?.value;
  if (access) {
    const headers = new Headers(req.headers);
    headers.set('Authorization', `Bearer ${access}`);

    return NextResponse.next({
      request: {
        headers
      }
    });
  }

  // Redirect to login if no access token is present
  const url = req.nextUrl.clone();
  url.pathname = '/auth/sign-in';
  url.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
};
