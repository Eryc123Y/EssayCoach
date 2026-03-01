/**
 * API Client for Dashboard Feature
 *
 * Provides type-safe API client for dashboard data fetching
 * with CSRF protection and secure error handling.
 */

const BASE_URL = '/api/v2/core';

/**
 * Request timeout in milliseconds
 */
const REQUEST_TIMEOUT = 30000;

/**
 * Get CSRF token from cookie
 * Django stores CSRF token in 'csrftoken' cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Create request headers with CSRF token for state-changing requests
 */
function createHeaders(
  includeContentType: boolean = true,
  includeCsrf: boolean = false
): HeadersInit {
  const headers: HeadersInit = {};

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  // Add CSRF token for non-GET requests
  if (includeCsrf) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
  }

  return headers;
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = REQUEST_TIMEOUT
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
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw error;
  }
}

/**
 * Safe error message extraction
 * Prevents exposure of sensitive information
 */
function extractErrorMessage(response: Response, text: string): string {
  // Don't expose detailed error messages for 5xx errors
  if (response.status >= 500) {
    return 'Server error - please try again later';
  }

  // For 4xx errors, use safe generic messages
  if (response.status === 401) {
    return 'Authentication required - please sign in';
  }

  if (response.status === 403) {
    return 'Access denied - insufficient permissions';
  }

  if (response.status === 404) {
    return 'Resource not found';
  }

  // Return sanitized text or generic message
  return text || `Request failed (${response.status})`;
}

// Simple API client for dashboard feature
export const api = {
  async get<T>(url: string): Promise<T> {
    const fullUrl = url.startsWith('/') ? url : `${BASE_URL}${url}`;

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: 'GET',
        headers: createHeaders(true, false),
        credentials: 'include', // Include cookies for auth
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = extractErrorMessage(response, errorText);
      throw new Error(errorMessage);
    }

    return response.json();
  },

  async post<T>(url: string, data: unknown): Promise<T> {
    const fullUrl = url.startsWith('/') ? url : `${BASE_URL}${url}`;

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: 'POST',
        headers: createHeaders(true, true), // Include CSRF token
        credentials: 'include',
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = extractErrorMessage(response, errorText);
      throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  },

  async patch<T>(url: string, data: unknown): Promise<T> {
    const fullUrl = url.startsWith('/') ? url : `${BASE_URL}${url}`;

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: 'PATCH',
        headers: createHeaders(true, true), // Include CSRF token
        credentials: 'include',
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = extractErrorMessage(response, errorText);
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  },

  async delete<T>(url: string): Promise<T> {
    const fullUrl = url.startsWith('/') ? url : `${BASE_URL}${url}`;

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: 'DELETE',
        headers: createHeaders(true, true), // Include CSRF token
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = extractErrorMessage(response, errorText);
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  },
};
