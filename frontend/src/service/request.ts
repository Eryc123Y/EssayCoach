export interface RequestConfig {
  url: string;
  method?: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function request<T = any>(config: RequestConfig): Promise<T> {
  const { url, method = 'GET', data, params, headers = {} } = config;

  let fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const separator = fullUrl.includes('?') ? '&' : '?';
    fullUrl += `${separator}${searchParams.toString()}`;
  }

  const isFormData = data instanceof FormData;

  // Get auth token from cookies if available
  let authToken = headers['Authorization'];
  if (!authToken) {
    if (typeof document !== 'undefined') {
      // Read access_token from cookie (set by login API)
      const cookieValue = document.cookie
        .split('; ')
        .find((row) => row.startsWith('access_token='))
        ?.split('=')[1];
      if (cookieValue) {
        authToken = `Token ${cookieValue}`;
      }
    }
  }

  const response = await fetch(fullUrl, {
    method,
    credentials: 'include', // Include cookies for session authentication
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...headers,
      ...(authToken && { 'Authorization': authToken })
    },
    body: isFormData ? data : data ? JSON.stringify(data) : undefined
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message ||
        errorBody.detail ||
        `Request to ${fullUrl} failed with status ${response.status}`
    );
  }

  return response.json();
}
