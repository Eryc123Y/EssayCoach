import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code') || '500';
  const msg = searchParams.get('msg') || 'Internal server error';

  // Return error response for testing error handling
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message: msg
      }
    },
    { status: parseInt(code, 10) || 500 }
  );
}
