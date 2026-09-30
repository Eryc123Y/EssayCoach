import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NotificationCenter } from '@/features/notifications/notification-center';
import { resolveDashboardRole } from '@/lib/server-dashboard-auth';

export default async function NotificationsPage() {
  const role = await resolveDashboardRole((await cookies()).get('access_token')?.value);
  if (!role) redirect('/auth/sign-in');
  return <NotificationCenter />;
}
