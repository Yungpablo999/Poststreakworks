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

export type TourTargetId = 'first-post' | 'check-in' | 'nav' | 'menu-button' | 'tab-bar' | 'studios' | 'ask-jarvis' | 'bell' | 'ghost' | 'home-ghost';

export interface TourStep {
  key: string;
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
    emotion: 'wave',
    title: 'Hi, I’m Ghost!',
    body: 'I’ll be your buddy here. Want a quick look around? It takes about a minute.',
  },
  {
    key: 'first-post',
    targets: ['first-post'],
    emotion: 'idea',
    title: 'Every post starts here',
    body: 'When you’re ready, tap this. Jarvis helps with the idea, the caption and a good time to post.',
  },
  {
    key: 'check-in',
    targets: ['check-in'],
    emotion: 'determined',
    title: 'Check in once a day',
    body: 'It builds a gentle habit. Missed a day? No stress, just pick up again.',
    tryIt: { hint: 'Go on, tap Check in for today!', done: 'Nice! That’s day one done.', doneEmotion: 'party' },
  },
  {
    key: 'nav',
    targets: ['nav', 'tab-bar', 'menu-button'],
    emotion: 'happy',
    title: 'Find your way around',
    body: 'Create for new posts, Quests for small weekly goals, and Growth to see how your posts are doing.',
    bodyFor: {
      'menu-button': 'Tap here any time for Create, Quests, Growth and the studios.',
      'tab-bar': 'Home, Create, Quests and Growth are always down here.',
    },
  },
  {
    key: 'studios',
    targets: ['studios'],
    emotion: 'working',
    title: 'Your studios',
    body: 'Plan posts in Schedule, turn one video into posts for every platform with Repurpose, and find strong first lines in Hook Studio.',
  },
  {
    key: 'jarvis',
    targets: ['ask-jarvis'],
    emotion: 'cool',
    title: 'Ask Jarvis anything',
    body: 'Jarvis is the brains. Ask for ideas or captions, and he sends me off to do the jobs for you.',
  },
  {
    key: 'bell',
    targets: ['bell'],
    emotion: 'calm',
    title: 'News and nudges',
    body: 'When something needs you, it shows up here. Never spammy, promise.',
  },
  {
    key: 'ghost',
    targets: ['ghost', 'home-ghost'],
    emotion: 'love',
    title: 'And that’s me!',
    body: 'I’ll cheer you on and point things out as you go.',
    tryIt: { hint: 'Tap me to say hi!', done: 'Hehe, hi back!', doneEmotion: 'happy' },
  },
  {
    key: 'done',
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
  const steps = TOUR_STEPS.filter((s) => !s.targets || s.targets.some((t) => targets.has(t)));
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
