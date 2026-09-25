import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SettingsWorkspace from '@/features/settings/settings-workspace';
import { resolveDashboardRole } from '@/lib/server-dashboard-auth';

export default async function SettingsPage() {
  const role = await resolveDashboardRole((await cookies()).get('access_token')?.value);
  if (!role) redirect('/auth/sign-in');
  return <SettingsWorkspace />;
}
