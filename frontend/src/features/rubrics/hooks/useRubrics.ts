'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  fetchRubricList,
  fetchPublicRubrics,
  toggleRubricVisibility,
  deleteRubric,
  RubricListItem
} from '@/service/api/rubric';
import { toast } from 'sonner';

export type RubricFilter = 'all' | 'my' | 'public';

export interface UseRubricsOptions {
  initialFilter?: RubricFilter;
  userRole?: 'student' | 'lecturer' | 'admin';
  userId?: number;
}

export interface UseRubricsReturn {
  rubrics: RubricListItem[];
  isLoading: boolean;
  error: string | null;
  filter: RubricFilter;
  setFilter: (filter: RubricFilter) => void;
  refreshRubrics: () => Promise<void>;
  handleToggleVisibility: (
    rubricId: number,
    currentVisibility: 'public' | 'private'
  ) => Promise<void>;
  handleDeleteRubric: (rubricId: number) => Promise<void>;
}

export function useRubrics({
  initialFilter = 'all',
  userRole = 'student',
  userId
}: UseRubricsOptions = {}): UseRubricsReturn {
  const [rubrics, setRubrics] = useState<RubricListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RubricFilter>(initialFilter);

  // Determine the effective filter based on user role
  const getEffectiveFilter = useCallback((): RubricFilter => {
    // Students can only see public rubrics
    if (userRole === 'student') {
      return 'public';
    }
    // Lecturers and admins can see all filters
    return filter;
  }, [userRole, filter]);

  const loadRubrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const effectiveFilter = getEffectiveFilter();
      let params = {};

      if (effectiveFilter === 'public') {
        // Fetch public rubrics
        const data = await fetchPublicRubrics();
        setRubrics(data);
      } else if (effectiveFilter === 'my') {
        // Fetch only user's own rubrics
        if (userId) {
          params = { user_id_user: userId };
        }
        const data = await fetchRubricList(params);
        setRubrics(data);
      } else {
        // Fetch all rubrics accessible to the user
        const data = await fetchRubricList();
        setRubrics(data);
      }
    } catch (err: any) {
      const errorMessage =
        err.message || 'Failed to load rubrics. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      setRubrics([]);
    } finally {
      setIsLoading(false);
    }
  }, [getEffectiveFilter, userId]);

  useEffect(() => {
    loadRubrics();
  }, [loadRubrics]);

  const refreshRubrics = useCallback(async () => {
    await loadRubrics();
  }, [loadRubrics]);

  const handleToggleVisibility = useCallback(
    async (
      rubricId: number,
      currentVisibility: 'public' | 'private'
    ): Promise<void> => {
      const newVisibility: 'public' | 'private' =
        currentVisibility === 'public' ? 'private' : 'public';

      try {
        await toggleRubricVisibility(rubricId, newVisibility);

        // Update local state
        setRubrics((prev) =>
          prev.map((rubric) =>
            rubric.rubric_id === rubricId
              ? { ...rubric, visibility: newVisibility }
              : rubric
          )
        );

        toast.success(
          `Rubric visibility changed to ${newVisibility === 'public' ? 'Public' : 'Private'}`
        );
      } catch (err: any) {
        const errorMessage =
          err.message || 'Failed to update visibility. Please try again.';
        toast.error(errorMessage);
        throw err;
      }
    },
    []
  );

  const handleDeleteRubric = useCallback(async (rubricId: number) => {
    try {
      await deleteRubric(rubricId);

      // Update local state
      setRubrics((prev) =>
        prev.filter((rubric) => rubric.rubric_id !== rubricId)
      );

      toast.success('Rubric deleted successfully');
    } catch (err: any) {
      const errorMessage =
        err.message || 'Failed to delete rubric. Please try again.';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  return {
    rubrics,
    isLoading,
    error,
    filter,
    setFilter,
    refreshRubrics,
    handleToggleVisibility,
    handleDeleteRubric
  };
}
