import { PLATFORM_RULES } from '../api/posts';

// ONE source of truth for the platforms a creator can connect and post to, in display order.
// Mirrors poststreak-web's PLATFORM_META (the six enabled platforms); the posting rules
// (text / image / video) come from PLATFORM_RULES in src/api/posts.ts.

export const POST_PLATFORM_IDS = ['linkedin', 'threads', 'facebook', 'instagram', 'youtube', 'tiktok'] as const;
export type PostPlatformId = (typeof POST_PLATFORM_IDS)[number];

export interface PostPlatform {
  id: PostPlatformId;
  name: string;
  shortName: string;
  /** What the platform is good for (the longer composer modal) */
  format: string;
  multiplier: string;
  bgColor: string;
  gradient?: string[];
}

export const POST_PLATFORMS: PostPlatform[] = [
  { id: 'linkedin', name: 'LinkedIn', shortName: 'LinkedIn', format: 'Posts & Articles', multiplier: 'Professional', bgColor: '#0A66C2' },
  { id: 'threads', name: 'Threads', shortName: 'Threads', format: 'Quotes & Insights', multiplier: 'Strong Fit', bgColor: '#000000' },
  { id: 'facebook', name: 'Facebook', shortName: 'FB', format: 'Reels & Groups', multiplier: 'Community', bgColor: '#1877F2' },
  {
    id: 'instagram',
    name: 'Instagram',
    shortName: 'IG',
    format: 'Reels & Carousel',
    multiplier: 'Recommended',
    bgColor: '#833AB4',
    gradient: ['#833AB4', '#FD1D1D', '#FCAF45'],
  },
  { id: 'youtube', name: 'YouTube', shortName: 'YT', format: 'Shorts & Longform', multiplier: 'High Retention', bgColor: '#FF0000' },
  { id: 'tiktok', name: 'TikTok', shortName: 'TikTok', format: '9:16 Video / Reels', multiplier: 'Best Fit', bgColor: '#000000' },
];

export type ComposerFormat = 'short_video' | 'carousel' | 'image' | 'text' | 'long_video';
const ALL_FORMATS: ComposerFormat[] = ['short_video', 'carousel', 'image', 'text', 'long_video'];

/** Platforms that take a text-only post (LinkedIn, Threads, Facebook) */
export const isTextPlatform = (id: string): boolean => PLATFORM_RULES[id]?.supportsText === true;

export type MediaRequirement = 'none' | 'image_or_video' | 'video';

/**
 * The strictest media need among the platforms (same rules as checkPlatformPost):
 * YouTube/TikTok need a video, Instagram a photo or video, text platforms nothing.
 */
export function mediaRequiredFor(platformIds: string[]): MediaRequirement {
  let need: MediaRequirement = 'none';
  for (const id of platformIds) {
    const rule = PLATFORM_RULES[id];
    if (!rule || rule.supportsText) continue;
    if (rule.video && !rule.image) return 'video';
    need = 'image_or_video';
  }
  return need;
}

/** The formats a post to these platforms can use. Text platforms: anything (text, one image, video). */
export function formatsAllowedFor(platformIds: string[]): ComposerFormat[] {
  // Text platforms take a caption with at most one photo (no video yet)
  if (platformIds.length > 0 && platformIds.every(isTextPlatform)) return ['text', 'image'];
  switch (mediaRequiredFor(platformIds)) {
    case 'video':
      return ['short_video', 'long_video'];
    case 'image_or_video':
      return ['short_video', 'image', 'long_video'];
    default:
      return ALL_FORMATS;
  }
}

/** The format to suggest first: text when only text platforms are chosen, else short video */
export function recommendedFormatFor(platformIds: string[]): ComposerFormat {
  return platformIds.length > 0 && platformIds.every(isTextPlatform) ? 'text' : 'short_video';
}

/** Keeps the current format if these platforms allow it, else the recommended one */
export function resolveFormat(current: ComposerFormat, platformIds: string[]): ComposerFormat {
  return formatsAllowedFor(platformIds).includes(current) ? current : recommendedFormatFor(platformIds);
}
