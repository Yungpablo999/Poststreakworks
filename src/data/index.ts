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

export function getIdeaFeed(niches: string[], goal: IdeaGoal, platforms: string[] = []): FeedIdea[] {
  const list = getStarterIdeas(niches.length ? niches : ['lifestyle'], platforms);
  return list.map((i) => ({ ...i, why: WHY_BY_GOAL[goal] }));
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
