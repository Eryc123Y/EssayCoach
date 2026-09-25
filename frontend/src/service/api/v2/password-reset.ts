import { request } from '@/service/request';

export const passwordResetService = {
  preview(token: string): Promise<{ email: string; expires_at: string }> {
    return request({ url: '/api/v2/auth/password-reset/preview/', method: 'POST', data: { token } });
  },
  complete(token: string, password: string, confirmation: string): Promise<{ success: boolean; message: string }> {
    return request({
      url: '/api/v2/auth/password-reset/complete/',
      method: 'POST',
      data: { token, new_password: password, new_password_confirm: confirmation },
    });
  },
};
