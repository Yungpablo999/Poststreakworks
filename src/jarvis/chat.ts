// Jarvis chat: you ask Jarvis (the brains), and when there's a job to do he
// hands it to Ghost (the mascot), who goes and does it in the app.
//
// For now Jarvis answers with built-in replies (no AI service yet). Swap
// `think()` for a real AI call later; everything else stays the same.
//
// Plain TypeScript store so the launcher, the panel and App.tsx share it.

import { useSyncExternalStore } from 'react';
import * as Clipboard from 'expo-clipboard';
import { checkInToday, getGoalCaption, getIdeaFeed, getTopicIdeas, saveDraft, type FeedIdea, type Persona } from '../data';
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

// Jarvis's real brain. When the app is connected to the backend (src/backend)
// this asks the server, which answers with the same reply shape. It returns null
// when the server can't be reached, and the built-in brain below answers instead,
// so the chat always works.
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

  if (brain) {
    brain({ message: q, history, context: { ...ctx, lastTopic: lastTopic ?? undefined } })
      .catch(() => null)
      .then((reply) => {
        if (token !== askToken) return; // the chat was cleared while Jarvis was thinking
        const message: ChatMessage = reply ? { id: nid('j'), from: 'jarvis', ...reply } : think(q);
        set({ messages: [...state.messages, message], thinking: false });
      });
    return;
  }

  // A short pause so it reads like Jarvis is thinking
  setTimeout(() => {
    const reply = think(q);
    set({ messages: [...state.messages, reply], thinking: false });
  }, 650 + Math.min(600, q.length * 8));
}

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

