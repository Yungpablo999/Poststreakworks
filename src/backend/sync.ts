import { API_ROUTES } from '../../frontend/shared/constants/apiRoutes';
import type {
  AppPlatform,
  Bootstrap,
  CheckInMonth,
  CheckInResult,
  CheckInSummary,
  ConnectedAccount,
  JarvisChatReply,
  SpendRepurposeResult,
  ToggleHookResult,
} from '../../frontend/shared/types/phase1';
import {
  hasCheckInMonth,
  hydrateCheckIn,
  hydrateCheckInMonth,
  hydrateDrafts,
  hydrateRepurposeUsed,
  hydrateSavedHooks,
  markCheckInDay,
  resetUserData,
  setDataBackend,
  type CheckInStreak,
  type SavedDraft,
  type SavedHook,
} from '../data';
import { setJarvisBrain, type JarvisReply } from '../jarvis/chat';
import { onTipSeen, seedTipsSeen } from '../mascot/mascot';
import { onTourEnded, setTourFinished } from '../tour/tour';
import type { UserProfileData } from '../components/UserProfileModal';
import { BACKEND } from '../config/backend';
import { api, backendReady, type ApiResult } from './api';
import { setAccounts } from './accounts';
import { capabilitiesStore, NO_CAPABILITIES, planStore, unreadStore } from './account';
import { notify } from './notice';

// The glue between the app's in-memory stores (src/data, the tour, the mascot's
// tips, Jarvis's chat) and the API. Screens never call the API themselves: they
// keep calling the same functions as before, and this file
//   - fills the stores from the creator's account when they sign in (hydrate), and
//   - saves each change as it happens (write-through, in order, so two quick
//     changes to the same thing can't arrive swapped).
// A change shows on screen immediately; if saving it fails the creator is told
// and the stores are re-read from the account so the screen stays truthful.

// ─── Saving in order ────────────────────────────────────────────────────────

let tail: Promise<unknown> = Promise.resolve();
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = tail.then(job, job);
  tail = run.catch(() => undefined);
  return run;
}

let loaded = false;
/** Has the account's data been read since sign-in? (false = the app is showing empty stores.) */
export const isDataLoaded = () => loaded;

const SAVE_FAILED = 'Couldn’t save that. Check your connection and try again.';

/** A save failed: tell the creator, then put the stores back in step with their account. */
async function saveFailed(message = SAVE_FAILED): Promise<void> {
  notify(message);
  await reloadSavedWork();
}

// ─── Reading the account ────────────────────────────────────────────────────

export const APP_PLATFORMS: readonly AppPlatform[] = ['tiktok', 'instagram', 'youtube', 'facebook', 'threads', 'x', 'linkedin'];
const isAppPlatform = (p: string | undefined): p is AppPlatform => !!p && (APP_PLATFORMS as readonly string[]).includes(p);

const toStreak = (c: CheckInSummary): CheckInStreak => ({
  currentDays: c.currentDays,
  week: c.week,
  todayIndex: c.todayIndex,
  checkedInToday: c.checkedInToday,
});

/** Everything the app needs at launch, in one call. */
export function loadBootstrap(): Promise<ApiResult<Bootstrap>> {
  return api.get<Bootstrap>(API_ROUTES.ME.BOOTSTRAP);
}

/** Fills the stores from the creator's account. Call after sign-in and after every launch. */
export function applyBootstrap(b: Bootstrap): void {
  hydrateDrafts(
    b.drafts.map((d) => ({
      id: d.id,
      title: d.title,
      kind: d.kind,
      format: d.format,
      platform: d.platform,
      savedAt: d.savedAt,
    })),
  );
  hydrateSavedHooks(b.savedHooks);
  hydrateCheckIn(toStreak(b.checkIn));
  hydrateRepurposeUsed(b.repurpose.usedThisWeek);
  setAccounts(b.accounts);
  capabilitiesStore.set(b.capabilities);
  planStore.set(b.plan);
  unreadStore.set(b.unreadNotifications);
  seedTipsSeen(b.tipsSeen, true);
  setTourFinished(b.tour.done);
  loaded = true;
}

