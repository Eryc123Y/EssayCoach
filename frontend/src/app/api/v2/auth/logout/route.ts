import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Call Django backend to invalidate token
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace('localhost', '127.0.0.1');
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
      console.error('Logout backend call failed:', error);
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
  return res;
}
