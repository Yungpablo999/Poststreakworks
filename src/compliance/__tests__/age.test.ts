import { ageConfirmationData, confirmAge, declineAge, hasAgeConfirmation, MIN_AGE, needsAgeGate } from '../age';

describe('minimum age', () => {
  it('is 16, one number for everyone', () => {
    expect(MIN_AGE).toBe(16);
    expect(ageConfirmationData().age_confirmed_min).toBe(16);
  });
});

describe('age confirmation data', () => {
  it('records when and what age', () => {
    const d = ageConfirmationData(16, new Date('2026-11-16T10:00:00Z'));
    expect(d).toEqual({ age_confirmed_at: '2026-11-16T10:00:00.000Z', age_confirmed_min: 16 });
    expect(hasAgeConfirmation(d)).toBe(true);
    expect(hasAgeConfirmation({})).toBe(false);
    expect(hasAgeConfirmation(null)).toBe(false);
  });
});

describe('the age gate', () => {
  it('stops any signed-in account with no confirmation (a first Google sign-in, or an old account)', () => {
    expect(needsAgeGate(undefined)).toBe(true);
    expect(needsAgeGate({ full_name: 'A' })).toBe(true);
    expect(needsAgeGate({ age_confirmed_at: '' })).toBe(true);
  });
  it('lets an account through once it carries the confirmation', () => {
    expect(needsAgeGate(ageConfirmationData())).toBe(false);
  });
  it('confirming writes the confirmation to the account', async () => {
    const update = jest.fn().mockResolvedValue(true);
    const ok = await confirmAge({ updateUserData: update, signOut: async () => undefined }, new Date('2026-11-16T10:00:00Z'));
    expect(ok).toBe(true);
    expect(update).toHaveBeenCalledWith({ age_confirmed_at: '2026-11-16T10:00:00.000Z', age_confirmed_min: 16 });
  });
  it('reports false when the write fails or throws, so the screen stays up', async () => {
    expect(await confirmAge({ updateUserData: async () => false, signOut: async () => undefined })).toBe(false);
    expect(await confirmAge({ updateUserData: async () => { throw new Error('x'); }, signOut: async () => undefined })).toBe(false);
  });
  it('declining signs out, and never throws', async () => {
    const signOut = jest.fn().mockResolvedValue(undefined);
    await declineAge({ signOut });
    expect(signOut).toHaveBeenCalledTimes(1);
    await expect(declineAge({ signOut: async () => { throw new Error('x'); } })).resolves.toBeUndefined();
  });
});
