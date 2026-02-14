import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get the token from HttpOnly cookie
    const token = req.cookies.get('access_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Call Django backend
    const apiUrl = (
      process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    ).replace('localhost', '127.0.0.1');

    const response = await fetch(`${apiUrl}/api/v2/auth/me/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.detail || 'Failed to get user info' },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Normalize response format to match frontend expectations
    // Django returns { success: true, data: {...} }
    // Frontend expects the same format
    return NextResponse.json(result);
  } catch (error) {
    console.error('[getUserInfo] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
