import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getServerApiUrl } from '@/lib/server-api';
import { FormalSubmissionDetail } from '@/features/essay-feedback/components/formal-submission-detail';

type Submission = {
  submission_id: number;
  submission_time: string;
  task_id_task: number;
  submission_txt: string;
};

type PublishedAssessment = {
  status: string;
  final_score: string | null;
  published_at: string | null;
  items: Array<{ rubric_item_id: number; score: number; comment: string }>;
  rubric_snapshot: Array<{ id: number; name: string; max_score: number }> | null;
};

async function fetchPrivateRecord(url: string, token: string): Promise<Response> {
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
}

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const token = (await cookies()).get('access_token')?.value;
  if (!token) redirect('/auth/sign-in');
  const base = `${getServerApiUrl()}/api/v2/core`;
  const [submissionResponse, assessmentResponse] = await Promise.all([
    fetchPrivateRecord(`${base}/submissions/${id}/`, token),
    fetchPrivateRecord(`${base}/assessments/${id}/`, token)
  ]);
  if (submissionResponse.status === 401 || assessmentResponse.status === 401) redirect('/auth/sign-in');
  if (submissionResponse.status === 403 || submissionResponse.status === 404) notFound();
  if (!submissionResponse.ok) throw new Error(`Could not load submission: ${submissionResponse.status}`);
  if (!assessmentResponse.ok && assessmentResponse.status !== 404) {
    throw new Error(`Could not load assessment: ${assessmentResponse.status}`);
  }
  const submission = (await submissionResponse.json()) as Submission;
  const assessment = assessmentResponse.status === 404
    ? null
    : (await assessmentResponse.json()) as PublishedAssessment;
  return <FormalSubmissionDetail submission={submission} assessment={assessment} />;
}
