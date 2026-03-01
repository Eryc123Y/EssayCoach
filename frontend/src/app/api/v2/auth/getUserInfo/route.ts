import { NextRequest, NextResponse } from 'next/server';
import { normalizeUserInfo } from '@/lib/user-normalization';
import { getServerApiUrl } from '@/lib/server-api';

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
    const apiUrl = getServerApiUrl();

    const response = await fetch(`${apiUrl}/api/v2/core/users/me/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
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
    const normalizedUser = normalizeUserInfo(result);
    return NextResponse.json({
      success: true,
      data: normalizedUser
    });
  } catch (error) {
    console.error(
      '[getUserInfo] Error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
