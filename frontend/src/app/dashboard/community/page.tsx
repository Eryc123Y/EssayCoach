import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CommunityWorkspace } from '@/features/community/community-workspace';
import { resolveDashboardRole } from '@/lib/server-dashboard-auth';

export default async function CommunityPage() {
  const role = await resolveDashboardRole((await cookies()).get('access_token')?.value);
  if (!role) redirect('/auth/sign-in');
  return <CommunityWorkspace role={role} />;
}
