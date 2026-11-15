import type { Draft, DraftInput, DraftsApi } from './drafts';
import { describeDraftError } from './drafts';

// One shared, cached list of the creator's drafts for every screen. Plain store (no React)
// so it can be tested; src/hooks/useDrafts.ts subscribes to it.

export interface DraftsState {
  drafts: Draft[];
  /** True until the first load finishes */
  loading: boolean;
  /** Message of the last failed load, or null */
  error: string | null;
}

export type SaveResult = { ok: true; draft: Draft } | { ok: false; message: string };

export function createDraftsStore(api: DraftsApi) {
  let state: DraftsState = { drafts: [], loading: true, error: null };
  const listeners = new Set<() => void>();
  let inFlight: Promise<void> | null = null;

  const set = (next: Partial<DraftsState>) => {
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  };

  /** Loads the list. Overlapping calls share one request. */
  function refresh(): Promise<void> {
    if (inFlight) return inFlight;
    inFlight = api
      .list()
      .then((drafts) => set({ drafts, loading: false, error: null }))
      .catch((e) => set({ loading: false, error: describeDraftError(e) }))
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
  }

  /** Saves a new draft and puts it at the top. Never throws: failure comes back as a message. */
  async function save(input: DraftInput): Promise<SaveResult> {
    try {
      const draft = await api.create(input);
      set({ drafts: [draft, ...state.drafts.filter((d) => d.id !== draft.id)] });
      return { ok: true, draft };
    } catch (e) {
      return { ok: false, message: describeDraftError(e) };
    }
  }

  /** Removes a draft. Returns false (and sets `error`) on failure. */
  async function remove(id: string): Promise<boolean> {
    try {
      await api.remove(id);
    } catch (e) {
      set({ error: describeDraftError(e) });
      return false;
    }
    set({ drafts: state.drafts.filter((d) => d.id !== id), error: null });
    return true;
  }

  /** Forget everything, e.g. on sign-out so the next user doesn't see this list */
  function reset() {
    set({ drafts: [], loading: true, error: null });
  }

  return {
    getSnapshot: () => state,
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    refresh,
    save,
    remove,
    reset,
  };
}
