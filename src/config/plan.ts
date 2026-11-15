import type { Plan } from '../api/plan';

/** What a request to switch between the Free and Pro views does. The plan comes from the backend. */
export type TierRequest = { allowed: boolean; message?: string };

export const PRO_NOT_AVAILABLE = 'Pro is coming soon.';

/**
 * The Free/Pro switches and upgrade buttons in the app call this. They never set the plan: the real plan
 * (src/api/plan.ts) is the only source. Asking for Pro without it is refused with a short message; asking
 * for the plan you already have is a no-op; Free is ignored for a Pro creator (their plan is their plan).
 */
export function requestTierChange(current: Plan, requested: Plan): TierRequest {
  if (requested === current) return { allowed: true };
  if (requested === 'pro') return { allowed: false, message: PRO_NOT_AVAILABLE };
  return { allowed: false };
}
