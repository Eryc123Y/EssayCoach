import { NextRequest, NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/server-api';

const DJANGO_API_URL = getServerApiUrl();

const SAFE_FORWARD_HEADERS = [
  'accept',
  'content-type',
  'origin',
  'referer',
  'x-csrftoken',
  'x-requested-with'
] as const;

const SAFE_FORWARD_COOKIES = ['csrftoken', 'sessionid'] as const;

function buildProxyHeaders(req: NextRequest, backendHost: string): Headers {
  const headers = new Headers();

  for (const headerName of SAFE_FORWARD_HEADERS) {
    const value = req.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  headers.set('Host', backendHost);

  const safeCookies = SAFE_FORWARD_COOKIES.flatMap((cookieName) => {
    const value = req.cookies.get(cookieName)?.value;
    return value ? [`${cookieName}=${value}`] : [];
  });

  if (safeCookies.length > 0) {
    headers.set('Cookie', safeCookies.join('; '));
  }

  return headers;
}

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  let backendUrl: URL;
  try {
    backendUrl = new URL(DJANGO_API_URL);
  } catch {
    return NextResponse.json(
      { error: 'Invalid backend API URL configuration' },
      { status: 500 }
    );
  }

  const { path } = await params;
  const pathString = path.join('/');
  const queryString = req.nextUrl.searchParams.toString();
  const querySuffix = queryString ? `?${queryString}` : '';

  const targetUrl = `${backendUrl.origin}/api/v2/${pathString}/${querySuffix}`;

  const token = req.cookies.get('access_token')?.value;
  const headers = buildProxyHeaders(req, backendUrl.host);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const body = hasBody ? await req.blob() : undefined;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      redirect: 'follow'
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
