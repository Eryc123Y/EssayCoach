import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TaskForm } from '@/features/tasks/components/task-form';
import { resolveDashboardRole } from '@/lib/server-dashboard-auth';

export default async function NewTaskPage() {
  const role = await resolveDashboardRole((await cookies()).get('access_token')?.value);
  if (!role) redirect('/auth/sign-in');
  if (role === 'student') redirect('/dashboard/tasks');
  return <main className='mx-auto max-w-3xl px-5 py-8 md:px-9'><TaskForm /></main>;
}
