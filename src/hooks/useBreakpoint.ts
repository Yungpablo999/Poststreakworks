import { Platform, useWindowDimensions } from 'react-native';

// Screen size buckets for the responsive layout.
//   phone   — under 700px: the app as designed (bottom tab bar, one column)
//   tablet  — 700 to 1099px: bottom tab bar, content centred at a comfy width
//   desktop — 1100px and up: side menu instead of the tab bar, wider content
export type Breakpoint = 'phone' | 'tablet' | 'desktop';

export const DESKTOP_MIN = 1100;
export const TABLET_MIN = 700;
/** Width of the desktop side menu */
export const SIDEBAR_W = 256;

export function breakpointFor(width: number): Breakpoint {
  if (width >= DESKTOP_MIN) return 'desktop';
  if (width >= TABLET_MIN) return 'tablet';
  return 'phone';
}

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return breakpointFor(width);
}

/** Width available to a screen's content (the window minus the side menu on desktop) */
export function useContentWidth(): number {
  const { width } = useWindowDimensions();
  const bp = breakpointFor(width);
  return bp === 'desktop' || (Platform.OS === 'web' && bp === 'tablet') ? width - SIDEBAR_W : width;
}

/** Focused pages (studios, details) sit in a 560px column on phones and
 *  tablets; on desktop they open up to 780px so a big screen isn't mostly empty. */
export function usePageWidth(): { maxWidth: number } | null {
  return useBreakpoint() === 'desktop' ? { maxWidth: 780 } : null;
}

// ─── The web app ─────────────────────────────────────────────────────────────
// In a browser PostStreak is a web app at every size: a web header and menu
// instead of the phone app's floating tab bar and header. Add ?preview=app to
// the address to see the phone app's own design in a browser (for design work).

const previewApp =
  Platform.OS === 'web' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'app';

/** True in a browser (unless previewing the phone app with ?preview=app) */
export const IS_WEB_APP = Platform.OS === 'web' && !previewApp;

/** The web app's chrome (web header, side menu or drawer) replaces the phone app's */
export function useWebChrome(): boolean {
  const bp = useBreakpoint();
  return IS_WEB_APP || bp === 'desktop';
}

/** Web app with a permanent side menu: tablets and up. Phones get a drawer. */
export function useWebSidebar(): boolean {
  const bp = useBreakpoint();
  return bp === 'desktop' || (IS_WEB_APP && bp === 'tablet');
}
