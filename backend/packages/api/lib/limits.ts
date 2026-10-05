//
// freeRepurposesPerWeek / jarvisChatPerDay come from the October 2026 product
// brief. Repurposes: "1 free per week" (an open decision — keep or change; this
// is the one place to change it). Jarvis chat is a SEPARATE budget from the
// four content tools above (ideas/hooks/scripts/captions): chat is open to
// everyone, so these numbers are abuse/cost guards. They are PLACEHOLDERS until
// product sets real ones.
export const TIER_LIMITS = {
  free: {
    maxConnectedPlatforms: 2,
    aiGenerationsPerDay: 3,
    // Small changes to something already written (rewrite one part of a script, shorten a caption,
    // suggest tags) are counted apart from new writing, so tidying a script doesn't use up the day.
    // A PLACEHOLDER like jarvisChatPerDay until product sets the real number.
    aiEditsPerDay: 10,
    passportBoostPct: 0,
    repurposesPerWeek: 1 as number | null,
    jarvisChatPerDay: 30,
  },
  pro: {
    maxConnectedPlatforms: Infinity,
    aiGenerationsPerDay: Infinity,
    aiEditsPerDay: Infinity,
    passportBoostPct: 15,
    repurposesPerWeek: null as number | null,
    jarvisChatPerDay: 300,
  },
  founding: {
    maxConnectedPlatforms: Infinity,
    aiGenerationsPerDay: Infinity,
    aiEditsPerDay: Infinity,
    passportBoostPct: 15,
    repurposesPerWeek: null as number | null,
    jarvisChatPerDay: 300,
  },
} as const;
