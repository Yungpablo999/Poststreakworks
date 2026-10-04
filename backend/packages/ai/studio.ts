import { z } from "zod";
import { groqChat } from "@poststreak/integrations/groq";
import { extractJson } from "./jarvis-chat";
import {
  REPURPOSE_FORMATS,
  captionEditPrompt,
  captionsPrompt,
  hooksPrompt,
  repurposePrompt,
  scriptPartPrompt,
  scriptPrompt,
  type RepurposePlatform,
} from "./prompts/studio";

// ============================================================================
// The writing tools: script, hooks, captions (and small caption edits), Repurpose.
//
// The model only SUGGESTS. Everything it returns is parsed, length-capped and checked here before it
// reaches the app: a reply that is the wrong shape is asked for once more, and if it still isn't usable
// the creator gets an honest "couldn't write that" (and isn't charged for it: see the callers). Nothing
// the model says can add a field, a format or a platform the app doesn't know.
// ============================================================================

export const FILM_STYLES = ["talking", "dance", "skit", "text"] as const;
export const HOOK_ANGLES = ["question", "mistake", "story", "bold", "result"] as const;
export const SCRIPT_PARTS = ["hook", "story", "lesson", "cta"] as const;
export const IDEA_GOALS = ["followers", "saves", "comments", "often"] as const;
export const CAPTION_TONES = ["Helpful", "Honest", "Motivational", "Funny", "Professional"] as const;
export const PLATFORMS = ["tiktok", "instagram", "youtube", "threads", "facebook"] as const;
export const CAPTION_EDITS = ["rewrite", "shorten", "ask", "tags"] as const;

export { REPURPOSE_FORMATS };

export class StudioError extends Error {
  constructor(
    /** unavailable: the model couldn't be reached. unusable: it answered, but not with something we can use. */
    public readonly kind: "unavailable" | "unusable",
    message: string,
  ) {
    super(message);
    this.name = "StudioError";
  }
}

// ─── What comes in ──────────────────────────────────────────────────────────

// (a request with the field missing altogether gets the same words as an empty one)
const idea = z
  .string({ required_error: "Say what it's about first.", invalid_type_error: "That doesn't look right." })
  .trim()
  .min(1, "Say what it's about first.")
  .max(300, "Keep it under 300 characters.");
const recent = z.array(z.string().trim().min(1).max(300)).max(9).default([]);

export const scriptInput = z.object({
  idea,
  length: z.union([z.literal(15), z.literal(30), z.literal(60)]).default(30),
  style: z.enum(FILM_STYLES).default("talking"),
});
export type ScriptInput = z.infer<typeof scriptInput>;

const scriptText = z.object({
  hook: z.string().trim().min(1).max(1000),
  story: z.string().trim().min(1).max(1000),
  lesson: z.string().trim().min(1).max(1000),
  cta: z.string().trim().min(1).max(1000),
});

export const scriptPartInput = z.object({
  idea,
  part: z.enum(SCRIPT_PARTS),
  script: scriptText,
  length: z.union([z.literal(15), z.literal(30), z.literal(60)]).default(30),
  style: z.enum(FILM_STYLES).default("talking"),
  direction: z.enum(["different", "shorter", "punchier"]).default("different"),
});
export type ScriptPartInput = z.infer<typeof scriptPartInput>;

export const hooksInput = z.object({
  idea,
  style: z.enum(FILM_STYLES).default("talking"),
  angle: z.enum(HOOK_ANGLES).default("question"),
  /** Lines the creator has already seen, so another round gives new ones. */
  avoid: recent,
});
export type HooksInput = z.infer<typeof hooksInput>;

export const captionsInput = z.object({
  topic: idea,
  goal: z.enum(IDEA_GOALS).default("followers"),
  tones: z.array(z.enum(CAPTION_TONES)).min(1).max(3).default(["Helpful"]),
  platform: z.enum(PLATFORMS).optional(),
  /** The openings already shown, so another round gives new ones. */
  avoid: recent,
});
export type CaptionsInput = z.infer<typeof captionsInput>;

export const captionEditInput = z.object({
  caption: z.string({ required_error: "Write a caption first." }).trim().min(1, "Write a caption first.").max(2200),
  action: z.enum(CAPTION_EDITS),
  platform: z.enum(PLATFORMS).optional(),
  idea: z.string().trim().max(300).optional(),
});
export type CaptionEditInput = z.infer<typeof captionEditInput>;

