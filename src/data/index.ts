import { react } from '../mascot/mascot';

// The stores the screens share: the creator's check-ins, Repurpose allowance, calendar, drafts and saved
// hooks. They hold what the server sent (src/backend/sync.ts fills them when the creator signs in) and
// save each change back through `setDataBackend`. Nothing in here is made up.

export type Persona = 'new' | 'returning';

// ---------------------------------------------------------------------------
// Backend connection
// With no backend (the default) everything below lives in memory, as it always
// has. When the app is connected (src/backend), it registers these callbacks so
// every change is also saved to the creator's account, and fills the stores from
// their account at sign-in with the hydrate* functions further down. Screens
// only ever call the functions in this file.
// ---------------------------------------------------------------------------

export interface DataBackend {
  draftSaved?: (draft: SavedDraft) => void;
  draftRemoved?: (id: string) => void;
  /** `nowSaved` is the new state: false = the hook was just removed. */
  hookToggled?: (hook: SavedHook, nowSaved: boolean) => void;
  checkedIn?: () => void;
}

let dataBackend: DataBackend | null = null;
export function setDataBackend(next: DataBackend | null) {
  dataBackend = next;
}

// ---------------------------------------------------------------------------
// Check-in streak
// A gentle daily check-in habit. Missing a day never "breaks" anything in the
// copy: there are no freezes, countdowns or warnings. The server owns the count;
// this holds its last answer so Home, Quests and the calendar agree.
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

let checkIn: CheckInStreak = { currentDays: 0, week: Array(7).fill(false), todayIndex: mondayFirstIndex(new Date()), checkedInToday: false };
const checkInListeners = new Set<() => void>();

export function getCheckInStreak(): CheckInStreak {
  return checkIn;
}

/** The creator taps "Check in": shown at once, then the server's count replaces it (hydrateCheckIn). */
export function checkInToday(): CheckInStreak {
  if (checkIn.checkedInToday) return checkIn;
  const week = [...checkIn.week];
  week[checkIn.todayIndex] = true;
  checkIn = { ...checkIn, week, checkedInToday: true, currentDays: checkIn.currentDays + 1 };
  checkInListeners.forEach((listener) => listener());
  react('checkIn');
  dataBackend?.checkedIn?.();
  return checkIn;
}

export function subscribeToCheckIns(listener: () => void): () => void {
  checkInListeners.add(listener);
  return () => checkInListeners.delete(listener);
}

/** Replaces the check-in state with the creator's real one. */
export function hydrateCheckIn(streak: CheckInStreak): void {
  checkIn = streak;
  checkInListeners.forEach((listener) => listener());
}

/** Days of a month the creator checked in (from the backend), keyed "YYYY-MM". Fills the calendar's past days. */
const checkInMonths = new Map<string, Set<string>>();
export function hydrateCheckInMonth(year: number, month: number, days: string[]): void {
  checkInMonths.set(`${year}-${month}`, new Set(days));
  checkInListeners.forEach((listener) => listener());
}
export function hasCheckInMonth(year: number, month: number): boolean {
  return checkInMonths.has(`${year}-${month}`);
}
/** A check-in just happened on this date (YYYY-MM-DD, the creator's own day): add it to a month that was already loaded. */
export function markCheckInDay(localDate: string): void {
  const [y, m] = localDate.split('-').map(Number);
  checkInMonths.get(`${y}-${m - 1}`)?.add(localDate);
}

// ---------------------------------------------------------------------------
// Repurpose: how many this week, and the plan's weekly limit (null = unlimited).
// Both numbers come from the server, which is also the one that enforces the limit.
// ---------------------------------------------------------------------------

export interface RepurposeAllowance {
  usedThisWeek: number;
  /** null = unlimited (Pro). */
  weeklyLimit: number | null;
}

let repurpose: RepurposeAllowance = { usedThisWeek: 0, weeklyLimit: 1 };
const repurposeListeners = new Set<() => void>();

export function getRepurposeAllowance(): RepurposeAllowance {
  return repurpose;
}

export function subscribeToRepurposes(listener: () => void): () => void {
  repurposeListeners.add(listener);
  return () => repurposeListeners.delete(listener);
}

/** The server's count and limit. */
export function hydrateRepurpose(next: RepurposeAllowance): void {
  repurpose = next;
  repurposeListeners.forEach((l) => l());
}

// ---------------------------------------------------------------------------
// Calendar (the pop-up behind the Home check-in card)
// One month at a time: which days had a check-in, and what was posted or is
// planned. Check-ins come from the check-in store above (so tapping "Check in"
// on Home shows up here straight away); posts come from the creator's schedule
// (hydrateCalendarPosts), nothing is made up.
// ---------------------------------------------------------------------------

export type CalendarPlatform = 'tiktok' | 'instagram' | 'youtube' | 'threads' | 'facebook';

