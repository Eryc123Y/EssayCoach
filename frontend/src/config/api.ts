/**
 * API Configuration
 * 
 * Controls API version switching for gradual migration from v1 to v2.
 * Set NEXT_PUBLIC_API_VERSION in .env.local to control which version is used.
 */

export type ApiVersion = 'v1' | 'v2';

export const API_CONFIG = {
  /**
   * Current API version to use
   * Can be overridden via NEXT_PUBLIC_API_VERSION environment variable
   */
  version: (process.env.NEXT_PUBLIC_API_VERSION || 'v2') as ApiVersion,
  
  /**
   * Base URL for API requests
   */
  baseUrl: '/api',
  
  /**
   * Backend API URL (for direct calls from Next.js API routes)
   */
  backendUrl: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
} as const;

/**
 * Check if v2 API is enabled
 */
export function isV2Enabled(): boolean {
  return API_CONFIG.version === 'v2';
}

/**
 * Get the API version prefix for use in URLs
 * @returns 'v1' or 'v2'
 */
export function getApiVersion(): string {
  return API_CONFIG.version;
}

/**
 * Build an API URL with the correct version prefix
 * @param path - The API path without version (e.g., '/core/rubrics/')
 * @returns Full API path with version (e.g., '/api/v2/core/rubrics/')
 */
export function buildApiUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_CONFIG.baseUrl}/${API_CONFIG.version}${normalizedPath}`;
}

/**
 * Build a backend direct URL (for Next.js API routes)
 * @param path - The API path without version
 * @returns Full backend URL
 */
export function buildBackendUrl(path: string): string {
  const url = API_CONFIG.backendUrl.replace('localhost', '127.0.0.1');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${url}/api/${API_CONFIG.version}${normalizedPath}`;
}