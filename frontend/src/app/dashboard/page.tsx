import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateAndDecodeToken } from '@/lib/auth';

/**
 * Map backend role names to frontend role names
 * Backend uses 'teacher', frontend uses 'lecturer'
 */
function normalizeRole(role: string): 'student' | 'lecturer' | 'admin' {
  if (role === 'teacher') return 'lecturer';
  return role as 'student' | 'lecturer' | 'admin';
}

export default async function Dashboard() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  // If no cookie, redirect to overview which has client-side auth handling
  if (!accessToken) {
    return redirect('/dashboard/overview');
  }

  // Validate JWT token with signature verification
  const tokenValidation = await validateAndDecodeToken(accessToken);

  // If token invalid, redirect to overview (client will handle refresh)
  if (!tokenValidation.valid || !tokenValidation.role) {
    return redirect('/dashboard/overview');
  }

  const normalizedRole = normalizeRole(tokenValidation.role);

  // Redirect to role-specific dashboard
  return redirect(`/dashboard/${normalizedRole}`);
}
