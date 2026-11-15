import type { ConnectedPlatform, PlatformsApi } from './platforms';

// One shared, cached list of connected platforms for every screen. Plain store
// (no React) so it can be tested; src/hooks/usePlatforms.ts subscribes to it.

export interface PlatformsState {
  platforms: ConnectedPlatform[];
  /** True until the first load finishes */
  loading: boolean;
  /** Message of the last failed load or disconnect, or null */
  error: string | null;
}

export function createPlatformsStore(api: PlatformsApi) {
  let state: PlatformsState = { platforms: [], loading: true, error: null };
  const listeners = new Set<() => void>();
  let inFlight: Promise<void> | null = null;

  const set = (next: Partial<PlatformsState>) => {
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  };
  const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

  /** Loads the list. Overlapping calls share one request. */
  function refresh(): Promise<void> {
    if (inFlight) return inFlight;
    inFlight = api
      .list()
      .then((platforms) => set({ platforms, loading: false, error: null }))
      .catch((e) => set({ loading: false, error: message(e) }))
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
  }

  /** Disconnects, then removes it from the list. Returns false (and sets `error`) on failure. */
  async function disconnect(platform: string): Promise<boolean> {
    try {
      await api.disconnect(platform);
    } catch (e) {
      set({ error: message(e) });
      return false;
    }
    set({ platforms: state.platforms.filter((p) => p.platform !== platform), error: null });
    return true;
  }

  /** Forget everything, e.g. on sign-out so the next user doesn't see this list */
  function reset() {
    set({ platforms: [], loading: true, error: null });
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
    disconnect,
    reset,
  };
}
