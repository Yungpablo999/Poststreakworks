import { FREE_REPURPOSES_PER_MONTH } from '../config/features';

// Single place screens get their data from.
//
// Everything here is mock data for now. When the real backend (the web app
// behind PostIT-web's login) is ready, replace the bodies of these functions
// with API calls — screens and components shouldn't need to change.
//
// Screens are being moved onto this module one phase at a time; older screens
// still keep some mock values inline.

export type Persona = 'new' | 'returning';

// ---------------------------------------------------------------------------
// Check-in streak
// A gentle daily check-in habit. Missing a day never "breaks" anything in the
// copy — there are no freezes, countdowns or warnings.
// ---------------------------------------------------------------------------

export interface CheckInStreak {
  /** Consecutive days checked in, including today if already checked in. */
  currentDays: number;
  /** This week, Monday → Sunday. true = checked in that day. */
  week: boolean[];
  /** Index of today within `week` (0 = Monday). */
  todayIndex: number;
  checkedInToday: boolean;
}

const mondayFirstIndex = (date: Date) => (date.getDay() + 6) % 7;

export function getCheckInStreak(persona: Persona): CheckInStreak {
  const todayIndex = mondayFirstIndex(new Date());
  if (persona === 'new') {
    return { currentDays: 0, week: Array(7).fill(false), todayIndex, checkedInToday: false };
  }
  // Returning: checked in every day this week up to (not including) today.
  return {
    currentDays: 17,
    week: Array.from({ length: 7 }, (_, i) => i < todayIndex),
    todayIndex,
    checkedInToday: false,
  };
}

// ---------------------------------------------------------------------------
// Voice Studio (Pro)
// `accuracy` is the voice-clone accuracy score: how closely the AI voice
// sounds like the creator. It is NOT Creator Match.
// ---------------------------------------------------------------------------

export interface VoiceCloneSummary {
  minutesUsed: number;
  minutesIncluded: number;
  /** 0–100, or null if the creator hasn't cloned their voice yet. */
  accuracy: number | null;
  voiceName: string | null;
}

export function getVoiceCloneSummary(persona: Persona): VoiceCloneSummary {
  if (persona === 'new') {
    return { minutesUsed: 0, minutesIncluded: 150, accuracy: null, voiceName: null };
  }
  return { minutesUsed: 118, minutesIncluded: 150, accuracy: 78, voiceName: 'Energetic Narrator' };
}

// ---------------------------------------------------------------------------
// Repurpose (Free: FREE_REPURPOSES_PER_MONTH per month; Pro: unlimited)
// ---------------------------------------------------------------------------

export interface RepurposeAllowance {
  usedThisMonth: number;
  /** null = unlimited (Pro). */
  monthlyLimit: number | null;
}

export function getRepurposeAllowance(persona: Persona, tier: 'free' | 'pro'): RepurposeAllowance {
  const usedThisMonth = persona === 'new' ? 0 : 1;
  return { usedThisMonth, monthlyLimit: tier === 'pro' ? null : FREE_REPURPOSES_PER_MONTH };
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

export interface ScheduleSummary {
  scheduledCount: number;
  /** Human label for the next scheduled post, or null when nothing is planned. */
  nextPostLabel: string | null;
}

export function getScheduleSummary(persona: Persona): ScheduleSummary {
  if (persona === 'new') return { scheduledCount: 0, nextPostLabel: null };
  return { scheduledCount: 1, nextPostLabel: 'Today · 7:30 PM' };
}
