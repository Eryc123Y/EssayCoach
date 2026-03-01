import { request } from '@/service/request';
import type { RubricDetail, RubricDuplicateInput } from './types';

const BASE_URL = '/api/v2';

export const rubricActionsService = {
  /**
   * Duplicate a rubric with all its items and level descriptions.
   * Omitting `visibility` defaults to `private` (server-side default).
   */
  async duplicateRubric(rubricId: number, data: RubricDuplicateInput): Promise<RubricDetail> {
    return request<RubricDetail>({
      url: `${BASE_URL}/core/rubrics/${rubricId}/duplicate/`,
      method: 'POST',
      data,
    });
  },
};
