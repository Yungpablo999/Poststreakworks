// Jarvis chat: you ask Jarvis (the brains), and when there's a job to do he
// hands it to Ghost (the mascot), who goes and does it in the app.
//
// Jarvis answers on the server (the "brain" src/backend/sync.ts plugs in). The app has no answers of its
// own: when the server can't be reached it says so, and the launcher is hidden when the server has no AI.
//
// Plain TypeScript store so the launcher, the panel and App.tsx share it.

import { useSyncExternalStore } from 'react';
import * as Clipboard from 'expo-clipboard';
import { checkInToday, saveDraft, type FeedIdea, type Persona } from '../data';
import { express, react } from '../mascot/mascot';

// ─── Ghost's jobs ───────────────────────────────────────────────────────────
/** Pages Ghost can take you to. App.tsx decides how to get there. */
export type GhostPlace =
  | 'create'
  | 'schedule'
  | 'growth'
  | 'repurpose'
  | 'hook-studio'
  | 'quests'
  | 'challenge'
  | 'jarvis-pro'
  | 'accounts';

export type GhostJob =
  | { kind: 'compose'; title: string }
  | { kind: 'draft'; title: string; format: string }
  | { kind: 'open'; place: GhostPlace }
  | { kind: 'copy'; text: string }
  | { kind: 'checkIn' };

export interface GhostTask {
  id: string;
  /** What you tap, e.g. "Ghost, save it to drafts" */
  label: string;
  /** What Ghost says when it's done, e.g. "Saved to your drafts" */
  done: string;
  job: GhostJob;
}

export interface ChatMessage {
  id: string;
  from: 'me' | 'jarvis';
  text: string;
  ideas?: FeedIdea[];
  /** A caption Jarvis wrote, shown in its own box */
  caption?: string;
  /** Short lines shown as a list (hooks, tips) */
  list?: string[];
  tasks?: GhostTask[];
  /** Follow-up questions you can tap to ask */
  chips?: string[];
}

export type TaskStatus = 'idle' | 'working' | 'done';

type ChatState = {
  open: boolean;
  thinking: boolean;
  messages: ChatMessage[];
  tasks: Record<string, TaskStatus>;
};

const START_CHIPS = ['Give me post ideas', 'Write me a caption', 'When should I post?', 'How do I grow?'];

const INTRO: ChatMessage = {
  id: 'intro',
  from: 'jarvis',
  text: 'Hi, I’m Jarvis. Ask me for ideas, captions, hooks or when to post. When there’s a job to do, I’ll send Ghost to do it for you.',
  chips: START_CHIPS,
};

let state: ChatState = { open: false, thinking: false, messages: [INTRO], tasks: {} };
const listeners = new Set<() => void>();
function set(next: Partial<ChatState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const get = () => state;
export function useJarvisChat() {
  return useSyncExternalStore(subscribe, get, get);
}

export function openJarvis(question?: string) {
  set({ open: true });
  if (question) ask(question);
}
export function closeJarvis() {
  set({ open: false });
}

// What Jarvis knows about you (App.tsx keeps it up to date)
let ctx: { persona: Persona; niches: string[]; platforms: string[] } = { persona: 'new', niches: [], platforms: [] };
export function setJarvisContext(next: typeof ctx) {
  ctx = next;
}

// How Ghost gets around the app (App.tsx sets this up)
let hands: { open: (place: GhostPlace) => void; compose: (title: string) => void } | null = null;
export function setGhostHands(h: typeof hands) {
  hands = h;
}

// ─── Asking ─────────────────────────────────────────────────────────────────
let seq = 0;
const nid = (p: string) => `${p}-${Date.now()}-${++seq}`;
let lastTopic: string | null = null;

// Jarvis's brain: the server (src/backend/sync.ts sets it). It returns null when the server can't be
// reached; the chat then says so, and the question can be asked again.
export type JarvisReply = Omit<ChatMessage, 'id' | 'from'>;
export interface JarvisAsk {
  message: string;
  history: { from: 'me' | 'jarvis'; text: string }[];
  context: { persona: Persona; niches: string[]; platforms: string[]; lastTopic?: string };
}
let brain: ((req: JarvisAsk) => Promise<JarvisReply | null>) | null = null;
export function setJarvisBrain(fn: typeof brain) {
  brain = fn;
}

let askToken = 0;

export function ask(raw: string) {
  const q = raw.trim();
  if (!q || state.thinking) return;
  const history = state.messages
    .filter((m) => m.id !== 'intro')
    .slice(-8)
    .map((m) => ({ from: m.from, text: m.text }));
  set({ messages: [...state.messages, { id: nid('me'), from: 'me', text: q }], thinking: true });
  const token = ++askToken;

  const answer = brain ? brain({ message: q, history, context: { ...ctx, lastTopic: lastTopic ?? undefined } }).catch(() => null) : Promise.resolve(null);
  void answer.then((reply) => {
    if (token !== askToken) return; // the chat was cleared while Jarvis was thinking
    if (reply?.ideas?.length) lastTopic = q;
    const message: ChatMessage = reply ? { id: nid('j'), from: 'jarvis', ...reply } : { id: nid('j'), from: 'jarvis', ...UNREACHABLE, chips: [q] };
    set({ messages: [...state.messages, message], thinking: false });
  });
}

const UNREACHABLE: JarvisReply = { text: 'I can’t reach PostStreak right now. Check your connection, then tap your question to ask again.' };

/** Clear the chat and start over */
export function resetJarvis() {
  lastTopic = null;
  askToken++;
  set({ messages: [INTRO], tasks: {}, thinking: false });
}

// ─── Ghost doing a job ──────────────────────────────────────────────────────
export function runTask(task: GhostTask, opts: { closeAfter?: boolean } = {}) {
  if (state.tasks[task.id] && state.tasks[task.id] !== 'idle') return;
  set({ tasks: { ...state.tasks, [task.id]: 'working' } });
  express('working', 'On it!', 1400);
  setTimeout(() => {
    const j = task.job;
    switch (j.kind) {
      case 'draft':
        saveDraft({ id: `jarvis-${j.title}`, title: j.title, kind: 'post', format: j.format });
        react('saved');
        break;
      case 'copy':
        Clipboard.setStringAsync(j.text).catch(() => {});
        react('copied');
        break;
      case 'checkIn':
        checkInToday(); // the mascot cheers from inside
        break;
      case 'compose':
        express('excited', 'Let’s make it!', 2200, true);
        break;
      case 'open':
        express('happy', 'Here you go!', 2000);
        break;
    }
    set({ tasks: { ...state.tasks, [task.id]: 'done' } });
    // Going somewhere: on phones the chat gets out of the way first
    const goes = j.kind === 'compose' || j.kind === 'open';
    if (goes) {
      if (opts.closeAfter) set({ open: false });
      setTimeout(() => {
        if (j.kind === 'compose') hands?.compose(j.title);
        if (j.kind === 'open') hands?.open(j.place);
      }, opts.closeAfter ? 260 : 0);
    }
  }, 900);
}

// ─── Jobs for an idea Jarvis suggested ──────────────────────────────────────
export function ideaTasks(idea: FeedIdea): GhostTask[] {
  return [
    { id: `${idea.id}-make`, label: 'Ghost, start this post', done: 'Your post is ready to edit', job: { kind: 'compose', title: idea.title } },
    { id: `${idea.id}-save`, label: 'Ghost, save it to drafts', done: 'Saved to your drafts', job: { kind: 'draft', title: idea.title, format: idea.format } },
  ];
}
