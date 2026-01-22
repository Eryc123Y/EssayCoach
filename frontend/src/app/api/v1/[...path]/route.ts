import { NextRequest, NextResponse } from 'next/server';

const DJANGO_API_URL = 'http://127.0.0.1:8000';

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');

  // Construct the target URL
  const targetUrl = `${DJANGO_API_URL}/api/v1/${pathString}/?${req.nextUrl.searchParams.toString()}`;

  // Get the token from HttpOnly cookie
  const token = req.cookies.get('access_token')?.value;

  // Prepare headers
  const headers = new Headers(req.headers);
  headers.set('Host', '127.0.0.1:8000'); // Ensure Host header matches target

  // Inject Authorization header if token exists
  if (token) {
    headers.set('Authorization', `Token ${token}`);
  }

  // Next.js Request body can only be read once, so we need to be careful.
  // For GET/HEAD methods, body must be null/undefined.
  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const body = hasBody ? await req.blob() : undefined;

  try {
    console.log(`[Proxy] Forwarding ${req.method} request to: ${targetUrl}`);
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      // distinct: follow redirects automatically to avoid browser loops
      redirect: 'follow'
    });

    console.log(`[Proxy] Received response status: ${response.status}`);

    // Create a new response to return to the client
    const responseHeaders = new Headers(response.headers);

    // Clean up headers that might cause issues
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    console.error(`[Proxy] FATAL ERROR [${req.method} ${pathString}]:`, error);
    if (error instanceof TypeError && error.message === 'fetch failed') {
      console.error(
        '[Proxy] This usually means Django is not running or not accessible at http://127.0.0.1:8000'
      );
    }
    console.error(`Proxy Error [${req.method} ${pathString}]:`, error);
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 502 }
    );
  }
}

// Export handler for all HTTP methods
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
