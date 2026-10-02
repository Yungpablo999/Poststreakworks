import { z } from "zod";
import { nicheListSchema, timezoneSchema } from "./platforms";

/** A public handle, without the "@" (becomes the creator's passport slug). */
export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9_]{2,29}$/, "Use 3–30 letters, numbers or underscores");

/**
 * What a creator tells us while signing up. Every field is optional so the app
 * can send each onboarding step as it goes.
 */
export const saveOnboardingInput = z.object({
  displayName: z.string().trim().min(1).max(50).optional(),
  handle: handleSchema.optional(),
  niches: nicheListSchema.optional(),
  /** The device's IANA zone; decides when the creator's day and week start. */
  timezone: timezoneSchema.optional(),
});

export type SaveOnboardingInput = z.infer<typeof saveOnboardingInput>;
