import { request } from '@/service/request';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  UserInfo,
  RubricListItem,
  RubricListResponse,
  RubricDetail,
  RubricImportResponse,
} from './types';

const BASE_URL = '/api/v2';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await request<{ token: string; refresh: string; expires_at: string; user: UserInfo }>({
      url: `${BASE_URL}/auth/login-with-jwt/`,
      method: 'POST',
      data,
    });

    return {
      access: response.token,
      refresh: response.refresh,
      expiresAt: response.expires_at,
      user: response.user,
    };
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await request<RefreshTokenResponse>({
      url: `${BASE_URL}/auth/refresh/`,
      method: 'POST',
      data: { refresh: refreshToken },
    });

    return {
      access: response.access,
      refresh: response.refresh,
      expiresAt: response.expiresAt,
    };
  },

  async getUserInfo(): Promise<UserInfo> {
    return request<UserInfo>({
      url: `${BASE_URL}/auth/me/`,
      method: 'GET',
    });
  },

  async logout(refreshToken?: string): Promise<void> {
    const url = refreshToken
      ? `${BASE_URL}/auth/logout-jwt/?refresh=${encodeURIComponent(refreshToken)}`
      : `${BASE_URL}/auth/logout/`;

    await request({
      url,
      method: 'POST',
    });
  },
};

export const rubricService = {
  async fetchRubricList(params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<RubricListResponse> {
    return request<RubricListResponse>({
      url: `${BASE_URL}/core/rubrics/`,
      method: 'GET',
      params,
    });
  },

  async fetchRubricDetail(rubricId: number): Promise<RubricDetail> {
    return request<RubricDetail>({
      url: `${BASE_URL}/core/rubrics/${rubricId}/detail_with_items/`,
      method: 'GET',
    }).then((data) => {
      data.rubric_items = data.rubric_items ?? [];
      data.rubric_items.forEach((item) => {
        item.level_descriptions = item.level_descriptions ?? [];
      });
      return data;
    });
  },

  async createRubric(data: { rubric_desc: string }): Promise<RubricListItem> {
    return request<RubricListItem>({
      url: `${BASE_URL}/core/rubrics/`,
      method: 'POST',
      data,
    });
  },

  async updateRubric(
    rubricId: number,
    data: { rubric_desc: string }
  ): Promise<RubricListItem> {
    return request<RubricListItem>({
      url: `${BASE_URL}/core/rubrics/${rubricId}/`,
      method: 'PUT',
      data,
    });
  },

  async deleteRubric(rubricId: number): Promise<void> {
    await request({
      url: `${BASE_URL}/core/rubrics/${rubricId}/`,
      method: 'DELETE',
    });
  },

  async importRubricFromPdf(
    file: File,
    rubricName?: string
  ): Promise<RubricImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (rubricName) {
      formData.append('rubric_name', rubricName);
    }

    return request<RubricImportResponse>({
      url: `${BASE_URL}/core/rubrics/import_from_pdf_with_ai/`,
      method: 'POST',
      data: formData,
    });
  },

  async fetchPublicRubrics(params?: {
    page?: number;
    page_size?: number;
  }): Promise<RubricListResponse> {
    return request<RubricListResponse>({
      url: `${BASE_URL}/core/rubrics/public/`,
      method: 'GET',
      params,
    });
  },

  async toggleRubricVisibility(
    rubricId: number,
    visibility: 'public' | 'private'
  ): Promise<RubricListItem> {
    return request<RubricListItem>({
      url: `${BASE_URL}/core/rubrics/${rubricId}/visibility/`,
      method: 'PATCH',
      data: { visibility },
    });
  },
};
