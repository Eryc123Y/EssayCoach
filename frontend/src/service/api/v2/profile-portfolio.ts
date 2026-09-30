import { request } from '@/service/request';

export type PortfolioEssay = {
  id: number;
  title: string;
  submitted_at: string;
  score: number | null;
  released: boolean;
  shared_id: number | null;
};

export type PortfolioProfile = {
  user_id: number;
  name: string;
  role: 'student' | 'lecturer' | 'admin';
  email: string | null;
  joined_at: string;
  bio: string;
  avatar_url: string | null;
  visibility: 'private' | 'classmates' | 'institution' | null;
  show_essays: boolean | null;
  show_scores: boolean | null;
  total_submissions: number | null;
  average_score: number | null;
  released_results: number | null;
  history: PortfolioEssay[];
  badges: Array<{ id: number; name: string; description: string; icon: string; earned_at: string }>;
  classes: Array<{ id: number; name: string }>;
  students_taught: number | null;
  rubrics_created: number | null;
  reviews_completed: number | null;
};

export type PortfolioUpdate = {
  bio: string;
  visibility: 'private' | 'classmates' | 'institution';
  show_essays: boolean;
  show_scores: boolean;
};

export const portfolioService = {
  get: (id: number) => request<PortfolioProfile>({ url: `/api/v2/core/profiles/${id}/` }),
  update: (data: PortfolioUpdate) => request<PortfolioProfile>({
    url: '/api/v2/core/profiles/me/', method: 'PUT', data,
  }),
};
