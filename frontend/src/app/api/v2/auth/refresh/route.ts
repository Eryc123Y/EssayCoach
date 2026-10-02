import { NextRequest, NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/server-api';

const persistentCookieAge = 60 * 60 * 24 * 7;
const secureCookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export async function POST(req: NextRequest) {
  try {
    // Prefer refresh token from HttpOnly cookie; fall back to request body for compatibility.
    const body = await req.json().catch(() => ({}));
    const refreshToken =
      req.cookies.get('refresh_token')?.value || body?.refresh;
    // The marker is deliberately independent from the token itself. Missing
    // markers are from older logins and keep their existing persistent behavior.
    const remember = req.cookies.get('session_persistence')?.value !== 'session';

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'refresh token is required' },
        { status: 400 }
      );
    }

    // Call the real Django backend
    const apiUrl = getServerApiUrl();

    const response = await fetch(`${apiUrl}/api/v2/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData?.detail || errorData?.message || 'Failed to refresh token';
      return NextResponse.json({ message }, { status: response.status });
    }

    const result = await response.json();
    const payload = result?.data ?? result;
    const { access, refresh: newRefresh, expires_at } = payload;

    const res = NextResponse.json({
      expiresAt: expires_at
    });

    // Set new access token cookie
    res.cookies.set('access_token', access, {
      ...secureCookieOptions,
      ...(remember ? { maxAge: 60 * 60 } : {}),
    });

    // Set new refresh token cookie (token rotation - new refresh token issued)
    res.cookies.set('refresh_token', newRefresh, {
      ...secureCookieOptions,
      ...(remember ? { maxAge: persistentCookieAge } : {}),
    });
    res.cookies.set('session_persistence', remember ? 'persistent' : 'session', {
      ...secureCookieOptions,
      ...(remember ? { maxAge: persistentCookieAge } : {}),
    });

    return res;
  } catch (error) {
    console.error('[Refresh] Failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
