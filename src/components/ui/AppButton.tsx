import React from 'react';
import { Pressable, View, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
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
// Motion: on hover (web) the face lifts and brightens and the icon nudges right;
// on press it springs down into the ledge and back.

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
const HOVER_LIFT = 2;
const SPRING = { damping: 14, stiffness: 380, mass: 0.6 };

const VARIANTS: Record<Variant, { bg: string; bgPressed: string; ledge: string | null; text: string; border?: string }> = {
  primary: { bg: ds.purple, bgPressed: ds.purplePressed, ledge: ds.purpleLedge, text: '#FFFFFF' },
  outline: { bg: ds.surface, bgPressed: '#F3F0EA', ledge: ds.line, text: ds.ink, border: ds.line },
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

  const reduceMotion = useReducedMotion();
  // 0 = resting, 1 = fully pressed / hovered
  const press = useSharedValue(0);
  const hover = useSharedValue(0);

  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const pressDepth = v.ledge ? LEDGE : 0;

  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: press.value * pressDepth - hover.value * (1 - press.value) * (v.ledge ? HOVER_LIFT : 0) },
      { scale: reduceMotion ? 1 : interpolate(press.value, [0, 1], [1, 0.985]) },
    ],
  }));

  const shineStyle = useAnimatedStyle(() => ({ opacity: hover.value * (1 - press.value) }));
  const shadeStyle = useAnimatedStyle(() => ({ opacity: press.value }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: reduceMotion ? 0 : hover.value * 3 }],
  }));

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => {
        press.value = withTiming(1, { duration: 80 });
      }}
      onPressOut={() => {
        press.value = withSpring(0, SPRING);
      }}
      onHoverIn={() => {
        if (!disabled) hover.value = withTiming(1, { duration: 160 });
      }}
      onHoverOut={() => {
        hover.value = withTiming(0, { duration: 200 });
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      style={[
        styles.wrap,
        { height: height + (v.ledge ? LEDGE : 0) },
        Platform.OS === 'web' && ({ cursor: disabled ? 'not-allowed' : 'pointer' } as object),
        disabled && styles.disabled,
        style,
      ]}
    >
      {/* The ledge: a solid edge under the face */}
      {v.ledge && <View style={[styles.ledge, { height, backgroundColor: v.ledge }]} />}
      <Animated.View
        style={[
          styles.face,
          { height, backgroundColor: v.bg },
          v.border && { borderWidth: variant === 'glass' ? 1 : 1.5, borderColor: v.border },
          styles.clip,
          faceStyle,
        ]}
      >
        {variant === 'glass' && <BlurView intensity={30} tint="light" style={styles.glassBlur} />}
        {/* Hover shine and press shade, faded in by the animation */}
        <Animated.View pointerEvents="none" style={[styles.overlay, { backgroundColor: SHINE[variant] }, shineStyle]} />
        <Animated.View pointerEvents="none" style={[styles.overlay, { backgroundColor: v.bgPressed }, shadeStyle]} />
        <Text style={[styles.label, { color: v.text, fontSize: size === 'lg' ? 16 : 15 }]} numberOfLines={1}>
          {title}
        </Text>
        {iconRight && <Animated.View style={iconStyle}>{iconRight}</Animated.View>}
      </Animated.View>
    </Pressable>
  );
}

// Hover tint per variant (a light wash over the face)
const SHINE: Record<Variant, string> = {
  primary: 'rgba(255, 255, 255, 0.10)',
  outline: 'rgba(91, 62, 232, 0.05)',
  quiet: 'rgba(255, 255, 255, 0.35)',
  gold: 'rgba(255, 255, 255, 0.14)',
  glass: 'rgba(255, 255, 255, 0.45)',
};

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
  clip: {
    overflow: 'hidden',
  },
  // iOS's blur ignores the parent's rounded clip, so it gets its own corners
  glassBlur: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: dsRadius.md - 1, overflow: 'hidden' },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});
