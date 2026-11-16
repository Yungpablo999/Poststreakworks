import { ageConfirmationData, detectRegion, hasAgeConfirmation, MIN_AGE, regionFromLocale, requiredAge } from '../age';
import { applyPendingAge, PENDING_AGE_KEY, savePendingAge } from '../pendingAge';

describe('requiredAge', () => {
  it('is 13 unless the region needs more', () => {
    expect(MIN_AGE).toBe(13);
    expect(requiredAge(null)).toBe(13);
    expect(requiredAge('US')).toBe(13);
    expect(requiredAge('ng')).toBe(18);
    expect(requiredAge('DE')).toBe(16);
  });
});

describe('regionFromLocale / detectRegion', () => {
  it('reads the region of a locale', () => {
    expect(regionFromLocale('en-NG')).toBe('NG');
    expect(regionFromLocale('en_ng')).toBe('NG');
    expect(regionFromLocale('en')).toBeNull();
    expect(regionFromLocale(undefined)).toBeNull();
  });
  it('never throws', () => {
    expect(() => detectRegion()).not.toThrow();
  });
});

describe('age confirmation data', () => {
  it('records when and what age', () => {
    const d = ageConfirmationData(18, new Date('2026-11-16T10:00:00Z'));
    expect(d).toEqual({ age_confirmed_at: '2026-11-16T10:00:00.000Z', age_confirmed_min: 18 });
    expect(hasAgeConfirmation(d)).toBe(true);
    expect(hasAgeConfirmation({})).toBe(false);
    expect(hasAgeConfirmation(null)).toBe(false);
  });
});

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: async (k: string) => data[k] ?? null,
    setItem: async (k: string, v: string) => void (data[k] = v),
    removeItem: async (k: string) => void delete data[k],
  };
}

describe('pending confirmation (Google sign-up)', () => {
  it('is written to the account once, then cleared', async () => {
    const storage = fakeStorage();
    await savePendingAge({ storage }, 13, new Date('2026-11-16T10:00:00Z'));
    const update = jest.fn().mockResolvedValue(true);
    await applyPendingAge({ storage, updateUserData: update }, {});
    expect(update).toHaveBeenCalledWith({ age_confirmed_at: '2026-11-16T10:00:00.000Z', age_confirmed_min: 13 });
    expect(storage.data[PENDING_AGE_KEY]).toBeUndefined();
  });
  it('keeps it when the write fails, to retry next session', async () => {
    const storage = fakeStorage();
    await savePendingAge({ storage }, 13);
    await applyPendingAge({ storage, updateUserData: async () => false }, {});
    expect(storage.data[PENDING_AGE_KEY]).toBeDefined();
  });
  it('does not overwrite an account that already has one', async () => {
    const storage = fakeStorage();
    await savePendingAge({ storage }, 13);
    const update = jest.fn();
    await applyPendingAge({ storage, updateUserData: update }, { age_confirmed_at: '2026-01-01T00:00:00Z' });
    expect(update).not.toHaveBeenCalled();
    expect(storage.data[PENDING_AGE_KEY]).toBeUndefined();
  });
  it('does nothing without a pending confirmation, and survives junk', async () => {
    const update = jest.fn();
    await applyPendingAge({ storage: fakeStorage(), updateUserData: update }, {});
    const junk = fakeStorage({ [PENDING_AGE_KEY]: '{bad' });
    await expect(applyPendingAge({ storage: junk, updateUserData: update }, {})).resolves.toBeUndefined();
    expect(update).not.toHaveBeenCalled();
  });
});
