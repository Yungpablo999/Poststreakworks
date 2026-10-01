import { useWindowDimensions } from 'react-native';

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
  return breakpointFor(width) === 'desktop' ? width - SIDEBAR_W : width;
}

/** Focused pages (studios, details) sit in a 560px column on phones and
 *  tablets; on desktop they open up to 780px so a big screen isn't mostly empty. */
export function usePageWidth(): { maxWidth: number } | null {
  return useBreakpoint() === 'desktop' ? { maxWidth: 780 } : null;
}
