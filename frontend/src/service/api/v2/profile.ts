/**
 * Profile API Service (PRD-08)
 *
 * Provides type-safe API client for profile-related endpoints:
 * - User statistics
 * - User badges
 * - User progress over time
 */

import type { UserStats, Badge, UserProgress } from './types';
import { api } from './client';

/**
 * Profile API service
 */
export const profileApi = {
  /**
   * Get user statistics
   * GET /api/v2/core/users/{userId}/stats/
   */
  async getStats(userId: number): Promise<UserStats> {
    return api.get<UserStats>(`/users/${userId}/stats/`);
  },

  /**
   * Get user badges
   * GET /api/v2/core/users/{userId}/badges/
   */
  async getBadges(userId: number): Promise<Badge[]> {
    return api.get<Badge[]>(`/users/${userId}/badges/`);
  },

  /**
   * Get user progress over time
   * GET /api/v2/core/users/{userId}/progress/?period=month|week
   */
  async getProgress(
    userId: number,
    period: 'month' | 'week' = 'month'
  ): Promise<UserProgress> {
    return api.get<UserProgress>(`/users/${userId}/progress/?period=${period}`);
  }
};
