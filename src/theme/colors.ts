export const goldTokens = {
  primary: '#F59E0B',       // Radiant Metallic Amber Gold
  light: '#FEF3C7',         // Soft Cream Gold Surface
  border: '#FDE68A',        // Crisp Gold Border
  dark: '#B45309',          // Deep High-Contrast Bronze Gold Text
  gradient: ['#FBBF24', '#F59E0B', '#D97706'] as [string, string, string],
  lightGradient: ['#FFFBEB', '#FEF3C7'] as [string, string],
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
  bg: '#F7F5F0',
  bgSecondary: '#F0ECE1',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  cardSurface: '#FAF9F6',
  border: '#ECE8E0',
  borderSubtle: 'rgba(23, 20, 32, 0.04)',
  text: '#171420',
  textSecondary: '#5E576E',
  textMuted: '#8E869E',
  primary: '#5B3EE8',
  primaryLight: '#EDE9FE',
  gold: '#F59E0B',
  goldLight: '#FEF3C7',
  surfacePill: '#EDE9FE',
  headerBg: '#F7F5F0',
  inputBg: '#FFFFFF',
  inputBorder: '#ECE8E0',
  tabBarBg: 'rgba(255, 255, 255, 0.92)',
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
  primary: '#5B3EE8', // Single-accent Purple
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
  // Brand single-accent purple
  primary: '#5B3EE8',
  primaryDark: '#451FB8',
  primaryLight: '#EDE9FE',
  purpleGlow: '#5B3EE8',
  
  // Pro Gold
  gold: '#F59E0B',
  goldLight: '#FEF3C7',
  amberDark: '#B45309',
  proGoldGradient: ['#FBBF24', '#F59E0B', '#D97706'] as [string, string, string],
  
  // Layout & Surfaces
  background: '#F7F5F0',
  backgroundCard: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#ECE8E0',
  cardBorderLight: '#ECE8E0',
  
  // Typography
  text: '#171420',
  textPrimary: '#171420',
  textSecondary: '#5E576E',
  textMuted: '#8E869E',
  textWhite: '#FFFFFF',
  
  // Borders
  border: '#ECE8E0',
  borderLight: '#ECE8E0',
  
  // Base
  white: '#FFFFFF',
  black: '#000000',
  
  // Feedback
  success: '#10B981',
  successDark: '#15803D',
  error: '#EF4444',
  warning: '#F59E0B',
  warningDark: '#D97706',
  
  // Pill backgrounds
  purplePillBg: '#EDE9FE',
  purplePillText: '#5B3EE8',
  goldPillBg: '#FEF3C7',
  goldPillText: '#D97706',
  successPillBg: '#DCFCE7',
  successPillText: '#15803D',
  grayPillBg: '#F1F5F9',
  grayPillText: '#475569',
  
  // Glass tokens (subtle only)
  glassLight: 'rgba(255, 255, 255, 0.70)',
  glassMedium: 'rgba(255, 255, 255, 0.85)',
  glassUltra: 'rgba(255, 255, 255, 0.94)',
  glassViolet: 'rgba(91, 62, 232, 0.06)',
  glassVioletBorder: 'rgba(91, 62, 232, 0.14)',
};
