import { ApiError, authFetch as realAuthFetch } from './authFetch';
import type { AuthFetch } from './createAuthFetch';

// Jarvis on the real backend (no UI in here). Same Bearer auth as everything else (src/api/authFetch.ts).
//
//   POST /api/ai/hooks    { topic }               -> { hooks: string[] }      (up to 5, one per style)
//   POST /api/ai/compose  { topic, platform? }    -> { content: string }      (one finished post)
//   POST /api/agent       { message, conversationHistory[] }  -> streamed plain text (the reply)
// (/api/agent/memory needs no app call: the agent route reads and saves the creator's preferences itself.)
//
// The agent route streams text. Where the runtime can't read a stream (older React Native fetch)
// the whole reply is read at once, so callers always get the same final text.

export const AI_MESSAGES = {
  signedOut: 'Your session has expired. Sign in again.',
  network: "Couldn't reach Jarvis. Check your connection and try again.",
  generic: "Jarvis couldn't write that. Try again in a moment.",
  tooMany: 'Jarvis is busy. Try again in a few minutes.',
  noTopic: 'Add a topic first.',
  empty: 'Jarvis sent back an empty answer. Try again.',
} as const;

export interface AiDeps {
  authFetch: AuthFetch;
}
const defaults = (): AiDeps => ({ authFetch: realAuthFetch });

/** Turns anything thrown by these calls into one short sentence for a toast */
export function describeAiError(e: unknown): string {
  if (e instanceof AiInputError) return e.message;
  if (e instanceof ApiError) {
    if (e.status === 401) return AI_MESSAGES.signedOut;
    if (e.status === 429) return AI_MESSAGES.tooMany;
    const body = (e.body ?? {}) as { error?: unknown };
    // The backend words its 400s for people ("Topic required")
    if (e.status === 400 && typeof body.error === 'string' && body.error.trim()) return body.error.trim();
    return AI_MESSAGES.generic;
  }
  if (e instanceof AiEmptyError) return AI_MESSAGES.empty;
  // fetch itself failed (offline, DNS, CORS)
  return AI_MESSAGES.network;
}

export class AiInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiInputError';
  }
}
export class AiEmptyError extends Error {
  constructor() {
    super(AI_MESSAGES.empty);
    this.name = 'AiEmptyError';
  }
}

/** True when the failure is "not signed in" (so a screen can send the creator to sign in) */
export const isSignedOutError = (e: unknown): boolean => e instanceof ApiError && e.status === 401;

async function readJson(res: Response): Promise<unknown> {
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/** The route sometimes returns hooks with numbering or quotes (its fallback splits lines): tidy them */
export function cleanHooks(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const line = item
      .trim()
      .replace(/^[\s\-*•\d.)]+/, '')
      .replace(/^["“]+|["”]+$/g, '')
      .trim();
    if (line && !out.includes(line)) out.push(line);
  }
  return out;
}

/** What Jarvis is asked: the idea, the kind of opening ("A question") and whether it is spoken or on screen */
export function hookBrief(idea: string, openWith: string, spoken: boolean): string {
  const kind = spoken ? 'The hook is the first line said to camera.' : 'The hook is short text on the first frame, under 8 words.';
  return `${idea.trim()} (open with ${openWith.toLowerCase()}). ${kind}`;
}

export async function generateHooks(topic: string, deps: AiDeps = defaults()): Promise<string[]> {
  const t = topic.trim();
  if (!t) throw new AiInputError(AI_MESSAGES.noTopic);
  const res = await deps.authFetch('/api/ai/hooks', { method: 'POST', body: { topic: t } });
  const data = (await readJson(res)) as { hooks?: unknown } | null;
  const hooks = cleanHooks(data?.hooks);
  if (hooks.length === 0) throw new AiEmptyError();
  return hooks;
}

// ─── Captions / posts ───────────────────────────────────────────────────────

/**
 * The route has its own instructions for linkedin and threads only; no platform at all means LinkedIn
 * (150-300 characters, professional). Anything else gets its short, punchy default, which is what the
 * app's captions want, so a missing platform is sent as 'general'.
 */
export const GENERAL_PLATFORM = 'general';

/** "Instagram · Reel" -> 'instagram'; a name the backend has no id for -> undefined */
export function platformIdFor(name: string | undefined): string | undefined {
  const n = (name ?? '').toLowerCase();
  return ['linkedin', 'threads', 'facebook', 'instagram', 'youtube', 'tiktok'].find((id) => n.includes(id));
}

export async function composePost(topic: string, platform?: string, deps: AiDeps = defaults()): Promise<string> {
  const t = topic.trim();
  if (!t) throw new AiInputError(AI_MESSAGES.noTopic);
  const res = await deps.authFetch('/api/ai/compose', { method: 'POST', body: { topic: t, platform: platform || GENERAL_PLATFORM } });
  const data = (await readJson(res)) as { content?: unknown } | null;
  const content = typeof data?.content === 'string' ? data.content.trim() : '';
  if (!content) throw new AiEmptyError();
  return content;
}

