import { Platform, ViewStyle } from 'react-native';
import { colors } from './colors';

export const shadows: Record<string, ViewStyle> = {
  glassBadge: {
    ...Platform.select({
      ios: {
        shadowColor: '#1A1720',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 8px 24px rgba(26, 23, 32, 0.08)',
      } as any,
    }),
  },
  primaryButton: {
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 10px 24px rgba(95, 58, 221, 0.32)',
      } as any,
    }),
  },
  secondaryButton: {
    ...Platform.select({
      ios: {
        shadowColor: '#1A1720',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 12px rgba(26, 23, 32, 0.04)',
      } as any,
    }),
  },
  mascotHalo: {
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 36,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 12px 40px rgba(95, 58, 221, 0.15)',
      } as any,
    }),
  },
};
