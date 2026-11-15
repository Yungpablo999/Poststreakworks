import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { platformsApi } from '../api/platforms';
import { createPlatformsStore } from '../api/platformsStore';
import { onAuthChange } from '../auth/session';

// The creator's connected platforms, shared by every screen.
//
//   const { isConnected, platforms, disconnect, refresh } = usePlatforms();
//
// Loads on first use. Call refresh() after a connect finishes.

export const platformsStore = createPlatformsStore(platformsApi);

let watchingAuth = false;
/** Signing out (or the session ending) clears the list, so the next creator never sees it */
function watchAuthOnce() {
  if (watchingAuth) return;
  watchingAuth = true;
  onAuthChange((session) => {
    if (!session) platformsStore.reset();
  });
}

export function usePlatforms() {
  const state = useSyncExternalStore(platformsStore.subscribe, platformsStore.getSnapshot, platformsStore.getSnapshot);

  useEffect(() => {
    watchAuthOnce();
    if (state.loading) void platformsStore.refresh();
    // only on mount: later loads are explicit refresh() calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isConnected = useCallback((id: string) => state.platforms.some((p) => p.platform === id), [state.platforms]);

  return {
    ...state,
    isConnected,
    refresh: platformsStore.refresh,
    disconnect: platformsStore.disconnect,
  };
}
