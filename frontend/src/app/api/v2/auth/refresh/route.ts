import { NextRequest, NextResponse } from 'next/server';
import {
  isRememberedSession,
  refreshSessionTokens,
  setSessionCookies
} from '@/lib/auth-session';

export async function POST(req: NextRequest) {
  try {
    // Prefer refresh token from HttpOnly cookie; fall back to request body for compatibility.
    const body = await req.json().catch(() => ({}));
    const refreshToken = req.cookies.get('refresh_token')?.value || body?.refresh;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'refresh token is required' },
        { status: 400 }
      );
    }

    const result = await refreshSessionTokens(refreshToken, isRememberedSession(req));
    if (result.status === 'rejected') {
      return NextResponse.json({ message: 'Invalid or expired refresh token' }, { status: 401 });
    }
    if (result.status === 'error') {
      return NextResponse.json({ message: 'Failed to refresh token' }, { status: 502 });
    }

    const res = NextResponse.json({ expiresAt: result.tokens.expiresAt });
    // Token rotation: the backend issued a new refresh token.
    setSessionCookies(res, result.tokens);
    return res;
  } catch (error) {
    console.error('[Refresh] Failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
