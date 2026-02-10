import { NextRequest, NextResponse } from 'next/server';

const DJANGO_API_URL = 'http://127.0.0.1:8000';

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');

  const targetUrl = `${DJANGO_API_URL}/api/v2/${pathString}/?${req.nextUrl.searchParams.toString()}`;

  const token = req.cookies.get('access_token')?.value;
  const headers = new Headers(req.headers);

  headers.set('Host', '127.0.0.1:8000');

  if (token) {
    headers.set('Authorization', `Token ${token}`);
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
