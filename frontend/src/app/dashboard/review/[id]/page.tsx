import { notFound } from 'next/navigation';
import { AssessmentWorkspace } from '@/features/essay-feedback/components/assessment-workspace';

export default async function ReviewSubmissionPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ queue?: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const { queue: rawQueue } = await searchParams;
  const queue = (rawQueue || '').split(',').filter((value) => /^\d+$/.test(value)).slice(0, 500).map(Number);
  return <AssessmentWorkspace submissionId={Number(id)} queue={queue} />;
}
