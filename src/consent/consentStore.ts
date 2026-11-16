import { useSyncExternalStore } from 'react';
import { authStorage } from '../auth/storage';
import { createConsentStore, type ConsentState } from './consent';

// The app's one consent store, kept in the same place as the session (browser storage on the
// web, the Keychain / Keystore on phones).
export const consentStore = createConsentStore(authStorage);

export function useConsent(): { state: ConsentState; loaded: boolean } {
  const state = useSyncExternalStore(consentStore.subscribe, consentStore.get, consentStore.get);
  const loaded = useSyncExternalStore(consentStore.subscribe, consentStore.isLoaded, consentStore.isLoaded);
  return { state, loaded };
}
