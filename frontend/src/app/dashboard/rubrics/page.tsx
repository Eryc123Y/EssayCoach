import { RubricsClient } from '@/features/rubrics/components/rubric-list';
import { rubricService, authService } from '@/service/api/v2/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function getRubrics() {
  try {
    // The API handles role-based filtering automatically
    const response = await rubricService.fetchRubricList();
    return response.results || [];
  } catch (error) {
    console.error('Failed to fetch rubrics:', error);
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

    // Fetch full user info including role
    const userInfo = await authService.getUserInfo();
    return {
      userId: userInfo.user_id,
      role: (userInfo.user_role === 'teacher' ? 'lecturer' : userInfo.user_role) as 'student' | 'lecturer' | 'admin'
    };
  } catch (error) {
    console.error('Failed to get current user:', error);
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
