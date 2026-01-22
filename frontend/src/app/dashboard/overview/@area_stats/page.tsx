import { delay } from '@/lib/utils';
import { AreaGraph } from '@/features/overview/components/area-graph';

export default async function AreaStatsPage() {
  await delay(2000);
  return <AreaGraph />;
}
