// The creator's analytics choice. Nothing is measured until they say yes; "no" is
// remembered and can be changed any time in Settings. The choice lives on this device.
//
// Pure store with injected storage so it can be tested; consentStore.ts wires the real one.

export type ConsentChoice = 'granted' | 'denied';
export type ConsentState = ConsentChoice | 'unset';

export const CONSENT_KEY = 'poststreak.consent.v1';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export function parseConsent(raw: string | null | undefined): ConsentState {
  return raw === 'granted' || raw === 'denied' ? raw : 'unset';
}

export interface ConsentStore {
  /** Loads the saved choice (call once at start) */
  load(): Promise<ConsentState>;
  get(): ConsentState;
  /** True once load() has finished, so the banner doesn't flash for someone who already chose */
  isLoaded(): boolean;
  set(choice: ConsentChoice): Promise<void>;
  subscribe(listener: () => void): () => void;
}

export function createConsentStore(storage: KeyValueStorage): ConsentStore {
  let state: ConsentState = 'unset';
  let loaded = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    async load() {
      try {
        // A choice made before the read finished wins
        if (state === 'unset') state = parseConsent(await storage.getItem(CONSENT_KEY));
      } catch {
        // unreadable storage: treat as undecided, which measures nothing
      }
      loaded = true;
      emit();
      return state;
    },
    get: () => state,
    isLoaded: () => loaded,
    async set(choice) {
      state = choice;
      emit();
      try {
        await storage.setItem(CONSENT_KEY, choice);
      } catch {
        // not saved: holds for this visit only
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * Runs `start` the first time consent is granted (now, if it already is) and `stop` when it is
 * withdrawn. Returns the unsubscribe. This is the one door for any analytics SDK: it must be
 * started from here and nowhere else.
 */
export function whenConsented(store: ConsentStore, start: () => void, stop?: () => void): () => void {
  let running = false;
  const sync = () => {
    const granted = store.get() === 'granted';
    if (granted && !running) {
      running = true;
      start();
    } else if (!granted && running) {
      running = false;
      stop?.();
    }
  };
  sync();
  return store.subscribe(sync);
}
