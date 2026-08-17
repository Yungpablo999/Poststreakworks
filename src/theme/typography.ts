import { TextStyle, Platform } from 'react-native';

export const typography = {
  // Font Family
  fontFamily: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    default: 'System',
  }),

  // Font Sizes & Scales
  sizes: {
    hero: 44,
    title1: 28,
    title2: 22,
    title3: 18,
    headline: 16,
    body: 15,
    callout: 14,
    subhead: 13,
    footnote: 12,
    caption: 11,
    tiny: 10,
  },

  // Font Weights
  weights: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    heavy: '800' as TextStyle['fontWeight'],
  },

  // Letter Spacing
  letterSpacing: {
    tightest: -0.8,
    tight: -0.4,
    normal: 0,
    relaxed: 0.3,
    wide: 0.8,
    widest: 1.2,
  },

  // Line Heights
  lineHeights: {
    hero: 50,
    title1: 34,
    title2: 28,
    title3: 24,
    body: 22,
    callout: 20,
    subhead: 18,
    caption: 15,
  },
};
