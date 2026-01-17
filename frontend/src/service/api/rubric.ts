import { request } from '../request';

/**
 * Rubric API Types
 */

export interface RubricLevelDesc {
  level_id: number;
  min_score: number;
  max_score: number;
  level_desc: string;
}

export interface RubricItem {
  rubric_item_id: number;
  rubric_item_name: string;
  rubric_item_weight: string;
  level_descriptions: RubricLevelDesc[];
}

export interface RubricDetail {
  rubric_id: number;
  rubric_desc: string;
  rubric_create_time: string;
  rubric_items: RubricItem[];
}

export interface RubricListItem {
  rubric_id: number;
  rubric_desc: string;
  rubric_create_time: string;
  user_id: number;
}

export interface RubricImportResponse {
  success: boolean;
  rubric_id: number;
  rubric_name: string;
  items_count: number;
  levels_count: number;
  ai_parsed: boolean;
  ai_model: string;
  detection: {
    is_rubric: boolean;
    confidence: number;
    reason?: string;
  };
  error?: string;
}

export interface RubricListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RubricListItem[];
}

/**
 * Upload a PDF rubric for AI-powered parsing and import
 */
export function uploadRubricPDF(
  file: File,
  rubricName?: string
): Promise<RubricImportResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (rubricName) {
    formData.append('rubric_name', rubricName);
  }

  return request<RubricImportResponse>({
    url: '/api/v1/core/rubrics/import_from_pdf_with_ai/',
    method: 'POST',
    data: formData
  });
}

/**
 * Get list of all rubrics
 */
export function fetchRubricList(params?: {
  page?: number;
  page_size?: number;
}): Promise<RubricListResponse> {
  return request<RubricListResponse>({
    url: '/api/v1/core/rubrics/',
    method: 'GET',
    params
  });
}

/**
 * Get detailed rubric with items and level descriptions
 */
export function fetchRubricDetail(rubricId: number): Promise<RubricDetail> {
  return request<RubricDetail>({
    url: `/api/v1/core/rubrics/${rubricId}/detail_with_items/`,
    method: 'GET'
  });
}

/**
 * Delete a rubric
 */
export function deleteRubric(rubricId: number): Promise<void> {
  return request<void>({
    url: `/api/v1/core/rubrics/${rubricId}/`,
    method: 'DELETE'
  });
}
