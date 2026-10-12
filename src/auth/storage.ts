import type { AuthStorage } from './chunkedStorage';

// Web: the session lives in the browser's localStorage (storage.native.ts is used on phones).
// Guarded so a browser that blocks storage (private mode) just stays signed out.
function local(): Storage | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

export const authStorage: AuthStorage = {
  async getItem(key) {
    try {
      return local()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      local()?.setItem(key, value);
    } catch {
      // quota or blocked storage: the session lasts for this page only
    }
  },
  async removeItem(key) {
    try {
      local()?.removeItem(key);
    } catch {
      // nothing to remove
    }
  },
};
