import { request } from '@/service/request';

export type DirectoryUser = {
  user_id: number;
  user_email: string;
  user_fname: string | null;
  user_lname: string | null;
  user_role: 'student' | 'lecturer' | 'admin';
  user_status: 'active' | 'suspended' | 'unregistered';
  date_joined: string;
};

export type DirectoryDetail = DirectoryUser & {
  classes: Array<{ class_id: number; class_name: string; unit_id: string; relationship: 'student' | 'teacher' | 'course_lead' }>;
  submissions_count: number;
};

export type AccountActivity = {
  id: number;
  user_id: number;
  action: string;
  details: { actor_id?: number; reason?: string } | null;
  created_at: string;
};

const BASE = '/api/v2/admin/users';

export const adminUsersService = {
  list(params: { search?: string; role?: string; status?: string; page?: number } = {}): Promise<DirectoryUser[]> {
    return request({ url: `${BASE}/`, params });
  },
  detail(id: number): Promise<DirectoryDetail> {
    return request({ url: `${BASE}/${id}/` });
  },
  updateName(id: number, user_fname: string, user_lname: string): Promise<DirectoryUser> {
    return request({ url: `${BASE}/${id}/`, method: 'PATCH', data: { user_fname, user_lname } });
  },
  activity(id: number): Promise<AccountActivity[]> {
    return request({ url: `${BASE}/${id}/activity/` });
  },
  action(id: number, action: 'disable_user' | 'enable_user' | 'force_logout', reason = ''): Promise<{ success: boolean }> {
    return request({ url: `${BASE}/${id}/action/`, method: 'POST', data: { action, reason } });
  },
  delete(id: number): Promise<{ success: boolean }> {
    return request({ url: `/api/v2/core/users/${id}/`, method: 'DELETE' });
  },
  issuePasswordReset(id: number): Promise<{ token: string; email: string; expires_at: string }> {
    return request({ url: `${BASE}/${id}/password-reset/`, method: 'POST' });
  },
};
