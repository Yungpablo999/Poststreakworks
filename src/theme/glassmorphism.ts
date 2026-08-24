import { Platform, ViewStyle } from 'react-native';
import { colors } from './colors';

export const glassmorphism = {
  // Glass Materials Level System (Apple-inspired)
  level0: {
    backgroundColor: '#FAF8F5',
  } as ViewStyle,

  // Level 1: Subtle Translucent Surface (Secondary containers, supporting chips, navigation surfaces)
  level1: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 245, 0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#171420',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
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

  // Level 2: Interactive Glass Surface (Primary Cards, Interactive controls)
  level2: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    ...Platform.select({
      ios: {
        shadowColor: '#171420',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
      },
      android: {
        elevation: 3,
      },
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 24px rgba(23, 20, 32, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
      } as any,
    }),
  } as ViewStyle,

  // Level 3: Floating Material (Sheets, Modals, Floating action bars)
  level3: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...Platform.select({
      ios: {
        shadowColor: '#1F2687',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.10,
        shadowRadius: 28,
      },
      android: {
        elevation: 8,
      },
      web: {
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        boxShadow: '0 12px 36px rgba(31, 38, 135, 0.08), inset 0 1.5px 1.5px rgba(255, 255, 255, 0.95)',
      } as any,
    }),
  } as ViewStyle,

  // Level 4: Premium Hero Material (Pro VIP cards, Major milestones, XP crowns)
  level4: {
    backgroundColor: 'rgba(22, 18, 36, 0.92)',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    ...Platform.select({
      ios: {
        shadowColor: '#582CDB',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.16,
        shadowRadius: 36,
      },
      android: {
        elevation: 10,
      },
      web: {
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        boxShadow: '0 16px 44px rgba(88, 44, 219, 0.14), inset 0 1px 1px rgba(245, 158, 11, 0.25)',
      } as any,
    }),
  } as ViewStyle,

  // Presets & Backward Compatibility
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  } as ViewStyle,

  lens: {
    backgroundColor: colors.glassUltra,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: colors.cardBorderLight,
  } as ViewStyle,

  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  } as ViewStyle,

  navbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(235, 230, 245, 0.9)',
  } as ViewStyle,

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
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 28,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 12px 36px rgba(88, 44, 219, 0.08)',
      } as any,
    }),
  } as ViewStyle,

  shadowCard: {
    ...Platform.select({
      ios: {
        shadowColor: '#171420',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 8px 24px rgba(23, 20, 32, 0.04)',
      } as any,
    }),
  } as ViewStyle,
};
