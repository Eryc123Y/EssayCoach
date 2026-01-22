import { delay } from '@/lib/utils';
import { RecentSubmissions } from '@/features/overview/components/recent-submissions';

export default async function SubmissionsPage() {
  await delay(1000);
  return <RecentSubmissions />;
}
