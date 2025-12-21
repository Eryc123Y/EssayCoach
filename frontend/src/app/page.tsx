import { redirect } from 'next/navigation';

export default async function Page() {
  // const cookieStore = cookies();
  // const access = cookieStore.get('access_token')?.value;
  // if (!access) return redirect('/auth/sign-in');
  return redirect('/dashboard/overview');
}
