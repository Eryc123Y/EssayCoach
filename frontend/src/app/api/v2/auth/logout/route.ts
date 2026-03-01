import { NextRequest, NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/server-api';

export async function POST(req: NextRequest) {
  // Call Django backend to invalidate token
  const apiUrl = getServerApiUrl();
  const token = req.cookies.get('access_token')?.value;
  
  if (token) {
    try {
      await fetch(`${apiUrl}/api/v2/auth/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      // Continue with cookie clearing even if backend call fails
      console.error('[Logout] Backend call failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set('access_token', '', { httpOnly: true, path: '/', maxAge: 0 });
  res.cookies.set('refresh_token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0
  });
  res.cookies.set('user_email', '', { httpOnly: true, path: '/', maxAge: 0 });
  res.cookies.set('user_first_name', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0
  });
  res.cookies.set('user_last_name', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0
  });
  res.cookies.set('user_role', '', { httpOnly: true, path: '/', maxAge: 0 });
  res.cookies.set('user_id', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
