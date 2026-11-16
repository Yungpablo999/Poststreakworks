import { CONSENT_KEY, createConsentStore, parseConsent, whenConsented } from '../consent';

function storage(initial: string | null = null) {
  let value = initial;
  return { getItem: async () => value, setItem: async (_k: string, v: string) => void (value = v), peek: () => value };
}

describe('consent store', () => {
  it('starts undecided and measures nothing', async () => {
    const store = createConsentStore(storage());
    expect(store.get()).toBe('unset');
    expect(store.isLoaded()).toBe(false);
    await store.load();
    expect(store.get()).toBe('unset');
    expect(store.isLoaded()).toBe(true);
  });
  it('remembers a saved choice, and ignores junk', async () => {
    expect(parseConsent('granted')).toBe('granted');
    expect(parseConsent('yes')).toBe('unset');
    const store = createConsentStore(storage('denied'));
    expect(await store.load()).toBe('denied');
    const bad = createConsentStore(storage('zzz'));
    expect(await bad.load()).toBe('unset');
  });
  it('saves a choice under its key and tells listeners', async () => {
    const s = storage();
    const store = createConsentStore(s);
    const listener = jest.fn();
    store.subscribe(listener);
    await store.set('granted');
    expect(store.get()).toBe('granted');
    expect(s.peek()).toBe('granted');
    expect(CONSENT_KEY).toBe('poststreak.consent.v1');
    expect(listener).toHaveBeenCalled();
  });
  it('survives storage that throws', async () => {
    const store = createConsentStore({ getItem: async () => { throw new Error('x'); }, setItem: async () => { throw new Error('x'); } });
    await expect(store.load()).resolves.toBe('unset');
    await expect(store.set('granted')).resolves.toBeUndefined();
    expect(store.get()).toBe('granted');
  });
});

describe('whenConsented', () => {
  it('starts only after consent, and stops on withdrawal', async () => {
    const store = createConsentStore(storage());
    await store.load();
    const start = jest.fn();
    const stop = jest.fn();
    whenConsented(store, start, stop);
    expect(start).not.toHaveBeenCalled();
    await store.set('denied');
    expect(start).not.toHaveBeenCalled();
    await store.set('granted');
    await store.set('granted');
    expect(start).toHaveBeenCalledTimes(1);
    await store.set('denied');
    expect(stop).toHaveBeenCalledTimes(1);
  });
  it('starts at once when consent was already given', async () => {
    const store = createConsentStore(storage('granted'));
    await store.load();
    const start = jest.fn();
    whenConsented(store, start);
    expect(start).toHaveBeenCalledTimes(1);
  });
});
