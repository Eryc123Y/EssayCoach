import { NextRequest, NextResponse } from 'next/server';

type LoginRequestBody = {
  email?: string;
  password?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as LoginRequestBody;
    const email = body?.email;
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Call the real Django backend
    // Force 127.0.0.1 to avoid Node.js ipv6 resolution issues
    const apiUrl = (
      process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    ).replace('localhost', '127.0.0.1');
    const response = await fetch(`${apiUrl}/api/v1/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData?.error?.message || errorData?.detail || 'Invalid credentials';
      return NextResponse.json({ message }, { status: response.status });
    }

    const result = await response.json();
    const { token, user } = result.data;
    
    // Normalize user role field - backend may return 'role' or other field names
    const normalizedUser = {
      ...user,
      // Ensure role field is consistent
      role: user.role || user.user_role || 'student'
    };
    
    // Debug: Log the user object to see what fields are available
    console.log('[Login Debug] Raw user from API:', JSON.stringify(user, null, 2));
    console.log('[Login Debug] Normalized user role:', normalizedUser.role);

    const res = NextResponse.json({ access: token, user: normalizedUser });

    // Set cookie for frontend request.ts to use
    res.cookies.set('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

     // Mirror user info in cookies for simple-auth-context.tsx (using normalizedUser for consistency)
    res.cookies.set('user_email', normalizedUser.email || '', {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });
    res.cookies.set('user_first_name', normalizedUser.first_name || '', {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });
    res.cookies.set('user_last_name', normalizedUser.last_name || '', {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });
    res.cookies.set('user_role', normalizedUser.role, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });
    res.cookies.set('user_id', String(normalizedUser.user_id || normalizedUser.id || ''), {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
