import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_400Regular_Italic,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_500Medium_Italic,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_600SemiBold_Italic,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_700Bold_Italic,
  PlusJakartaSans_800ExtraBold,
  PlusJakartaSans_800ExtraBold_Italic,
} from '@expo-google-fonts/plus-jakarta-sans';
import { PlayfairDisplay_700Bold_Italic } from '@expo-google-fonts/playfair-display';

// Every font the app loads at startup. Plus Jakarta Sans is the only UI font;
// Playfair Display italic is reserved for the word "Earn." (see fonts.earn).
export const fontAssets = {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_400Regular_Italic,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_500Medium_Italic,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_600SemiBold_Italic,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_700Bold_Italic,
  PlusJakartaSans_800ExtraBold,
  PlusJakartaSans_800ExtraBold_Italic,
  PlayfairDisplay_700Bold_Italic,
};

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
  earn: 'PlayfairDisplay_700Bold_Italic',
};

const WEIGHT_NAMES: Record<number, string> = {
  400: '400Regular',
  500: '500Medium',
  600: '600SemiBold',
  700: '700Bold',
  800: '800ExtraBold',
};

const normalizeWeight = (weight: string | number | undefined): number => {
  if (weight === undefined || weight === 'normal') return 400;
  if (weight === 'bold') return 700;
  const n = typeof weight === 'number' ? weight : parseInt(weight, 10);
  if (Number.isNaN(n)) return 400;
  // Plus Jakarta Sans ships 200–800; clamp lighter/heavier requests to the UI range.
  return Math.min(800, Math.max(400, Math.round(n / 100) * 100));
};

// Custom fonts load as one family per weight, so a fontWeight on its own does
// nothing. This turns a weight + style into the matching Plus Jakarta Sans face.
export const jakartaFamily = (weight?: string | number, italic?: boolean): string =>
  `PlusJakartaSans_${WEIGHT_NAMES[normalizeWeight(weight)]}${italic ? '_Italic' : ''}`;

// Family names that should be treated as "the brand sans" and remapped.
export const isBrandSansFamily = (family?: string): boolean =>
  !family || family === 'System' || family.includes('Plus Jakarta Sans') || family.startsWith('PlusJakartaSans_');
