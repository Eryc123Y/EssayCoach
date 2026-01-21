export interface RequestConfig {
  url: string;
  method?: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

const BASE_URL = '';

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

  const response = await fetch(fullUrl, {
    method,
    credentials: 'include',
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: isFormData ? data : data ? JSON.stringify(data) : undefined
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.error || 
        errorBody.message ||
        errorBody.detail ||
        `Request to ${fullUrl} failed with status ${response.status}`
    );
  }

  return response.json();
}