// ─── Jarvis's built-in brain ────────────────────────────────────────────────
const PLACE_NAME: Record<GhostPlace, string> = {
  create: 'Create',
  schedule: 'your Schedule',
  growth: 'Growth',
  repurpose: 'Repurpose',
  'hook-studio': 'Hook Studio',
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

let ideaRound = 0;
let ideaKey = '';
function ideasReply(topic: string | null): ChatMessage {
  // Asking again about the same thing gives fresh ideas
  const key = topic ?? '';
  ideaRound = key === ideaKey ? ideaRound + 1 : 0;
  ideaKey = key;
  const ideas = topic
    ? getTopicIdeas(topic, 'often', '30-second Reel', ideaRound).slice(0, 3)
    : getIdeaFeed(ctx.niches, 'often', ctx.platforms).slice(ideaRound * 3 % 6, ideaRound * 3 % 6 + 3);
  if (topic) lastTopic = topic;
  return {
    id: nid('j'),
    from: 'jarvis',
    text: topic ? `Here are 3 ideas about ${topic}. Pick one and Ghost will set it up.` : 'Here are 3 ideas that fit what you make. Pick one and Ghost will set it up.',
    ideas,
    tasks: [],
    chips: ['Write a caption for it', 'Give me hooks', 'More ideas'],
  };
}

export function ideaTasks(idea: FeedIdea): GhostTask[] {
  return [
    { id: `${idea.id}-make`, label: 'Ghost, start this post', done: 'Your post is ready to edit', job: { kind: 'compose', title: idea.title } },
    { id: `${idea.id}-save`, label: 'Ghost, save it to drafts', done: 'Saved to your drafts', job: { kind: 'draft', title: idea.title, format: idea.format } },
  ];
}

function think(q: string): ChatMessage {
  const l = q.toLowerCase();
  const j = (text: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({ id: nid('j'), from: 'jarvis', text, ...extra });

  if (has(l, /^(hi|hey|hello|yo|sup|hiya|good (morning|afternoon|evening))\b/)) {
    return j('Hey! What are you thinking of posting? Tell me a topic and I’ll come up with ideas.', { chips: START_CHIPS });
  }
  if (has(l, /\b(thank|thanks|thx|cheers)\b/)) {
    return j('Any time! Ghost and I are here whenever you need us.', { chips: ['Give me post ideas', 'When should I post?'] });
  }
  if (has(l, /check(ed)?[ -]?in|streak/)) {
    return j('Want Ghost to check you in for today? It only takes a tap.', {
      tasks: [{ id: nid('t'), label: 'Ghost, check me in for today', done: 'Checked in for today', job: { kind: 'checkIn' } }],
    });
  }
  if (has(l, /caption/)) {
    const topic = topicOf(q) ?? lastTopic ?? 'my morning routine';
    lastTopic = topic;
    const { caption } = getGoalCaption(topic.charAt(0).toUpperCase() + topic.slice(1), 'comments');
    return j(`Here’s a caption for “${topic}”. It ends on a question, so people reply.`, {
      caption,
      tasks: [
        { id: nid('t'), label: 'Ghost, copy the caption', done: 'Copied. Paste it anywhere', job: { kind: 'copy', text: caption } },
        { id: nid('t'), label: 'Ghost, start a post with it', done: 'Your post is ready to edit', job: { kind: 'compose', title: topic.charAt(0).toUpperCase() + topic.slice(1) } },
      ],
      chips: ['Make it funnier', 'Give me hooks'],
    });
  }
  if (has(l, /funnier|funny|shorter|different/) && lastTopic) {
    const { caption } = getGoalCaption(lastTopic.charAt(0).toUpperCase() + lastTopic.slice(1), 'followers');
    return j('Here’s another take, lighter this time.', {
      caption,
      tasks: [{ id: nid('t'), label: 'Ghost, copy the caption', done: 'Copied. Paste it anywhere', job: { kind: 'copy', text: caption } }],
    });
  }
  if (has(l, /hook|first line|opening|intro/)) {
    const topic = topicOf(q) ?? lastTopic ?? 'my morning routine';
    lastTopic = topic;
    const hooks = getTopicIdeas(topic, 'followers').map((i) => i.hook).concat(getTopicIdeas(topic, 'comments').map((i) => i.hook)).slice(0, 4);
    return j(`A few first lines for “${topic}”. Say one in the first 2 seconds, or put it on screen if you don’t talk.`, {
      list: hooks,
      tasks: [openTask('hook-studio', 'Ghost, open Hook Studio for more')],
      chips: ['Write a caption for it'],
    });
  }
  if (has(l, /schedul|calendar|when (should|do|can) i post|best time|what time|plan my week|plan (the|this) week/)) {
    return j('A good place to start is around 7:30 in the morning or evening, when people are on their phones. Three posts a week is plenty to begin with. I’ll learn your best times once your accounts are connected.', {
      tasks: [openTask('schedule', 'Ghost, open my schedule'), openTask('accounts', 'Ghost, connect my accounts')],
      chips: ['Give me post ideas'],
    });
  }
  if (has(l, /repurpose|other platforms|every platform|cross ?post|turn .* into/)) {
    return j('Give me one video and I’ll turn it into posts for TikTok, Instagram, YouTube and more. Ghost can take you there.', {
      tasks: [openTask('repurpose', 'Ghost, open Repurpose')],
    });
  }
  if (has(l, /grow|followers|views|reach|stats|analytics|numbers|algorithm|viral/)) {
    return j('What helps most:', {
      list: ['Post on a rhythm you can keep, like 3 times a week.', 'Make the first 2 seconds count.', 'Reply to comments in the first hour.', 'Repeat what works. Your Growth page shows what that is.'],
      tasks: [openTask('growth', 'Ghost, show my growth'), openTask('accounts', 'Ghost, connect my accounts')],
      chips: ['Give me post ideas', 'Give me hooks'],
    });
  }
  if (has(l, /challenge|quest|badge/)) {
    return j('This week’s challenge is to post 3 times, any day, any platform, at your own pace.', {
      tasks: [openTask('challenge', 'Ghost, show the challenge'), openTask('quests', 'Ghost, open Quests')],
    });
  }
  if (has(l, /\bpro\b|upgrade|price|pricing|cost|subscription/)) {
    return j('Pro gives you unlimited ideas and Repurpose, and a daily brief from me.', { tasks: [openTask('jarvis-pro', 'Ghost, show me Pro')] });
  }
  if (has(l, /draft/)) {
    return j('Your drafts live on the Create page.', { tasks: [openTask('create', 'Ghost, open my drafts')] });
  }
  if (has(l, /idea|what (should|do|can) i post|post about|content|inspir|stuck|more/)) {
    return ideasReply(has(l, /^more/) ? ideaKey || null : topicOf(q));
  }
  // Anything short is probably a topic: give ideas for it
  if (q.split(/\s+/).length <= 6) return ideasReply(q.replace(/[?.!]+$/, ''));
  return j('I can help with post ideas, captions, hooks, when to post and growing your account. What would you like?', { chips: START_CHIPS });
}
