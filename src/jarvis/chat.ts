// Jarvis chat: you ask Jarvis (the brains), and when there's a job to do he
// hands it to Ghost (the mascot), who goes and does it in the app.
//
// Jarvis answers from the real backend (POST /api/agent, streamed; see src/api/ai.ts).
// Ghost's jobs (copy, start a post, open a page) are offered next to the answer.
//
// Plain TypeScript store so the launcher, the panel and App.tsx share it.

import { useSyncExternalStore } from 'react';
import * as Clipboard from 'expo-clipboard';
import { checkInToday, saveDraft, type FeedIdea, type Persona } from '../data';
import { AI_MESSAGES, askJarvis, describeAiError, isSignedOutError, type AgentTurn } from '../api/ai';
import { express, react } from '../mascot/mascot';

// ─── Ghost's jobs ───────────────────────────────────────────────────────────
/** Pages Ghost can take you to. App.tsx decides how to get there. */
export type GhostPlace =
  | 'create'
  | 'schedule'
  | 'growth'
  | 'repurpose'
  | 'hook-studio'
  | 'voice-studio'
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

/** Bumps on reset so an answer that arrives after "start over" is dropped */
let run = 0;
let lastQuestion: string | null = null;
const RETRY = 'Try again';

/** The conversation so far as the agent route wants it (the intro isn't part of it) */
function historyForAgent(): AgentTurn[] {
  return state.messages
    .filter((m) => m.id !== INTRO.id && m.text.trim())
    .map((m) => ({ role: m.from === 'me' ? ('user' as const) : ('assistant' as const), content: m.text }));
}

export function ask(raw: string) {
  let q = raw.trim();
  if (q === RETRY && lastQuestion) q = lastQuestion;
  if (!q || state.thinking) return;
  lastQuestion = q;
  const history = historyForAgent();
  const mine = run;
  const replyId = nid('j');
  let started = false;
  set({ messages: [...state.messages, { id: nid('me'), from: 'me', text: q }], thinking: true });

  const show = (text: string, extra: Partial<ChatMessage> = {}) => {
    if (mine !== run) return;
    const reply: ChatMessage = { id: replyId, from: 'jarvis', text, ...extra };
    const messages = started ? state.messages.map((m) => (m.id === replyId ? reply : m)) : [...state.messages, reply];
    started = true;
    set({ messages, thinking: false });
  };

  askJarvis(q, history, { onText: (t) => show(t) })
    .then((reply) => {
      const topic = topicOf(q);
      if (topic) lastTopic = topic;
      show(reply, { tasks: tasksFor(q, reply), chips: chipsFor(q) });
    })
    .catch((e) => {
      if (mine !== run) return;
      const text = isSignedOutError(e) ? AI_MESSAGES.signedOut : describeAiError(e);
      // Keep what streamed in before the failure; the error goes in its own message
      started = false;
      const keep = state.messages.filter((m) => !(m.id === replyId && !m.text.trim()));
      set({ messages: [...keep, { id: nid('j'), from: 'jarvis', text, chips: [RETRY] }], thinking: false });
    });
}

