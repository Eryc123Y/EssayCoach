import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveDashboardRole } from '@/lib/server-dashboard-auth';
import { PortfolioWorkspace } from '@/features/profile/portfolio-workspace';

export const metadata = {
  title: 'Dashboard : Profile'
};

export default async function Page({ params }: { params: Promise<{ profile?: string[] }> }) {
  const role = await resolveDashboardRole((await cookies()).get('access_token')?.value);
  if (!role) redirect('/auth/sign-in');
  const path = (await params).profile;
  const id = path?.[0] ? Number(path[0]) : undefined;
  if (path && (path.length !== 1 || !Number.isSafeInteger(id) || (id ?? 0) <= 0)) redirect('/dashboard/profile');
  return <PortfolioWorkspace profileId={id} />;
}
