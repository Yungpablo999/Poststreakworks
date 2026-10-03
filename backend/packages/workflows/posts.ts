import type { SupabaseClient } from "@supabase/supabase-js";
import { PROVIDER_IDS, PROVIDER_NAMES, isProviderId, type ProviderId } from "@poststreak/integrations";
import { getServiceClient } from "./service-client";
import { recordStreakEvent, type RecordStreakEventResult } from "./streak-engine";

// A creator's posts: planned, due, posted. The rules live here and nowhere else, because
// creators cannot write posts themselves (migration …25): everything they do arrives through
// these functions, checked, and the two changes that must be atomic are database functions.
//
// PostStreak does not publish to TikTok, Instagram, YouTube, Threads or Facebook for the
// creator. A post is PLANNED for a time, becomes READY at that time (the creator gets a note),
// and is POSTED when the creator says they posted it, one platform at a time:
//
//   scheduled ──time comes──▶ ready ──"I posted it" on each platform──▶ posted
//        ▲                      │
//        └── "remind me later" ─┘            (a draft is not a post: drafts live in `drafts`)
//
// "Post now" skips the waiting: the post is ready the moment it is made.

export const POST_PLATFORMS: readonly ProviderId[] = PROVIDER_IDS;
export type PostPlatform = ProviderId;
export const POST_FORMATS = ["short_video", "carousel", "image", "text", "long_video"] as const;
export type PostFormat = (typeof POST_FORMATS)[number];

export const MAX_CAPTION_LENGTH = 5000;
export const MAX_TAGS = 30;
export const MAX_TAG_LENGTH = 100;
/** Posts planned or waiting to be confirmed at once. A tripwire for runaway clients, not a plan limit. */
export const MAX_OPEN_POSTS = 100;
export const MAX_DAYS_AHEAD = 365;

const DAY_MS = 86_400_000;

export class PostError extends Error {
  constructor(
    public readonly code: "invalid" | "not_found" | "conflict" | "limit",
    message: string,
  ) {
    super(message);
    this.name = "PostError";
  }
}

// ─── Shapes ─────────────────────────────────────────────────────────────────

export type PostState = "draft" | "scheduled" | "ready" | "posted" | "failed";
export type PostStepState = "waiting" | "ready" | "posted" | "failed";

/** One platform of a post. */
export type PostStep = {
  platform: string;
  state: PostStepState;
  /** The link to the live post, when the creator gave one or a sync found it. */
  url?: string;
  /** When the creator said they posted it. */
  postedAt?: string;
};

export type Post = {
  id: string;
  caption: string;
  tags: string[];
  format: PostFormat | null;
  /** When it is (or was) due. */
  at: string;
  state: PostState;
  platforms: PostStep[];
  /** When the last platform was posted. */
  postedAt: string | null;
  /** Why it failed, for a post the publisher could not send. */
  error: string | null;
  createdAt: string;
};

export type PostRow = {
  id: string;
  user_id: string;
  content: string;
  tags: string[] | null;
  format: string | null;
  target_platforms: string[];
  scheduled_at: string;
  status: string;
  published_at: string | null;
  platform_post_ids: Record<string, { status?: string; id?: string; url?: string; at?: string } | undefined> | null;
  error: string | null;
  created_at: string;
};

export const POST_COLUMNS = "id, user_id, content, tags, format, target_platforms, scheduled_at, status, published_at, platform_post_ids, error, created_at";

const STATE_OF: Record<string, PostState> = {
  draft: "draft",
  scheduled: "scheduled",
  publishing: "scheduled",
  pending_confirmation: "ready",
  published: "posted",
  failed: "failed",
};

/** What the app is told about a post. Pure. */
export function toPost(row: PostRow): Post {
  const steps = row.platform_post_ids ?? {};
  const platforms: PostStep[] = row.target_platforms.map((platform) => {
    const step = steps[platform];
    const state: PostStepState =
      step?.status === "published" || row.status === "published"
        ? "posted"
        : step?.status === "failed" || row.status === "failed"
          ? "failed"
          : row.status === "pending_confirmation"
            ? "ready"
            : "waiting";
    return {
      platform,
      state,
      ...(step?.url && { url: step.url }),
      ...(state === "posted" && (step?.at ?? row.published_at) && { postedAt: step?.at ?? row.published_at! }),
    };
  });
  return {
    id: row.id,
    caption: row.content,
    tags: row.tags ?? [],
    format: (POST_FORMATS as readonly string[]).includes(row.format ?? "") ? (row.format as PostFormat) : null,
    at: row.scheduled_at,
    state: STATE_OF[row.status] ?? "scheduled",
    platforms,
    postedAt: row.published_at,
    error: row.error,
    createdAt: row.created_at,
  };
}

