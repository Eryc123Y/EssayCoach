import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { TaskDetail } from '@/features/tasks/components/task-detail';
import { resolveDashboardRole } from '@/lib/server-dashboard-auth';

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const role = await resolveDashboardRole((await cookies()).get('access_token')?.value);
  if (!role) redirect('/auth/sign-in');
  return <TaskDetail taskId={Number(id)} role={role} />;
}
