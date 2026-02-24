/**
 * Authentication types for JWT-based auth
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh?: string;
  expiresAt?: string;
  user: UserInfo;
}

export interface RefreshTokenResponse {
  access: string;
  refresh: string;
  expiresAt: string;
}

export interface UserInfo {
  id: number | string;
  user_id?: number;
  email: string;
  username?: string;
  first_name?: string | null;
  last_name?: string | null;
  name: string;
  avatar?: string | null;
  role: 'student' | 'lecturer' | 'admin';
  status?: string;
  date_joined?: string;
}

export interface AuthStoreState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseAuthRefreshReturn {
  isRefreshing: boolean;
  error: string | null;
  lastRefreshAt: Date | null;
  refreshCount: number;
  clearError: () => void;
  refresh: () => Promise<boolean>;
  checkAndRefresh: () => Promise<boolean>;
  getAccessToken: () => Promise<string | null>;
  clearAuth: () => Promise<boolean>;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  needsRefresh: () => boolean;
}
