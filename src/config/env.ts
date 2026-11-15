// Settings that come from the environment (.env, see .env.example).
//
// Expo only inlines process.env.EXPO_PUBLIC_* when each name is written out in
// full, so every variable is spelled out below rather than looked up by name.
//
// The backend URL and the Supabase settings have NO defaults on purpose: a build
// without them must fail loudly where the API or Supabase client is created,
// not quietly talk to the wrong server.

export class MissingEnvError extends Error {
  constructor(name: string) {
    super(`${name} is not set. Add it to .env (see .env.example) and restart Expo.`);
    this.name = 'MissingEnvError';
  }
}

function required(name: string, value: string | undefined): string {
  const v = (value ?? '').trim();
  if (!v) throw new MissingEnvError(name);
  return v;
}

const stripTrailingSlash = (v: string) => v.replace(/\/+$/, '');

/** Base URL of the PostStreak backend, e.g. https://poststreak.app (no trailing slash). Throws if unset. */
export function getApiUrl(): string {
  return stripTrailingSlash(required('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL));
}

/** Supabase project URL and anon (public) key. Throws if either is unset. */
export function getSupabaseConfig(): { url: string; anonKey: string } {
  return {
    url: stripTrailingSlash(required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL)),
    anonKey: required('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  };
}

export const ENV = {
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'wss://api.poststreak.com/ws',
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'production',
  JARVIS_API_KEY: process.env.EXPO_PUBLIC_JARVIS_API_KEY || '',
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_KEY || '',
};
