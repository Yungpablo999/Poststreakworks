import { ApiError, api } from './authFetch';
import { parseTikTokPostOptions, type TikTokPostOptions } from './tiktok';
import { MediaUploadError, blobFromUri, checkMedia, uploadMedia } from './media';

// Real publishing for the composers (no UI in here).
//
//   POST /api/post/now       { content, platform, mediaKey? }               -> { success, postId }
//   POST /api/post/schedule  { content, platform, scheduledAt, mediaKey? }  -> { success, postId }
//   POST /api/schedule       { content, platforms[], scheduledAt }          -> { success, scheduled, failed, results[] }
//
// A post carries at most ONE media item and an upload attaches to exactly one post,
// so with media every platform gets its own upload and its own call.
// A platform that can't take that kind of media but takes text (e.g. LinkedIn with a
// video) gets the caption alone; one that needs media and can't take it fails.
//
// TikTok takes `publishOptions: { tiktok }` (privacy level, comment/duet/stitch, disclosure; all
// required, see src/api/tiktok.ts) from the composer's TikTok card. Only the TikTok call carries it.

export interface PlatformRule {
  label: string;
  textLimit: number;
  /** Counts emoji as their UTF-8 byte length (Threads) */
  emojiAsBytes?: boolean;
  /** Takes a text-only post */
  supportsText: boolean;
  image: boolean;
  video: boolean;
}

// Mirrors poststreak-web's PLATFORM_META (src/lib/platforms/meta.ts)
export const PLATFORM_RULES: Record<string, PlatformRule> = {
  linkedin: { label: 'LinkedIn', textLimit: 3000, supportsText: true, image: true, video: false },
  threads: { label: 'Threads', textLimit: 500, emojiAsBytes: true, supportsText: true, image: true, video: false },
  facebook: { label: 'Facebook', textLimit: 63206, supportsText: true, image: true, video: false },
  instagram: { label: 'Instagram', textLimit: 2200, supportsText: false, image: true, video: true },
  youtube: { label: 'YouTube', textLimit: 5000, supportsText: false, image: false, video: true },
  tiktok: { label: 'TikTok', textLimit: 2200, supportsText: false, image: false, video: true },
};

export const POST_MESSAGES = {
  signedOut: 'Your session has expired. Sign in again.',
  network: "Couldn't reach PostStreak. Check your connection and try again.",
  generic: "Couldn't post that. Try again in a moment.",
  tooMany: "You're posting too fast. Try again in a few minutes.",
  noPlatform: 'Select at least one platform.',
  noContent: 'Add a caption first.',
  pastTime: 'Pick a time in the future.',
  notScheduled: "Couldn't be scheduled.",
  tiktokSettings: 'Choose your TikTok settings first.',
} as const;

export class PostInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PostInputError';
  }
}

export interface LocalMedia {
  uri: string;
  kind: 'image' | 'video';
  mimeType?: string;
  sizeBytes?: number;
}

export interface PostOutcome {
  platform: string;
  ok: boolean;
  postId?: string;
  /** Short, user-facing; set when ok is false */
  message?: string;
}

export interface PostSummary {
  outcomes: PostOutcome[];
  succeeded: string[];
  failed: Array<{ platform: string; message: string }>;
  allOk: boolean;
  anyOk: boolean;
  /** The creator's session ended: sign in again */
  signedOut: boolean;
}

export interface PostDeps {
  post: <T>(path: string, body: unknown) => Promise<T>;
  readBlob: (uri: string) => Promise<Blob>;
  upload: (blob: Blob, contentType: string) => Promise<{ mediaKey: string }>;
  now: () => Date;
}

const defaultDeps: PostDeps = {
  post: (path, body) => api.post(path, body),
  readBlob: blobFromUri,
  upload: (body, contentType) => uploadMedia({ body, contentType }),
  now: () => new Date(),
};

export const labelFor = (platform: string) => PLATFORM_RULES[platform]?.label ?? platform;

