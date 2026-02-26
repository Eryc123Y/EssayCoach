'use client';

import { useState, useEffect, useCallback } from 'react';
import { profileApi } from '@/service/api/v2/profile';
import type { UserStats, Badge, UserProgress } from '@/service/api/v2/types';

export interface UseProfileReturn {
  stats: UserStats | null;
  badges: Badge[];
  progress: UserProgress | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching user profile data
 *
 * @param userId - User ID to fetch profile data for
 * @param options - Optional configuration
 * @returns Profile data (stats, badges, progress), loading state, error, and refresh function
 *
 * @example
 * ```tsx
 * const { stats, badges, progress, loading, error } = useProfile(userId);
 *
 * if (loading) return <ProfileSkeleton />;
 * if (error) return <ErrorState error={error} />;
 *
 * return (
 *   <>
 *     <ProfileStats stats={stats} />
 *     <BadgeWall badges={badges} />
 *     <ProgressChart progress={progress} />
 *   </>
 * );
 * ```
 */
export function useProfile(
  userId: number,
  options?: {
    enabled?: boolean; // default: true
  }
): UseProfileReturn {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all profile data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [statsData, badgesData, progressData] = await Promise.all([
        profileApi.getStats(userId),
        profileApi.getBadges(userId),
        profileApi.getProgress(userId),
      ]);

      setStats(statsData);
      setBadges(badgesData);
      setProgress(progressData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch profile data');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Refresh function for manual refresh
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    if (options?.enabled === false) {
      setLoading(false);
      return;
    }

    fetchData();
  }, [fetchData, options?.enabled]);

  return {
    stats,
    badges,
    progress,
    loading,
    error,
    refresh,
  };
}
