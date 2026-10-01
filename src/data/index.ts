import { FREE_REPURPOSES_PER_WEEK } from '../config/features';

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
// Repurpose (Free: FREE_REPURPOSES_PER_WEEK per week; Pro: unlimited)
// ---------------------------------------------------------------------------

export interface RepurposeAllowance {
  usedThisWeek: number;
  /** null = unlimited (Pro). */
  weeklyLimit: number | null;
}

// Repurposes used this week (mock store; a real backend would count them)
const repurposeUsed: Record<Persona, number> = { new: 0, returning: 0 };
const repurposeListeners = new Set<() => void>();

export function getRepurposeAllowance(persona: Persona, tier: 'free' | 'pro'): RepurposeAllowance {
  return { usedThisWeek: repurposeUsed[persona], weeklyLimit: tier === 'pro' ? null : FREE_REPURPOSES_PER_WEEK };
}

/** Uses one repurpose. Returns false when a free plan has none left. */
export function spendRepurpose(persona: Persona, tier: 'free' | 'pro'): boolean {
  if (tier !== 'pro' && repurposeUsed[persona] >= FREE_REPURPOSES_PER_WEEK) return false;
  repurposeUsed[persona] += 1;
  repurposeListeners.forEach((l) => l());
  return true;
}

export function subscribeToRepurposes(listener: () => void): () => void {
  repurposeListeners.add(listener);
  return () => repurposeListeners.delete(listener);
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
  const fromNiches = normalizeNiches(niches).flatMap((n) =>
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

/** Snapshots for every connected platform, in the order they were connected. */
export function getAccountSnapshots(platforms: string[]): AccountSnapshot[] {
  return platforms
    .map((p) => getAccountSnapshot([p]))
    .filter((s): s is AccountSnapshot => s !== null);
}

/** Posts per week, rounded, from days posted in the last 30 days (min 0). */
export function postsPerWeek(snapshot: AccountSnapshot): number {
  return Math.max(0, Math.round(snapshot.postingDaysLast30 / (30 / 7)));
}

/** The starter plan's posting rhythm. */
export const PLAN_POSTS_PER_WEEK = 3;

// ---------------------------------------------------------------------------
// Calendar (the pop-up behind the Home check-in card)
// One month at a time: which days had a check-in, what was posted, and what's
// scheduled. Mock posts are generated relative to today so the calendar always
// looks current; check-ins come from the check-in store above so tapping
// "Check in" on Home shows up here straight away.
// ---------------------------------------------------------------------------

export type CalendarPlatform = 'tiktok' | 'instagram' | 'youtube' | 'threads' | 'facebook';

export interface CalendarPost {
  id: string;
  title: string;
  platform: CalendarPlatform;
  time: string;
  status: 'posted' | 'scheduled' | 'draft';
}

export interface CalendarDay {
  /** YYYY-MM-DD */
  key: string;
  day: number;
  isToday: boolean;
  isPast: boolean;
  checkedIn: boolean;
  posts: CalendarPost[];
}

export interface CalendarMonth {
  year: number;
  /** 0 = January */
  month: number;
  label: string;
  /** Empty cells before day 1 in a Monday-first grid. */
  startOffset: number;
  days: CalendarDay[];
  postedCount: number;
  scheduledCount: number;
  checkInCount: number;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MOCK_POSTS: { title: string; platform: CalendarPlatform; time: string }[] = [
  { title: 'My 5-minute morning reset', platform: 'tiktok', time: '7:30 AM' },
  { title: '3 small habits that changed my week', platform: 'instagram', time: '8:00 PM' },
  { title: 'A day in my life, honestly', platform: 'youtube', time: '6:00 PM' },
  { title: 'How I plan my week in 10 minutes', platform: 'tiktok', time: '7:00 PM' },
  { title: 'What I wish I knew before starting', platform: 'instagram', time: '7:30 PM' },
  { title: 'Quick tip: hooks that hold attention', platform: 'threads', time: '12:30 PM' },
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function getCalendarMonth(persona: Persona, year: number, month: number): CalendarMonth {
  const today = startOfDay(new Date());
  const streak = getCheckInStreak(persona);
  const first = new Date(year, month, 1);
  const daysCount = new Date(year, month + 1, 0).getDate();
  const startOffset = mondayFirstIndex(first);
  // Days before today that count toward the current run of check-ins
  const priorRun = streak.currentDays - (streak.checkedInToday ? 1 : 0);

  const days: CalendarDay[] = [];
  for (let d = 1; d <= daysCount; d++) {
    const date = new Date(year, month, d);
    const diff = Math.round((date.getTime() - today.getTime()) / 86400000); // days from today
    const isToday = diff === 0;
    const isPast = diff < 0;

    const checkedIn = isToday ? streak.checkedInToday : isPast && persona === 'returning' && -diff <= priorRun;

    const posts: CalendarPost[] = [];
    if (persona === 'returning') {
      const pick = MOCK_POSTS[(d + month * 3) % MOCK_POSTS.length];
      const weekday = mondayFirstIndex(date);
      // About three posts a week: Mon / Wed / Fri, within ~10 weeks of today
      const onPlan = weekday === 0 || weekday === 2 || weekday === 4;
      if (onPlan && isPast && diff >= -70) {
        posts.push({ id: `p-${dayKey(date)}`, ...pick, status: 'posted' });
      } else if (onPlan && !isPast && diff <= 21) {
        posts.push({ id: `s-${dayKey(date)}`, ...pick, status: 'scheduled' });
      }
      if (isToday) {
        posts.push({ id: `d-${dayKey(date)}-t`, ...MOCK_POSTS[4], time: '7:30 PM', status: 'draft' });
      }
    }

    days.push({ key: dayKey(date), day: d, isToday, isPast, checkedIn, posts });
  }

  const all = days.flatMap((x) => x.posts);
  return {
    year,
    month,
    label: `${MONTH_NAMES[month]} ${year}`,
    startOffset,
    days,
    postedCount: all.filter((p) => p.status === 'posted').length,
    scheduledCount: all.filter((p) => p.status !== 'posted').length,
    checkInCount: days.filter((x) => x.checkedIn).length,
  };
}

// ---------------------------------------------------------------------------
// Schedule (this week at a glance)
// ---------------------------------------------------------------------------

export interface WeekSchedule {
  /** Monday → Sunday of the current week. */
  days: CalendarDay[];
  todayIndex: number;
  plannedCount: number;
  draftCount: number;
  /** Future days this week with nothing planned. */
  openDays: number;
  /** Posts per platform this week, most first. */
  platformMix: { platform: CalendarPlatform; count: number }[];
  /** Suggested posting time (mock until real audience data). */
  bestTime: string;
}

export function getWeekSchedule(persona: Persona): WeekSchedule {
  const today = startOfDay(new Date());
  const todayIndex = mondayFirstIndex(today);
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - todayIndex);
  const cache: Record<string, CalendarMonth> = {};
  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (!cache[k]) cache[k] = getCalendarMonth(persona, d.getFullYear(), d.getMonth());
    days.push(cache[k].days[d.getDate() - 1]);
  }
  const all = days.flatMap((d) => d.posts);
  const counts: Partial<Record<CalendarPlatform, number>> = {};
  all.forEach((p) => (counts[p.platform] = (counts[p.platform] ?? 0) + 1));
  return {
    days,
    todayIndex,
    plannedCount: all.length,
    draftCount: all.filter((p) => p.status === 'draft').length,
    openDays: days.filter((d) => !d.isPast && !d.isToday && d.posts.length === 0).length,
    platformMix: (Object.keys(counts) as CalendarPlatform[])
      .map((platform) => ({ platform, count: counts[platform]! }))
      .sort((a, b) => b.count - a.count),
    bestTime: '7:30 PM',
  };
}

// ---------------------------------------------------------------------------
// Film-it plan (short video filmed inside TikTok / Reels / Shorts)
// Trending sounds and filters only exist inside those apps, so PostStreak
// plans the post and hands off. Sound ideas are SAMPLE data: official trend
// data needs TikTok's Discovery/Research API approval, and organic trending
// sounds aren't always licensed for business accounts.
// ---------------------------------------------------------------------------

// Most short video isn't talking to camera: dance and trend videos, skits and
// silent "text on screen" edits are just as common, so the plan follows the
// style of video, pre-picked from the creator's niche.
export type FilmStyle = 'talking' | 'dance' | 'skit' | 'text';

export const FILM_STYLES: { id: FilmStyle; label: string }[] = [
  { id: 'talking', label: 'Talking' },
  { id: 'dance', label: 'Dance / trend' },
  { id: 'skit', label: 'Skit' },
  { id: 'text', label: 'Text on screen' },
];

export interface FilmPlan {
  style: FilmStyle;
  /** Label over the hook box, e.g. "SAY IN THE FIRST 2 SECONDS". */
  hookLabel: string;
  hook: string;
  /** Heading for the list: "Shots" for talking / text, ideas for dance and skits
   *  (those creators already know the trend or how to act — they need an angle). */
  listLabel: string;
  shots: string[];
  /** Shown above the sound ideas; stronger for styles built on the sound. */
  soundTip: string;
  soundFirst: boolean;
}

export type TrendStage = 'rising' | 'peaking' | 'fading';

export interface SoundIdea {
  id: string;
  name: string;
  vibe: string;
  /** Where the sound is in its trend life (sample until real trend data). */
  stage?: TrendStage;
  isSample: true;
}

export function getDefaultFilmStyle(niches: string[] = []): FilmStyle {
  const n = niches[0];
  if (n === 'music') return 'dance';
  if (n === 'comedy') return 'skit';
  if (n === 'lifestyle' || n === 'beauty' || n === 'food') return 'text';
  return 'talking';
}

export function getFilmPlan(ideaTitle: string, style: FilmStyle = 'talking'): FilmPlan {
  const topic = ideaTitle.replace(/[“”"]/g, '').trim();
  switch (style) {
    case 'dance':
      return {
        style,
        // No advice about the dance itself: creators have already seen and
        // learnt it. Only the sound, its timing and the text line.
        hookLabel: 'ON-SCREEN TEXT',
        hook: `${topic}`,
        listLabel: '',
        shots: [],
        soundTip: 'Post while it’s rising. Rising sounds are best used in the next 2–3 days.',
        soundFirst: true,
      };
    case 'skit':
      return {
        style,
        hookLabel: 'PREMISE',
        listLabel: 'Punchline ideas',
        hook: `POV: ${/^I\b/.test(topic) ? topic : topic.charAt(0).toLowerCase() + topic.slice(1)}`,
        shots: [
          'Flip it: end on the opposite of what everyone expects',
          'Let the quiet character get the last word',
          'Freeze on the reaction face for the final beat',
        ],
        soundTip: 'A trending comedy audio or your own voice both work. Timing is everything.',
        soundFirst: true,
      };
    case 'text':
      return {
        style,
        hookLabel: 'ON-SCREEN TEXT (FIRST 2 SECONDS)',
        hook: topic,
        listLabel: 'Shots',
        shots: [
          'Open on the most satisfying close-up',
          '3–5 quick clips, 1–2 seconds each, cut to the beat',
          'End on the result with one line of text',
        ],
        soundTip: 'No talking needed. A trending song carries the video.',
        soundFirst: false,
      };
    default:
      return {
        style: 'talking',
        hookLabel: 'SAY IN THE FIRST 2 SECONDS',
        hook: `“${topic}.”`,
        listLabel: 'Shots',
        shots: [
          'Face the camera, say the hook with energy',
          'Show one real moment or example (5–10s)',
          'End with one takeaway and a question',
        ],
        soundTip: 'Keep music low under your voice, or skip it.',
        soundFirst: false,
      };
  }
}

const SOUND_IDEAS: Record<FilmStyle, Omit<SoundIdea, 'isSample'>[]> = {
  talking: [
    { id: 't1', name: 'Soft lo-fi beat', vibe: 'Quiet under your voice' },
    { id: 't2', name: 'Light acoustic loop', vibe: 'Warm, calm tips' },
  ],
  dance: [
    { id: 'd1', name: 'Afrobeats drop', vibe: 'Picking up this week', stage: 'rising' },
    { id: 'd2', name: 'Sped-up pop remix', vibe: 'Everyone is on it', stage: 'peaking' },
    { id: 'd3', name: 'Old challenge sound', vibe: 'Late now, skip it', stage: 'fading' },
  ],
  skit: [
    { id: 'k1', name: 'Trending comedy audio', vibe: 'Lip-sync the joke', stage: 'rising' },
    { id: 'k2', name: 'Dramatic reveal sound', vibe: 'For the punchline', stage: 'peaking' },
    { id: 'k3', name: 'Your own voice', vibe: 'Original audio' },
  ],
  text: [
    { id: 'x1', name: 'Aesthetic trending song', vibe: 'Slow, satisfying clips', stage: 'rising' },
    { id: 'x2', name: 'Upbeat build-up', vibe: 'Quick cuts to the beat' },
    { id: 'x3', name: 'Calm acoustic', vibe: 'Routines and recipes' },
  ],
};

export function getSoundIdeas(style: FilmStyle = 'talking'): SoundIdea[] {
  return SOUND_IDEAS[style].map((s) => ({ ...s, isSample: true as const }));
}

// ---------------------------------------------------------------------------
// Ideas feed (Create → Ideas)
// Ideas for the creator's chosen niches, each with a one-line reason tied to
// the goal they picked. Mock until the real Jarvis idea generator.
// ---------------------------------------------------------------------------

export type IdeaGoal = 'followers' | 'saves' | 'comments' | 'often';

export const IDEA_GOALS: { id: IdeaGoal; label: string }[] = [
  { id: 'followers', label: 'Grow followers' },
  { id: 'saves', label: 'Get saves' },
  { id: 'comments', label: 'Get comments' },
  { id: 'often', label: 'Post more often' },
];

export const NICHE_LABELS: Record<string, string> = {
  lifestyle: 'Lifestyle',
  comedy: 'Comedy',
  education: 'Education',
  beauty: 'Beauty & Fashion',
  food: 'Food',
  fitness: 'Fitness',
  tech: 'Tech & Business',
  music: 'Music & Dance',
};

const WHY_BY_GOAL: Record<IdeaGoal, string> = {
  followers: 'Relatable ideas get shared, which puts you in front of new people.',
  saves: 'Useful and quick to follow, so people save it for later.',
  comments: 'Ends on a question people actually want to answer.',
  often: 'Fast to film and easy to post today.',
};

export interface FeedIdea extends StarterIdea {
  why: string;
}

// Topics per niche: the goal turns these into its own kind of idea
const NICHE_TOPICS: Record<string, string[]> = {
  lifestyle: ['morning routines', 'staying organised', 'slow weekends'],
  comedy: ['group chats', 'work meetings', 'family dinners'],
  education: ['studying', 'learning faster', 'note taking'],
  beauty: ['skincare', 'everyday makeup', 'outfit ideas'],
  food: ['quick dinners', 'meal prep', 'cheap eats'],
  fitness: ['home workouts', 'staying consistent at the gym', 'stretching'],
  tech: ['productivity apps', 'side hustles', 'working from home'],
  music: ['dance trends', 'learning choreography', 'practice sessions'],
};

// Each goal suits a different format
function goalFormat(goal: IdeaGoal, base: string): string {
  if (goal === 'saves') return base === 'Text post' ? 'Text post' : 'Carousel';
  if (goal === 'often') return base === 'Text post' ? 'Text post' : '15-second video';
  return base;
}

export function getIdeaFeed(niches: string[], goal: IdeaGoal, platforms: string[] = []): FeedIdea[] {
  const list = getStarterIdeas(niches.length ? niches : ['lifestyle'], platforms);
  const base = list[0]?.format ?? '30-second Reel';
  // Followers: the hand-written starter ideas are already built to be shared
  if (goal === 'followers') return list.map((i) => ({ ...i, why: WHY_BY_GOAL[goal] }));
  // Other goals: ideas written for that goal from the creator's niche topics
  const ns = normalizeNiches(niches.length ? niches : ['lifestyle']);
  const topics = ns.flatMap((n) => (NICHE_TOPICS[n] ?? []).map((t) => ({ n, t })));
  const pool = TOPIC_TEMPLATES[goal];
  const made: FeedIdea[] = topics.flatMap(({ n, t }, ti) =>
    [0, 1].map((k) => {
      const tpl = pool[(ti * 2 + k) % pool.length];
      const cap = t.charAt(0).toUpperCase() + t.slice(1);
      return {
        id: `${goal}-${n}-${ti}-${k}`,
        niche: n,
        title: tpl.title(t, cap),
        hook: tpl.hook(t),
        format: goalFormat(goal, base),
        bestTime: list[ti % Math.max(1, list.length)]?.bestTime ?? '7:30 PM',
        why: WHY_BY_GOAL[goal],
      };
    }),
  );
  // Mix niches so the top pick and list move between them
  const byRound = [0, 1].flatMap((k) => made.filter((m) => m.id.endsWith(`-${k}`)));
  return byRound.length ? byRound : list.map((i) => ({ ...i, why: WHY_BY_GOAL[goal] }));
}

/** Niche ids from either ids ("tech") or display names ("Tech & AI"). */
export function normalizeNiches(input: string[] = []): string[] {
  const ids = Object.keys(NICHE_LABELS);
  const out = input
    .map((raw) => {
      const v = raw.trim().toLowerCase();
      if (ids.includes(v)) return v;
      const first = v.split(/[\s&]+/)[0];
      return ids.find((id) => id === first || NICHE_LABELS[id].toLowerCase().startsWith(first)) ?? null;
    })
    .filter((x): x is string => !!x);
  return Array.from(new Set(out));
}

// ---------------------------------------------------------------------------
// Goal-shaped captions: "Use this idea" from Ideas writes the caption for the
// goal the creator picked (mock copywriting until Jarvis writes it for real).
// ---------------------------------------------------------------------------

export interface GoalCaption {
  caption: string;
  tone: 'Helpful' | 'Viral' | 'Story';
  cta: 'Ask Question' | 'Save Post' | 'Share Thoughts';
}

export function getGoalCaption(title: string, goal: IdeaGoal, hook?: string): GoalCaption {
  const t = title.replace(/[“”"]/g, '').trim();
  const h = hook ? hook.trim() : '';
  switch (goal) {
    case 'saves':
      return {
        caption: `${t}\n\n1. Start small\n2. Do it the same time each day\n3. Keep it under 5 minutes\n\nSave this for later so you don't forget it.`,
        tone: 'Helpful',
        cta: 'Save Post',
      };
    case 'comments':
      return {
        caption: `${h || t}\n\nHonestly, this changed more than I expected.\n\nWhat would you add? Tell me in the comments.`,
        tone: 'Story',
        cta: 'Ask Question',
      };
    case 'often':
      return {
        caption: `${t}. That's it, that's the post.\n\nWhat's yours?`,
        tone: 'Helpful',
        cta: 'Ask Question',
      };
    default:
      return {
        caption: `${h || t}\n\nIf this is you too, you're not alone.\n\nSend this to someone who needs to hear it.`,
        tone: 'Viral',
        cta: 'Share Thoughts',
      };
  }
}

// ---------------------------------------------------------------------------
// Drafts (saved from Script and the post composer, listed on Create)
// In-memory mock store; a real backend would persist these.
// ---------------------------------------------------------------------------

export interface SavedDraft {
  id: string;
  title: string;
  kind: 'script' | 'post';
  /** e.g. "Script", "30-second Reel" */
  format: string;
  /** Platform id when known ('tiktok' | 'instagram' | …) */
  platform?: string;
  savedAt: number;
}

let draftStore: SavedDraft[] = [];
const draftListeners = new Set<() => void>();

export function getDrafts(): SavedDraft[] {
  return draftStore;
}

/** Adds a draft, or updates it (same id) and moves it to the top. */
export function saveDraft(d: Omit<SavedDraft, 'savedAt'>): SavedDraft {
  const saved = { ...d, savedAt: Date.now() };
  draftStore = [saved, ...draftStore.filter((x) => x.id !== d.id)];
  draftListeners.forEach((l) => l());
  return saved;
}

export function removeDraft(id: string): void {
  draftStore = draftStore.filter((x) => x.id !== id);
  draftListeners.forEach((l) => l());
}

export function subscribeToDrafts(listener: () => void): () => void {
  draftListeners.add(listener);
  return () => draftListeners.delete(listener);
}

export function draftAgo(savedAt: number): string {
  const mins = Math.round((Date.now() - savedAt) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

// ---------------------------------------------------------------------------
// Caption writer (Create → Caption): three options for a topic, shaped by the
// goal (the ending) and tone. Mock copywriting until Jarvis writes it.
// ---------------------------------------------------------------------------

export const CAPTION_TONES = ['Helpful', 'Honest', 'Motivational', 'Funny', 'Professional'] as const;
export type CaptionTone = (typeof CAPTION_TONES)[number];

export interface CaptionOption {
  id: string;
  label: string;
  body: string;
  ending: string;
  hashtags: string;
}

const ENDING_BY_GOAL: Record<IdeaGoal, string[]> = {
  followers: ['Send this to someone who needs to hear it.', 'Share this with a friend who gets it.'],
  saves: ['Save this for later so you don’t forget it.', 'Save this for your next filming day.'],
  comments: ['What would you add? Tell me in the comments.', 'Which one are you trying first?'],
  often: ['What’s yours?', 'Your turn. What’s one small win today?'],
};

const TAGS_BY_GOAL: Record<IdeaGoal, string> = {
  followers: '#CreatorCommunity',
  saves: '#SaveThis',
  comments: '#LetsTalk',
  often: '#PostDaily',
};

// Goal decides the KIND of caption (structure); tone decides the WORDING.
const BODIES_BY_GOAL: Record<IdeaGoal, { label: string; body: (t: string, l: string) => string }[]> = {
  followers: [
    { label: 'Relatable', body: (t, l) => `If you've ever felt this, you're not alone: ${l}.` },
    { label: 'Story', body: (t) => `${t}. A year ago I'd never have posted this. Now it's the one people send to their friends.` },
    { label: 'Hot take', body: (_t, l) => `Unpopular opinion: ${l} matters more than any trend.` },
    { label: 'Before & after', body: (_t, l) => `Before: overthinking every post. After: ${l}, and posting feels light again.` },
  ],
  saves: [
    { label: 'Quick tips', body: (t) => `${t}:\n1. Start small\n2. Keep it under 5 minutes\n3. Post it the same day` },
    { label: 'Checklist', body: (t) => `${t}, a quick checklist:\n• One clear point\n• A strong first line\n• One thing to try` },
    { label: 'Step by step', body: (_t, l) => `How I handle ${l}:\nStep 1: Pick one lesson\nStep 2: Film it in one take\nStep 3: Post before you overthink it` },
    { label: 'Cheat sheet', body: (t) => `${t}. The short version:\n→ Less planning\n→ More posting\n→ Learn from each one` },
  ],
  comments: [
    { label: 'Question first', body: (_t, l) => `Quick question: ${l}. Where do you stand?` },
    { label: 'Honest take', body: (_t, l) => `Honest moment: ${l}. Nobody talks about this part.` },
    { label: 'This or that', body: (t) => `${t}: plan everything, or just post? I've tried both.` },
    { label: 'Hot take', body: (_t, l) => `Maybe unpopular: ${l} is overrated. Change my mind.` },
  ],
  often: [
    { label: 'One-liner', body: (t) => `${t}. That's the post.` },
    { label: 'Tiny win', body: (_t, l) => `Small win today: ${l}.` },
    { label: 'Quick thought', body: (_t, l) => `Quick thought on ${l}: done beats perfect.` },
    { label: 'Daily note', body: (t) => `Day's note: ${t.toLowerCase()}. Short and honest.` },
  ],
};

const TONE_TAGS: Record<string, string> = {
  Helpful: '#CreatorTips',
  Honest: '#RealTalk',
  Motivational: '#Motivation',
  Funny: '#CreatorLife',
  Professional: '#ContentStrategy',
};

function applyTone(text: string, tones: string[], goal: IdeaGoal): string {
  let t = text;
  const pro = tones.includes('Professional');
  if (tones.includes('Honest') && !/^honest/i.test(t)) t = `Honestly? ${t}`;
  if (tones.includes('Helpful') && (goal === 'saves' || goal === 'followers')) t += `\n\nTry it this week and see what changes.`;
  if (tones.includes('Motivational')) t += ` You've got this.`;
  if (tones.includes('Funny') && !pro) t += ` (My coffee agrees.)`;
  if (pro) {
    t = t
      .replace(/Honest moment:/g, 'A candid note:')
      .replace(/Honestly\? (\S)/g, (_m, c: string) => `To be candid, ${c === 'I' ? c : c.toLowerCase()}`)
      .replace(/Unpopular opinion:/g, 'A contrarian view:')
      .replace(/Change my mind\./g, 'I would like to hear other views.')
      .replace(/!/g, '.')
      .replace(/You've got this\./g, 'Keep going.');
  }
  return t;
}

export function describeCaptionShape(goal: IdeaGoal, tones: string[]): string {
  const g = IDEA_GOALS.find((x) => x.id === goal)?.label.toLowerCase() ?? '';
  const t = tones.map((x) => x.toLowerCase());
  const toneText = t.length > 1 ? `${t.slice(0, -1).join(', ')} and ${t[t.length - 1]}` : t[0];
  // "an honest", "an upbeat"… (silent h in "honest")
  const article = /^([aeiou]|hon)/i.test(toneText) ? 'an' : 'a';
  return `Written to ${g}, in ${article} ${toneText} tone.`;
}

export function getCaptionOptions(topic: string, goal: IdeaGoal, tones: string[], round = 0): CaptionOption[] {
  const t = topic.replace(/[“”"]/g, '').trim() || 'My creator journey';
  const lower = t.charAt(0).toLowerCase() + t.slice(1);
  const bodies = BODIES_BY_GOAL[goal];
  const endings = ENDING_BY_GOAL[goal];
  const toneTags = tones.map((x) => TONE_TAGS[x]).filter(Boolean).slice(0, 2);
  const hashtags = Array.from(new Set([...toneTags, '#ContentCreation', TAGS_BY_GOAL[goal]])).join(' ');
  return [0, 1, 2].map((i) => {
    const b = bodies[(i + round) % bodies.length];
    return {
      id: `${goal}-${tones.join('')}-${round}-${i}`,
      label: b.label,
      body: applyTone(b.body(t, lower), tones, goal),
      ending: applyTone(endings[(i + round) % endings.length], tones.filter((x) => x === 'Professional'), goal),
      hashtags,
    };
  });
}

// ---------------------------------------------------------------------------
// Repurpose: one idea written the way each platform works. Mock copy until
// Jarvis writes it for real.
// ---------------------------------------------------------------------------

export type OutFormat = 'video' | 'carousel' | 'photo' | 'text' | 'thread' | 'community';

/** The formats each platform supports, in the order we offer them. */
export const PLATFORM_FORMATS: Record<string, { id: OutFormat; label: string }[]> = {
  tiktok: [
    { id: 'video', label: 'Video' },
    { id: 'carousel', label: 'Photo carousel' },
  ],
  instagram: [
    { id: 'video', label: 'Reel' },
    { id: 'carousel', label: 'Carousel' },
    { id: 'photo', label: 'Photo post' },
  ],
  youtube: [
    { id: 'video', label: 'Short' },
    { id: 'community', label: 'Community post' },
  ],
  threads: [
    { id: 'text', label: 'Text post' },
    { id: 'thread', label: 'Thread' },
  ],
  facebook: [
    { id: 'video', label: 'Video' },
    { id: 'text', label: 'Post' },
  ],
};

export interface RepurposeVersion {
  platform: string;
  formatId: OutFormat;
  /** e.g. "Reel · 9:16" */
  format: string;
  title: string;
  body: string;
  /** Carousel slides, when the format is a carousel */
  slides?: string[];
  /** Thread posts, when the format is a thread */
  posts?: string[];
}

// Strip quotes and any end punctuation, since templates add their own
const clean = (idea: string) => idea.replace(/[“”"]/g, '').trim().replace(/[.!?…]+$/, '') || 'My creator journey';

/** One platform's version of the idea in a chosen format. */
export function makeVersion(idea: string, platform: string, formatId: OutFormat): RepurposeVersion {
  const t = clean(idea);
  const l = t.charAt(0).toLowerCase() + t.slice(1);
  const label = PLATFORM_FORMATS[platform]?.find((f) => f.id === formatId)?.label ?? 'Post';
  switch (formatId) {
    case 'video': {
      const ratio = platform === 'facebook' ? '9:16 or 4:5' : '9:16';
      const lines: Record<string, string> = {
        tiktok: `Stop scrolling if this is you: ${l}.\n\nHere's the one thing that changed it for me. Watch to the end.`,
        instagram: `${t}.\n\nI used to overthink every post.\nNow I share one small lesson at a time.\n\nSave this for your next filming day.`,
        youtube: `${t}, in under a minute. The short version of what I wish someone had told me sooner.`,
        facebook: `${t}. A quick video on what finally worked for me. Share it with someone who needs it.`,
      };
      return { platform, formatId, format: `${label} · ${ratio}`, title: platform === 'youtube' ? (t.length > 60 ? `${t.slice(0, 57)}…` : t) : 'Hook first, 20–30 seconds', body: lines[platform] ?? lines.tiktok };
    }
    case 'carousel':
      return {
        platform,
        formatId,
        format: `${label} · 5 slides`,
        title: 'Swipe-through slides',
        slides: [t, 'Here’s what nobody tells you', 'What I used to do', 'What I do now', 'Save this for later'],
        body: `${t}. Swipe through, then save it for your next post.`,
      };
    case 'photo':
      return { platform, formatId, format: `${label} · 4:5`, title: 'One photo and a caption', body: `${t}.\n\nOne photo, one honest lesson. What would you add?` };
    case 'text':
      return {
        platform,
        formatId,
        format: label,
        title: platform === 'threads' ? 'Conversation starter' : 'Longer post',
        body:
          platform === 'threads'
            ? `${t}.\n\nHonestly, nobody talks about this part. What would you add?`
            : `${t}.\n\nWhen I started, I waited for everything to be perfect. Sharing small, honest lessons made it easier, and people related to it more.\n\nHas this happened to you?`,
      };
    case 'thread':
      return {
        platform,
        formatId,
        format: `${label} · 4 posts`,
        title: 'A short thread',
        posts: [`${t}. A quick thread.`, 'The first thing I got wrong: waiting for the perfect idea.', 'What changed: posting small lessons, often.', 'Your turn. What’s one thing you’d add?'],
        body: `${t}. A quick thread.`,
      };
    case 'community':
      return { platform, formatId, format: label, title: 'Poll for your subscribers', body: `Quick question: ${l}. Which one is you?\n\n• Still figuring it out\n• Getting there\n• Got it sorted` };
  }
}

/** A version for each platform, starting with the format that fits the source best. */
export function getRepurposeVersions(idea: string, platforms: string[], prefer: 'video' | 'carousel' | 'text' = 'video'): RepurposeVersion[] {
  return platforms
    .filter((p) => PLATFORM_FORMATS[p])
    .map((p) => {
      const opts = PLATFORM_FORMATS[p].map((f) => f.id);
      const want: OutFormat[] = prefer === 'carousel' ? ['carousel', 'photo', 'text'] : prefer === 'text' ? ['text', 'thread', 'community', 'carousel'] : ['video', 'text'];
      const pick = want.find((f) => opts.includes(f)) ?? opts[0];
      return makeVersion(idea, p, pick);
    });
}

// ---------------------------------------------------------------------------
// Video studio: Jarvis watches a video the creator made (frame by frame, then
// a second pass for anything missed), describes what stands out, and suggests
// new videos with the same shape. Mock breakdowns until the video model is
// connected. It describes the video; it never claims to know why a post did well.
// ---------------------------------------------------------------------------

export interface StudioVideo {
  uri?: string;
  /** "Your video" / the post title when it came from Growth */
  name: string;
  seconds: number;
  source: 'upload' | 'camera' | 'post';
  platform?: string;
}

export interface VideoMoment {
  at: number;
  label: string;
  note: string;
}

export interface VideoRecipePart {
  id: 'opening' | 'sound' | 'pace' | 'tone';
  label: string;
  value: string;
}

export interface VideoBreakdown {
  style: FilmStyle;
  moments: VideoMoment[];
  recipe: VideoRecipePart[];
}

export interface LikeThisIdea {
  id: string;
  title: string;
  /** What carries over from the original, as short chips */
  keeps: string[];
  /** One small change per platform */
  tweaks: Record<string, string>;
}

const at = (s: number, f: number) => Math.max(0, Math.round(s * f));

export function getVideoBreakdown(style: FilmStyle, seconds: number): VideoBreakdown {
  const s = Math.max(5, seconds);
  const cuts = Math.max(2, Math.round(s / 6));
  const by: Record<FilmStyle, VideoBreakdown> = {
    talking: {
      style,
      moments: [
        { at: 0, label: 'Opening', note: 'You start with a question, no hello or intro.' },
        { at: at(s, 0.15), label: 'The point', note: 'The main point lands early, before people decide to scroll.' },
        { at: at(s, 0.5), label: 'Example', note: 'A real example from your own experience.' },
        { at: at(s, 0.9), label: 'Ending', note: 'You end by asking viewers what they think.' },
      ],
      recipe: [
        { id: 'opening', label: 'Opening', value: 'A question in the first second' },
        { id: 'sound', label: 'Sound', value: 'Your voice, light music under it' },
        { id: 'pace', label: 'Pace', value: `${s}s, ${cuts} cuts` },
        { id: 'tone', label: 'Tone', value: 'Honest and relatable' },
      ],
    },
    dance: {
      style,
      moments: [
        { at: 0, label: 'Opening', note: 'You are already moving on the first beat.' },
        { at: at(s, 0.35), label: 'The drop', note: 'Outfit or place changes right on the drop.' },
        { at: at(s, 0.7), label: 'Close-up', note: 'The camera moves in for the last part.' },
        { at: at(s, 0.95), label: 'Loop', note: 'The last frame matches the first, so it replays smoothly.' },
      ],
      recipe: [
        { id: 'opening', label: 'Opening', value: 'Straight in on the beat' },
        { id: 'sound', label: 'Sound', value: 'Trending sound, still rising' },
        { id: 'pace', label: 'Pace', value: `${s}s, cuts on the beat` },
        { id: 'tone', label: 'Tone', value: 'Confident and playful' },
      ],
    },
    skit: {
      style,
      moments: [
        { at: 0, label: 'Opening', note: 'Drops straight into the situation.' },
        { at: at(s, 0.4), label: 'The turn', note: 'The moment the situation flips.' },
        { at: at(s, 0.85), label: 'Punchline', note: 'The payoff lands right at the end.' },
      ],
      recipe: [
        { id: 'opening', label: 'Opening', value: 'Mid-scene, no setup' },
        { id: 'sound', label: 'Sound', value: 'Your voice and a sound effect' },
        { id: 'pace', label: 'Pace', value: `${s}s, ${cuts} cuts` },
        { id: 'tone', label: 'Tone', value: 'Funny and familiar' },
      ],
    },
    text: {
      style,
      moments: [
        { at: 0, label: 'Opening', note: 'Big text on the first frame says what the video is.' },
        { at: at(s, 0.3), label: 'Text change', note: 'New text on every cut keeps people reading.' },
        { at: at(s, 0.9), label: 'Ending', note: 'The last line gives people a reason to save it.' },
      ],
      recipe: [
        { id: 'opening', label: 'Opening', value: 'Text that names the topic' },
        { id: 'sound', label: 'Sound', value: 'Calm trending audio' },
        { id: 'pace', label: 'Pace', value: `${s}s, text on each cut` },
        { id: 'tone', label: 'Tone', value: 'Calm and useful' },
      ],
    },
  };
  return by[style];
}

const IDEAS_BY_STYLE: Record<FilmStyle, { title: string; keeps: string[] }[]> = {
  talking: [
    { title: 'Answer the top question from the comments', keeps: ['Question opening', 'Same length'] },
    { title: 'The opposite version: what to avoid', keeps: ['Early point', 'Ask at the end'] },
    { title: 'Same opening, a new topic from your niche', keeps: ['Question opening', 'Same pace'] },
    { title: 'Part 2: what happened next', keeps: ['Same tone', 'Same length'] },
    { title: 'Your quick take on this week’s news in your niche', keeps: ['Early point', 'Same pace'] },
    { title: 'Story time: when this went wrong for you', keeps: ['Honest tone', 'Ask at the end'] },
  ],
  dance: [
    { title: 'Same trend, somewhere unexpected', keeps: ['Change on the drop', 'Same sound'] },
    { title: 'Do it with a friend or family member', keeps: ['Straight in', 'Same length'] },
    { title: 'A rising trend with a similar sound', keeps: ['Cuts on the beat', 'Smooth loop'] },
    { title: 'Behind the scenes: your takes that didn’t work', keeps: ['Same sound', 'Playful tone'] },
    { title: 'Same trend in a new outfit theme', keeps: ['Change on the drop', 'Close-up ending'] },
    { title: 'A duet-ready version others can join', keeps: ['Same sound', 'Smooth loop'] },
  ],
  skit: [
    { title: 'Same character, a new situation', keeps: ['Mid-scene opening', 'Late punchline'] },
    { title: 'Swap the roles', keeps: ['Same turn', 'Same length'] },
    { title: 'Part 2 of the same story', keeps: ['Same character', 'Same pace'] },
    { title: 'The version your followers asked for', keeps: ['Mid-scene opening', 'Same tone'] },
    { title: 'Same joke, set somewhere new', keeps: ['Same turn', 'Late punchline'] },
    { title: 'The other person’s point of view', keeps: ['Same situation', 'Same length'] },
  ],
  text: [
    { title: 'Same format, the next step of the topic', keeps: ['Text opening', 'Text on each cut'] },
    { title: 'A list version: 3 quick tips', keeps: ['Same audio vibe', 'Save-worthy ending'] },
    { title: 'Before and after with the same text style', keeps: ['Text opening', 'Same pace'] },
    { title: 'Myths vs facts in your niche', keeps: ['Text on each cut', 'Calm tone'] },
    { title: 'A day-in-the-life with the same captions', keeps: ['Same audio vibe', 'Same length'] },
    { title: 'Your most asked question, answered in text', keeps: ['Text opening', 'Save-worthy ending'] },
  ],
};

const TWEAKS: Record<FilmStyle, Record<string, string>> = {
  talking: {
    tiktok: 'Keep the question as on-screen text too.',
    instagram: 'Pick a cover frame with your face and the question.',
    youtube: 'Put the question in the Shorts title so it shows in search.',
    threads: 'Post the question as text and link the video in a reply.',
    facebook: 'Upload natively; a longer caption works well here.',
  },
  dance: {
    tiktok: 'Post while the sound is still rising.',
    instagram: 'Use the same sound from Reels audio and pick a cover mid-move.',
    youtube: 'Add a short title on screen so Shorts can show it in search.',
    threads: 'Share a still and ask which place to do it next.',
    facebook: 'Post as a Reel; these get shared to groups.',
  },
  skit: {
    tiktok: 'Put the situation as text on the first frame.',
    instagram: 'Cover frame on the funniest face, not the start.',
    youtube: 'Name the situation in the title, like “When your…”.',
    threads: 'Write the situation as a one-liner and ask for their version.',
    facebook: 'Tag it as relatable in the caption so people share it.',
  },
  text: {
    tiktok: 'Keep text inside the safe middle of the screen.',
    instagram: 'Try it as a carousel too, one line per slide.',
    youtube: 'Use the first text line as the Shorts title.',
    threads: 'Post the text lines as a thread, no video needed.',
    facebook: 'Use a bigger font; many watch on small screens.',
  },
};

export function getLikeThisIdeas(style: FilmStyle, seconds: number, platforms: string[], round = 0): LikeThisIdea[] {
  const pool = IDEAS_BY_STYLE[style];
  const len = `About ${Math.max(5, seconds)}s`;
  return [0, 1, 2].map((i) => {
    const base = pool[(round * 3 + i) % pool.length];
    const tweaks: Record<string, string> = {};
    platforms.forEach((p) => {
      if (TWEAKS[style][p]) tweaks[p] = TWEAKS[style][p];
    });
    return { id: `${style}-${round}-${i}`, title: base.title, keeps: [...base.keeps, len], tweaks };
  });
}

// ---------------------------------------------------------------------------
// Pro: ideas about the creator's own topic, shaped by the chosen goal.
// Template-based mock until Jarvis writes them.
// ---------------------------------------------------------------------------

const TOPIC_TEMPLATES: Record<IdeaGoal, { title: (t: string, T: string) => string; hook: (t: string) => string }[]> = {
  followers: [
    { title: (t) => `Things nobody tells you about ${t}`, hook: (t) => `Nobody warned me about this part of ${t}.` },
    { title: (_t, T) => `${T}: the side nobody shows you`, hook: () => `Here’s what it really looks like behind the scenes.` },
    { title: (t) => `POV: you’re new to ${t}`, hook: () => `If this is you right now, keep watching.` },
    { title: (t) => `How ${t} changed my week`, hook: () => `I didn’t expect this to make such a difference.` },
    { title: (t) => `Rating every tip on ${t} I tried`, hook: () => `Number three was a total waste of time.` },
    { title: (t) => `The mistake everyone makes with ${t}`, hook: () => `I did this for months before I noticed.` },
  ],
  saves: [
    { title: (t) => `5 tips on ${t} worth saving`, hook: () => `Save this so you have it next time.` },
    { title: (t) => `My simple checklist for ${t}`, hook: () => `I use this every single time. Here it is.` },
    { title: (_t, T) => `${T}, step by step for beginners`, hook: () => `Step one is the one most people skip.` },
    { title: (t) => `The tools I use for ${t}`, hook: () => `All of these are free. Save the list.` },
    { title: (t) => `A cheat sheet for ${t}`, hook: () => `Everything in one place. Screenshot this.` },
    { title: (t) => `3 habits that made ${t} easier`, hook: () => `These are the only ones I kept doing.` },
  ],
  comments: [
    { title: (t) => `Unpopular opinion about ${t}`, hook: () => `I know people will disagree with this one.` },
    { title: (t) => `${t.charAt(0).toUpperCase() + t.slice(1)}: which side are you on?`, hook: () => `Tell me in the comments which one you pick.` },
    { title: (t) => `What I wish I’d known sooner about ${t}`, hook: () => `What would you add to this list?` },
    { title: (t) => `Tell me if I’m wrong about ${t}`, hook: () => `Be honest with me in the comments.` },
    { title: (t) => `The question I get asked most about ${t}`, hook: () => `Drop your answer before you watch mine.` },
    { title: (t) => `${t.charAt(0).toUpperCase() + t.slice(1)}: overrated or worth it?`, hook: () => `I changed my mind on this one.` },
  ],
  often: [
    { title: (t) => `One quick tip on ${t}, in 30 seconds`, hook: () => `Here’s one thing you can try today.` },
    { title: (t) => `A day of ${t} in 3 short clips`, hook: () => `No talking, just the day.` },
    { title: (t) => `${t.charAt(0).toUpperCase() + t.slice(1)}: today’s small win`, hook: () => `Small win today, and here’s how.` },
    { title: (t) => `${t.charAt(0).toUpperCase() + t.slice(1)} in one photo and one line`, hook: () => `Today, in one picture.` },
    { title: (t) => `${t.charAt(0).toUpperCase() + t.slice(1)} in 5 minutes a day`, hook: () => `Five minutes, that’s all it takes.` },
    { title: (t) => `Before and after: ${t}`, hook: () => `Here’s where I started.` },
  ],
};

const TOPIC_WHY: Record<IdeaGoal, string> = {
  followers: 'Relatable ideas get shared, which brings new people',
  saves: 'Useful lists and steps are what people save',
  comments: 'Opinions and questions get people talking',
  often: 'Quick to make, so posting stays easy',
};

export function getTopicIdeas(topic: string, goal: IdeaGoal, format = '30-second Reel', round = 0): FeedIdea[] {
  const t = topic.trim().replace(/[.!?]+$/, '');
  const lower = t.charAt(0).toLowerCase() + t.slice(1);
  const cap = t.charAt(0).toUpperCase() + t.slice(1);
  const stamp = Date.now();
  const pool = TOPIC_TEMPLATES[goal];
  return [0, 1, 2].map((i) => pool[(round * 3 + i) % pool.length]).map((tpl, i) => ({
    id: `topic-${goal}-${stamp}-${i}`,
    niche: 'topic',
    title: tpl.title(lower, cap),
    hook: tpl.hook(lower),
    format,
    bestTime: '7:30 PM',
    why: TOPIC_WHY[goal],
  }));
}

// ---------------------------------------------------------------------------
// Saved hooks (Hook Studio hearts). In-memory until there's a backend.
// ---------------------------------------------------------------------------

export interface SavedHook {
  line: string;
  /** 'talking' | 'dance' | 'skit' | 'text' */
  style: string;
  idea: string;
  savedAt: number;
}

let savedHooks: SavedHook[] = [];
const savedHookListeners = new Set<() => void>();
const emitHooks = () => savedHookListeners.forEach((l) => l());

export function getSavedHooks(): SavedHook[] {
  return savedHooks;
}
export function isHookSaved(line: string): boolean {
  return savedHooks.some((h) => h.line === line);
}
/** Saves or un-saves a hook; returns true when it's now saved. */
export function toggleSavedHook(h: Omit<SavedHook, 'savedAt'>): boolean {
  if (isHookSaved(h.line)) {
    savedHooks = savedHooks.filter((x) => x.line !== h.line);
    emitHooks();
    return false;
  }
  savedHooks = [{ ...h, savedAt: Date.now() }, ...savedHooks];
  emitHooks();
  return true;
}
export function subscribeToSavedHooks(listener: () => void): () => void {
  savedHookListeners.add(listener);
  return () => savedHookListeners.delete(listener);
}

// ---------------------------------------------------------------------------
// Repurpose from a link: work out the platform and kind of post from a URL.
// Mock: a real backend reads the post (the creator's own posts through their
// connected accounts; other people's only for ideas, never to copy).
// ---------------------------------------------------------------------------

export type LinkKind = 'video' | 'carousel' | 'text' | 'article';

export interface LinkPreview {
  url: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'threads' | 'facebook' | 'x' | 'web';
  platformName: string;
  kind: LinkKind;
  kindLabel: string;
  title: string;
  style: FilmStyle;
}

const LINK_TITLES: Record<LinkKind, string> = {
  video: '3 creator mistakes I stopped making',
  carousel: 'My simple posting system, in 5 slides',
  text: 'Nobody talks about how lonely creating can feel',
  article: 'How to stay consistent as a creator',
};

export function readLink(raw: string): LinkPreview | null {
  const text = raw.trim();
  const m = text.match(/(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?/i);
  if (!m) return null;
  const url = m[0].startsWith('http') ? m[0] : `https://${m[0]}`;
  let host = '';
  let path = '';
  try {
    const u = new URL(url);
    host = u.hostname.replace(/^www\.|^m\./, '').toLowerCase();
    path = u.pathname.toLowerCase();
  } catch {
    return null;
  }
  const make = (platform: LinkPreview['platform'], platformName: string, kind: LinkKind, kindLabel: string): LinkPreview => ({
    url,
    platform,
    platformName,
    kind,
    kindLabel,
    title: LINK_TITLES[kind],
    style: kind === 'carousel' || kind === 'text' || kind === 'article' ? 'text' : 'talking',
  });
  if (host.endsWith('tiktok.com')) return make('tiktok', 'TikTok', path.includes('/photo/') ? 'carousel' : 'video', path.includes('/photo/') ? 'Photo carousel' : 'Video');
  if (host.endsWith('instagram.com')) {
    if (path.startsWith('/reel')) return make('instagram', 'Instagram', 'video', 'Reel');
    return make('instagram', 'Instagram', 'carousel', 'Post or carousel');
  }
  if (host.endsWith('youtube.com') || host === 'youtu.be') return make('youtube', 'YouTube', 'video', path.startsWith('/shorts') ? 'Short' : 'Video');
  if (host.endsWith('threads.net') || host.endsWith('threads.com')) return make('threads', 'Threads', 'text', 'Text post');
  if (host.endsWith('facebook.com') || host === 'fb.watch') {
    const vid = host === 'fb.watch' || /\/(watch|reel|videos)/.test(path);
    return make('facebook', 'Facebook', vid ? 'video' : 'text', vid ? 'Video' : 'Post');
  }
  if (host === 'x.com' || host.endsWith('twitter.com')) return make('x', 'X', 'text', 'Post');
  return make('web', host, 'article', 'Web page');
}
