// Ghost's welcome tour, for brand-new free creators right after sign-up.
// Ghost spotlights the real parts of the screen one by one, explains each in
// a line or two, and lets you try a couple of them (check in, tap Ghost).
// Skip any time.
//
// Parts of the screen take part by wrapping themselves in <TourTarget id=…>.
// Steps whose part isn't on screen (e.g. the side menu on a phone) are left
// out, so the same tour fits desktop, tablet, phone web and the phone app.

import { useSyncExternalStore } from 'react';
import type { View } from 'react-native';
import type { Emotion } from '../mascot/mascot';

export type TourTargetId =
  | 'first-post' | 'check-in' | 'nav' | 'menu-button' | 'tab-bar' | 'studios' | 'ask-jarvis' | 'bell' | 'ghost' | 'home-ghost'
  | 'create-idea' | 'quest-card' | 'growth-card' | 'schedule-card';

/** Parts that sit inside the page (scroll them into view); the rest are fixed bars and menus */
export const IN_PAGE: TourTargetId[] = ['first-post', 'check-in', 'home-ghost', 'create-idea', 'quest-card', 'growth-card', 'schedule-card'];

/** The main pages the tour visits */
export type TourPage = 'dashboard' | 'create' | 'quests' | 'growth' | 'schedule';

export interface TourStep {
  key: string;
  /** The page this step is on (Ghost takes you there) */
  page: TourPage;
  /** On other pages the step always shows (centred if its part isn't there) */
  always?: boolean;
  /** Spotlight the first of these that's on screen; none = a card in the middle */
  targets?: TourTargetId[];
  emotion: Emotion;
  title: string;
  body: string;
  /** Different words depending on which target is showing */
  bodyFor?: Partial<Record<TourTargetId, string>>;
  /** You can tap the real thing; doing so moves the tour on */
  tryIt?: { hint: string; done: string; doneEmotion: Emotion };
}

export const TOUR_STEPS: TourStep[] = [
  {
    key: 'hello',
    page: 'dashboard',
    emotion: 'wave',
    title: 'Hi, I’m Ghost!',
    body: 'I’ll be your buddy here. Want me to show you around? It takes about a minute.',
  },
  {
    key: 'first-post',
    page: 'dashboard',
    targets: ['first-post'],
    emotion: 'idea',
    title: 'Every post starts here',
    body: 'When you’re ready, tap this. Jarvis helps with the idea, the caption and a good time to post.',
  },
  {
    key: 'check-in',
    page: 'dashboard',
    targets: ['check-in'],
    emotion: 'determined',
    title: 'Check in once a day',
    body: 'It builds a gentle habit. Missed a day? No stress, just pick up again.',
    tryIt: { hint: 'Go on, tap Check in for today!', done: 'Nice! That’s day one done.', doneEmotion: 'party' },
  },
  {
    key: 'nav',
    page: 'dashboard',
    targets: ['nav', 'tab-bar', 'menu-button'],
    emotion: 'happy',
    title: 'Find your way around',
    body: 'Home, Create, Quests and Growth live here. Let me show you each one.',
    bodyFor: {
      'menu-button': 'Tap here any time for Create, Quests, Growth and the studios. Let me show you each one.',
      'tab-bar': 'Home, Create, Quests and Growth are always down here. Let me show you each one.',
    },
  },
  {
    key: 'create',
    page: 'create',
    always: true,
    targets: ['create-idea'],
    emotion: 'idea',
    title: 'Create: ideas made for you',
    body: 'Jarvis picks ideas that fit what you make. Tap Another for a fresh one, or use it to start your post.',
  },
  {
    key: 'quests',
    page: 'quests',
    always: true,
    targets: ['quest-card'],
    emotion: 'determined',
    title: 'Quests: small goals',
    body: 'Little goals that keep you going. Finish one to earn XP and badges.',
  },
  {
    key: 'growth',
    page: 'growth',
    always: true,
    targets: ['growth-card'],
    emotion: 'happy',
    title: 'Growth: see what works',
    body: 'Connect your accounts and I’ll show you which posts people loved, so you can make more like them.',
  },
  {
    key: 'schedule',
    page: 'schedule',
    always: true,
    targets: ['schedule-card'],
    emotion: 'calm',
    title: 'Schedule: plan ahead',
    body: 'Pick a time and your post lines up here. I’ll remind you when it’s time.',
  },
  {
    key: 'studios',
    page: 'schedule',
    targets: ['studios'],
    emotion: 'working',
    title: 'More studios',
    body: 'Turn one video into posts for every platform with Repurpose, and find strong first lines in Hook Studio.',
  },
  {
    key: 'jarvis',
    page: 'schedule',
    always: true,
    targets: ['ask-jarvis'],
    emotion: 'cool',
    title: 'Ask Jarvis anything',
    body: 'Jarvis is the brains. Ask for ideas or captions, and he sends me off to do the jobs for you.',
  },
  {
    key: 'bell',
    page: 'dashboard',
    targets: ['bell'],
    emotion: 'calm',
    title: 'News and nudges',
    body: 'When something needs you, it shows up here. Never spammy, promise.',
  },
  {
    key: 'ghost',
    page: 'dashboard',
    targets: ['ghost', 'home-ghost'],
    emotion: 'love',
    title: 'And that’s me!',
    body: 'I’ll cheer you on and point things out as you go.',
    tryIt: { hint: 'Tap me to say hi!', done: 'Hehe, hi back!', doneEmotion: 'happy' },
  },
  {
    key: 'done',
    page: 'dashboard',
    emotion: 'party',
    title: 'You’re all set!',
    body: 'That’s the tour. Let’s make your first post together.',
  },
];

