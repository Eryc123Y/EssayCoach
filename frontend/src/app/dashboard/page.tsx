import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveDashboardRole } from '@/lib/server-dashboard-auth';

export default async function Dashboard() {
  const accessToken = (await cookies()).get('access_token')?.value;
  const role = await resolveDashboardRole(accessToken);
  redirect(role ? `/dashboard/${role}` : '/auth/sign-in');
}
