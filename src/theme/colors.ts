export interface ThemeColors {
  isDark: boolean;
  bg: string;
  bgSecondary: string;
  card: string;
  cardElevated: string;
  cardSurface: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  gold: string;
  goldLight: string;
  surfacePill: string;
  headerBg: string;
  inputBg: string;
  inputBorder: string;
  tabBarBg: string;
}

export const lightTheme: ThemeColors = {
  isDark: false,
  bg: '#FAF8F5',
  bgSecondary: '#F3EFEA',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  cardSurface: '#F8FAFC',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  text: '#171420',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#582CDB',
  primaryLight: '#EDE9FE',
  gold: '#F59E0B',
  goldLight: '#FEF3C7',
  surfacePill: '#F1F5F9',
  headerBg: '#FAF8F5',
  inputBg: '#F8FAFC',
  inputBorder: '#E2E8F0',
  tabBarBg: 'rgba(255, 255, 255, 0.85)',
};

export const darkTheme: ThemeColors = {
  isDark: true,
  bg: '#0C0A12', // Ultra Luxe Midnight Obsidian
  bgSecondary: '#130F1E',
  card: '#161224', // Deep Velvet Slate Card
  cardElevated: '#1F1A30', // Elevated Interactive Card
  cardSurface: '#1C172B',
  border: '#2B2342', // Subtle Violet-Slate Border
  borderSubtle: '#221B35',
  text: '#F8FAFC', // Pure Crisp White
  textSecondary: '#CBD5E1', // High Contrast Light Slate
  textMuted: '#94A3B8', // Refined Muted Slate
  primary: '#7C3AED', // Vivid Royal Purple
  primaryLight: '#2A1D4E',
  gold: '#F59E0B', // Glowing Amber Gold
  goldLight: '#382606',
  surfacePill: '#201A2F',
  headerBg: '#0C0A12',
  inputBg: '#1D172B',
  inputBorder: '#352B50',
  tabBarBg: 'rgba(22, 18, 36, 0.92)',
};

export const getTheme = (isDark: boolean): ThemeColors => (isDark ? darkTheme : lightTheme);

export const colors = {
  primary: '#582CDB',
  primaryDark: '#451FB8',
  primaryLight: '#EDE9FE',
  purpleGlow: '#7C3AED',
  gold: '#F59E0B',
  goldLight: '#FEF3C7',
  amberDark: '#B45309',
  background: '#FAF8F5',
  backgroundCard: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  cardBorderLight: 'rgba(255, 255, 255, 0.8)',
  text: '#171420',
  textPrimary: '#171420',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  white: '#FFFFFF',
  black: '#000000',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  glassLight: 'rgba(255, 255, 255, 0.65)',
  glassMedium: 'rgba(255, 255, 255, 0.8)',
  glassUltra: 'rgba(255, 255, 255, 0.92)',
  glassViolet: 'rgba(88, 44, 219, 0.08)',
  glassVioletBorder: 'rgba(88, 44, 219, 0.2)',
};