/** Length as the platform counts it (Threads counts emoji by their UTF-8 bytes) */
export function textLengthFor(platform: string, text: string): number {
  if (!PLATFORM_RULES[platform]?.emojiAsBytes) return text.length;
  let n = 0;
  for (const ch of text) n += /\p{Extended_Pictographic}/u.test(ch) ? new TextEncoder().encode(ch).length : 1;
  return n;
}

/** Turns anything thrown while posting into one short sentence for a toast */
export function describePostError(e: unknown, platform?: string): string {
  if (e instanceof PostInputError || e instanceof MediaUploadError) return e.message;
  if (e instanceof ApiError) {
    const body = (e.body ?? {}) as { error?: unknown; code?: unknown };
    const code = typeof body.code === 'string' ? body.code : undefined;
    const name = platform ? labelFor(platform) : 'That platform';
    switch (code) {
      case 'missing_token':
        return `${name} isn't connected. Connect it first.`;
      case 'expired_token':
      case 'provider_auth_error':
        return `${name} needs to be reconnected.`;
      case 'provider_temporary_error':
        return `${name} is having trouble right now. Try again soon.`;
      case 'unsupported_platform':
        return `${name} isn't supported yet.`;
      case 'validation_error':
        // Written for people by the backend ("Instagram posts need a photo or video.")
        if (e.status !== 401 && typeof body.error === 'string' && body.error.trim()) return body.error.trim();
        break;
      default:
        break;
    }
    if (e.status === 401) return POST_MESSAGES.signedOut;
    if (e.status === 429) return POST_MESSAGES.tooMany;
    if (e.status === 400 && typeof body.error === 'string' && body.error.trim()) return body.error.trim();
    return POST_MESSAGES.generic;
  }
  // fetch itself failed (offline, DNS, CORS)
  return POST_MESSAGES.network;
}

function isSignedOut(e: unknown): boolean {
  if (!(e instanceof ApiError) || e.status !== 401) return false;
  const code = (e.body as { code?: unknown } | null)?.code;
  // A 401 with a provider code is the platform rejecting the token, not the app session
  return code !== 'provider_auth_error';
}

/** Why this platform can't take this post, or null (checked before anything is sent) */
export function checkPlatformPost(platform: string, content: string, media: LocalMedia | null): string | null {
  const rule = PLATFORM_RULES[platform];
  if (!rule) return `${labelFor(platform)} isn't supported yet.`;
  if (textLengthFor(platform, content) > rule.textLimit) {
    return `Too long for ${rule.label} (${rule.textLimit.toLocaleString('en-US')} characters max).`;
  }
  if (!media && !rule.supportsText) return `${rule.label} posts need a ${rule.video && rule.image ? 'photo or video' : 'video'}.`;
  if (media && !rule[media.kind]) {
    if (!rule.supportsText) return `${rule.label} can't post ${media.kind === 'image' ? 'a photo' : 'a video'}.`;
  }
  // LinkedIn, Threads and Facebook take JPEG or PNG only (the backend refuses WebP)
  if (media?.kind === 'image' && rule.supportsText && media.mimeType && !/^image\/(jpeg|jpg|png)$/i.test(media.mimeType)) {
    return `${rule.label} photos must be JPEG or PNG.`;
  }
  return null;
}

/** Whether this platform's call carries the media (see the header comment) */
const takesMedia = (platform: string, media: LocalMedia | null): media is LocalMedia =>
  media !== null && PLATFORM_RULES[platform]?.[media.kind] === true;

function summarize(outcomes: PostOutcome[], signedOut: boolean): PostSummary {
  return {
    outcomes,
    succeeded: outcomes.filter((o) => o.ok).map((o) => o.platform),
    failed: outcomes.filter((o) => !o.ok).map((o) => ({ platform: o.platform, message: o.message ?? POST_MESSAGES.generic })),
    allOk: outcomes.length > 0 && outcomes.every((o) => o.ok),
    anyOk: outcomes.some((o) => o.ok),
    signedOut,
  };
}