// ─── Targets on screen ──────────────────────────────────────────────────────
const targets = new Map<TourTargetId, View>();
export function registerTourTarget(id: TourTargetId, view: View) {
  targets.set(id, view);
}
/** Only forgets it if it's still the same one (another copy may have taken over) */
export function unregisterTourTarget(id: TourTargetId, view: View) {
  if (targets.get(id) === view) targets.delete(id);
}
export function getTourTarget(id: TourTargetId) {
  return targets.get(id) ?? null;
}

// ─── Getting around ─────────────────────────────────────────────────────────
// App.tsx says how to open a page; pages say how to scroll themselves
let navigator: ((page: TourPage) => void) | null = null;
export function setTourNavigator(fn: typeof navigator) {
  navigator = fn;
}
export function goToTourPage(page: TourPage) {
  navigator?.(page);
}
type Scroller = {
  scrollBy: (dy: number) => void;
  /** Where the page's scroll area sits on screen (top and bottom, in window points) */
  viewport: (cb: (top: number, bottom: number) => void) => void;
};
let scrollers: Scroller[] = [];
export function registerTourScroller(s: Scroller) {
  scrollers = [...scrollers, s];
}
export function unregisterTourScroller(s: Scroller) {
  scrollers = scrollers.filter((x) => x !== s);
}
/** The page that's showing now (the most recently opened one) */
export function currentTourScroller(): Scroller | null {
  return scrollers[scrollers.length - 1] ?? null;
}

// ─── State ──────────────────────────────────────────────────────────────────
type TourState = { active: boolean; steps: TourStep[]; index: number; tried: boolean };
let state: TourState = { active: false, steps: [], index: 0, tried: false };
const listeners = new Set<() => void>();
function set(next: Partial<TourState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const get = () => state;
export function useTour() {
  return useSyncExternalStore(subscribe, get, get);
}
export function isTourActive() {
  return state.active;
}

let finishedOnce = false;
/** Start the tour (once per session until there's a backend to remember it) */
export function startTour() {
  if (state.active || finishedOnce) return;
  // Home's steps are checked now; other pages' steps always come along.
  // The studios step only shows where the side menu is (it's on every page).
  const steps = TOUR_STEPS.filter((s) => !s.targets || s.always || s.targets.some((t) => targets.has(t)));
  set({ active: true, steps, index: 0, tried: false });
}
export function nextStep() {
  if (state.index >= state.steps.length - 1) return endTour();
  set({ index: state.index + 1, tried: false });
}
export function prevStep() {
  if (state.index > 0) set({ index: state.index - 1, tried: false });
}
export function endTour() {
  finishedOnce = true;
  set({ active: false, index: 0, tried: false });
}

/** A tour target was tapped: on a "try it" step that counts as doing it */
export function tourTargetTapped(id: TourTargetId) {
  if (!state.active || state.tried) return;
  const step = state.steps[state.index];
  if (!step?.tryIt || !step.targets?.includes(id)) return;
  set({ tried: true });
  setTimeout(() => {
    if (state.active && state.steps[state.index] === step) nextStep();
  }, 1500);
}
