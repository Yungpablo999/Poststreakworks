import { getSupabase } from '../auth/supabase';

// The creator's plan, read from the backend's user_plans table (RLS: a creator can read only their own row).
// This is a read. Nothing in the app writes the plan: it changes only when billing (or an admin) changes it
// in the database. While payments are off (PAYMENTS_ENABLED=false) everyone is on 'free'.

export type Plan = 'free' | 'pro';

/** Anything unexpected counts as free, never as pro */
export const normalisePlan = (value: unknown): Plan => (value === 'pro' ? 'pro' : 'free');

type PlanRow = { plan?: unknown } | null;
/** Just the part of the Supabase client we use, so tests can pass a fake */
export interface PlanClient {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): PromiseLike<{ data: PlanRow; error: { message: string } | null }>;
      };
    };
  };
}

/**
 * The plan for this user, or null when it could not be read (offline, signed out, error):
 * callers keep what they had instead of guessing. A signed-in user with no row yet is 'free'.
 */
export async function fetchPlan(userId: string, client?: PlanClient): Promise<Plan | null> {
  try {
    const c = client ?? (getSupabase() as unknown as PlanClient);
    const { data, error } = await c.from('user_plans').select('plan').eq('user_id', userId).maybeSingle();
    if (error) return null;
    return normalisePlan(data?.plan);
  } catch {
    return null;
  }
}
