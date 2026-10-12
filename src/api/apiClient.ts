import { authFetch } from './authFetch';

// Older result-object style API used by src/api/services.ts. It now goes through
// authFetch (Bearer token from the Supabase session, refresh once + retry on 401).
// Only GET and POST: the backend's CORS allows no other methods.

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

async function request<T>(endpoint: string, method: 'GET' | 'POST', body?: unknown): Promise<ApiResponse<T>> {
  let response: Response;
  try {
    response = await authFetch(endpoint, { method, body });
  } catch (err: unknown) {
    // A missing EXPO_PUBLIC_API_URL / Supabase setting is a setup bug: let it fail loudly.
    if (err instanceof Error && err.name === 'MissingEnvError') throw err;
    return {
      success: false,
      error: err instanceof Error && err.message ? err.message : 'Network connection failed',
      statusCode: 0,
    };
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      success: false,
      error: data?.error || data?.message || response.statusText || 'Request failed',
      statusCode: response.status,
    };
  }
  return { success: true, data, statusCode: response.status };
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint, 'GET'),
  post: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, 'POST', body),
};