/** Clear the chat and start over */
export function resetJarvis() {
  run++;
  lastTopic = null;
  lastQuestion = null;
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
        checkInToday(ctx.persona); // the mascot cheers from inside
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

// ─── Jarvis's built-in brain ────────────────────────────────────────────────
const PLACE_NAME: Record<GhostPlace, string> = {
  create: 'Create',
  schedule: 'your Schedule',
  growth: 'Growth',
  repurpose: 'Repurpose',
  'hook-studio': 'Hook Studio',
  'voice-studio': 'Voice Studio',
  quests: 'Quests',
  challenge: 'this week’s challenge',
  'jarvis-pro': 'Pro',
  accounts: 'your accounts',
};

const openTask = (place: GhostPlace, label?: string): GhostTask => ({
  id: nid('t'),
  label: label ?? `Ghost, open ${PLACE_NAME[place]}`,
  done: place === 'accounts' ? 'Opened your accounts' : `Opened ${PLACE_NAME[place]}`,
  job: { kind: 'open', place },
});

/** "ideas about my morning routine" → "my morning routine" */
function topicOf(q: string): string | null {
  const m = q.match(/\b(?:about|on|for|around|re)\s+(.+)$/i);
  const t = (m ? m[1] : '').replace(/[?.!]+$/, '').trim();
  if (!t || /^(me|it|this|that|today|tiktok|instagram|youtube)$/i.test(t)) return null;
  return t;
}

const has = (q: string, re: RegExp) => re.test(q);

export function ideaTasks(idea: FeedIdea): GhostTask[] {
  return [
    { id: `${idea.id}-make`, label: 'Ghost, start this post', done: 'Your post is ready to edit', job: { kind: 'compose', title: idea.title } },
    { id: `${idea.id}-save`, label: 'Ghost, save it to drafts', done: 'Saved to your drafts', job: { kind: 'draft', title: idea.title, format: idea.format } },
  ];
}

const titleCase = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * Ghost's jobs that fit this question and answer. The answer text comes from Jarvis; these are the
 * buttons next to it: copy it, start a post from it, or open the page it talks about.
 */
export function tasksFor(question: string, reply: string): GhostTask[] {
  const l = question.toLowerCase();
  const tasks: GhostTask[] = [];
  const wroteSomething = has(l, /caption|hook|first line|opening|thread|write|rewrite|funnier|shorter/);
  if (wroteSomething && reply.trim()) {
    tasks.push({ id: nid('t'), label: 'Ghost, copy it', done: 'Copied. Paste it anywhere', job: { kind: 'copy', text: reply.trim() } });
    const topic = topicOf(question) ?? lastTopic;
    if (topic) {
      tasks.push({ id: nid('t'), label: 'Ghost, start a post with it', done: 'Your post is ready to edit', job: { kind: 'compose', title: titleCase(topic) } });
    }
  }
  if (has(l, /check(ed)?( me)?[ -]?in\b|streak/)) {
    tasks.push({ id: nid('t'), label: 'Ghost, check me in for today', done: 'Checked in for today', job: { kind: 'checkIn' } });
  }
  if (has(l, /\bhooks?\b|first line|opening/)) tasks.push(openTask('hook-studio', 'Ghost, open Hook Studio for more'));
  if (has(l, /schedul|calendar|best time|when (should|do|can) i post|plan (my|the|this) week/)) tasks.push(openTask('schedule', 'Ghost, open my schedule'));
  if (has(l, /repurpose|other platforms|cross ?post/)) tasks.push(openTask('repurpose'));
  if (has(l, /grow|followers|views|reach|analytics|algorithm|viral/)) tasks.push(openTask('growth', 'Ghost, show my growth'));
  if (has(l, /voice|narrat|read (it )?(out|aloud)/)) tasks.push(openTask('voice-studio'));
  if (has(l, /challenge|quest|badge/)) tasks.push(openTask('quests', 'Ghost, open Quests'));
  if (has(l, /draft/)) tasks.push(openTask('create', 'Ghost, open my drafts'));
  if (has(l, /connect|accounts?/)) tasks.push(openTask('accounts', 'Ghost, connect my accounts'));
  return tasks.slice(0, 3);
}

/** Follow-up questions to tap under an answer */
export function chipsFor(question: string): string[] {
  const l = question.toLowerCase();
  if (has(l, /caption/)) return ['Make it funnier', 'Give me hooks'];
  if (has(l, /hook|first line|opening/)) return ['Write a caption for it'];
  if (has(l, /idea|what (should|do|can) i post|stuck/)) return ['Write a caption for it', 'Give me hooks', 'More ideas'];
  return ['Give me post ideas', 'Give me hooks'];
}
