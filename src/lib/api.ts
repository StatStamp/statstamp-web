const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://statstamp-api.test';

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const { body, headers: customHeaders, ...rest } = options;

  const response = await fetch(`${API_BASE}/api${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...customHeaders,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw error;
  }

  if (response.status === 204) return undefined as T;

  return response.json();
}
