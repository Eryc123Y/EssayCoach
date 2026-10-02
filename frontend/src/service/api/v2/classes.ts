import { request } from '@/service/request';
import type {
  ClassItem,
  ClassCreateInput,
  ClassUpdateInput,
  ClassDetail,
  ClassCreatableUnit,
  ClassLeaveRequest,
  StudentInfo,
} from './types';

const BASE_URL = '/api/v2';

export const classService = {
  async listCreatableUnits(): Promise<ClassCreatableUnit[]> {
    return request<ClassCreatableUnit[]>({
      url: `${BASE_URL}/core/classes/create-options/`,
      method: 'GET',
    });
  },
  async listClasses(params?: {
    unit_id_unit?: string;
    class_size__gte?: number;
    class_size__lte?: number;
    class_status?: string;
    class_name?: string;
  }): Promise<ClassItem[]> {
    return request<ClassItem[]>({
      url: `${BASE_URL}/core/classes/`,
      method: 'GET',
      params,
    });
  },

  async getClass(classId: number): Promise<ClassDetail> {
    return request<ClassDetail>({
      url: `${BASE_URL}/core/classes/${classId}/`,
      method: 'GET',
    });
  },

  async createClass(data: ClassCreateInput): Promise<ClassItem> {
    return request<ClassItem>({
      url: `${BASE_URL}/core/classes/`,
      method: 'POST',
      data,
    });
  },

  async updateClass(classId: number, data: ClassUpdateInput): Promise<ClassItem> {
    return request<ClassItem>({
      url: `${BASE_URL}/core/classes/${classId}/`,
      method: 'PUT',
      data,
    });
  },

  async deleteClass(classId: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>({
      url: `${BASE_URL}/core/classes/${classId}/`,
      method: 'DELETE',
    });
  },

  async duplicateClass(classId: number, className: string): Promise<ClassItem> {
    return request<ClassItem>({
      url: `${BASE_URL}/core/classes/${classId}/duplicate/`,
      method: 'POST',
      data: { class_name: className },
    });
  },

  async joinClass(joinCode: string): Promise<ClassItem> {
    return request<ClassItem>({
      url: `${BASE_URL}/core/classes/join/?join_code=${encodeURIComponent(joinCode)}`,
      method: 'POST',
    });
  },

  async listLeaveRequests(classId: number): Promise<ClassLeaveRequest[]> {
    return request<ClassLeaveRequest[]>({ url: `${BASE_URL}/core/classes/${classId}/leave-requests/`, method: 'GET' });
  },

  async requestLeave(classId: number, reason: string): Promise<ClassLeaveRequest> {
    return request<ClassLeaveRequest>({
      url: `${BASE_URL}/core/classes/${classId}/leave-requests/`, method: 'POST', data: { reason },
    });
  },

  async decideLeave(classId: number, requestId: number, approve: boolean): Promise<ClassLeaveRequest> {
    return request<ClassLeaveRequest>({
      url: `${BASE_URL}/core/classes/${classId}/leave-requests/${requestId}/decision/`,
      method: 'POST', data: { approve },
    });
  },

  async getClassStudents(classId: number): Promise<StudentInfo[]> {
    return request<StudentInfo[]>({
      url: `${BASE_URL}/core/classes/${classId}/students/`,
      method: 'GET',
    });
  },

  async removeStudentFromClass(classId: number, userId: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>({
      url: `${BASE_URL}/core/classes/${classId}/students/${userId}/`,
      method: 'DELETE',
    });
  },

  async archiveClass(classId: number): Promise<ClassItem> {
    return request<ClassItem>({
      url: `${BASE_URL}/core/classes/${classId}/archive/`,
      method: 'POST',
    });
  },

};
