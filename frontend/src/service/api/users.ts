import { request } from '../request';

// NOTE: Backend endpoints are not ready. These are placeholders to keep API usage consistent.

export function fetchUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}) {
  return request<any>({ url: '/users', params });
}

export function fetchUserById(id: number) {
  return request<any>({ url: `/users/${id}` });
}

export function createUser(data: any) {
  return request<any>({ url: '/users', method: 'post', data });
}

export function updateUser(id: number, data: any) {
  return request<any>({ url: `/users/${id}`, method: 'put', data });
}

export function suspendUser(id: number) {
  return request<any>({
    url: `/users/${id}`,
    method: 'patch',
    data: { status: 'suspended' }
  });
}

export function deleteUser(id: number) {
  return request<any>({ url: `/users/${id}`, method: 'delete' });
}
