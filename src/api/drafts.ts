import { ApiError, api } from './authFetch';

// The creator's saved drafts, from the backend (poststreak-web /api/drafts).
//
//   GET    /api/drafts      -> { drafts: Draft[] }       newest first
//   POST   /api/drafts      -> 201 { draft }
//   PATCH  /api/drafts/:id  -> { draft }
//   DELETE /api/drafts/:id  -> { success: true }
//
// Until the backend's drafts migration is applied the routes answer 503
// { code: 'drafts_unavailable' }; describeDraftError turns that into a plain sentence.
// Only text is saved: the caption, the chosen platforms and the format. Media is not
// saved with a draft yet (a draft keeps an optional media_key, unused by the app so far).

export interface Draft {
  id: string;
  content: string;
  platforms: string[];
  format: string | null;
  media_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface DraftInput {
  content?: string;
  platforms?: string[];
  format?: string | null;
  media_key?: string | null;
}

export interface DraftsApi {
  list: () => Promise<Draft[]>;
  create: (input: DraftInput) => Promise<Draft>;
  update: (id: string, input: DraftInput) => Promise<Draft>;
  remove: (id: string) => Promise<void>;
}

export const draftsApi: DraftsApi = {
  list: async () => (await api.get<{ drafts: Draft[] }>('/api/drafts')).drafts,
  create: async (input) => (await api.post<{ draft: Draft }>('/api/drafts', input)).draft,
  update: async (id, input) => (await api.patch<{ draft: Draft }>(`/api/drafts/${encodeURIComponent(id)}`, input)).draft,
  remove: async (id) => {
    await api.delete(`/api/drafts/${encodeURIComponent(id)}`);
  },
};

export const DRAFT_MESSAGES = {
  unavailable: "Drafts aren't available yet. Your post wasn't saved.",
  signedOut: 'Your session has expired. Sign in again.',
  network: "Couldn't reach PostStreak. Check your connection and try again.",
  generic: "Couldn't save that draft. Try again in a moment.",
  full: 'You have too many drafts. Delete one to save another.',
} as const;

/** One short sentence for a toast when saving or loading drafts fails */
export function describeDraftError(e: unknown): string {
  if (e instanceof ApiError) {
    const code = (e.body as { code?: unknown } | null)?.code;
    if (e.status === 503 || code === 'drafts_unavailable') return DRAFT_MESSAGES.unavailable;
    if (e.status === 401) return DRAFT_MESSAGES.signedOut;
    if (e.status === 409) return DRAFT_MESSAGES.full;
    if (e.status === 400) {
      const msg = (e.body as { error?: unknown } | null)?.error;
      if (typeof msg === 'string' && msg.trim()) return msg.trim();
    }
    return DRAFT_MESSAGES.generic;
  }
  if (e instanceof Error && e.name === 'MissingEnvError') return DRAFT_MESSAGES.generic;
  return DRAFT_MESSAGES.network;
}

/** The first line of the caption, as the title in the drafts list */
export function draftTitle(d: Pick<Draft, 'content'>): string {
  const line = d.content.split('\n').map((l) => l.trim()).find(Boolean);
  if (!line) return 'Untitled post';
  return line.length > 60 ? `${line.slice(0, 57)}...` : line;
}
