import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  // const cookieStore = await cookies();
  // const access = cookieStore.get('access_token')?.value;
  // if (!access) return redirect('/auth/sign-in');
  return redirect('/dashboard/overview');
}