// ─── Checking what the creator sent ─────────────────────────────────────────

export type NewPostInput = {
  caption: string;
  tags?: string[];
  platforms: string[];
  format?: string | null;
  /** "now" = ready this moment; "schedule" = at `at`. */
  when: "now" | "schedule";
  at?: string;
  /** The composer's draft this post was made from; it is removed once the post exists. */
  fromDraft?: string;
};

export type ValidNewPost = {
  caption: string;
  tags: string[];
  platforms: PostPlatform[];
  format: PostFormat | null;
  when: "now" | "schedule";
  at: Date;
};

export function cleanCaption(raw: unknown): string {
  const caption = typeof raw === "string" ? raw.replace(/\r\n/g, "\n").trim() : "";
  if (!caption) throw new PostError("invalid", "Write a caption first.");
  if (caption.length > MAX_CAPTION_LENGTH) throw new PostError("invalid", `Captions can be up to ${MAX_CAPTION_LENGTH.toLocaleString("en-US")} characters.`);
  return caption;
}

/** "#Habits" for "habits", " # Daily Habits " for "dailyhabits"; duplicates (any case) are dropped. */
export function cleanTags(raw: unknown): string[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new PostError("invalid", "Tags must be a list.");
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") throw new PostError("invalid", "Tags must be text.");
    const body = item.replace(/[\s#]+/g, "");
    if (!body) continue;
    const tag = `#${body}`;
    if (tag.length > MAX_TAG_LENGTH) throw new PostError("invalid", `A tag can be up to ${MAX_TAG_LENGTH} characters.`);
    if (seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    tags.push(tag);
  }
  if (tags.length > MAX_TAGS) throw new PostError("invalid", `A post can have up to ${MAX_TAGS} tags.`);
  return tags;
}

export function cleanPlatforms(raw: unknown): PostPlatform[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new PostError("invalid", "Pick at least one platform.");
  const platforms: PostPlatform[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !isProviderId(item)) {
      throw new PostError("invalid", "Posts can be planned for TikTok, Instagram, YouTube, Threads and Facebook.");
    }
    if (!platforms.includes(item)) platforms.push(item);
  }
  return platforms;
}

export function cleanFormat(raw: unknown): PostFormat | null {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string" || !(POST_FORMATS as readonly string[]).includes(raw)) throw new PostError("invalid", "That format isn't one we know.");
  return raw as PostFormat;
}

/** The time a post is planned for: in the future and within a year. */
export function cleanTime(raw: unknown, now: Date): Date {
  const at = typeof raw === "string" ? new Date(raw) : null;
  if (!at || Number.isNaN(at.getTime())) throw new PostError("invalid", "Pick a day and time.");
  if (at.getTime() <= now.getTime()) throw new PostError("invalid", "That time has already passed. Pick a later time.");
  if (at.getTime() > now.getTime() + MAX_DAYS_AHEAD * DAY_MS) throw new PostError("invalid", "Plan posts up to a year ahead.");
  return at;
}

export function validateNewPost(input: NewPostInput, now: Date): ValidNewPost {
  if (input.when !== "now" && input.when !== "schedule") throw new PostError("invalid", "Say whether to post now or at a time.");
  return {
    caption: cleanCaption(input.caption),
    tags: cleanTags(input.tags),
    platforms: cleanPlatforms(input.platforms),
    format: cleanFormat(input.format),
    when: input.when,
    at: input.when === "now" ? now : cleanTime(input.at, now),
  };
}

export type PostPatch = {
  caption?: string;
  tags?: string[];
  platforms?: string[];
  format?: string | null;
  /** A new time. A post that was ready goes back to waiting for it. */
  at?: string;
};

// The links a platform's own app gives for a post. Anything else is not that platform's post.
const HOSTS: Record<ProviderId, RegExp> = {
  tiktok: /(^|\.)tiktok\.com$/,
  instagram: /(^|\.)instagram\.com$|^instagr\.am$/,
  youtube: /(^|\.)youtube\.com$|^youtu\.be$/,
  threads: /(^|\.)threads\.(net|com)$/,
  facebook: /(^|\.)facebook\.com$|^fb\.watch$|^fb\.com$/,
};

/** The link the creator pasted for their post, or null for none. Must be that platform's own. */
export function cleanPostUrl(platform: PostPlatform, raw: unknown): string | null {
  if (raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "")) return null;
  if (typeof raw !== "string" || raw.length > 500) throw new PostError("invalid", "That link doesn't look right.");
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new PostError("invalid", "That link doesn't look right.");
  }
  if (url.protocol !== "https:" || !HOSTS[platform].test(url.hostname.toLowerCase())) {
    throw new PostError("invalid", `That isn't a ${PROVIDER_NAMES[platform]} link.`);
  }
  return url.toString();
}

