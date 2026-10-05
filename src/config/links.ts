import { Linking, Platform } from 'react-native';

// Pages on the website (www.poststreak.app) the app links to.

export const LEGAL_URLS = {
  Terms: 'https://www.poststreak.app/terms-of-service',
  Privacy: 'https://www.poststreak.app/privacy-policy',
} as const;

/** Opens a website page: a new tab on the web, the browser on a phone. */
export function openWebsitePage(url: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  void Linking.openURL(url).catch(() => {
    // no browser to open it with: nothing more we can do
  });
}
