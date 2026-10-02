import { NextRequest, NextResponse } from 'next/server';
import { normalizeUserInfo } from '@/lib/user-normalization';
import { getServerApiUrl } from '@/lib/server-api';
import { authCookieOptions, setSessionCookies } from '@/lib/auth-session';

type LoginRequestBody = {
  email?: string;
  password?: string;
  remember?: boolean;
};

/**
 * The browser's address for the backend's per-client login limits.
 * Next fills x-forwarded-for from the socket when it is absent; a reverse
 * proxy that appends to it writes the right-most entry, so only that one is
 * forwarded. When Next is exposed directly a client can still forge it, which
 * the backend's per-account ceiling bounds.
 */
function clientAddress(req: NextRequest): string | undefined {
  const forwarded = req.headers.get('x-forwarded-for');
  const address = forwarded?.split(',').pop()?.trim();
  return address || undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as LoginRequestBody;
    const email = body?.email;
    const password = body?.password;
    // Missing values preserve the long-lived behavior used by existing clients.
    const remember = body?.remember !== false;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Call the real Django backend with JWT endpoint
    // Force 127.0.0.1 to avoid Node.js ipv6 resolution issues
    const apiUrl = getServerApiUrl();
    const forwardedFor = clientAddress(req);
    const response = await fetch(`${apiUrl}/api/v2/auth/login-with-jwt/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {})
      },
      body: JSON.stringify({ email, password, remember })
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
      expiresAt: expires_at,
      user: normalizedUser
    });

    setSessionCookies(res, { access: token, refresh, expiresAt: expires_at, remember });

    // Store user info in HttpOnly cookies for security (prevents client-side tampering)
    // Frontend should read user data from the response body, not cookies
    const userCookieOptions = { ...authCookieOptions, ...(remember ? { maxAge: 60 * 60 * 24 } : {}) };
    res.cookies.set('user_email', normalizedUser.user_email || '', userCookieOptions);
    res.cookies.set('user_first_name', normalizedUser.user_fname || '', userCookieOptions);
    res.cookies.set('user_last_name', normalizedUser.user_lname || '', userCookieOptions);
    res.cookies.set('user_role', normalizedUser.user_role, userCookieOptions);
    res.cookies.set(
      'user_id',
      String(normalizedUser.user_id || ''),
      userCookieOptions
    );

    return res;
  } catch (error) {
    console.error('[Login] Failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