// ─── Reading ────────────────────────────────────────────────────────────────

async function loadRow(userId: string, id: string, db: SupabaseClient): Promise<PostRow> {
  const { data, error } = await db.from("scheduled_posts").select(POST_COLUMNS).eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`getPost: ${error.message}`);
  if (!data) throw new PostError("not_found", "That post isn't there any more.");
  return data as PostRow;
}

export async function getPost(userId: string, id: string, db: SupabaseClient = getServiceClient()): Promise<Post> {
  return toPost(await loadRow(userId, id, db));
}

/** Posts whose time has come and are waiting for the creator to post them, oldest first. */
export async function listReadyPosts(userId: string, db: SupabaseClient = getServiceClient()): Promise<Post[]> {
  const { data, error } = await db
    .from("scheduled_posts")
    .select(POST_COLUMNS)
    .eq("user_id", userId)
    .eq("status", "pending_confirmation")
    .order("scheduled_at", { ascending: true })
    .limit(50);
  if (error) throw new Error(`listReadyPosts: ${error.message}`);
  return ((data ?? []) as PostRow[]).map(toPost);
}

// ─── Making and changing posts ──────────────────────────────────────────────

const OPEN_STATUSES = ["scheduled", "pending_confirmation", "publishing"];

const pendingSteps = (platforms: string[]): Record<string, { status: string }> =>
  Object.fromEntries(platforms.map((p) => [p, { status: "pending_confirmation" }]));

export async function createPost(userId: string, input: NewPostInput, db: SupabaseClient = getServiceClient(), now: Date = new Date()): Promise<Post> {
  const post = validateNewPost(input, now);

  const { count, error: countError } = await db
    .from("scheduled_posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", OPEN_STATUSES);
  if (countError) throw new Error(`createPost: ${countError.message}`);
  if ((count ?? 0) >= MAX_OPEN_POSTS) throw new PostError("limit", `You have ${MAX_OPEN_POSTS} posts waiting. Post or remove a few before planning more.`);

  const ready = post.when === "now";
  const { data, error } = await db
    .from("scheduled_posts")
    .insert({
      user_id: userId,
      content: post.caption,
      tags: post.tags,
      format: post.format,
      target_platforms: post.platforms,
      scheduled_at: post.at.toISOString(),
      status: ready ? "pending_confirmation" : "scheduled",
      platform_post_ids: ready ? pendingSteps(post.platforms) : {},
    })
    .select(POST_COLUMNS)
    .single();
  if (error || !data) throw new Error(`createPost: ${error?.message ?? "no row"}`);

  // The draft it grew from is done. Failing to tidy it up must not fail the post.
  if (input.fromDraft) {
    const { error: draftError } = await db.from("drafts").delete().eq("user_id", userId).eq("client_key", input.fromDraft);
    if (draftError) console.error("createPost: could not remove the draft:", draftError.message);
  }
  return toPost(data as PostRow);
}

const EDITABLE = ["scheduled", "pending_confirmation"];

/**
 * What changes in the database for an edit, or null when nothing does. Pure, so every rule is
 * tested without a database.
 */
export function planUpdate(row: PostRow, patch: PostPatch, now: Date): Record<string, unknown> | null {
  if (!EDITABLE.includes(row.status)) {
    throw new PostError("conflict", row.status === "published" ? "This post has been posted, so it can't be changed." : "This post can't be changed.");
  }
  const steps = row.platform_post_ids ?? {};
  const posted = (p: string) => steps[p]?.status === "published";

  const update: Record<string, unknown> = {};
  if (patch.caption !== undefined) update.content = cleanCaption(patch.caption);
  if (patch.tags !== undefined) update.tags = cleanTags(patch.tags);
  if (patch.format !== undefined) update.format = cleanFormat(patch.format);

  let platforms = row.target_platforms;
  if (patch.platforms !== undefined) {
    const next = cleanPlatforms(patch.platforms);
    if (row.target_platforms.some(posted) && [...next].sort().join() !== [...row.target_platforms].sort().join()) {
      throw new PostError("conflict", "Part of this post is already posted, so its platforms can't change.");
    }
    platforms = next;
    update.target_platforms = next;
  }

  let status = row.status;
  if (patch.at !== undefined) {
    update.scheduled_at = cleanTime(patch.at, now).toISOString();
    status = "scheduled"; // a post that was ready waits for its new time
    update.status = status;
  }

  // The per-platform record follows the platforms and the status: what is posted stays, the rest is
  // ready (the time has come) or empty (waiting for its time).
  if (patch.platforms !== undefined || patch.at !== undefined) {
    const kept = Object.fromEntries(platforms.filter(posted).map((p) => [p, steps[p]]));
    update.platform_post_ids = status === "pending_confirmation" ? { ...pendingSteps(platforms.filter((p) => !kept[p])), ...kept } : kept;
  }

  return Object.keys(update).length === 0 ? null : update;
}

