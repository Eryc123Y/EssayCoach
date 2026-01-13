import { NextResponse } from 'next/server';

export async function POST() {
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
