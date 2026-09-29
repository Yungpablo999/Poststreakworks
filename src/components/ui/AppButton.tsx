import React from 'react';
import { Pressable, View, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Text } from './AppText';
import { ds, dsRadius } from '../../theme/colors';

// The app's one button. Tactile "ledge" style shared with the website: a solid
// darker edge sits under the button and the press pushes the button into it.
//   primary — brand purple (main action; one per screen)
//   outline — white with a warm border (secondary action)
//   quiet   — lavender, no ledge (low-emphasis)
//   gold    — Pro only (upgrade / Pro features)
//   glass   — frosted, for secondary actions on glass screens

type Variant = 'primary' | 'outline' | 'quiet' | 'gold' | 'glass';
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
  glass: { bg: 'rgba(255, 255, 255, 0.55)', bgPressed: 'rgba(255, 255, 255, 0.75)', ledge: 'rgba(63, 37, 191, 0.14)', text: ds.ink, border: 'rgba(255, 255, 255, 0.9)' },
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
              v.border && { borderWidth: variant === 'glass' ? 1 : 1.5, borderColor: v.border },
              variant === 'glass' && styles.glassClip,
            ]}
          >
            {variant === 'glass' && <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />}
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
  glassClip: {
    overflow: 'hidden',
  },
});
