// A Supabase auth storage adapter on top of a small key/value store (SecureStore
// on phones). SecureStore warns about values over 2048 bytes and a Supabase
// session is often bigger, so each value is split into chunks:
//   `${key}.n`  = number of chunks
//   `${key}.0`, `${key}.1`, … = the chunks
// The count is written last and removed first, so a half-written value is never read.

export interface KeyValueStore {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

export interface AuthStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Safe under the 2048-byte limit even for multi-byte text (Supabase sessions are ASCII JSON). */
export const DEFAULT_CHUNK_SIZE = 1800;

// SecureStore keys may only contain letters, digits, ".", "-" and "_".
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

export function createChunkedStorage(store: KeyValueStore, chunkSize = DEFAULT_CHUNK_SIZE): AuthStorage {
  if (chunkSize < 1) throw new Error('chunkSize must be at least 1');

  async function count(key: string): Promise<number> {
    const raw = await store.getItemAsync(`${key}.n`);
    const n = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  async function remove(key: string): Promise<void> {
    const n = await count(key);
    await store.deleteItemAsync(`${key}.n`);
    for (let i = 0; i < n; i++) await store.deleteItemAsync(`${key}.${i}`);
  }

  return {
    async getItem(rawKey) {
      const key = safeKey(rawKey);
      const n = await count(key);
      if (n === 0) return null;
      const parts: string[] = [];
      for (let i = 0; i < n; i++) {
        const part = await store.getItemAsync(`${key}.${i}`);
        if (part === null) return null; // damaged: treat as signed out rather than return half a session
        parts.push(part);
      }
      return parts.join('');
    },
    async setItem(rawKey, value) {
      const key = safeKey(rawKey);
      await remove(key);
      const n = Math.max(1, Math.ceil(value.length / chunkSize));
      for (let i = 0; i < n; i++) {
        await store.setItemAsync(`${key}.${i}`, value.slice(i * chunkSize, (i + 1) * chunkSize));
      }
      await store.setItemAsync(`${key}.n`, String(n));
    },
    async removeItem(rawKey) {
      await remove(safeKey(rawKey));
    },
  };
}
