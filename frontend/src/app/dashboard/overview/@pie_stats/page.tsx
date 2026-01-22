import { delay } from '@/lib/utils';
import { PieGraph } from '@/features/overview/components/pie-graph';

export default async function PieStatsPage() {
  await delay(1000);
  return <PieGraph />;
}
