import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { HelpCenter } from '@/features/help/help-center';
import { resolveDashboardRole } from '@/lib/server-dashboard-auth';

export default async function HelpPage() {
  const role = await resolveDashboardRole((await cookies()).get('access_token')?.value);
  if (!role) redirect('/auth/sign-in');
  return <HelpCenter role={role} />;
}
