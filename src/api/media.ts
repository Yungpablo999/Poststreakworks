import { api } from './authFetch';

// Uploads one image or video to R2 and returns the `mediaKey` a post takes
// (POST /api/post/now, /api/post/schedule, /api/schedule).
//
//   1. POST /api/media/upload-url { contentType, sizeBytes }
//        -> { uploadUrl, method, headers, key, publicUrl, expiresAt }
//   2. PUT the file to uploadUrl with exactly those headers and exactly sizeBytes bytes.
//
// Limits are enforced by the backend: JPEG/PNG/WebP up to 20 MB, MP4/MOV up to
// 1 GiB, 30 uploads per hour. The checks here only give a clearer message sooner.

export const ALLOWED_MEDIA_TYPES = ['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 1024 * 1024 * 1024;

export const MEDIA_MESSAGES = {
  unsupportedType: 'Use a JPG, PNG or WebP image, or an MP4 or MOV video.',
  imageTooBig: 'Images can be up to 20 MB.',
  videoTooBig: 'Videos can be up to 1 GB.',
  rateLimited: "You've uploaded a lot in the last hour. Try again later.",
  notConfigured: 'Uploads are not available right now.',
  failed: "Couldn't upload that file. Check your connection and try again.",
} as const;

export class MediaUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaUploadError';
  }
}

export interface UploadedMedia {
  /** Pass this as `mediaKey` when posting */
  mediaKey: string;
  publicUrl: string;
}

export interface UploadMediaInput {
  /** The file bytes. Get one from a picked file's uri with `blobFromUri`. */
  body: Blob;
  /** Defaults to body.type */
  contentType?: string;
}

interface UploadUrlResponse {
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  key: string;
  publicUrl: string;
}

/** Why this file can't be uploaded, or null. Mirrors the backend's rules. */
export function checkMedia(contentType: string, sizeBytes: number): string | null {
  if (!(ALLOWED_MEDIA_TYPES as readonly string[]).includes(contentType)) return MEDIA_MESSAGES.unsupportedType;
  const isVideo = contentType.startsWith('video/');
  if (isVideo && sizeBytes > MAX_VIDEO_BYTES) return MEDIA_MESSAGES.videoTooBig;
  if (!isVideo && sizeBytes > MAX_IMAGE_BYTES) return MEDIA_MESSAGES.imageTooBig;
  return null;
}

/** Reads a picked file (file:// or blob: uri) into a Blob */
export async function blobFromUri(uri: string): Promise<Blob> {
  return (await fetch(uri)).blob();
}

export interface MediaDeps {
  /** Asks the backend for a presigned URL */
  requestUploadUrl: (input: { contentType: string; sizeBytes: number }) => Promise<UploadUrlResponse>;
  fetchImpl: typeof fetch;
}

const defaultDeps: MediaDeps = {
  requestUploadUrl: (input) => api.post<UploadUrlResponse>('/api/media/upload-url', input),
  fetchImpl: (...args) => fetch(...args),
};

export async function uploadMedia(
  { body, contentType = body.type }: UploadMediaInput,
  deps: MediaDeps = defaultDeps,
): Promise<UploadedMedia> {
  const problem = checkMedia(contentType, body.size);
  if (problem) throw new MediaUploadError(problem);

  let target: UploadUrlResponse;
  try {
    target = await deps.requestUploadUrl({ contentType, sizeBytes: body.size });
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 429) throw new MediaUploadError(MEDIA_MESSAGES.rateLimited);
    if (status === 503) throw new MediaUploadError(MEDIA_MESSAGES.notConfigured);
    if (status === 400 && e instanceof Error && e.message) throw new MediaUploadError(MEDIA_MESSAGES.failed);
    throw e;
  }

  let res: Response;
  try {
    res = await deps.fetchImpl(target.uploadUrl, { method: target.method, headers: target.headers, body });
  } catch {
    throw new MediaUploadError(MEDIA_MESSAGES.failed);
  }
  if (!res.ok) throw new MediaUploadError(MEDIA_MESSAGES.failed);

  return { mediaKey: target.key, publicUrl: target.publicUrl };
}
