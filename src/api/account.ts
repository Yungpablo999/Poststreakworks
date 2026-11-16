// Permanent account deletion. POST /api/account/delete { confirm: 'DELETE' } removes the creator's
// data (posts, connections, media, streaks, drafts, check-ins, preferences, referrals) and their sign-in.

export const DELETE_CONFIRM_PHRASE = 'DELETE';

/** True when what the creator typed is the confirm word (case and spaces around it do not matter) */
export function isDeleteConfirmed(typed: string): boolean {
  return typed.trim().toUpperCase() === DELETE_CONFIRM_PHRASE;
}

export interface DeleteAccountDeps {
  post: (endpoint: string, body: unknown) => Promise<{ success: boolean; statusCode: number; error?: string }>;
}

export type DeleteAccountOutcome = { ok: true } | { ok: false; message: string };

/** Asks the backend to delete the signed-in account. Never throws. */
export async function deleteMyAccount(typed: string, deps: DeleteAccountDeps): Promise<DeleteAccountOutcome> {
  if (!isDeleteConfirmed(typed)) return { ok: false, message: `Type ${DELETE_CONFIRM_PHRASE} to confirm` };
  try {
    const res = await deps.post('/api/account/delete', { confirm: DELETE_CONFIRM_PHRASE });
    if (res.success) return { ok: true };
    if (res.statusCode === 429) return { ok: false, message: 'Too many tries. Wait a minute and try again.' };
    return { ok: false, message: 'We could not delete your account. Nothing was lost; please try again.' };
  } catch {
    return { ok: false, message: 'We could not reach PostStreak. Check your connection and try again.' };
  }
}
