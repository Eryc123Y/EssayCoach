import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminDirectory } from '@/features/users/admin-directory';
import { resolveDashboardRole } from '@/lib/server-dashboard-auth';

export default async function UsersPage() {
  const role = await resolveDashboardRole((await cookies()).get('access_token')?.value);
  if (!role) redirect('/auth/sign-in');
  if (role !== 'admin') redirect(`/dashboard/${role}`);
  return <AdminDirectory />;
}