export const repurposeInput = z.object({
  text: z.string({ required_error: "Paste an idea or a post first." }).trim().min(1, "Paste an idea or a post first.").max(2000, "Keep it under 2,000 characters."),
  platforms: z
    .array(z.enum(PLATFORMS), { required_error: "Pick at least one platform." })
    .min(1, "Pick at least one platform.")
    .max(5)
    .transform((list) => [...new Set(list)]),
  prefer: z.enum(["video", "carousel", "text"]).default("video"),
});
export type RepurposeInput = z.infer<typeof repurposeInput>;

// ─── What goes out ──────────────────────────────────────────────────────────

export type ScriptOutput = { hook: string; story: string; lesson: string; cta: string };
export type CaptionOption = { id: string; label: string; caption: string; hashtags: string[] };
export type RepurposeVersion = {
  platform: RepurposePlatform;
  format: string;
  formatLabel: string;
  title: string;
  body: string;
  slides?: string[];
  posts?: string[];
};

const FORMAT_LABEL: Record<string, string> = {
  video: "Short video",
  reel: "Reel",
  short: "Short",
  carousel: "Photo carousel",
  post: "Post",
  community: "Community post",
  thread: "Thread",
};

// ─── Cleaning what the model returns ────────────────────────────────────────

/** Truncates by code point, so emoji are never split in half. */
export const clip = (value: string, max: number): string => {
  const chars = Array.from(value.trim());
  return chars.length <= max ? chars.join("") : chars.slice(0, max).join("").trimEnd();
};

/** Models like long dashes; the app's voice doesn't use them. */
const plain = (s: string) => s.replace(/\s*[—–]\s*/g, ", ");

const text = (max: number) =>
  z
    .string()
    .transform((s) => clip(plain(s), max))
    .pipe(z.string().min(1));

/** "#Habits" from "habits", "# Daily Habits", "##habits": one word, one #, nothing silly. */
export function cleanHashtags(raw: unknown, max = 8): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const body = item.replace(/[^\p{L}\p{N}_]+/gu, "");
    if (!body || body.length > 40) continue;
    const tag = `#${body}`;
    if (seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    out.push(tag);
    if (out.length >= max) break;
  }
  return out;
}

const scriptReply = z.object({ hook: text(240), story: text(900), lesson: text(400), cta: text(240) });
const partReply = z.object({ text: text(900) });

function parseHooks(raw: unknown): { hooks: string[] } | null {
  const obj = raw as { hooks?: unknown } | null;
  if (!obj || !Array.isArray(obj.hooks)) return null;
  const hooks: string[] = [];
  for (const h of obj.hooks) {
    const parsed = text(140).safeParse(h);
    if (parsed.success && !hooks.some((x) => x.toLowerCase() === parsed.data.toLowerCase())) hooks.push(parsed.data);
  }
  return hooks.length >= 3 ? { hooks: hooks.slice(0, 3) } : null;
}

const captionOptionReply = z.object({ label: text(40), caption: text(1400), hashtags: z.unknown().optional() });

function parseCaptions(raw: unknown, newId: () => string): { options: CaptionOption[] } | null {
  const obj = raw as { options?: unknown } | null;
  if (!obj || !Array.isArray(obj.options)) return null;
  const options: CaptionOption[] = [];
  for (const o of obj.options) {
    const parsed = captionOptionReply.safeParse(o);
    if (!parsed.success) continue;
    options.push({ id: `c-${newId()}`, label: parsed.data.label, caption: parsed.data.caption, hashtags: cleanHashtags(parsed.data.hashtags, 5) });
  }
  return options.length >= 3 ? { options: options.slice(0, 3) } : null;
}

const versionReply = z.object({
  platform: z.enum(PLATFORMS),
  format: z.string(),
  title: text(140),
  body: text(2000),
  slides: z.array(text(220)).max(10).optional().catch(undefined),
  posts: z.array(text(500)).max(8).optional().catch(undefined),
});

function parseRepurpose(raw: unknown, platforms: readonly RepurposePlatform[]): { versions: RepurposeVersion[] } | null {
  const obj = raw as { versions?: unknown } | null;
  if (!obj || !Array.isArray(obj.versions)) return null;
  const byPlatform = new Map<string, RepurposeVersion>();
  for (const v of obj.versions) {
    const parsed = versionReply.safeParse(v);
    if (!parsed.success) continue;
    const { platform, format, title, body, slides, posts } = parsed.data;
    const allowed = REPURPOSE_FORMATS[platform] as readonly string[];
    if (!allowed.includes(format) || byPlatform.has(platform)) continue;
    // A carousel needs its slides and a thread its posts; the other formats have neither
    if (format === "carousel" && (!slides || slides.length < 2)) continue;
    if (format === "thread" && (!posts || posts.length < 2)) continue;
    byPlatform.set(platform, {
      platform,
      format,
      formatLabel: FORMAT_LABEL[format] ?? format,
      title,
      body,
      ...(format === "carousel" && slides && { slides }),
      ...(format === "thread" && posts && { posts }),
    });
  }
  // One version for every platform that was asked for, in the order asked
  const versions = platforms.map((p) => byPlatform.get(p)).filter((v): v is RepurposeVersion => v !== undefined);
  return versions.length === platforms.length ? { versions } : null;
}

