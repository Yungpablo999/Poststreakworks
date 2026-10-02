// The mascot's "brain": one shared mood for the whole app, like Duolingo's owl.
//
// - A baseline emotion that follows where you are (writing → laptop, quests →
//   determined, Pro → sunglasses…).
// - Reactions to what you do (check in → happy, schedule → excited, finish the
//   challenge → party…). A reaction shows for a moment with a short line in a
//   speech bubble, then the mascot settles back to the baseline.
// - Always warm: it never guilts you for missing a day.
//
// Plain TypeScript so anything (screens, data, sheets) can call react().

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { isTourActive } from '../tour/tour';

export type Emotion =
  | 'wave'
  | 'happy'
  | 'excited'
  | 'party'
  | 'love'
  | 'cool'
  | 'thinking'
  | 'idea'
  | 'working'
  | 'determined'
  | 'sleepy'
  | 'calm';

export type MascotEvent =
  | 'hello'
  | 'welcomeBack'
  | 'tap'
  | 'checkIn'
  | 'thinking'
  | 'ideaReady'
  | 'scheduled'
  | 'posted'
  | 'saved'
  | 'repurposed'
  | 'hookSaved'
  | 'celebrate'
  | 'challengeDone'
  | 'pro'
  | 'questStart'
  | 'copied'
  | 'connected'
  | 'oops'
  | 'lastStep'
  | 'allCaughtUp';

type Reaction = { emotion: Emotion; lines: string[]; hold: number; burst?: boolean };

const REACTIONS: Record<MascotEvent, Reaction> = {
  hello: { emotion: 'wave', hold: 3200, lines: ['Hey! Ready to make something today?', 'Hi! Let’s make a post you’re proud of.', 'Hey you! Got an idea brewing?'] },
  welcomeBack: { emotion: 'wave', hold: 3600, lines: ['Welcome back! Good to see you.', 'Hey, you’re back! Let’s pick up where you left off.'] },
  tap: {
    emotion: 'happy',
    hold: 2200,
    lines: [
      'Hehe, that tickles!',
      'One post at a time. You’ve got this.',
      'Need an idea? Ask Jarvis!',
      'Small steps add up fast.',
      'I’m here if you get stuck.',
      'Post what you’d want to watch.',
    ],
  },
  checkIn: { emotion: 'happy', hold: 2800, burst: true, lines: ['Checked in! Nice to see you today.', 'Done for today. Easy win!'] },
  thinking: { emotion: 'thinking', hold: 1600, lines: ['Hmm, let me think…', 'Cooking up some ideas…'] },
  ideaReady: { emotion: 'idea', hold: 2800, lines: ['Ooh, I like this one!', 'Here’s a good one for you.'] },
  scheduled: { emotion: 'excited', hold: 3000, burst: true, lines: ['Scheduled! It goes out right on time.', 'Locked in. Your audience will love it!'] },
  posted: { emotion: 'party', hold: 3200, burst: true, lines: ['It’s live! So proud of you.', 'Posted! That’s how it’s done.'] },
  saved: { emotion: 'happy', hold: 2400, lines: ['Saved for later. Smart move.', 'Safe and sound in your drafts.'] },
  repurposed: { emotion: 'excited', hold: 3000, burst: true, lines: ['One post, every platform. Boom!', 'Look at all those versions!'] },
  hookSaved: { emotion: 'love', hold: 2400, lines: ['Ooh, good pick. Saved!', 'That one’s a keeper.'] },
  celebrate: { emotion: 'party', hold: 3400, burst: true, lines: ['Woohoo! Look at you go!', 'Yes! Another win!'] },
  challengeDone: { emotion: 'party', hold: 3600, burst: true, lines: ['Challenge done! You showed up all week.', 'You did it! Badge earned.'] },
  pro: { emotion: 'cool', hold: 3400, burst: true, lines: ['Welcome to Pro. Let’s go big.', 'Pro unlocked. Looking good!'] },
  questStart: { emotion: 'determined', hold: 2600, lines: ['Let’s do this!', 'Quest on. I believe in you.'] },
  copied: { emotion: 'happy', hold: 1800, lines: ['Copied! Paste it anywhere.'] },
  connected: { emotion: 'excited', hold: 2600, burst: true, lines: ['Connected! I’ll keep an eye on your numbers.', 'Yes! Now I can learn what works for you.'] },
  oops: { emotion: 'thinking', hold: 2600, lines: ['Hmm, almost. One more thing first.', 'Not quite yet. Let’s fix that.'] },
  lastStep: { emotion: 'determined', hold: 2600, lines: ['Last step! Nearly there.', 'One more and you’re in!'] },
  allCaughtUp: { emotion: 'calm', hold: 2000, lines: ['All caught up. Nice!'] },
};

type State = { emotion: Emotion; line: string | null; seq: number; burst: number; baseline: Emotion };

