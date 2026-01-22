import { delay } from '@/lib/utils';
import { BarGraph } from '@/features/overview/components/bar-graph';

export default async function BarStatsPage() {
  await delay(1000);

  return <BarGraph />;
}
