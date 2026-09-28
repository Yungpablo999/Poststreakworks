import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Text } from './ui/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { isNarrowScreen, sFont } from '../utils/responsive';

export type UserPersona = 'returning' | 'new';
export type UserTier = 'free' | 'pro' | 'founding';

export interface HeaderDualModePillsProps {
  tier?: UserTier;
  persona?: UserPersona;
  onToggleTier?: () => void;
  onTogglePersona?: () => void;
  isDark?: boolean;
}

export const HeaderDualModePills: React.FC<HeaderDualModePillsProps> = ({
  tier = 'free',
  persona = 'returning',
  onToggleTier,
  onTogglePersona,
  isDark = false,
}) => {
  const isPro = tier === 'pro' || tier === 'founding';
  const isNew = persona === 'new';

  const handleTierPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onToggleTier?.();
  };

  const handlePersonaPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onTogglePersona?.();
  };

  return (
    <View style={styles.container}>
      {/* Tier Switcher Pill: Free <-> Pro */}
      <Pressable
        onPress={handleTierPress}
        hitSlop={6}
        style={({ pressed }) => [styles.pillPressable, pressed && styles.pillPressed]}
      >
        {isPro ? (
          <LinearGradient
            colors={['#F59E0B', '#F59E0B', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.proBadge}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, lineHeight: 16 }}>👑</Text>
              </View>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.freeBadge, isDark && styles.freeBadgeDark]}>
            <Text style={[styles.freeBadgeText, isDark && styles.freeBadgeTextDark]}>
              {isNarrowScreen ? '🔒 PRO' : '🔒 FREE (PRO)'}
            </Text>
          </View>
        )}
      </Pressable>

      {/* User Persona Switcher Pill: Returning <-> New */}
      <Pressable
        onPress={handlePersonaPress}
        hitSlop={6}
        style={({ pressed }) => [styles.pillPressable, pressed && styles.pillPressed]}
      >
        {isNew ? (
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.newBadge}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, lineHeight: 16 }}>✨</Text>
              </View>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.returningBadge, isDark && styles.returningBadgeDark]}>
            <Text style={[styles.returningBadgeText, isDark && styles.returningBadgeTextDark]}>
              {isNarrowScreen ? '👤 RET' : '👤 RETURNING'}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillPressable: {
    borderRadius: 100,
  },
  pillPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  proBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  proBadgeText: {
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '800',
    fontSize: sFont(11),
    color: '#0F0E17',
    letterSpacing: 0.3,
  },
  freeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeBadgeDark: {
    backgroundColor: '#1E1B2E',
    borderColor: '#38324E',
  },
  freeBadgeText: {
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '700',
    fontSize: sFont(11),
    color: '#64748B',
    letterSpacing: 0.2,
  },
  freeBadgeTextDark: {
    color: '#CBD5E1',
  },
  newBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#34D399',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  newBadgeText: {
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '800',
    fontSize: sFont(11),
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  returningBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  returningBadgeDark: {
    backgroundColor: '#1A1830',
    borderColor: '#4338CA',
  },
  returningBadgeText: {
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '700',
    fontSize: sFont(10.5),
    color: '#4F46E5',
    letterSpacing: 0.2,
  },
  returningBadgeTextDark: {
    color: '#A5B4FC',
  },
});
