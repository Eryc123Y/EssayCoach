import { request } from '@/service/request';

export type FormalSubmission = {
  submission_id: number;
  submission_time: string;
  submission_txt: string;
  task_id_task: number;
  user_id_user: number;
};

export type AssessmentCriterion = {
  rubric_item_id: number;
  score: number;
  comment: string;
  source: string;
};

export type AssessmentSnapshotItem = {
  id: number;
  name: string;
  weight: string;
  max_score: number;
};

export type FormalAssessment = {
  submission_id: number;
  status: 'ai_pending' | 'ai_draft' | 'lecturer_reviewed' | 'published';
  version: number;
  final_score: string | null;
  items: AssessmentCriterion[];
  ai_proposal: { model: string; run_id: string; items: AssessmentCriterion[] } | null;
  rubric_snapshot: AssessmentSnapshotItem[] | null;
  can_publish: boolean;
  reviewed_by: number | null;
  reviewed_at: string | null;
  published_by: number | null;
  published_at: string | null;
};

export type FormalAIJob = {
  job_id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  attempts: number;
  model: string;
  error_message: string | null;
  error_category: string | null;
};

const core = '/api/v2/core';
const ai = '/api/v2/ai-feedback';

export const assessmentService = {
  getSubmission: (id: number) => request<FormalSubmission>({ url: `${core}/submissions/${id}/` }),
  getAssessment: (id: number) => request<FormalAssessment>({ url: `${core}/assessments/${id}/` }),
  getJob: (id: number) => request<FormalAIJob>({ url: `${ai}/jobs/submission/${id}/` }),
  retryJob: (jobId: string) => request<FormalAIJob>({ url: `${ai}/jobs/${jobId}/retry/`, method: 'POST' }),
  review: (id: number, expectedVersion: number, items: Array<{ rubric_item_id: number; score: number; comment: string }>) =>
    request<FormalAssessment>({
      url: `${core}/assessments/${id}/review/`, method: 'POST',
      data: { expected_version: expectedVersion, items }
    }),
  publish: (id: number, expectedVersion: number) => request<FormalAssessment>({
    url: `${core}/assessments/${id}/publish/`, method: 'POST',
    data: { expected_version: expectedVersion }
  })
};
