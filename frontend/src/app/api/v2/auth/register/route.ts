import { NextRequest, NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/server-api';
import { normalizeUserInfo } from '@/lib/user-normalization';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }

  try {
    const response = await fetch(`${getServerApiUrl()}/api/v2/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { message: result?.detail || 'Invitation could not be activated' },
        { status: response.status, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const payload = result?.data ?? result;
    if (!payload?.token || !payload?.refresh || !payload?.user) {
      return NextResponse.json(
        { message: 'Invalid activation response' },
        { status: 502 }
      );
    }
    const user = normalizeUserInfo(payload.user);
    const output = NextResponse.json(
      { user },
      { headers: { 'Cache-Control': 'no-store' } }
    );
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    };
    output.cookies.set('access_token', payload.token, {
      ...cookieOptions,
      maxAge: 60 * 60
    });
    output.cookies.set('refresh_token', payload.refresh, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7
    });
    return output;
  } catch {
    return NextResponse.json(
      { message: 'Backend service unavailable' },
      { status: 502 }
    );
  }
}
