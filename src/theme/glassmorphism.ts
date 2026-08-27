import { Platform, ViewStyle } from 'react-native';
import { colors } from './colors';

export const glassmorphism = {
  // Glass Materials Level System (Apple-inspired)
  level0: {
    backgroundColor: '#FAF8F5',
  } as ViewStyle,

  // Level 1: Subtle Translucent Surface (Secondary containers, supporting chips, navigation surfaces)
  level1: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#171420',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        boxShadow: '0 4px 16px rgba(23, 20, 32, 0.03)',
      } as any,
    }),
  } as ViewStyle,

  // Level 2: Interactive Card Surface (Standard cards, Interactive controls)
  level2: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    ...Platform.select({
      ios: {
        shadowColor: '#171420',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 6px 20px rgba(23, 20, 32, 0.04)',
      } as any,
    }),
  } as ViewStyle,

  // Level 3: Floating Material (Sheets, Modals, Floating action bars)
  level3: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    ...Platform.select({
      ios: {
        shadowColor: '#171420',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
      web: {
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: '0 10px 30px rgba(23, 20, 32, 0.07)',
      } as any,
    }),
  } as ViewStyle,

  // Level 4: Premium Hero Material (Pro VIP cards, Major milestones, XP crowns)
  level4: {
    backgroundColor: 'rgba(22, 18, 36, 0.94)',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.28)',
    ...Platform.select({
      ios: {
        shadowColor: '#582CDB',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.14,
        shadowRadius: 30,
      },
      android: {
        elevation: 8,
      },
      web: {
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        boxShadow: '0 12px 36px rgba(88, 44, 219, 0.12)',
      } as any,
    }),
  } as ViewStyle,

  // Presets & Backward Compatibility
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  } as ViewStyle,

  lens: {
    backgroundColor: colors.glassUltra,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: colors.cardBorderLight,
  } as ViewStyle,

  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  } as ViewStyle,

  navbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.06)',
  } as ViewStyle,

  shadowBadge: {
    ...Platform.select({
      ios: {
        shadowColor: '#171420',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 14px rgba(23, 20, 32, 0.03)',
      } as any,
    }),
  } as ViewStyle,

  shadowLens: {
    ...Platform.select({
      ios: {
        shadowColor: '#582CDB',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 24,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 10px 28px rgba(88, 44, 219, 0.06)',
      } as any,
    }),
  } as ViewStyle,

  shadowCard: {
    ...Platform.select({
      ios: {
        shadowColor: '#171420',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 6px 20px rgba(23, 20, 32, 0.04)',
      } as any,
    }),
  } as ViewStyle,
};
