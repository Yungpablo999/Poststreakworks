export const goldTokens = {
  primary: '#F59E0B',       // Radiant Metallic Amber Gold
  light: '#FEF3C7',         // Soft Cream Gold Surface
  border: '#FDE68A',        // Crisp Gold Border
  dark: '#B45309',          // Deep High-Contrast Bronze Gold Text
  gradient: ['#FBBF24', '#F59E0B', '#D97706'] as [string, string, string],
  darkSurface: 'rgba(245, 158, 11, 0.15)',
  darkBorder: 'rgba(245, 158, 11, 0.30)',
};

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
  bg: '#FAF9FD',
  bgSecondary: '#F4F2F9',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  cardSurface: '#F9F8FD',
  border: 'rgba(23, 20, 32, 0.08)',
  borderSubtle: 'rgba(23, 20, 32, 0.04)',
  text: '#171420',
  textSecondary: '#5E576E',
  textMuted: '#8E869E',
  primary: '#582CDB',
  primaryLight: '#F4F0FF',
  gold: '#F59E0B',
  goldLight: '#FEF3C7',
  surfacePill: '#F2EFF9',
  headerBg: '#FAF9FD',
  inputBg: '#FFFFFF',
  inputBorder: 'rgba(23, 20, 32, 0.09)',
  tabBarBg: 'rgba(255, 255, 255, 0.88)',
};

export const darkTheme: ThemeColors = {
  isDark: true,
  bg: '#0C0A12', // Ultra Luxe Midnight Obsidian
  bgSecondary: '#130F1E',
  card: '#161224', // Deep Velvet Slate Card
  cardElevated: '#1F1A30', // Elevated Interactive Card
  cardSurface: '#1C172B',
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
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
  primaryLight: '#F4F0FF',
  purpleGlow: '#7C3AED',
  gold: '#F59E0B',
  goldLight: '#FEF3C7',
  amberDark: '#B45309',
  background: '#FAF9FD',
  backgroundCard: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: 'rgba(23, 20, 32, 0.07)',
  cardBorderLight: 'rgba(255, 255, 255, 0.8)',
  text: '#171420',
  textPrimary: '#171420',
  textSecondary: '#5E576E',
  textMuted: '#8E869E',
  textWhite: '#FFFFFF',
  border: 'rgba(23, 20, 32, 0.08)',
  borderLight: 'rgba(23, 20, 32, 0.04)',
  white: '#FFFFFF',
  black: '#000000',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  glassLight: 'rgba(255, 255, 255, 0.70)',
  glassMedium: 'rgba(255, 255, 255, 0.85)',
  glassUltra: 'rgba(255, 255, 255, 0.94)',
  glassViolet: 'rgba(88, 44, 219, 0.06)',
  glassVioletBorder: 'rgba(88, 44, 219, 0.14)',
};
