import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1';

type LoginRequestBody = {
  email?: string;
  password?: string;
};

export async function POST(req: NextRequest) {
  const { email, password } = ((await req.json().catch(() => ({}))) ??
    {}) as LoginRequestBody;

  if (!email || !password) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Email and password are required'
        }
      },
      { status: 400 }
    );
  }

  try {
    const backendResponse = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store'
    });

    const payload = await backendResponse.json().catch(() => ({}));
    if (!backendResponse.ok) {
      return NextResponse.json(
        payload?.error
          ? { success: false, error: payload.error }
          : {
              success: false,
              error: {
                code: 'LOGIN_FAILED',
                message: 'Unable to authenticate with the provided credentials'
              }
            },
        { status: backendResponse.status }
      );
    }

    const token: string = payload?.data?.token;
    const response = NextResponse.json(payload, {
      status: backendResponse.status
    });

    if (token) {
      response.cookies.set('access_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24
      });
    }

    if (payload?.data?.user) {
      response.cookies.set('user_profile', JSON.stringify(payload.data.user), {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPSTREAM_UNAVAILABLE',
          message: 'Authentication service is temporarily unavailable'
        }
      },
      { status: 502 }
    );
  }
}
