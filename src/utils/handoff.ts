import { Linking, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

// Hand a planned short video off to the platform's own camera, where trending
// sounds and filters live. The caption + tags are copied first so the creator
// can paste them in.
//
// Mock-stage behaviour: we open the app (its URL scheme, falling back to the
// website). Later, with approved APIs:
//  - TikTok: Content Posting API "upload to drafts" (video.upload scope) sends
//    an uploaded video into TikTok drafts to finish with sounds.
//  - Instagram: Meta "Sharing to Reels" SDK opens the Reels composer with the
//    video loaded (needs a dev build, not Expo Go).
//  - YouTube: no Shorts audio via API; the creator adds sound in the app.

export type HandoffPlatform = 'tiktok' | 'instagram' | 'youtube';

const APP_URL: Record<HandoffPlatform, string> = {
  tiktok: 'snssdk1233://',
  instagram: 'instagram://camera',
  youtube: 'youtube://',
};

const WEB_URL: Record<HandoffPlatform, string> = {
  tiktok: 'https://www.tiktok.com/',
  instagram: 'https://www.instagram.com/',
  youtube: 'https://www.youtube.com/',
};

export const HANDOFF_NAMES: Record<HandoffPlatform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

export const isHandoffPlatform = (id: string): id is HandoffPlatform => id in APP_URL;

export async function handOffToPlatform(platform: HandoffPlatform, captionWithTags: string): Promise<void> {
  try {
    await Clipboard.setStringAsync(captionWithTags);
  } catch {
    // Copy is a convenience; opening the app still helps.
  }
  if (Platform.OS === 'web') {
    window.open(WEB_URL[platform], '_blank', 'noopener');
    return;
  }
  try {
    await Linking.openURL(APP_URL[platform]);
  } catch {
    await Linking.openURL(WEB_URL[platform]);
  }
}
