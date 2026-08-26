import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Baseline guideline dimensions (based on standard iPhone 16 / modern Android ~390px width)
const GUIDELINE_BASE_WIDTH = 390;
const GUIDELINE_BASE_HEIGHT = 844;

/**
 * Linear horizontal scale based on screen width.
 */
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size;
};

/**
 * Linear vertical scale based on screen height.
 */
export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT) * size;
};

/**
 * Moderate scale that applies a controlled scaling factor (default 0.4).
 * Prevents elements from shrinking too aggressively on narrow screens or expanding too much on large screens.
 */
export const moderateScale = (size: number, factor = 0.4): number => {
  const scaled = size + (scale(size) - size) * factor;
  return Math.round(scaled * 10) / 10;
};

/**
 * Responsive font scaler that respects device font scale preferences while ensuring
 * single-line text and compact badges do not break or bleed out on narrow screens (e.g. Galaxy Z Fold cover / S8 / SE).
 */
export const sFont = (size: number, factor = 0.35): number => {
  const scaledSize = moderateScale(size, factor);
  // Cap minimum font size to ensure legibility
  return Math.max(7, scaledSize);
};

/**
 * Responsive padding scaler for screen and card padding.
 * Automatically tightens padding on narrow screens (< 360px) to provide more breathing room for content.
 */
export const sPadding = (padding: number): number => {
  if (SCREEN_WIDTH < 350) {
    return Math.max(8, Math.round(padding * 0.75));
  }
  if (SCREEN_WIDTH < 375) {
    return Math.max(10, Math.round(padding * 0.85));
  }
  return padding;
};

/**
 * Device breakpoint flags
 */
export const isNarrowScreen = SCREEN_WIDTH < 350; // e.g. Samsung Galaxy Z Fold cover display (~320-340px)
export const isSmallScreen = SCREEN_WIDTH < 375;  // e.g. iPhone SE, iPhone mini, older Galaxy S8 (~360px)
export const isStandardScreen = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 420; // e.g. iPhone 14/15/16, Galaxy S23/S24
export const isLargeScreen = SCREEN_WIDTH >= 420; // e.g. iPhone 15/16 Pro Max, Galaxy Ultra

export const screenDimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isNarrow: isNarrowScreen,
  isSmall: isSmallScreen,
  isStandard: isStandardScreen,
  isLarge: isLargeScreen,
};

export default {
  scale,
  verticalScale,
  moderateScale,
  sFont,
  sPadding,
  isNarrowScreen,
  isSmallScreen,
  isStandardScreen,
  isLargeScreen,
  screenDimensions,
};