// ─── Calling the model ──────────────────────────────────────────────────────

export type Complete = (args: { system: string; user: string; temperature: number; maxTokens: number }) => Promise<string>;

export type Deps = { complete?: Complete; newId?: () => string };

/** Groq first, Gemini as the fallback (packages/integrations/groq.ts); a stand-in on this machine for local tests. */
const defaultComplete: Complete = async ({ system, user, temperature, maxTokens }) => {
  const out: unknown = await groqChat({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature,
    // The default model reasons before it answers; leave room so it doesn't spend the whole budget thinking.
    max_tokens: maxTokens,
  });
  if (typeof out !== "string") throw new Error("the model returned a non-text response");
  return out;
};

const REPAIR_NOTE = "\n\n(Reply again with only the JSON object described above, nothing else.)";

type Prompt = { system: string; user: string; temperature: number; maxTokens: number };

/**
 * Asks the model, checks what comes back, and asks once more if it wasn't usable. A model that can't be
 * reached is not retried (the fallback provider has already been tried inside groqChat).
 */
async function ask<T>(prompt: Prompt, parse: (raw: unknown) => T | null, deps: Deps, tool: string): Promise<T> {
  const complete = deps.complete ?? defaultComplete;
  for (let attempt = 0; attempt < 2; attempt++) {
    let reply: string;
    try {
      reply = await complete({ ...prompt, user: attempt === 0 ? prompt.user : prompt.user + REPAIR_NOTE });
    } catch (err) {
      console.error(`Jarvis ${tool} model call failed:`, err instanceof Error ? err.message : err);
      throw new StudioError("unavailable", "Jarvis can't be reached right now. Try again in a moment.");
    }
    const parsed = parse(extractJson(reply));
    if (parsed !== null) return parsed;
  }
  console.error(`Jarvis ${tool}: the model's reply was not usable twice in a row`);
  throw new StudioError("unusable", "Jarvis couldn't write that one. Try again.");
}

const fromSchema =
  <S extends z.ZodTypeAny>(schema: S) =>
  (raw: unknown): z.output<S> | null => {
    const parsed = schema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  };

// ─── The tools ──────────────────────────────────────────────────────────────

export const writeScript = (input: ScriptInput, deps: Deps = {}): Promise<ScriptOutput> =>
  ask(scriptPrompt(input), fromSchema(scriptReply), deps, "script");

export const rewriteScriptPart = (input: ScriptPartInput, deps: Deps = {}): Promise<{ text: string }> =>
  ask(scriptPartPrompt(input), fromSchema(partReply), deps, "script-part");

export const writeHooks = (input: HooksInput, deps: Deps = {}): Promise<{ hooks: string[] }> => ask(hooksPrompt(input), parseHooks, deps, "hooks");

export const writeCaptions = (input: CaptionsInput, deps: Deps = {}): Promise<{ options: CaptionOption[] }> => {
  const newId = deps.newId ?? (() => Math.random().toString(36).slice(2, 10));
  return ask(captionsPrompt(input), (raw) => parseCaptions(raw, newId), deps, "captions");
};

const captionReply = z.object({ caption: text(2200) });
const tagsReply = z.object({ tags: z.unknown() });

export async function editCaption(input: CaptionEditInput, deps: Deps = {}): Promise<{ caption: string } | { tags: string[] }> {
  const prompt = captionEditPrompt(input);
  if (input.action === "tags") {
    return ask(
      prompt,
      (raw) => {
        const parsed = tagsReply.safeParse(raw);
        if (!parsed.success) return null;
        const tags = cleanHashtags(parsed.data.tags, 8);
        return tags.length >= 3 ? { tags } : null;
      },
      deps,
      "caption-tags",
    );
  }
  return ask(prompt, fromSchema(captionReply), deps, "caption-edit");
}

export const repurposeText = (input: RepurposeInput, deps: Deps = {}): Promise<{ versions: RepurposeVersion[] }> =>
  ask(repurposePrompt(input), (raw) => parseRepurpose(raw, input.platforms), deps, "repurpose");
