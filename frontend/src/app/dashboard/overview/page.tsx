import { redirect } from 'next/navigation';

/** Preserve old links without showing fixture statistics. */
export default function DashboardOverviewPage() {
  redirect('/dashboard');
}
