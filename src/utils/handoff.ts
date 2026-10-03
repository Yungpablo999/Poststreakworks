import { Linking, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

// Hand a post to the platform's own app, where the creator posts it (and, for a video, films it with
// the app's sounds and filters). PostStreak doesn't post for the creator: the caption and tags are
// copied first so they can be pasted in, then the app opens. When the creator comes back they say
// whether they posted it.
//
// Opens the app by its link, falling back to the website. Threads takes the text in the link itself
// (its published "web intent"), so the caption is already in the box.

export type HandoffPlatform = 'tiktok' | 'instagram' | 'youtube' | 'threads' | 'facebook';

const APP_URL: Record<Exclude<HandoffPlatform, 'threads'>, string> = {
  tiktok: 'snssdk1233://',
  instagram: 'instagram://camera',
  youtube: 'youtube://',
  facebook: 'fb://',
};

const WEB_URL: Record<HandoffPlatform, string> = {
  tiktok: 'https://www.tiktok.com/',
  instagram: 'https://www.instagram.com/',
  youtube: 'https://www.youtube.com/',
  threads: 'https://www.threads.net/',
  facebook: 'https://www.facebook.com/',
};

export const HANDOFF_NAMES: Record<HandoffPlatform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  threads: 'Threads',
  facebook: 'Facebook',
};

export const HANDOFF_PLATFORMS = Object.keys(HANDOFF_NAMES) as HandoffPlatform[];

export const isHandoffPlatform = (id: string): id is HandoffPlatform => id in HANDOFF_NAMES;

/** Where to open: [the app's link, the website]. */
function targets(platform: HandoffPlatform, text: string): [string, string] {
  if (platform === 'threads') {
    const compose = `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`;
    return [compose, compose];
  }
  return [APP_URL[platform], WEB_URL[platform]];
}

export async function handOffToPlatform(platform: HandoffPlatform, captionWithTags: string): Promise<void> {
  try {
    await Clipboard.setStringAsync(captionWithTags);
  } catch {
    // Copy is a convenience; opening the app still helps.
  }
  const [app, web] = targets(platform, captionWithTags);
  if (Platform.OS === 'web') {
    window.open(web, '_blank', 'noopener');
    return;
  }
  try {
    await Linking.openURL(app);
  } catch {
    await Linking.openURL(web);
  }
}

/** The text a creator pastes: the caption, then the tags. */
export const postText = (caption: string, tags: string[]): string => [caption.trim(), tags.join(' ')].filter(Boolean).join('\n\n');