/** Re-reads the lists after a failed save (or on coming back online). */
export async function reloadSavedWork(): Promise<void> {
  const res = await loadBootstrap();
  if (res.ok) applyBootstrap(res.data);
}

/** Signed out: wipe the last creator's data from memory. */
export function clearAccountData(): void {
  resetUserData();
  setAccounts([]);
  capabilitiesStore.set(NO_CAPABILITIES);
  planStore.set(null);
  unreadStore.set(0);
  seedTipsSeen([], true);
  setTourFinished(false);
  loaded = false;
}

// ─── The profile ────────────────────────────────────────────────────────────

// Onboarding picks topics by id ("tech"); the profile sheet lists them by label
// ("Tech & AI"). The server keeps one vocabulary (a lowercase slug of the label),
// and these convert at the edge.
const PROFILE_NICHES = [
  'Lifestyle', 'Tech & AI', 'Comedy & Relatable', 'Storytelling', 'Fitness & Health',
  'Business & Wealth', 'Travel & Vlogs', 'Fashion & Beauty', 'Education',
];
const slug = (label: string) =>
  label.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 31);

export const nicheIds = (labels: string[]): string[] =>
  Array.from(new Set(labels.map(slug).filter((s) => /^[a-z][a-z0-9_-]{1,30}$/.test(s)))).slice(0, 12);

const labelForNiche = (id: string): string =>
  PROFILE_NICHES.find((l) => slug(l) === id) ?? id.charAt(0).toUpperCase() + id.slice(1).replace(/[-_]+/g, ' ');

export const STAGE_1: readonly string[] = ['tiktok', 'instagram', 'youtube', 'facebook', 'threads'];

/** The profile fields that come from the creator's real connected accounts. */
export function connectionsPatch(accounts: ConnectedAccount[]): Pick<UserProfileData, 'connectedPlatforms' | 'tiktokHandle'> {
  const tiktok = accounts.find((a) => a.platform === 'tiktok');
  return {
    // Only real connections count; the sample ones are gone.
    connectedPlatforms: accounts.filter((a) => STAGE_1.includes(a.platform)).map((a) => a.platform),
    tiktokHandle: tiktok?.handle ?? tiktok?.name ?? undefined,
  };
}

/** The profile the app shows, from the creator's account. */
export function profileFromBootstrap(b: Bootstrap, prev: UserProfileData, fallbackName?: string): UserProfileData {
  const p = b.profile;
  const name = p.name || fallbackName || p.email.split('@')[0] || prev.name;
  return {
    ...prev,
    name,
    handle: p.handle ? `@${p.handle}` : '',
    bio: p.bio,
    niche: p.niche,
    niches: p.niches.map(labelForNiche),
    tier: p.tier,
    userPersona: b.persona,
    streakCount: b.checkIn.currentDays,
    level: p.level,
    xp: p.xp,
    postsCount: p.postsCount,
    customAvatarUri: p.avatarUrl ?? undefined,
    ...connectionsPatch(b.accounts),
  };
}

// What the creator picked before an account existed (topics). Signing in with Google or
// Apple on the web leaves the page and comes back, so the picks wait in the tab's
// session storage and are saved once the account is there.
const ONBOARDING_KEY = 'ps.onboarding';
export function rememberOnboarding(niches: string[]): void {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(ONBOARDING_KEY, JSON.stringify({ niches }));
  } catch {
    // private mode: the picks are simply not remembered
  }
}
export function takeOnboarding(): { niches: string[] } | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(ONBOARDING_KEY);
    sessionStorage.removeItem(ONBOARDING_KEY);
    const parsed = raw ? (JSON.parse(raw) as { niches?: unknown }) : null;
    return parsed && Array.isArray(parsed.niches) ? { niches: parsed.niches.filter((n): n is string => typeof n === 'string') } : null;
  } catch {
    return null;
  }
}

// The device's IANA zone ("Africa/Lagos"). Some devices report an offset such as "GMT+01:00"
// instead, which the server would refuse (and refuse the rest of the request with it), so only
// a proper zone name is sent.
const deviceTimezone = (): string | undefined => {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone && (zone === 'UTC' || /^[A-Za-z]+(?:[/_+-][A-Za-z0-9_+-]+)+$/.test(zone)) ? zone : undefined;
  } catch {
    return undefined;
  }
};

