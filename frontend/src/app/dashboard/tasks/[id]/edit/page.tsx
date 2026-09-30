import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { TaskForm } from '@/features/tasks/components/task-form';
import { resolveDashboardRole } from '@/lib/server-dashboard-auth';
import { getServerApiUrl } from '@/lib/server-api';
import type { Task } from '@/service/api/v2/types';

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const token = (await cookies()).get('access_token')?.value;
  const role = await resolveDashboardRole(token);
  if (!role) redirect('/auth/sign-in');
  if (role === 'student') redirect('/dashboard/tasks');
  const response = await fetch(`${getServerApiUrl()}/api/v2/core/tasks/${id}/`, {
    headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
  });
  if (response.status === 403 || response.status === 404) notFound();
  if (!response.ok) throw new Error(`Could not load assignment: ${response.status}`);
  const task = (await response.json()) as Task;
  return <main className='mx-auto max-w-3xl px-5 py-8 md:px-9'><TaskForm taskId={task.task_id} initialData={task} /></main>;
}
