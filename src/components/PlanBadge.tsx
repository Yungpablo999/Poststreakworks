import React from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from './ui/AppText';
import { ds, goldTokens } from '../theme/colors';
import { sFont } from '../utils/responsive';
import type { UserTier } from '../types/account';

// The creator's plan, shown in the header. It only shows what the server says;
// tapping opens the Jarvis Pro page (to upgrade, or to see the plan they're on).

const LockIcon = ({ color }: { color: string }) => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth={2.6} />
    <Path d="M8 11V8a4 4 0 118 0v3" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
  </Svg>
);

const CrownIcon = ({ color }: { color: string }) => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill={color}>
    <Path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5L3 7z" />
  </Svg>
);

export function PlanBadge({ tier, onPress }: { tier: UserTier; onPress?: () => void }) {
  const isPro = tier === 'pro' || tier === 'founding';
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        onPress?.();
      }}
      disabled={!onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isPro ? 'Your plan: Jarvis Pro' : 'Your plan: Free. See Jarvis Pro'}
      style={({ pressed }) => [
        styles.chip,
        isPro && styles.chipGold,
        pressed && styles.pressed,
        Platform.OS === 'web' && onPress ? ({ cursor: 'pointer' } as object) : null,
      ]}
    >
      {isPro ? <CrownIcon color={goldTokens.dark} /> : <LockIcon color={ds.text2} />}
      <Text style={[styles.label, isPro && { color: goldTokens.dark }]} numberOfLines={1}>
        {isPro ? 'PRO' : 'FREE'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  chipGold: { backgroundColor: goldTokens.light, borderColor: goldTokens.border },
  pressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
  label: { fontSize: sFont(10.5), fontWeight: '800', letterSpacing: 0.6, color: ds.text2 },
});