/** Saves what the creator picked while signing up, plus the device's time zone (it decides when their day starts). */
export async function saveOnboarding(input: { displayName?: string; niches?: string[]; handle?: string }): Promise<void> {
  const niches = input.niches ? nicheIds(input.niches) : undefined;
  const body = {
    ...(input.displayName ? { displayName: input.displayName.slice(0, 50) } : {}),
    ...(niches?.length ? { niches } : {}),
    ...(input.handle ? { handle: input.handle } : {}),
    ...(deviceTimezone() ? { timezone: deviceTimezone() } : {}),
  };
  if (Object.keys(body).length === 0) return;
  await enqueue(() => api.put(API_ROUTES.USER.ONBOARDING, body));
}

/** Keeps the account's time zone right when the creator travels (or changes their phone's zone). */
export async function syncTimezone(b: Bootstrap): Promise<void> {
  const zone = deviceTimezone();
  if (zone && zone !== b.profile.timezone) await enqueue(() => api.put(API_ROUTES.USER.ONBOARDING, { timezone: zone }));
}

/** The profile sheet's Save: name, @handle, topics and bio. Returns an error message to show, or null. */
export async function saveProfile(next: UserProfileData, prev: UserProfileData): Promise<string | null> {
  const failures: string[] = [];

  const profileBody = {
    ...(next.name !== prev.name && next.name.trim() ? { displayName: next.name.trim().slice(0, 50) } : {}),
    ...(next.bio !== prev.bio ? { bio: next.bio.slice(0, 500) } : {}),
    ...(next.niche !== prev.niche ? { niche: next.niche.slice(0, 100) } : {}),
  };
  if (Object.keys(profileBody).length > 0) {
    const res = await enqueue(() => api.put(API_ROUTES.USER.UPDATE_PROFILE, profileBody));
    if (!res.ok) failures.push('Couldn’t save your profile.');
  }

  const onboardingBody = {
    ...(next.niches.join('|') !== prev.niches.join('|') ? { niches: nicheIds(next.niches) } : {}),
    ...(next.handle !== prev.handle && /^@?[A-Za-z0-9_]{3,30}$/.test(next.handle) ? { handle: next.handle.replace(/^@/, '') } : {}),
  };
  if (Object.keys(onboardingBody).length > 0) {
    const res = await enqueue(() => api.put(API_ROUTES.USER.ONBOARDING, onboardingBody));
    if (!res.ok) failures.push(res.status === 409 ? 'That @handle is already taken.' : 'Couldn’t save your topics.');
  }
  return failures[0] ?? null;
}

// ─── Saving as it happens ───────────────────────────────────────────────────

// Draft ids are the app's own text ("jarvis-My morning reset"); the server takes up to 160 characters.
const serverKey = (id: string): string => {
  if (id.length <= 160) return id;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 31) + id.charCodeAt(i)) | 0;
  return `${id.slice(0, 140)}~${(h >>> 0).toString(36)}`;
};

const HOOK_STYLES = ['talking', 'dance', 'skit', 'text'];

