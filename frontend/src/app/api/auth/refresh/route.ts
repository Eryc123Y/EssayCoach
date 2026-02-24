import { NextRequest, NextResponse } from 'next/server';

type RefreshRequestBody = {
  refresh?: string;
};

/**
 * @deprecated Use /api/v2/auth/refresh instead
 * This route is kept for backwards compatibility and redirects to v2
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RefreshRequestBody;
    const { refresh } = body ?? {};

    if (!refresh) {
      return NextResponse.json(
        { message: 'refresh token is required' },
        { status: 400 }
      );
    }

    // Redirect to v2 endpoint
    const refreshUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000'}/api/v2/auth/refresh`;

    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData?.detail || errorData?.message || 'Failed to refresh token';
      return NextResponse.json({ message }, { status: response.status });
    }

    const result = await response.json();
    const { access, refresh: newRefresh, expiresAt } = result;

    const res = NextResponse.json({
      access,
      refresh: newRefresh,
      expiresAt
    });

    // Set new access token cookie
    res.cookies.set('access_token', access, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 // 1 hour
    });

    // Set new refresh token cookie
    res.cookies.set('refresh_token', newRefresh, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return res;
  } catch (error) {
    console.error('[Refresh] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
