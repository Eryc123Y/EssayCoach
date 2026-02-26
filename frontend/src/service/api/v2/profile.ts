/**
 * Profile API Service (PRD-08)
 *
 * Provides type-safe API client for profile-related endpoints:
 * - User statistics
 * - User badges
 * - User progress over time
 */

import type { UserStats, Badge, UserProgress } from './types';

const BASE_URL = '/api/v2/core';

/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Create request headers with CSRF token for state-changing requests
 */
function createHeaders(includeCsrf: boolean = false): HeadersInit {
  const headers: HeadersInit = {};

  if (includeCsrf) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
  }

  return headers;
}

/**
 * Fetch with timeout support (30 seconds)
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Profile API service
 */
export const profileApi = {
  /**
   * Get user statistics
   * GET /api/v2/core/users/{userId}/stats/
   */
  async getStats(userId: number): Promise<UserStats> {
    const url = `${BASE_URL}/users/${userId}/stats/`;

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: createHeaders(false),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to fetch user stats (${response.status})`);
    }

    return response.json();
  },

  /**
   * Get user badges
   * GET /api/v2/core/users/{userId}/badges/
   */
  async getBadges(userId: number): Promise<Badge[]> {
    const url = `${BASE_URL}/users/${userId}/badges/`;

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: createHeaders(false),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to fetch user badges (${response.status})`);
    }

    return response.json();
  },

  /**
   * Get user progress over time
   * GET /api/v2/core/users/{userId}/progress/?period=month|week
   */
  async getProgress(
    userId: number,
    period: 'month' | 'week' = 'month'
  ): Promise<UserProgress> {
    const url = `${BASE_URL}/users/${userId}/progress/?period=${period}`;

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: createHeaders(false),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to fetch user progress (${response.status})`);
    }

    return response.json();
  },
};