function writeThrough() {
  setDataBackend({
    draftSaved: (d: SavedDraft) => {
      if (!backendReady()) return;
      void enqueue(async () => {
        const res = await api.put(API_ROUTES.DRAFTS.ITEM(serverKey(d.id)), {
          title: d.title.trim().slice(0, 300) || 'Untitled',
          kind: d.kind,
          format: d.format.slice(0, 80),
          ...(isAppPlatform(d.platform) ? { platform: d.platform } : {}),
        });
        if (!res.ok) await saveFailed(res.status === 400 ? 'Couldn’t save that draft.' : SAVE_FAILED);
      });
    },
    draftRemoved: (id: string) => {
      if (!backendReady()) return;
      void enqueue(async () => {
        const res = await api.delete(API_ROUTES.DRAFTS.ITEM(serverKey(id)));
        if (!res.ok) await saveFailed();
      });
    },
    hookToggled: (h: SavedHook, nowSaved: boolean) => {
      if (!backendReady()) return;
      void enqueue(async () => {
        const body = {
          line: h.line.slice(0, 500),
          style: HOOK_STYLES.includes(h.style) ? h.style : 'talking',
          idea: h.idea.slice(0, 300),
        };
        let res = await api.post<ToggleHookResult>(API_ROUTES.HOOKS.TOGGLE, body);
        // The server flips whatever it has. If it already agreed with this device before the tap, flip it back.
        if (res.ok && res.data.saved !== nowSaved) res = await api.post<ToggleHookResult>(API_ROUTES.HOOKS.TOGGLE, body);
        if (!res.ok) await saveFailed(res.status === 400 ? res.message : SAVE_FAILED);
      });
    },
    checkedIn: () => {
      if (!backendReady()) return;
      void enqueue(async () => {
        const res = await api.post<CheckInResult>(API_ROUTES.CHECK_INS.CHECK_IN);
        if (res.ok) {
          markCheckInDay(res.data.summary.localDate); // keep the calendar's loaded month in step
          hydrateCheckIn(toStreak(res.data.summary)); // the server's count, in the creator's own day
        } else {
          await saveFailed();
        }
      });
    },
    repurposeSpent: () => {
      if (!backendReady()) return;
      void enqueue(async () => {
        const res = await api.post<SpendRepurposeResult>(API_ROUTES.REPURPOSE.SPEND);
        if (res.ok) hydrateRepurposeUsed(res.data.usedThisWeek); // the server enforces the limit
        else await saveFailed();
      });
    },
  });

  onTipSeen((key) => {
    if (!backendReady() || !/^[a-z0-9][a-z0-9:_-]{0,59}$/.test(key)) return;
    void enqueue(() => api.post(API_ROUTES.USER.TIP_SEEN, { key }));
  });
  onTourEnded(() => {
    if (!backendReady()) return;
    void enqueue(() => api.post(API_ROUTES.USER.TOUR_DONE));
  });
}

// ─── Jarvis ─────────────────────────────────────────────────────────────────

function jarvisBrain() {
  setJarvisBrain(async (req): Promise<JarvisReply | null> => {
    if (!backendReady()) return null;
    const res = await api.post<JarvisChatReply>(API_ROUTES.JARVIS.CHAT, {
      message: req.message.slice(0, 600),
      history: req.history.map((m) => ({ from: m.from, text: m.text.slice(0, 900) })),
      context: {
        persona: req.context.persona,
        niches: req.context.niches.slice(0, 12).map((n) => n.slice(0, 40)),
        platforms: req.context.platforms.slice(0, 8).map((p) => p.slice(0, 20)),
        ...(req.context.lastTopic ? { lastTopic: req.context.lastTopic.slice(0, 120) } : {}),
      },
    });
    if (res.ok) {
      // The server's own AI was unavailable and it sent a stand-in ("having trouble…"): the
      // built-in replies are more useful than an apology, so let them answer instead.
      if (res.data.degraded) return null;
      const { text, ideas, caption, list, tasks, chips } = res.data;
      return { text, ideas, caption, list, tasks, chips };
    }
    if (res.status === 429) return { text: 'I need a short break. Ask me again in a minute.', chips: ['Give me post ideas'] };
    if (res.status === 402 || res.code === 'UPGRADE_REQUIRED') {
      return { text: 'You’ve used today’s chats with me. They come back tomorrow, or Pro gives you more.', chips: ['Show me Pro'] };
    }
    return null; // can't reach the server: the built-in brain answers
  });
}

// ─── Calendar ───────────────────────────────────────────────────────────────

/** Loads which days of a month the creator checked in (for the calendar's past days). Once per month. */
export async function loadCheckInMonth(year: number, month: number): Promise<void> {
  if (!backendReady() || hasCheckInMonth(year, month)) return;
  const res = await api.get<CheckInMonth>(API_ROUTES.CHECK_INS.MONTH(year, month));
  if (res.ok) hydrateCheckInMonth(year, month, res.data.days);
}

// ─── Start-up ───────────────────────────────────────────────────────────────

let wired = false;
/** Connects the app's stores to the API. Safe to call more than once; does nothing without a backend. */
export function connectBackend(): void {
  if (!BACKEND.enabled || wired) return;
  wired = true;
  writeThrough();
  jarvisBrain();
}