export async function updatePost(userId: string, id: string, patch: PostPatch, db: SupabaseClient = getServiceClient(), now: Date = new Date()): Promise<Post> {
  const row = await loadRow(userId, id, db);
  const update = planUpdate(row, patch, now);
  if (!update) return toPost(row);

  const { data, error } = await db
    .from("scheduled_posts")
    .update(update)
    .eq("id", id)
    .eq("user_id", userId)
    .in("status", EDITABLE)
    .select(POST_COLUMNS)
    .maybeSingle();
  if (error) throw new Error(`updatePost: ${error.message}`);
  if (!data) throw new PostError("conflict", "This post was just posted, so it can't be changed.");
  return toPost(data as PostRow);
}

export async function deletePost(userId: string, id: string, db: SupabaseClient = getServiceClient()): Promise<void> {
  const { data, error } = await db
    .from("scheduled_posts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .in("status", ["draft", "scheduled", "pending_confirmation", "failed"])
    .select("id");
  if (error) throw new Error(`deletePost: ${error.message}`);
  if (!data?.length) {
    const row = await loadRow(userId, id, db); // not_found if it was never theirs
    throw new PostError("conflict", row.status === "published" ? "A post that's been posted stays in your history." : "This post can't be removed right now.");
  }
  // Its "time to post" notes go with it
  const { error: noteError } = await db.from("notifications").delete().eq("user_id", userId).like("key", `post-ready:${id}:%`);
  if (noteError) console.error("deletePost: could not remove its notes:", noteError.message);
}

// ─── "I posted it" ──────────────────────────────────────────────────────────

export type MarkPostedResult = {
  post: Post;
  /** The creator's streak after this post. Null when the post was already marked. */
  streak: RecordStreakEventResult | null;
};

export async function markPosted(
  userId: string,
  id: string,
  input: { platform: string; url?: string | null },
  db: SupabaseClient = getServiceClient(),
  now: Date = new Date(),
): Promise<MarkPostedResult> {
  if (typeof input.platform !== "string" || !isProviderId(input.platform)) throw new PostError("invalid", "Say which platform you posted to.");
  const url = cleanPostUrl(input.platform, input.url);

  const { data, error } = await db.rpc("confirm_post_platform", {
    p_user_id: userId,
    p_post_id: id,
    p_platform: input.platform,
    p_url: url,
    p_now: now.toISOString(),
  });
  if (error) throw new Error(`markPosted: ${error.message}`);

  const result = data as { result: string; status?: string };
  switch (result.result) {
    case "not_found":
      throw new PostError("not_found", "That post isn't there any more.");
    case "wrong_platform":
      throw new PostError("invalid", `This post wasn't planned for ${PROVIDER_NAMES[input.platform]}.`);
    case "not_open":
      throw new PostError("conflict", result.status === "published" ? "This post is already posted." : "This post isn't waiting to be posted.");
    case "already_posted":
      return { post: await getPost(userId, id, db), streak: null };
    case "ok":
      break;
    default:
      throw new Error(`markPosted: unexpected result ${JSON.stringify(result)}`);
  }

  // A post made counts towards today's streak (once a day, whatever the number of posts). A failure
  // here must not undo the post: it is already recorded.
  const streak = await recordStreakEvent(userId, "publish", { post_id: id, platform: input.platform, source: "confirmed" });
  return { post: await getPost(userId, id, db), streak };
}

// ─── The cron ───────────────────────────────────────────────────────────────

/** Turns every scheduled post whose time has come into "ready to post" and tells its creator. Returns how many. */
export async function releaseDuePosts(db: SupabaseClient = getServiceClient(), now: Date = new Date()): Promise<number> {
  const { data, error } = await db.rpc("release_due_posts", { p_now: now.toISOString() });
  if (error) throw new Error(`releaseDuePosts: ${error.message}`);
  return typeof data === "number" ? data : 0;
}
