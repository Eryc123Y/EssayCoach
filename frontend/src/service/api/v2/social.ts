import { request } from '@/service/request';

export type SharedEssay = {
  id: number;
  submission_id: number;
  class_id: number;
  class_name: string;
  task_title: string;
  essay_text: string;
  user_id: number | null;
  author: string;
  visibility: 'public' | 'class' | 'anonymous';
  caption: string;
  tags: string[];
  status: 'visible' | 'hidden' | 'removed';
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  liked_by_me: boolean;
  bookmarked_by_me: boolean;
  is_mine: boolean;
  can_moderate: boolean;
};
export type SocialInteraction = {
  id: number;
  submission_id: number;
  user_id: number;
  author: string;
  interaction_type: 'like' | 'bookmark' | 'comment' | 'feedback';
  content: string;
  created_at: string;
  is_mine: boolean;
};
export type ContentReport = {
  id: number;
  submission_id: number;
  interaction_id: number | null;
  reporter_id: number;
  reason: string;
  description: string;
  status: string;
  decision: string;
  resolved_by: number | null;
  resolved_at: string | null;
  created_at: string;
};
const base = '/api/v2/social';

export const socialService = {
  feed(params: { search?: string; class_id?: number; tag?: string; mine?: boolean; moderation?: boolean; sort?: string; limit?: number; offset?: number } = {}) {
    return request<SharedEssay[]>({ url: `${base}/feed/`, params });
  },
  share(data: { submission_id: number; class_id?: number; visibility: SharedEssay['visibility']; caption: string; tags: string[] }) {
    return request<SharedEssay>({ url: `${base}/share/`, method: 'POST', data });
  },
  update(submissionId: number, data: { visibility: SharedEssay['visibility']; caption: string; tags: string[] }) {
    return request<SharedEssay>({ url: `${base}/shares/${submissionId}/`, method: 'PUT', data });
  },
  remove(submissionId: number) { return request({ url: `${base}/shares/${submissionId}/`, method: 'DELETE' }); },
  interact(submissionId: number, interaction_type: SocialInteraction['interaction_type'], content?: string) {
    return request<SocialInteraction>({ url: `${base}/${submissionId}/interact/`, method: 'POST', data: { interaction_type, content } });
  },
  removeToggle(submissionId: number, kind: 'like' | 'bookmark') {
    return request({ url: `${base}/${submissionId}/interact/${kind}/`, method: 'DELETE' });
  },
  interactions(submissionId: number) {
    return request<SocialInteraction[]>({ url: `${base}/${submissionId}/interactions/` });
  },
  removeInteraction(interactionId: number) {
    return request({ url: `${base}/interactions/${interactionId}/`, method: 'DELETE' });
  },
  report(data: { submission_id?: number; interaction_id?: number; reason: string; description: string }) {
    return request<ContentReport>({ url: `${base}/report/`, method: 'POST', data });
  },
  reports(status = 'open') {
    return request<ContentReport[]>({ url: `${base}/moderation/reports/`, params: { status } });
  },
  resolve(reportId: number, decision: 'keep' | 'hide' | 'remove') {
    return request<ContentReport>({ url: `${base}/moderation/reports/${reportId}/resolve/`, method: 'POST', data: { decision } });
  },
  hide(submissionId: number) { return request({ url: `${base}/moderation/${submissionId}/hide/`, method: 'POST' }); },
  restore(submissionId: number) { return request({ url: `${base}/moderation/${submissionId}/restore/`, method: 'POST' }); },
  ban(userId: number, data: { class_id: number; days: number; reason: string }) {
    return request({ url: `${base}/moderation/users/${userId}/ban/`, method: 'POST', data });
  },
};
