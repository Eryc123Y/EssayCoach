import { NextRequest, NextResponse } from 'next/server';
import { normalizeUserInfo } from '@/lib/user-normalization';
import { getServerApiUrl } from '@/lib/server-api';

type LoginRequestBody = {
  email?: string;
  password?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as LoginRequestBody;
    const email = body?.email;
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Call the real Django backend with JWT endpoint
    // Force 127.0.0.1 to avoid Node.js ipv6 resolution issues
    const apiUrl = getServerApiUrl();
    const response = await fetch(`${apiUrl}/api/v2/auth/login-with-jwt/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData?.error?.message || errorData?.detail || 'Invalid credentials';
      return NextResponse.json({ message }, { status: response.status });
    }

    const result = await response.json();
    const payload = result?.data ?? result;
    const { token, refresh, expires_at, user } = payload;

    // Normalize user role field - backend may return 'role' or other field names
    const normalizedUser = normalizeUserInfo(user);

    const res = NextResponse.json({
      access: token,
      refresh,
      expiresAt: expires_at,
      user: normalizedUser
    });

    // Set access token cookie
    res.cookies.set('access_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 // 1 hour
    });

    // Set refresh token cookie - longer expiry for refresh token
    res.cookies.set('refresh_token', refresh, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Store user info in HttpOnly cookies for security (prevents client-side tampering)
    // Frontend should read user data from the response body, not cookies
    res.cookies.set('user_email', normalizedUser.user_email || '', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24
    });
    res.cookies.set('user_first_name', normalizedUser.user_fname || '', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24
    });
    res.cookies.set('user_last_name', normalizedUser.user_lname || '', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24
    });
    res.cookies.set('user_role', normalizedUser.user_role, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24
    });
    res.cookies.set('user_id', String(normalizedUser.user_id || ''), {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24
    });

    return res;
  } catch (error) {
    console.error(
      '[Login] Failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