let state: State = { emotion: 'calm', line: null, seq: 0, burst: 0, baseline: 'calm' };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let revert: ReturnType<typeof setTimeout> | null = null;
let hideLine: ReturnType<typeof setTimeout> | null = null;
const lastLine: Partial<Record<MascotEvent, number>> = {};

function set(next: Partial<State>) {
  state = { ...state, ...next };
  emit();
}

function timeHello(): string | null {
  const h = new Date().getHours();
  if (h < 5) return 'Up late? Let’s make it count.';
  if (h < 12) return 'Good morning! Fresh day, fresh post?';
  if (h < 18) return 'Good afternoon! Got a minute to create?';
  return 'Good evening! Perfect time to post.';
}

/** React to something the creator did. */
export function react(event: MascotEvent) {
  wake();
  const r = REACTIONS[event];
  // Don't repeat the same line twice in a row
  let i = Math.floor(Math.random() * r.lines.length);
  if (r.lines.length > 1 && i === lastLine[event]) i = (i + 1) % r.lines.length;
  lastLine[event] = i;
  const line = event === 'hello' && Math.random() < 0.6 ? timeHello() ?? r.lines[i] : r.lines[i];
  set({ emotion: r.emotion, line, seq: state.seq + 1, burst: r.burst ? state.burst + 1 : state.burst });
  if (revert) clearTimeout(revert);
  if (hideLine) clearTimeout(hideLine);
  hideLine = setTimeout(() => set({ line: null }), Math.max(2400, r.hold + 400));
  revert = setTimeout(() => set({ emotion: state.baseline }), r.hold);
}

/** The resting emotion for where the creator is (no line, no hop). */
export function setBaseline(emotion: Emotion) {
  if (state.baseline === emotion) return;
  const reacting = state.emotion !== state.baseline;
  set({ baseline: emotion, emotion: reacting ? state.emotion : emotion });
}

/** Say something without changing the mood (e.g. a tip). */
export function say(line: string, ms = 3200) {
  wake();
  if (hideLine) clearTimeout(hideLine);
  set({ line, seq: state.seq + 1 });
  hideLine = setTimeout(() => set({ line: null }), ms);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const get = () => state;

export function useMascot() {
  return useSyncExternalStore(subscribe, get, get);
}

// ─── Napping ────────────────────────────────────────────────────────────────
// Leave the app alone for a while and the mascot dozes off; any activity wakes
// it with a little "I’m up!". Gentle, never a nag.
const NAP_AFTER = 75_000;
let napTimer: ReturnType<typeof setTimeout> | null = null;
let napping = false;
function scheduleNap() {
  if (napTimer) clearTimeout(napTimer);
  napTimer = setTimeout(() => {
    napping = true;
    set({ emotion: 'sleepy', line: null });
  }, NAP_AFTER);
}
function wake() {
  if (napping) {
    napping = false;
    set({ emotion: state.baseline });
  }
  scheduleNap();
}
/** Call on any user activity (touch, click, typing) */
export function activity() {
  const was = napping;
  wake();
  if (was) {
    set({ emotion: 'wave', line: 'Oh! I’m up, I’m up.', seq: state.seq + 1 });
    if (revert) clearTimeout(revert);
    if (hideLine) clearTimeout(hideLine);
    revert = setTimeout(() => set({ emotion: state.baseline }), 1800);
    hideLine = setTimeout(() => set({ line: null }), 2400);
  }
}

// ─── First-visit tips ───────────────────────────────────────────────────────
// The first time someone opens a page, the mascot points out what to do.
// Each tip shows once (for this session until there's a backend).
const tipsSeen = new Set<string>();
export function tipOnce(key: string, line: string, delay = 900) {
  if (tipsSeen.has(key)) return;
  tipsSeen.add(key);
  setTimeout(() => {
    // Not during the welcome tour; it shows next time instead
    if (isTourActive()) return tipsSeen.delete(key);
    express('happy', line, 4200);
  }, delay);
}

// ─── Loading ────────────────────────────────────────────────────────────────
/** While `busy` is true the mascot thinks; when it finishes, it lights up. */
export function useMascotThinking(busy: boolean, readyEvent: MascotEvent = 'ideaReady') {
  const was = useRef(false);
  useEffect(() => {
    if (busy && !was.current) react('thinking');
    if (!busy && was.current) react(readyEvent);
    was.current = busy;
  }, [busy, readyEvent]);
}

/** A one-off reaction with its own line (e.g. reacting to the topic you picked). */
export function express(emotion: Emotion, line: string, hold = 2600, burst = false) {
  wake();
  set({ emotion, line, seq: state.seq + 1, burst: burst ? state.burst + 1 : state.burst });
  if (revert) clearTimeout(revert);
  if (hideLine) clearTimeout(hideLine);
  revert = setTimeout(() => set({ emotion: state.baseline }), hold);
  hideLine = setTimeout(() => set({ line: null }), hold + 400);
}
