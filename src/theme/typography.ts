import { TextStyle, Platform } from 'react-native';

export const typography = {
  fontFamily: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    default: 'System',
  }),

  editorialSerif: Platform.select({
    ios: 'Didot',
    android: 'serif',
    web: "'Playfair Display', 'Bodoni Moda', 'Didot', 'Bodoni MT', Georgia, serif",
    default: 'serif',
  }),

  sizes: {
    hero: 36,
    display: 30,
    title1: 24,
    title2: 20,
    title3: 17,
    headline: 16,
    body: 14,
    callout: 13,
    subhead: 12,
    footnote: 11,
    caption: 10,
  },

  weights: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    heavy: '800' as TextStyle['fontWeight'],
    black: '900' as TextStyle['fontWeight'],
  },

  letterSpacing: {
    tightest: -0.8,
    tight: -0.4,
    normal: 0,
    relaxed: 0.3,
    wide: 0.6,
    widest: 1.0,
  },

  lineHeights: {
    hero: 42,
    display: 36,
    title1: 30,
    title2: 26,
    title3: 22,
    headline: 22,
    body: 20,
    callout: 18,
    subhead: 16,
    caption: 14,
  },
};
