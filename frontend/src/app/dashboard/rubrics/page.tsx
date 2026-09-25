import { RubricsClient } from '@/features/rubrics/components/rubric-list';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerApiUrl } from '@/lib/server-api';

async function getRubrics(access: string) {
  const response = await fetch(`${getServerApiUrl()}/api/v2/core/rubrics/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Rubric list failed: ${response.status}`);
  const payload = await response.json();
  return Array.isArray(payload) ? payload : payload?.results || [];
}

async function getCurrentUser(access: string) {
  const response = await fetch(`${getServerApiUrl()}/api/v2/core/users/me/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
  });
  if (!response.ok) redirect('/auth/sign-in');
  const userInfo = await response.json();
  return {
    userId: userInfo.user_id,
    role: (userInfo.user_role === 'teacher' ? 'lecturer' : userInfo.user_role) as 'student' | 'lecturer' | 'admin'
  };
}

export default async function RubricsPage() {
  const access = (await cookies()).get('access_token')?.value;
  if (!access) redirect('/auth/sign-in');
  const [rubrics, user] = await Promise.all([getRubrics(access), getCurrentUser(access)]);

  return (
    <RubricsClient
      initialRubrics={rubrics}
      userRole={user.role}
      userId={user.userId}
    />
  );
}
