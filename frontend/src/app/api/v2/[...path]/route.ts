import { NextRequest, NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/server-api';

const DJANGO_API_URL = getServerApiUrl();

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
  const headers = new Headers(req.headers);

  // Set Host header based on environment URL
  headers.set('Host', backendUrl.host);

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
