import { request } from '@/service/request';
import type { ClassItem, ClassCreateInput, ClassUpdateInput, ClassDetail, StudentInfo, JoinClassRequest, LeaveClassResponse } from './types';

const BASE_URL = '/api/v2';

export const classService = {
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

  async joinClass(joinCode: string): Promise<ClassItem> {
    return request<ClassItem>({
      url: `${BASE_URL}/core/classes/join/?join_code=${encodeURIComponent(joinCode)}`,
      method: 'POST',
    });
  },

  async leaveClass(classId: number): Promise<LeaveClassResponse> {
    return request<LeaveClassResponse>({
      url: `${BASE_URL}/core/classes/${classId}/leave/`,
      method: 'DELETE',
    });
  },

  async getClassStudents(classId: number): Promise<StudentInfo[]> {
    return request<StudentInfo[]>({
      url: `${BASE_URL}/core/classes/${classId}/students/`,
      method: 'GET',
    });
  },

  async addStudentToClass(classId: number, userId: number): Promise<StudentInfo> {
    return request<StudentInfo>({
      url: `${BASE_URL}/core/classes/${classId}/students/?user_id=${userId}`,
      method: 'POST',
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
