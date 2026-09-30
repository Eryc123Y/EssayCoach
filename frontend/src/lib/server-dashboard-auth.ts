import { getServerApiUrl } from '@/lib/server-api';

export type DashboardRole = 'student' | 'lecturer' | 'admin';

/** Let Django validate the token and current user status before choosing a dashboard. */
export async function resolveDashboardRole(accessToken: string | undefined): Promise<DashboardRole | null> {
  if (!accessToken) return null;
  const response = await fetch(`${getServerApiUrl()}/api/v2/auth/me/jwt/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store'
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error(`Could not check dashboard access: ${response.status}`);
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    throw new Error('Invalid dashboard identity response');
  }
  const data = payload.data;
  if (!data || typeof data !== 'object' || !('role' in data)) {
    throw new Error('Dashboard identity has no role');
  }
  const role = data.role === 'teacher' ? 'lecturer' : data.role;
  if (role !== 'student' && role !== 'lecturer' && role !== 'admin') {
    throw new Error('Dashboard identity has an unsupported role');
  }
  return role;
}
