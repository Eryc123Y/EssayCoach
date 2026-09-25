import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AnalyticsWorkspace } from '@/features/analytics/analytics-workspace';
import { resolveDashboardRole } from '@/lib/server-dashboard-auth';

export default async function AnalyticsPage() {
  const role = await resolveDashboardRole((await cookies()).get('access_token')?.value);
  if (!role) redirect('/auth/sign-in');
  return <AnalyticsWorkspace role={role} />;
}
