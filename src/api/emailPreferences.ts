import { ApiError, api } from './authFetch';

// Whether the creator gets PostStreak's product emails (tips, the welcome series, the weekly recap).
// Account and payment emails are always sent.
//
//   GET  /api/email/preferences -> { marketingOptOut: boolean }
//   POST /api/email/preferences    body { marketingOptOut: boolean } -> { marketingOptOut: boolean }

export const EMAIL_PREF_MESSAGES = {
  signedOut: 'Your session has expired. Sign in again.',
  network: "Couldn't reach PostStreak. Check your connection and try again.",
  generic: "Couldn't save that. Try again in a moment.",
} as const;

export interface EmailPreferencesApi {
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, body?: unknown) => Promise<T>;
}

const PATH = '/api/email/preferences';

/** Anything but a clear `true` counts as subscribed (no row means opted in) */
export function toProductEmails(raw: unknown): boolean {
  return !(raw && typeof raw === 'object' && (raw as { marketingOptOut?: unknown }).marketingOptOut === true);
}

/** True when the creator receives product emails */
export async function getProductEmails(client: EmailPreferencesApi = api): Promise<boolean> {
  return toProductEmails(await client.get<unknown>(PATH));
}

/** Saves the choice and returns what the backend stored */
export async function setProductEmails(on: boolean, client: EmailPreferencesApi = api): Promise<boolean> {
  return toProductEmails(await client.post<unknown>(PATH, { marketingOptOut: !on }));
}

export function describeEmailPrefError(e: unknown): string {
  if (e instanceof ApiError) return e.status === 401 ? EMAIL_PREF_MESSAGES.signedOut : EMAIL_PREF_MESSAGES.generic;
  return EMAIL_PREF_MESSAGES.network;
}
