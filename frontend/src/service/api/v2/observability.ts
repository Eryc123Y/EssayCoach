import { request } from '@/service/request';

export type JobState = {
  kind: 'formal' | 'practice' | 'chat';
  id: string;
  status: string;
  model: string;
  attempts: number;
  error_category: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  usage: Record<string, number> | null;
};

export type OperationsOverview = {
  database_ok: boolean;
  worker_ok: boolean;
  worker_last_seen_at: string | null;
  worker_processed_jobs: number;
  codex_binary_found: boolean;
  codex_login_status: 'valid' | 'not_logged_in' | 'runtime_unavailable' | 'unknown_timeout' | 'unknown_error';
  counts: Record<'formal' | 'practice' | 'chat', Record<string, number>>;
  jobs: JobState[];
};

export type OperationsTrace = {
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  name: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  status: string;
  attributes: Record<string, string | number>;
};

const base = '/api/v2/admin/observability';

export const observabilityService = {
  overview: () => request<OperationsOverview>({ url: `${base}/overview/` }),
  traces: (jobId?: string) => request<OperationsTrace[]>({
    url: `${base}/traces/`, params: jobId ? { job_id: jobId } : {},
  }),
};
