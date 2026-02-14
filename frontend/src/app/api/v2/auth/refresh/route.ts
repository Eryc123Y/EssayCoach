import { NextRequest, NextResponse } from 'next/server';

type RefreshRequestBody = {
  refresh?: string;
};

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

    // Mock delay to simulate backend
    await new Promise((resolve) => setTimeout(resolve, 400));

    const access = 'mock_access_token_refreshed_eyJ0eXAiOiJKV1QiLCJhbGc';
    const res = NextResponse.json({ access });
    res.cookies.set('access_token', access, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60
    });
    return res;
  } catch (_e) {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }
}
