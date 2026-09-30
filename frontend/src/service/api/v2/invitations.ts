import { request } from '@/service/request';
import type {
  InvitationCreateInput,
  InvitationCreateResult,
  BatchStudentInvitationResult
} from './types';

export const invitationService = {
  create(data: InvitationCreateInput): Promise<InvitationCreateResult> {
    return request<InvitationCreateResult>({
      url: '/api/v2/auth/invitations/',
      method: 'POST',
      data
    });
  },

  batchStudents(classId: number, emails: string[]): Promise<BatchStudentInvitationResult> {
    return request<BatchStudentInvitationResult>({
      url: '/api/v2/auth/invitations/batch/',
      method: 'POST',
      data: { class_id: classId, emails }
    });
  }
};

export function invitationLink(token: string): string {
  return `${window.location.origin}/auth/sign-up#token=${encodeURIComponent(token)}`;
}
