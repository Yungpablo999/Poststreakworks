import { ageConfirmationData, hasAgeConfirmation } from './age';

// Google sign-up leaves the page, so the box they ticked is kept here until the session
// comes back, then written to the account. Email sign-up sends it with the code request instead.

export const PENDING_AGE_KEY = 'poststreak.age.pending.v1';

export interface PendingAgeDeps {
  storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
  /** Writes user metadata (supabase.auth.updateUser({ data })) and says whether it worked */
  updateUserData(data: Record<string, unknown>): Promise<boolean>;
}

export async function savePendingAge(deps: Pick<PendingAgeDeps, 'storage'>, age: number, now: Date = new Date()): Promise<void> {
  try {
    await deps.storage.setItem(PENDING_AGE_KEY, JSON.stringify(ageConfirmationData(age, now)));
  } catch {
    // not saved: the account just won't carry the confirmation
  }
}

/** Writes a saved confirmation to the account once, then clears it. Never throws. */
export async function applyPendingAge(deps: PendingAgeDeps, userMetadata: Record<string, unknown> | null | undefined): Promise<void> {
  try {
    const raw = await deps.storage.getItem(PENDING_AGE_KEY);
    if (!raw) return;
    if (!hasAgeConfirmation(userMetadata)) {
      const data = JSON.parse(raw) as unknown;
      if (!data || typeof data !== 'object' || !hasAgeConfirmation(data as Record<string, unknown>)) {
        await deps.storage.removeItem(PENDING_AGE_KEY);
        return;
      }
      if (!(await deps.updateUserData(data as Record<string, unknown>))) return; // keep it, try next time
    }
    await deps.storage.removeItem(PENDING_AGE_KEY);
  } catch {
    // leave it for the next session check
  }
}