export interface CalendarPost {
  id: string;
  /** The id of the creator's own post (GET /posts/{id}), when PostStreak planned it; absent for one read from an account. */
  postId?: string;
  title: string;
  platform: CalendarPlatform;
  /** When it goes (or went) out, in milliseconds. */
  at: number;
  /** The time of day, e.g. "7:30 PM". */
  time: string;
  /** "ready" = it is time, and the creator needs to post it by hand and confirm. */
  status: 'posted' | 'scheduled' | 'ready' | 'draft';
  /** A link to the live post, when the platform gave one. */
  url?: string;
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

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const clock = (ms: number) => new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** "Today · 7:30 PM", "Tomorrow · 6:00 PM", "Sat, 3 Oct · 7:30 PM" */
export function whenLabel(ms: number, now: number = Date.now()): string {
  const days = Math.round((startOfDay(new Date(ms)).getTime() - startOfDay(new Date(now)).getTime()) / 86_400_000);
  const day = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days === -1 ? 'Yesterday' : new Date(ms).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day} · ${clock(ms)}`;
}

/** The creator's posts by day (YYYY-MM-DD), as the calendar loads them. */
const calendarPosts = new Map<string, CalendarPost[]>();

/**
 * Puts what the server says about [from, to) into the calendar, replacing whatever was shown for
 * that window (a post that was moved or cancelled disappears from where it was).
 */
export function hydrateCalendarPosts(from: number, to: number, posts: Omit<CalendarPost, 'time'>[]): void {
  for (const [key, list] of calendarPosts) {
    const kept = list.filter((p) => p.at < from || p.at >= to);
    if (kept.length) calendarPosts.set(key, kept);
    else calendarPosts.delete(key);
  }
  for (const p of posts) {
    const key = dayKey(new Date(p.at));
    calendarPosts.set(key, [...(calendarPosts.get(key) ?? []), { ...p, time: clock(p.at) }].sort((a, b) => a.at - b.at));
  }
  checkInListeners.forEach((listener) => listener());
}

export function getCalendarMonth(year: number, month: number): CalendarMonth {
  const today = startOfDay(new Date());
  const first = new Date(year, month, 1);
  const daysCount = new Date(year, month + 1, 0).getDate();
  const startOffset = mondayFirstIndex(first);
  const realDays = checkInMonths.get(`${year}-${month}`);

  const days: CalendarDay[] = [];
  for (let d = 1; d <= daysCount; d++) {
    const date = new Date(year, month, d);
    const diff = Math.round((date.getTime() - today.getTime()) / 86400000); // days from today
    const isToday = diff === 0;
    const key = dayKey(date);
    days.push({
      key,
      day: d,
      isToday,
      isPast: diff < 0,
      checkedIn: isToday ? checkIn.checkedInToday : realDays ? realDays.has(key) : false,
      posts: calendarPosts.get(key) ?? [],
    });
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
}

export function getWeekSchedule(): WeekSchedule {
  const today = startOfDay(new Date());
  const todayIndex = mondayFirstIndex(today);
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - todayIndex);
  const cache: Record<string, CalendarMonth> = {};
  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (!cache[k]) cache[k] = getCalendarMonth(d.getFullYear(), d.getMonth());
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
  };
}

// ---------------------------------------------------------------------------
// Film-it plan (short video filmed inside TikTok / Reels / Shorts)
// Trending sounds and filters only exist inside those apps, so PostStreak
// plans the post and hands off. PostStreak doesn't name sounds: what is trending on
// a platform isn't open data, and some trending sounds aren't licensed for
// business accounts, so the plan says how to choose and the creator searches in the app.
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
        soundTip: 'Choose one that is still climbing. A sound reaches the most people in its first days.',
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

// ---------------------------------------------------------------------------
// Ideas: the goal a creator picks, and the niche names. The ideas themselves come from the server
// (src/backend/ideas.ts).
// ---------------------------------------------------------------------------

export type IdeaGoal = 'followers' | 'saves' | 'comments' | 'often';

/** An idea from the server. */
export type { FeedIdea } from '../../frontend/shared/types/phase1';

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
// Drafts (saved from Script, Caption, Ideas and the post composer, listed on Create)
// Saved to the creator's account as they change (setDataBackend).
// ---------------------------------------------------------------------------

export interface SavedDraft {
  id: string;
  title: string;
  kind: 'script' | 'post';
  /** e.g. "Script", "30-second Reel" */
  format: string;
  /** Platform id when known ('tiktok' | 'instagram' | …) */
  platform?: string;
  /** What the composer (or Script) saved, so the draft opens the way it was left. */
  payload?: Record<string, unknown>;
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
  dataBackend?.draftSaved?.(saved);
  return saved;
}

export function removeDraft(id: string): void {
  draftStore = draftStore.filter((x) => x.id !== id);
  draftListeners.forEach((l) => l());
  dataBackend?.draftRemoved?.(id);
}

/** Replaces the drafts with the creator's saved ones (newest first). */
export function hydrateDrafts(list: SavedDraft[]): void {
  draftStore = [...list].sort((a, b) => b.savedAt - a.savedAt);
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
// Saved hooks (Hook Studio hearts), saved to the creator's account.
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
    const removed = savedHooks.find((x) => x.line === h.line)!;
    savedHooks = savedHooks.filter((x) => x.line !== h.line);
    emitHooks();
    dataBackend?.hookToggled?.(removed, false);
    return false;
  }
  const added = { ...h, savedAt: Date.now() };
  savedHooks = [added, ...savedHooks];
  emitHooks();
  react('hookSaved');
  dataBackend?.hookToggled?.(added, true);
  return true;
}

/** Replaces the saved hooks with the creator's (newest first). */
export function hydrateSavedHooks(list: SavedHook[]): void {
  savedHooks = [...list].sort((a, b) => b.savedAt - a.savedAt);
  emitHooks();
}

/** Signed out: forget everything that belonged to the last creator, back to a clean slate. */
export function resetUserData(): void {
  draftStore = [];
  savedHooks = [];
  checkIn = { currentDays: 0, week: Array(7).fill(false), todayIndex: mondayFirstIndex(new Date()), checkedInToday: false };
  checkInMonths.clear();
  calendarPosts.clear();
  repurpose = { usedThisWeek: 0, weeklyLimit: 1 };
  draftListeners.forEach((l) => l());
  emitHooks();
  checkInListeners.forEach((l) => l());
  repurposeListeners.forEach((l) => l());
}
export function subscribeToSavedHooks(listener: () => void): () => void {
  savedHookListeners.add(listener);
  return () => savedHookListeners.delete(listener);
}

