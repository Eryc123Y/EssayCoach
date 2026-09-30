import { request } from '@/service/request';

export const emailChangeService = {
  request: (newEmail: string, currentPassword: string) => request<{ message: string }>({
    url: '/api/v2/auth/email-change/request/', method: 'POST',
    data: { new_email: newEmail, current_password: currentPassword },
  }),
  preview: (token: string) => request<{ new_email: string; expires_at: string }>({
    url: '/api/v2/auth/email-change/preview/', method: 'POST', data: { token },
  }),
  complete: (token: string) => request<{ message: string }>({
    url: '/api/v2/auth/email-change/complete/', method: 'POST', data: { token },
  }),
};
