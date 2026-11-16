// Age confirmation at sign-up: a self-declaration ("I am at least N years old"),
// stored on the account as proof the person was asked.
//
// *** OWNER / LEGAL REVIEW NEEDED: the region list below is a starting point, not legal advice. ***
// MIN_AGE is the floor everywhere. A region listed in AGE_BY_REGION needs a higher age.
// The region is a best guess from the device (locale, then time zone): it can be wrong or
// missing, and then MIN_AGE applies.

export const MIN_AGE = 13;

/** ISO 3166-1 alpha-2 region -> the age confirmation that region needs (REVIEW with legal) */
export const AGE_BY_REGION: Readonly<Record<string, number>> = {
  NG: 18, // Nigeria: the data protection act treats under-18s as children
  DE: 16,
  NL: 16,
};

// A time zone is a fallback when the locale carries no region (a bare "en")
const REGION_BY_TIME_ZONE: Readonly<Record<string, string>> = {
  'Africa/Lagos': 'NG',
  'Europe/Berlin': 'DE',
  'Europe/Amsterdam': 'NL',
};

/** Region code from a locale like "en-NG" or "en_NG", or null */
export function regionFromLocale(locale: string | null | undefined): string | null {
  const m = /[-_]([A-Za-z]{2})(?:$|[-_])/.exec(locale ?? '');
  return m ? m[1].toUpperCase() : null;
}

/** Best-effort region of this device; null when it can't be told. Never throws. */
export function detectRegion(): string | null {
  try {
    const opts = Intl.DateTimeFormat().resolvedOptions();
    return REGION_BY_TIME_ZONE[opts.timeZone] ?? regionFromLocale(opts.locale);
  } catch {
    return null;
  }
}

/** The age a person in this region confirms (MIN_AGE unless the region needs more) */
export function requiredAge(region: string | null | undefined): number {
  const age = region ? AGE_BY_REGION[region.toUpperCase()] : undefined;
  return Math.max(MIN_AGE, age ?? MIN_AGE);
}

/**
 * The account data that records the confirmation (Supabase user metadata, so no table
 * or migration is needed). The timestamp is when they ticked the box.
 */
export function ageConfirmationData(age: number, now: Date = new Date()): { age_confirmed_at: string; age_confirmed_min: number } {
  return { age_confirmed_at: now.toISOString(), age_confirmed_min: age };
}

/** True when the account already carries a confirmation */
export function hasAgeConfirmation(metadata: Record<string, unknown> | null | undefined): boolean {
  return typeof metadata?.age_confirmed_at === 'string' && metadata.age_confirmed_at.length > 0;
}
