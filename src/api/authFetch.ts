import { getApiUrl } from '../config/env';
import { getSupabase } from '../auth/supabase';
import { createAuthFetch, fetchJson, type AuthFetchOptions } from './createAuthFetch';

export { ApiError } from './createAuthFetch';

// The app's fetch to the PostStreak backend (EXPO_PUBLIC_API_URL): Bearer token from
// the Supabase session, refresh once + retry once on a 401. See createAuthFetch.ts.
export const authFetch = createAuthFetch({
  baseUrl: getApiUrl,
  getAccessToken: async () => {
    const { data } = await getSupabase().auth.getSession();
    return data.session?.access_token ?? null;
  },
  refreshSession: async () => {
    const { data, error } = await getSupabase().auth.refreshSession();
    return error ? null : (data.session?.access_token ?? null);
  },
});

export const api = {
  get: <T>(path: string, options?: Omit<AuthFetchOptions, 'method' | 'body'>) =>
    fetchJson<T>(authFetch, path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<AuthFetchOptions, 'method' | 'body'>) =>
    fetchJson<T>(authFetch, path, { ...options, method: 'POST', body: body ?? {} }),
};
