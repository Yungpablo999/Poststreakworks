import { Platform, ViewStyle } from 'react-native';

export const glassmorphism = {
  // Frosted Glass Background Colors
  frostedLight: 'rgba(255, 255, 255, 0.72)',
  frostedMedium: 'rgba(255, 255, 255, 0.55)',
  frostedUltra: 'rgba(255, 255, 255, 0.88)',
  frostedViolet: 'rgba(95, 58, 221, 0.08)',
  
  // Specular Glass Borders
  borderLight: 'rgba(255, 255, 255, 0.85)',
  borderSubtle: 'rgba(225, 218, 235, 0.65)',
  borderDark: 'rgba(95, 58, 221, 0.15)',
  
  // Glass Shadows
  shadowLens: {
    ...Platform.select({
      ios: {
        shadowColor: '#5F3ADD',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 28,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 12px 32px rgba(95, 58, 221, 0.10), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
      } as any,
    }),
  } as ViewStyle,

  shadowBadge: {
    ...Platform.select({
      ios: {
        shadowColor: '#1A1720',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.07,
        shadowRadius: 18,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 8px 24px rgba(26, 23, 32, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
      } as any,
    }),
  } as ViewStyle,

  shadowNav: {
    ...Platform.select({
      ios: {
        shadowColor: '#1A1720',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 -6px 28px rgba(26, 23, 32, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.85)',
      } as any,
    }),
  } as ViewStyle,
};