export interface PublishInput {
  content: string;
  platforms: string[];
  media?: LocalMedia | null;
  /** TikTok settings from the composer card; required for a TikTok post (it has no defaults) */
  tiktok?: TikTokPostOptions | null;
}

/** Body fields that belong to one platform's call: TikTok's publishOptions */
function optionsFor(platform: string, tiktok: TikTokPostOptions | null): { publishOptions?: { tiktok: TikTokPostOptions } } {
  return platform === 'tiktok' && tiktok ? { publishOptions: { tiktok } } : {};
}

/** Why TikTok can't be sent yet (settings missing or invalid), or null; same check the backend runs */
function checkTikTok(platform: string, tiktok: TikTokPostOptions | null): string | null {
  if (platform !== 'tiktok') return null;
  const parsed = parseTikTokPostOptions(tiktok);
  return parsed.ok ? null : POST_MESSAGES.tiktokSettings;
}

function validateInput(input: PublishInput): {
  content: string;
  platforms: string[];
  media: LocalMedia | null;
  tiktok: TikTokPostOptions | null;
} {
  const content = input.content.trim();
  const platforms = Array.from(new Set(input.platforms));
  if (!platforms.length) throw new PostInputError(POST_MESSAGES.noPlatform);
  if (!content) throw new PostInputError(POST_MESSAGES.noContent);
  return { content, platforms, media: input.media ?? null, tiktok: input.tiktok ?? null };
}

/** Reads the file once and checks it against the upload rules; returns the type to upload as */
async function loadMedia(media: LocalMedia, deps: PostDeps): Promise<{ blob: Blob; contentType: string }> {
  const blob = await deps.readBlob(media.uri);
  const contentType = media.mimeType || blob.type;
  const problem = checkMedia(contentType, blob.size);
  if (problem) throw new MediaUploadError(problem);
  return { blob, contentType };
}

async function uploadFor(
  platform: string,
  media: LocalMedia | null,
  loaded: { blob: Blob; contentType: string } | null,
  deps: PostDeps,
): Promise<string | undefined> {
  if (!takesMedia(platform, media) || !loaded) return undefined;
  return (await deps.upload(loaded.blob, loaded.contentType)).mediaKey;
}

/**
 * Posts now, one call per platform. Returns what happened on each (partial success is
 * normal). Throws PostInputError/MediaUploadError only when nothing could be sent
 * (no platform, no caption, or the file itself is unusable).
 */
export async function publishNow(input: PublishInput, deps: PostDeps = defaultDeps): Promise<PostSummary> {
  const { content, platforms, media, tiktok } = validateInput(input);
  let loaded: { blob: Blob; contentType: string } | null = null;
  if (media && platforms.some((p) => takesMedia(p, media))) loaded = await loadMedia(media, deps);

  const outcomes: PostOutcome[] = [];
  let signedOut = false;
  for (const platform of platforms) {
    if (signedOut) {
      outcomes.push({ platform, ok: false, message: POST_MESSAGES.signedOut });
      continue;
    }
    const problem = checkPlatformPost(platform, content, media) ?? checkTikTok(platform, tiktok);
    if (problem) {
      outcomes.push({ platform, ok: false, message: problem });
      continue;
    }
    try {
      const mediaKey = await uploadFor(platform, media, loaded, deps);
      const res = await deps.post<{ postId?: string }>('/api/post/now', {
        content,
        platform,
        ...(mediaKey ? { mediaKey } : {}),
        ...optionsFor(platform, tiktok),
      });
      outcomes.push({ platform, ok: true, postId: res?.postId });
    } catch (e) {
      if (isSignedOut(e)) signedOut = true;
      outcomes.push({ platform, ok: false, message: describePostError(e, platform) });
    }
  }
  return summarize(outcomes, signedOut);
}

export interface ScheduleInput extends PublishInput {
  scheduledAt: Date;
}

/** Minimum lead time: the backend requires a future time, and a few seconds pass while uploading */
const MIN_LEAD_MS = 30_000;

/**
 * Schedules a post. Several platforms without media go in one /api/schedule call;
 * with media (or one platform) each platform is scheduled by itself.
 */
