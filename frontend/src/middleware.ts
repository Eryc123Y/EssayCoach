import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const pathname = nextUrl.pathname;

  const access = cookies.get('access_token')?.value;
  if (access) {
    // Redirect to dashboard if user is already authenticated and tries to access sign-in page
    if (pathname.startsWith('/auth/sign-in')) {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard/overview';
      return NextResponse.redirect(url);
    }

    // Attach Authorization header for authenticated requests
    const headers = new Headers(req.headers);
    headers.set('Authorization', `Bearer ${access}`);
    return NextResponse.next({
      request: {
        headers
      }
    });
  }

  // Bypass for public routes
  if (
    pathname.startsWith('/auth/sign-in') || // frontend login page
    pathname.startsWith('/_next') ||
    pathname.includes('/api/auth/login') // backend login endpoint
  ) {
    return NextResponse.next();
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
