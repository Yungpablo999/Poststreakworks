import { useEffect, useSyncExternalStore } from 'react';
import { draftsApi } from '../api/drafts';
import { createDraftsStore } from '../api/draftsStore';
import { onAuthChange } from '../auth/session';

// The creator's drafts from the backend, shared by every screen.
//
//   const { drafts, save, remove } = useDrafts();
//
// Loads on first use. save() never throws: it resolves to { ok, draft } or { ok: false, message }.

export const draftsStore = createDraftsStore(draftsApi);

let watchingAuth = false;
/** Signing out clears the list, so the next creator never sees it */
function watchAuthOnce() {
  if (watchingAuth) return;
  watchingAuth = true;
  onAuthChange((session) => {
    if (!session) draftsStore.reset();
  });
}

export function useDrafts() {
  const state = useSyncExternalStore(draftsStore.subscribe, draftsStore.getSnapshot, draftsStore.getSnapshot);

  useEffect(() => {
    watchAuthOnce();
    if (state.loading) void draftsStore.refresh();
    // only on mount: later loads are explicit refresh() calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, save: draftsStore.save, remove: draftsStore.remove, refresh: draftsStore.refresh };
}
