// The connection to the PostStreak backend (src/backend).
//
// The app is its backend's front door: it needs all three addresses below. With any
// of them missing it says so (src/screens/BackendBootScreen.tsx) instead of showing
// anything that looks real.
//
// Every value ships inside the app, so none of them may be a secret. The Supabase
// "anon" key is public by design (row-level security is the real boundary); the
// service_role key must never appear here.
//
// Expo only inlines process.env.EXPO_PUBLIC_* when it is written out in full, so
// each one is spelled out rather than read through a loop.

const clean = (v: string | undefined) => (v ?? '').trim().replace(/\/+$/, '');

const apiUrl = clean(process.env.EXPO_PUBLIC_API_URL);
const supabaseUrl = clean(process.env.EXPO_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

export type SocialProvider = 'apple' | 'google';

// Which one-tap sign-ins are switched on in the Supabase project (Authentication →
// Providers). A button that isn't listed here is hidden rather than left to fail.
const rawProviders: string = process.env.EXPO_PUBLIC_AUTH_PROVIDERS ?? '';
const providers = rawProviders
  .split(',')
  .map((p) => p.trim().toLowerCase())
  .filter((p): p is SocialProvider => p === 'apple' || p === 'google');

// Local testing: the sign-in screen offers the seeded test accounts (the server must agree: it
// only answers on a stack running on the same machine).
const testAccounts = (process.env.EXPO_PUBLIC_DEV_LOGIN ?? '').trim() === 'true';

export const BACKEND = {
  /** true once the API, Supabase URL and anon key are all set. */
  enabled: Boolean(apiUrl && supabaseUrl && supabaseAnonKey),
  apiUrl,
  supabaseUrl,
  supabaseAnonKey,
  socialProviders: providers,
  testAccounts,
  /** The phone app's link scheme (app.json "scheme"). */
  appScheme: 'poststreak',
} as const;
