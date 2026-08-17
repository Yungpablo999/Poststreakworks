import { Platform, ViewStyle } from 'react-native';
import { colors } from './colors';

export const glassmorphism = {
  // Frosted Glass Background Colors
  frostedLight: colors.glassLight,
  frostedMedium: colors.glassMedium,
  frostedUltra: colors.glassUltra,
  frostedViolet: colors.glassViolet,
  
  // Specular Glass Borders
  borderLight: colors.cardBorderLight,
  borderSubtle: colors.cardBorder,
  borderDark: colors.glassVioletBorder,
  
  // Standard Glass Card Style Preset
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#171420',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 24,
      },
      android: {
        elevation: 3,
      },
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 10px 30px rgba(23, 20, 32, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
      } as any,
    }),
  } as ViewStyle,

  // Floating Glass Lens Preset
  lens: {
    backgroundColor: colors.glassUltra,
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: colors.cardBorderLight,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.08,
        shadowRadius: 32,
      },
      android: {
        elevation: 6,
      },
      web: {
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 14px 40px rgba(88, 44, 219, 0.08), inset 0 1.5px 1.5px rgba(255, 255, 255, 1)',
      } as any,
    }),
  } as ViewStyle,

  // Glass Badge / Pill Preset
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    ...Platform.select({
      ios: {
        shadowColor: '#171420',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 16px rgba(23, 20, 32, 0.03), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
      } as any,
    }),
  } as ViewStyle,

  // Glass Bottom Navigation Bar Preset
  navbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(235, 230, 245, 0.9)',
    ...Platform.select({
      ios: {
        shadowColor: '#171420',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.06,
        shadowRadius: 28,
      },
      android: {
        elevation: 10,
      },
      web: {
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 -8px 32px rgba(23, 20, 32, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
      } as any,
    }),
  } as ViewStyle,

  // Backward Compatible Shadow Presets
  shadowBadge: {
    ...Platform.select({
      ios: {
        shadowColor: '#171420',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 16px rgba(23, 20, 32, 0.03)',
      } as any,
    }),
  } as ViewStyle,

  shadowLens: {
    ...Platform.select({
      ios: {
        shadowColor: '#582CDB',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.08,
        shadowRadius: 32,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 14px 40px rgba(88, 44, 219, 0.08)',
      } as any,
    }),
  } as ViewStyle,

  shadowCard: {
    ...Platform.select({
      ios: {
        shadowColor: '#171420',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 24,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 10px 30px rgba(23, 20, 32, 0.04)',
      } as any,
    }),
  } as ViewStyle,
};
