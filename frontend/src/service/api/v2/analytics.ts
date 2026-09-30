import { request } from '@/service/request';

export type ScorePoint = { date: string; average_score: number; count: number };
export type CriterionPoint = { criterion: string; average_percent: number; samples: number };
export type ScoreHistory = { submission_id: number; task_id: number; task_title: string; score: number; published_at: string };

export type StudentAnalytics = {
  user_id: number;
  total_submissions: number;
  published_results: number;
  average_score: number | null;
  class_average: number | null;
  score_history: ScoreHistory[];
  trend: ScorePoint[];
  criteria: CriterionPoint[];
  recommendations: Array<{ criterion: string; average_percent: number }>;
};

export type ClassAnalytics = {
  class_id: number;
  class_name: string;
  unit_id: string;
  student_count: number;
  task_count: number;
  submission_count: number;
  published_count: number;
  average_score: number | null;
  completion_rate: number;
  distribution: Array<{ range: string; count: number }>;
  trend: ScorePoint[];
  criteria: CriterionPoint[];
  students: Array<{ user_id: number; name: string; email: string; submissions: number; published_results: number; average_score: number | null }>;
  tasks: Array<{ task_id: number; title: string; published_results: number; average_score: number | null }>;
};

export type InstitutionAnalytics = {
  active_users: number;
  active_students: number;
  active_lecturers: number;
  active_classes: number;
  submission_count: number;
  published_count: number;
  average_score: number | null;
  trend: ScorePoint[];
  classes: Array<{ class_id: number; class_name: string; unit_id: string; student_count: number; submission_count: number; published_count: number; average_score: number | null }>;
  lecturer_activity: Array<{ user_id: number; reviews: number }>;
  ai_jobs: Record<string, number>;
};

export type AnalyticsScope = 'student' | 'class' | 'institution';
export type AnalyticsFilter = { start_date?: string; end_date?: string };

const base = '/api/v2/analytics';

export const analyticsService = {
  student(id: number, params: AnalyticsFilter = {}) {
    return request<StudentAnalytics>({ url: `${base}/student/${id}/`, params });
  },
  class(id: number, params: AnalyticsFilter = {}) {
    return request<ClassAnalytics>({ url: `${base}/classes/${id}/`, params });
  },
  institution(params: AnalyticsFilter = {}) {
    return request<InstitutionAnalytics>({ url: `${base}/institution/`, params });
  },
  async export(scope: AnalyticsScope, id: number | undefined, params: AnalyticsFilter = {}) {
    const search = new URLSearchParams({ scope });
    if (id !== undefined) search.set(scope === 'student' ? 'user_id' : 'class_id', String(id));
    if (params.start_date) search.set('start_date', params.start_date);
    if (params.end_date) search.set('end_date', params.end_date);
    const response = await fetch(`${base}/export/?${search}`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Export failed (${response.status})`);
    return response.blob();
  },
};
