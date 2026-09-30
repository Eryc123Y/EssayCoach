import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TaskList } from '@/features/tasks/components/task-list';
import { resolveDashboardRole } from '@/lib/server-dashboard-auth';

export default async function TasksPage() {
  const role = await resolveDashboardRole((await cookies()).get('access_token')?.value);
  if (!role) redirect('/auth/sign-in');
  return <main className='mx-auto max-w-7xl px-5 py-8 md:px-9'><TaskList userRole={role} /></main>;
}
