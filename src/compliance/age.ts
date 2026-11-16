// Age confirmation: a self-declaration ("I am at least 16 years old"), stored on the account
// (Supabase user metadata, so no table or migration is needed) as proof the person was asked.
// One minimum for everyone, in every region. It must match the privacy policy and the terms.

export const MIN_AGE = 16;

/**
 * The account data that records the confirmation. The timestamp is when they confirmed.
 */
export function ageConfirmationData(age: number = MIN_AGE, now: Date = new Date()): { age_confirmed_at: string; age_confirmed_min: number } {
  return { age_confirmed_at: now.toISOString(), age_confirmed_min: age };
}

/** True when the account already carries a confirmation */
export function hasAgeConfirmation(metadata: Record<string, unknown> | null | undefined): boolean {
  return typeof metadata?.age_confirmed_at === 'string' && metadata.age_confirmed_at.length > 0;
}

/**
 * Every signed-in account must carry a confirmation, however it signed in (email code, Google,
 * an account made before this check existed). Without one, the app stays behind the age screen.
 */
export function needsAgeGate(metadata: Record<string, unknown> | null | undefined): boolean {
  return !hasAgeConfirmation(metadata);
}

export interface AgeGateDeps {
  /** supabase.auth.updateUser({ data }); says whether it worked */
  updateUserData(data: Record<string, unknown>): Promise<boolean>;
  signOut(): Promise<void>;
}

/** The person confirmed they are old enough: write it to the account. True when saved. Never throws. */
export async function confirmAge(deps: AgeGateDeps, now: Date = new Date()): Promise<boolean> {
  try {
    return await deps.updateUserData(ageConfirmationData(MIN_AGE, now));
  } catch {
    return false;
  }
}

/** The person said they are not old enough: end the session. Never throws. */
export async function declineAge(deps: Pick<AgeGateDeps, 'signOut'>): Promise<void> {
  try {
    await deps.signOut();
  } catch {
    // the screen stays up; they can try again
  }
}
