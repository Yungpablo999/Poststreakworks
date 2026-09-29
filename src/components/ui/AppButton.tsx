import React from 'react';
import { Pressable, View, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from './AppText';
import { ds, dsRadius } from '../../theme/colors';

// The app's one button. Tactile "ledge" style shared with the website: a solid
// darker edge sits under the button and the press pushes the button into it.
//   primary — brand purple (main action; one per screen)
//   outline — white with a warm border (secondary action)
//   quiet   — lavender, no ledge (low-emphasis)
//   gold    — Pro only (upgrade / Pro features)

type Variant = 'primary' | 'outline' | 'quiet' | 'gold';
type Size = 'md' | 'lg';

interface AppButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const LEDGE = 3;

const VARIANTS: Record<Variant, { bg: string; bgPressed: string; ledge: string | null; text: string; border?: string }> = {
  primary: { bg: ds.purple, bgPressed: ds.purplePressed, ledge: ds.purpleLedge, text: '#FFFFFF' },
  outline: { bg: ds.surface, bgPressed: ds.surface, ledge: ds.line, text: ds.ink, border: ds.line },
  quiet: { bg: ds.lavender, bgPressed: '#E4DEFD', ledge: null, text: ds.purple },
  gold: { bg: ds.gold, bgPressed: '#EA9606', ledge: ds.goldLedge, text: ds.goldInk },
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  iconRight,
  style,
  accessibilityLabel,
}: AppButtonProps) {
  const v = VARIANTS[variant];
  const height = size === 'lg' ? 56 : 46;

  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      style={[styles.wrap, { height: height + (v.ledge ? LEDGE : 0) }, disabled && styles.disabled, style]}
    >
      {({ pressed }) => (
        <>
          {/* The ledge: a solid edge under the face */}
          {v.ledge && <View style={[styles.ledge, { height, backgroundColor: v.ledge }]} />}
          <View
            style={[
              styles.face,
              {
                height,
                backgroundColor: pressed ? v.bgPressed : v.bg,
                transform: [{ translateY: pressed && v.ledge ? LEDGE - 1 : 0 }],
              },
              v.border && { borderWidth: 1.5, borderColor: v.border },
            ]}
          >
            <Text style={[styles.label, { color: v.text, fontSize: size === 'lg' ? 16 : 15 }]} numberOfLines={1}>
              {title}
            </Text>
            {iconRight}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    position: 'relative',
  },
  ledge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: dsRadius.md,
  },
  face: {
    borderRadius: dsRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  label: {
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
