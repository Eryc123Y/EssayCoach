import { RubricsClient } from '@/features/rubrics/components/rubric-list';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerApiUrl } from '@/lib/server-api';

async function getRubrics() {
  try {
    const cookieStore = await cookies();
    const access = cookieStore.get('access_token')?.value;

    if (!access) {
      redirect('/auth/sign-in');
    }

    const apiUrl = getServerApiUrl();

    const response = await fetch(`${apiUrl}/api/v2/core/rubrics/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    return Array.isArray(payload) ? payload : payload?.results || [];
  } catch (error) {
    console.error(
      '[getRubrics] Failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return [];
  }
}

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const access = cookieStore.get('access_token')?.value;

    if (!access) {
      redirect('/auth/sign-in');
    }

    const apiUrl = getServerApiUrl();

    const response = await fetch(`${apiUrl}/api/v2/core/users/me/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      redirect('/auth/sign-in');
    }

    const userInfo = await response.json();
    return {
      userId: userInfo.user_id,
      role: (userInfo.user_role === 'teacher'
        ? 'lecturer'
        : userInfo.user_role) as 'student' | 'lecturer' | 'admin'
    };
  } catch (error) {
    console.error(
      '[getCurrentUser] Failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    redirect('/auth/sign-in');
  }
}

export default async function RubricsPage() {
  const [rubrics, user] = await Promise.all([getRubrics(), getCurrentUser()]);

  return (
    <RubricsClient
      initialRubrics={rubrics}
      userRole={user.role}
      userId={user.userId}
    />
  );
}
