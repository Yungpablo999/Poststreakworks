import { z } from "zod";

// The app and the database name platforms slightly differently:
//   app (src/config/features.ts, PlatformConnectScreen):  tiktok instagram youtube facebook threads, and "x"
//   database (platform_type enum):                         ... plus 'twitter' for X, and 'linkedin' / 'meta'
// The API speaks the app's vocabulary; this is the only place that maps.

export const APP_PLATFORMS = [
  "tiktok",
  "instagram",
  "youtube",
  "facebook",
  "threads",
  "x",
  "linkedin",
] as const;

export type AppPlatform = (typeof APP_PLATFORMS)[number];

export const appPlatformSchema = z.enum(APP_PLATFORMS);

export type DbPlatform = "tiktok" | "instagram" | "youtube" | "facebook" | "threads" | "twitter" | "linkedin" | "meta";

export function toDbPlatform(platform: AppPlatform): DbPlatform {
  return platform === "x" ? "twitter" : platform;
}

/** Database value -> app id. Returns null for platforms the app doesn't show (e.g. 'meta'). */
export function toAppPlatform(platform: string): AppPlatform | null {
  if (platform === "twitter") return "x";
  return (APP_PLATFORMS as readonly string[]).includes(platform) ? (platform as AppPlatform) : null;
}

/** Niche ids the onboarding screen offers (NicheSelectionScreen). */
export const NICHE_IDS = [
  "lifestyle",
  "comedy",
  "education",
  "beauty",
  "food",
  "fitness",
  "tech",
  "music",
] as const;

// Validated by shape, not the fixed list: adding a niche in the app shouldn't
// need a backend deploy. Matches the DB cap of 12.
export const nicheListSchema = z
  .array(z.string().regex(/^[a-z][a-z0-9_-]{1,30}$/))
  .max(12)
  .transform((niches) => Array.from(new Set(niches)));

/**
 * The canonical IANA name for a zone ("africa/lagos" -> "Africa/Lagos"), or
 * null when it isn't a real zone. Canonical case matters: the database matches
 * zone names exactly and falls back to Lagos for anything it doesn't recognise.
 */
export function canonicalTimezone(zone: string): string | null {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: zone }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

export const timezoneSchema = z
  .string()
  .min(1)
  .max(64)
  .transform((zone, ctx) => {
    const canonical = canonicalTimezone(zone);
    if (!canonical) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Unknown time zone" });
      return z.NEVER;
    }
    return canonical;
  });
