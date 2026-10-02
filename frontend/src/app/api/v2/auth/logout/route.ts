import { NextRequest, NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/server-api';
import { clearSessionCookies, resolveSession } from '@/lib/auth-session';

export async function POST(req: NextRequest) {
  // Revoke the backend session even when only the refresh cookie is left.
  const { accessToken } = await resolveSession(req);

  if (accessToken) {
    try {
      await fetch(`${getServerApiUrl()}/api/v2/auth/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      // Continue with cookie clearing even if backend call fails
      console.error('[Logout] Backend call failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  const res = NextResponse.json({ success: true });
  clearSessionCookies(res);
  return res;
}
