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

function initialCheckInStreak(persona: Persona): CheckInStreak {
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

// In-memory mock store so Home and Quests share the same check-in state.
// A real backend would persist this; screens only use the functions below.
const checkInStore: Partial<Record<Persona, CheckInStreak>> = {};
const checkInListeners = new Set<() => void>();

export function getCheckInStreak(persona: Persona): CheckInStreak {
  if (!checkInStore[persona]) checkInStore[persona] = initialCheckInStreak(persona);
  return checkInStore[persona]!;
}

export function checkInToday(persona: Persona): CheckInStreak {
  const current = getCheckInStreak(persona);
  if (current.checkedInToday) return current;
  const week = [...current.week];
  week[current.todayIndex] = true;
  checkInStore[persona] = { ...current, week, checkedInToday: true, currentDays: current.currentDays + 1 };
  checkInListeners.forEach((listener) => listener());
  return checkInStore[persona]!;
}

export function subscribeToCheckIns(listener: () => void): () => void {
  checkInListeners.add(listener);
  return () => checkInListeners.delete(listener);
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

// ---------------------------------------------------------------------------
// Starter plan (onboarding "Your plan" step)
// Built only from what the creator told us (niches + platforms) — no stats.
// Mock ideas for now; the real Jarvis idea generator replaces getStarterIdeas.
// ---------------------------------------------------------------------------

export interface StarterIdea {
  id: string;
  niche: string;
  title: string;
  hook: string;
  format: string;
  bestTime: string;
}

const IDEAS_BY_NICHE: Record<string, Omit<StarterIdea, 'id' | 'niche' | 'format'>[]> = {
  lifestyle: [
    { title: 'My 5-minute morning reset', hook: 'I stopped scrolling first thing in the morning. Here is what I do instead.', bestTime: '7:30 AM' },
    { title: 'A day in my life, honestly', hook: 'Not the aesthetic version. The real one.', bestTime: '6:00 PM' },
    { title: '3 small habits that changed my week', hook: 'None of these take more than two minutes.', bestTime: '8:00 PM' },
  ],
  comedy: [
    { title: 'When the group chat goes silent', hook: 'Everyone has sent this exact message at least once.', bestTime: '8:30 PM' },
    { title: 'Things my mum says, ranked', hook: 'Number one is non-negotiable.', bestTime: '7:00 PM' },
    { title: 'Me trying to be productive', hook: 'Step one: make a to-do list. Step two: lose it.', bestTime: '9:00 PM' },
  ],
  education: [
    { title: 'One thing school never taught you', hook: 'I wish someone told me this at 16.', bestTime: '7:00 PM' },
    { title: 'Explain it like I am five', hook: 'The simplest way to understand this in 30 seconds.', bestTime: '6:30 PM' },
    { title: '3 myths people still believe', hook: 'Number two surprised me too.', bestTime: '8:00 PM' },
  ],
  beauty: [
    { title: 'My 3-product everyday look', hook: 'Five minutes, three products, done.', bestTime: '7:30 AM' },
    { title: 'Outfit formula that always works', hook: 'Use this when you have nothing to wear.', bestTime: '6:00 PM' },
    { title: 'Budget swap vs. the real thing', hook: 'Can you spot the difference?', bestTime: '8:00 PM' },
  ],
  food: [
    { title: 'A 10-minute dinner I make weekly', hook: 'Cheap, fast, and better than takeaway.', bestTime: '5:30 PM' },
    { title: 'Rating the viral recipe honestly', hook: 'Is it actually worth it?', bestTime: '7:00 PM' },
    { title: 'What I eat in a busy day', hook: 'Real food for a real schedule.', bestTime: '12:30 PM' },
  ],
  fitness: [
    { title: 'A 10-minute workout, no equipment', hook: 'You can do this in your bedroom tonight.', bestTime: '6:30 AM' },
    { title: 'One mistake beginners make', hook: 'I did this for a year before I noticed.', bestTime: '7:00 PM' },
    { title: 'What I eat after training', hook: 'Simple, filling and it actually helps.', bestTime: '6:00 PM' },
  ],
  tech: [
    { title: '3 apps that save me an hour a day', hook: 'Number three is free.', bestTime: '8:00 AM' },
    { title: 'How I plan my week in 10 minutes', hook: 'The Sunday system that keeps me on track.', bestTime: '7:00 PM' },
    { title: 'A money lesson I learned late', hook: 'I wish I started this in my first job.', bestTime: '8:30 PM' },
  ],
  music: [
    { title: 'Learn this 8-count in 30 seconds', hook: 'Slow version first, then full speed.', bestTime: '7:00 PM' },
    { title: 'The song stuck in my head this week', hook: 'My cover, one take, no edits.', bestTime: '8:30 PM' },
    { title: 'Behind the scenes of my practice', hook: 'What an hour of practice really looks like.', bestTime: '6:00 PM' },
  ],
};

const GENERAL_IDEAS: Omit<StarterIdea, 'id' | 'niche' | 'format'>[] = [
  { title: 'Why I started creating', hook: 'This is the reason I finally hit post.', bestTime: '7:30 PM' },
  { title: 'One thing I wish I knew before I started', hook: 'Perfection is the enemy of posting.', bestTime: '7:00 PM' },
  { title: 'Introduce yourself in 30 seconds', hook: 'Hi, I am new here. Here is what to expect.', bestTime: '6:30 PM' },
];

function formatFor(platforms: string[]): string {
  if (platforms.includes('tiktok') || platforms.includes('instagram')) return '30-second Reel';
  if (platforms.includes('youtube')) return 'YouTube Short';
  if (platforms.includes('threads')) return 'Text post';
  if (platforms.includes('facebook')) return 'Short video';
  return '30-second Reel';
}

/** Ideas that match the creator's niches first, then general starters. */
export function getStarterIdeas(niches: string[], platforms: string[]): StarterIdea[] {
  const format = formatFor(platforms);
  const fromNiches = niches.flatMap((n) =>
    (IDEAS_BY_NICHE[n] ?? []).map((idea, i) => ({ ...idea, id: `${n}-${i}`, niche: n, format })),
  );
  // Interleave niches so shuffling moves between them
  const byIndex = [0, 1, 2].flatMap((i) => fromNiches.filter((idea) => idea.id.endsWith(`-${i}`)));
  const general = GENERAL_IDEAS.map((idea, i) => ({ ...idea, id: `general-${i}`, niche: 'general', format }));
  return [...byIndex, ...general];
}

// ---------------------------------------------------------------------------
// Connected-account snapshot (onboarding "Your plan" step)
// When a platform is connected for real, the backend returns the creator's own
// recent numbers. Until then this returns sample data with isSample = true,
// and the UI labels it "Sample data". Return null if nothing could be read.
// ---------------------------------------------------------------------------

export interface AccountSnapshot {
  platform: string;
  isSample: boolean;
  /** Days with at least one post in the last 30 days. */
  postingDaysLast30: number;
  /** Which of the last 30 days had a post (index 0 = 30 days ago). */
  postedDays: boolean[];
  avgViews: string;
  bestTime: string;
  /** How many of the recent posts went out near the best time. */
  postsAtBestTime: number;
  recentPosts: number;
  topFormat: string;
}

const SAMPLE_SNAPSHOTS: Record<string, Omit<AccountSnapshot, 'platform' | 'isSample' | 'postedDays'>> = {
  tiktok: { postingDaysLast30: 4, avgViews: '1.2K', bestTime: '7 PM', postsAtBestTime: 1, recentPosts: 4, topFormat: 'Short videos' },
  instagram: { postingDaysLast30: 3, avgViews: '640', bestTime: '6 PM', postsAtBestTime: 1, recentPosts: 3, topFormat: 'Reels' },
  youtube: { postingDaysLast30: 2, avgViews: '890', bestTime: '5 PM', postsAtBestTime: 0, recentPosts: 2, topFormat: 'Shorts' },
  facebook: { postingDaysLast30: 3, avgViews: '410', bestTime: '8 PM', postsAtBestTime: 1, recentPosts: 3, topFormat: 'Short videos' },
  threads: { postingDaysLast30: 5, avgViews: '320', bestTime: '9 AM', postsAtBestTime: 2, recentPosts: 5, topFormat: 'Text posts' },
};

export function getAccountSnapshot(platforms: string[]): AccountSnapshot | null {
  const platform = platforms.find((p) => p in SAMPLE_SNAPSHOTS);
  if (!platform) return null;
  const sample = SAMPLE_SNAPSHOTS[platform];
  // Spread the sample posting days across the month
  const postedDays = Array.from({ length: 30 }, (_, i) =>
    Array.from({ length: sample.postingDaysLast30 }, (_, k) => Math.round((k + 0.5) * (30 / sample.postingDaysLast30))).includes(i),
  );
  return { platform, isSample: true, postedDays, ...sample };
}
