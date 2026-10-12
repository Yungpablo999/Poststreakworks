import { createChunkedStorage, type KeyValueStore } from '../chunkedStorage';

function memoryStore() {
  const map = new Map<string, string>();
  const store: KeyValueStore = {
    getItemAsync: async (k) => map.get(k) ?? null,
    setItemAsync: async (k, v) => void map.set(k, v),
    deleteItemAsync: async (k) => void map.delete(k),
  };
  return { map, store };
}

describe('createChunkedStorage', () => {
  it('round-trips values larger than one chunk and keeps each chunk under the limit', async () => {
    const { map, store } = memoryStore();
    const s = createChunkedStorage(store, 10);
    const value = 'x'.repeat(95);
    await s.setItem('sb-ref-auth-token', value);
    expect(await s.getItem('sb-ref-auth-token')).toBe(value);
    expect(map.get('sb-ref-auth-token.n')).toBe('10');
    for (const [k, v] of map) if (k !== 'sb-ref-auth-token.n') expect(v.length).toBeLessThanOrEqual(10);
  });

  it('a shorter value replaces a longer one without leftover chunks', async () => {
    const { map, store } = memoryStore();
    const s = createChunkedStorage(store, 4);
    await s.setItem('k', 'abcdefghij');
    await s.setItem('k', 'xy');
    expect(await s.getItem('k')).toBe('xy');
    expect([...map.keys()].sort()).toEqual(['k.0', 'k.n']);
  });

  it('removeItem deletes everything and missing keys read as null', async () => {
    const { map, store } = memoryStore();
    const s = createChunkedStorage(store, 4);
    await s.setItem('k', 'abcdefghij');
    await s.removeItem('k');
    expect(map.size).toBe(0);
    expect(await s.getItem('k')).toBeNull();
  });

  it('a damaged value (missing chunk) reads as null, and keys are made SecureStore-safe', async () => {
    const { map, store } = memoryStore();
    const s = createChunkedStorage(store, 2);
    await s.setItem('a:b', 'abcd');
    expect(map.has('a_b.0')).toBe(true);
    map.delete('a_b.1');
    expect(await s.getItem('a:b')).toBeNull();
  });

  it('stores an empty string', async () => {
    const { store } = memoryStore();
    const s = createChunkedStorage(store);
    await s.setItem('k', '');
    expect(await s.getItem('k')).toBe('');
  });
});
