import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from './ui/AppText';
import { ds, goldTokens } from '../theme/colors';
import { isNarrowScreen, sFont } from '../utils/responsive';
import { BACKEND } from '../config/backend';

// Two small preview switches in the header: Free ↔ Pro and Returning ↔ New.
// Glass chips with drawn icons (no emoji); gold only appears in Pro mode.

export type UserPersona = 'returning' | 'new';
export type UserTier = 'free' | 'pro' | 'founding';

export interface HeaderDualModePillsProps {
  tier?: UserTier;
  persona?: UserPersona;
  onToggleTier?: () => void;
  onTogglePersona?: () => void;
  isDark?: boolean;
}

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

const PersonIcon = ({ color }: { color: string }) => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21a8 8 0 10-16 0" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
    <Path d="M12 12a4 4 0 100-8 4 4 0 000 8z" stroke={color} strokeWidth={2.6} />
  </Svg>
);

function Chip({
  onPress,
  label,
  icon,
  tone,
  a11y,
}: {
  onPress: () => void;
  label: string;
  icon: React.ReactNode;
  tone: 'glass' | 'gold' | 'lavender';
  a11y: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => [
        styles.chip,
        tone === 'gold' && styles.chipGold,
        tone === 'lavender' && styles.chipLavender,
        pressed && styles.pressed,
        Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
      ]}
    >
      {icon}
      <Text
        style={[
          styles.label,
          tone === 'gold' && { color: goldTokens.dark },
          tone === 'lavender' && { color: ds.purple },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export const HeaderDualModePills: React.FC<HeaderDualModePillsProps> = ({
  tier = 'free',
  persona = 'returning',
  onToggleTier,
  onTogglePersona,
}) => {
  const isPro = tier === 'pro' || tier === 'founding';
  const isNew = persona === 'new';

  const buzz = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
  };

  // These are preview switches for the sample-data build. A signed-in account's
  // plan comes from the server, so there's nothing to switch.
  if (BACKEND.enabled) return null;

  return (
    <View style={styles.container}>
      <Chip
        onPress={() => {
          buzz();
          onToggleTier?.();
        }}
        tone={isPro ? 'gold' : 'glass'}
        icon={isPro ? <CrownIcon color={goldTokens.dark} /> : <LockIcon color={ds.text2} />}
        label={isPro ? 'PRO' : 'FREE'}
        a11y={isPro ? 'Pro mode. Switch to Free' : 'Free mode. Switch to Pro'}
      />
      <Chip
        onPress={() => {
          buzz();
          onTogglePersona?.();
        }}
        tone={isNew ? 'lavender' : 'glass'}
        icon={isNew ? <View style={styles.newDot} /> : <PersonIcon color={ds.text2} />}
        label={isNew ? 'NEW' : isNarrowScreen ? 'RET' : 'RETURNING'}
        a11y={isNew ? 'New creator view. Switch to returning' : 'Returning creator view. Switch to new'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  chipLavender: { backgroundColor: 'rgba(237, 233, 254, 0.9)', borderColor: '#D9D0FD' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
  label: { fontSize: sFont(10.5), fontWeight: '800', letterSpacing: 0.6, color: ds.text2 },
  newDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ds.green },
});