export async function schedulePost(input: ScheduleInput, deps: PostDeps = defaultDeps): Promise<PostSummary> {
  const { content, platforms, media, tiktok } = validateInput(input);
  const when = input.scheduledAt;
  if (!(when instanceof Date) || Number.isNaN(when.getTime()) || when.getTime() < deps.now().getTime() + MIN_LEAD_MS) {
    throw new PostInputError(POST_MESSAGES.pastTime);
  }
  const scheduledAt = when.toISOString();

  const outcomes: PostOutcome[] = [];
  const sendable: string[] = [];
  for (const platform of platforms) {
    const problem = checkPlatformPost(platform, content, media) ?? checkTikTok(platform, tiktok);
    if (problem) outcomes.push({ platform, ok: false, message: problem });
    else sendable.push(platform);
  }

  let signedOut = false;
  const carriesMedia = sendable.some((p) => takesMedia(p, media));

  if (sendable.length > 1 && !carriesMedia) {
    try {
      const res = await deps.post<{ results?: Array<{ platform: string; postId: string }> }>('/api/schedule', {
        content,
        platforms: sendable,
        scheduledAt,
      });
      const done = new Map((res?.results ?? []).map((r) => [r.platform, r.postId]));
      for (const platform of sendable) {
        outcomes.push(
          done.has(platform)
            ? { platform, ok: true, postId: done.get(platform) }
            : { platform, ok: false, message: POST_MESSAGES.notScheduled },
        );
      }
    } catch (e) {
      signedOut = isSignedOut(e);
      // When every platform failed the backend says why for each one
      const perPlatform = new Map<string, { error?: string; code?: string }>();
      if (e instanceof ApiError) {
        const list = (e.body as { errors?: Array<{ platform: string; error?: string; code?: string }> } | null)?.errors;
        for (const item of Array.isArray(list) ? list : []) perPlatform.set(item.platform, item);
      }
      for (const platform of sendable) {
        const item = perPlatform.get(platform);
        const err =
          item && e instanceof ApiError ? new ApiError(e.status, { error: item.error, code: item.code }) : e;
        outcomes.push({ platform, ok: false, message: describePostError(err, platform) });
      }
    }
    return summarize(outcomes, signedOut);
  }

  let loaded: { blob: Blob; contentType: string } | null = null;
  if (media && carriesMedia) loaded = await loadMedia(media, deps);

  for (const platform of sendable) {
    if (signedOut) {
      outcomes.push({ platform, ok: false, message: POST_MESSAGES.signedOut });
      continue;
    }
    try {
      const mediaKey = await uploadFor(platform, media, loaded, deps);
      const res = await deps.post<{ postId?: string }>('/api/post/schedule', {
        content,
        platform,
        scheduledAt,
        ...(mediaKey ? { mediaKey } : {}),
        ...optionsFor(platform, tiktok),
      });
      outcomes.push({ platform, ok: true, postId: res?.postId });
    } catch (e) {
      if (isSignedOut(e)) signedOut = true;
      outcomes.push({ platform, ok: false, message: describePostError(e, platform) });
    }
  }
  return summarize(outcomes, signedOut);
}

/** One toast-sized line about a result, e.g. "Posted to LinkedIn. Threads: Threads is having trouble..." */
export function describeSummary(summary: PostSummary, verb: 'Posted' | 'Scheduled'): string {
  const names = summary.succeeded.map(labelFor).join(', ');
  if (summary.allOk) return `${verb} on ${names}.`;
  const failures = summary.failed.map((f) => `${labelFor(f.platform)}: ${f.message}`).join(' ');
  if (!summary.anyOk) return summary.failed.length === 1 ? summary.failed[0].message : failures;
  return `${verb} on ${names}. ${failures}`;
}

/** The next time the wall clock reads hour:minute (today if still ahead by the lead time, else tomorrow) */
export function nextOccurrence(hour: number, minute: number, now: Date): Date {
  const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (at.getTime() < now.getTime() + MIN_LEAD_MS) at.setDate(at.getDate() + 1);
  return at;
}
