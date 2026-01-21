import { delay } from '@/lib/utils';
import { BarGraph } from '@/features/overview/components/bar-graph';

export default async function BarStats() {
  await await delay(1000);

  return <BarGraph />;
}
