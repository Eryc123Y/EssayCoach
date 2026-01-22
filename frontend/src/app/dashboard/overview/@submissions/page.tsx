import { delay } from '@/lib/utils';
import { RecentSubmissions } from '@/features/overview/components/recent-submissions';

export default async function Submissions() {
  await delay(1000); 
  return <RecentSubmissions />;
}
