import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Text } from './ui/AppText';
import { colors } from '../theme/colors';

// The PostStreak logo is always the ghost mascot + wordmark together — never the
// ghost on its own. Use this component anywhere the brand mark appears.

type BrandLogoSize = 'sm' | 'md' | 'lg';

const SIZES: Record<BrandLogoSize, { badge: number; ghost: number; word: number; gap: number }> = {
  sm: { badge: 30, ghost: 21, word: 16, gap: 7 },
  md: { badge: 34, ghost: 24, word: 18, gap: 8 },
  lg: { badge: 48, ghost: 34, word: 26, gap: 10 },
};

interface BrandLogoProps {
  size?: BrandLogoSize;
  isDark?: boolean;
}

export function BrandLogo({ size = 'md', isDark = false }: BrandLogoProps) {
  const s = SIZES[size];
  return (
    <View
      style={[styles.row, { gap: s.gap }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="PostStreak"
    >
      <View
        style={[
          styles.badge,
          isDark && styles.badgeDark,
          { width: s.badge, height: s.badge, borderRadius: s.badge / 2 },
        ]}
      >
        <Image
          source={require('../../assets/images/jarvis-ghost-clean.png')}
          style={{ width: s.ghost, height: s.ghost }}
          resizeMode="contain"
        />
      </View>
      <Text
        style={[styles.wordmark, { fontSize: s.word }, isDark && styles.wordmarkDark]}
        numberOfLines={1}
      >
        PostStreak
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  badge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDark: {
    backgroundColor: '#1F1A30',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  wordmark: {
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.6,
  },
  wordmarkDark: {
    color: '#FFFFFF',
  },
});