/** What the writers ask for: the idea plus the goal and tones, as one topic line the route can use */
export function captionBrief(topic: string, opts: { goal?: string; tones?: string[]; instruction?: string } = {}): string {
  const parts = [topic.trim()];
  if (opts.goal) parts.push(`Goal: ${opts.goal}.`);
  if (opts.tones && opts.tones.length > 0) parts.push(`Tone: ${opts.tones.join(', ')}.`);
  if (opts.instruction) parts.push(opts.instruction.trim());
  return parts.filter(Boolean).join(' ');
}

export interface SplitCaption {
  body: string;
  /** The closing line when it is a question (the writer shows it in its own box), else '' */
  ending: string;
  /** Hashtags found at the end of the text, joined by spaces */
  hashtags: string;
}

/** Splits a finished post into body / closing question / hashtags, the way the Caption writer lays them out */
export function splitCaption(text: string): SplitCaption {
  let rest = text.trim();
  let hashtags = '';
  const tagLine = rest.match(/(?:^|\n+)((?:#[\p{L}\p{N}_]+[ \t]*)+)$/u);
  if (tagLine) {
    hashtags = tagLine[1].trim().split(/\s+/).join(' ');
    rest = rest.slice(0, tagLine.index).trim();
  }
  const paras = rest.split(/\n{2,}/);
  let ending = '';
  if (paras.length > 1 && /\?\s*$/.test(paras[paras.length - 1])) {
    ending = (paras.pop() as string).trim();
  }
  return { body: paras.join('\n\n').trim(), ending, hashtags };
}

export interface WrittenOption {
  id: string;
  label: string;
  body: string;
  ending: string;
  hashtags: string;
}

/** Three ways in, so the three options differ (one compose call each) */
export const OPTION_ANGLES: { label: string; instruction: string }[] = [
  { label: 'Question', instruction: 'Open with a question the reader will answer in their head.' },
  { label: 'Story', instruction: 'Open mid-story with one specific moment.' },
  { label: 'Bold take', instruction: 'Open with a confident opinion.' },
];

/**
 * Three finished captions for the Caption writer. Resolves with whatever came back (at least one);
 * rejects with the first error when every call failed.
 */
export async function composeCaptionOptions(
  topic: string,
  opts: { goal?: string; tones?: string[]; platform?: string; idPrefix?: string } = {},
  deps: AiDeps = defaults(),
): Promise<WrittenOption[]> {
  const results = await Promise.allSettled(
    OPTION_ANGLES.map((a) => composePost(captionBrief(topic, { goal: opts.goal, tones: opts.tones, instruction: a.instruction }), opts.platform, deps)),
  );
  const options: WrittenOption[] = [];
  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') return;
    const { body, ending, hashtags } = splitCaption(r.value);
    options.push({ id: `${opts.idPrefix ?? 'ai'}-${i}`, label: OPTION_ANGLES[i].label, body: body || r.value, ending, hashtags });
  });
  if (options.length === 0) {
    const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    throw failed ? failed.reason : new AiEmptyError();
  }
  return options;
}

// ─── Jarvis chat ────────────────────────────────────────────────────────────

export interface AgentTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** The route keeps the last 20; sending less keeps requests small */
export const AGENT_HISTORY_LIMIT = 12;

export function trimHistory(history: AgentTurn[]): AgentTurn[] {
  return history.filter((t) => t.content.trim()).slice(-AGENT_HISTORY_LIMIT);
}

/**
 * Asks Jarvis. `onText` gets the reply so far each time more arrives (the full text each call), and the
 * promise resolves to the final reply. Falls back to reading the whole body when the runtime can't stream.
 */
export async function askJarvis(
  message: string,
  history: AgentTurn[],
  opts: { onText?: (textSoFar: string) => void; signal?: AbortSignal } = {},
  deps: AiDeps = defaults(),
): Promise<string> {
  const m = message.trim();
  if (!m) throw new AiInputError(AI_MESSAGES.noTopic);
  const res = await deps.authFetch('/api/agent', {
    method: 'POST',
    body: { message: m, conversationHistory: trimHistory(history) },
    headers: { Accept: 'text/plain' },
    signal: opts.signal,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, data);
  }

  let text = '';
  const reader = res.body && typeof res.body.getReader === 'function' ? res.body.getReader() : null;
  if (reader && typeof TextDecoder !== 'undefined') {
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      opts.onText?.(text);
    }
    text += decoder.decode();
  } else {
    text = await res.text();
  }
  text = text.trim();
  if (!text) throw new AiEmptyError();
  opts.onText?.(text);
  return text;
}
