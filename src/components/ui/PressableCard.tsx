import React from 'react';
import { Pressable, Platform, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// A tappable card wrapper: lifts a little on hover (web), sinks a touch on press
// and springs back. Children can read `hover` to animate their own parts
// (e.g. nudge a chevron or tilt an icon).

interface PressableCardProps {
  onPress?: () => void;
  children: React.ReactNode | ((hover: SharedValue<number>) => React.ReactNode);
  style?: StyleProp<ViewStyle>;
  /** Layout for the outer touch area (e.g. flex: 1 in a row). */
  wrapStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  haptic?: boolean;
}

export function PressableCard({ onPress, children, style, wrapStyle, accessibilityLabel, haptic = true }: PressableCardProps) {
  const reduceMotion = useReducedMotion();
  const hover = useSharedValue(0);
  const press = useSharedValue(0);

  const anim = useAnimatedStyle(() => ({
    transform: [
      { translateY: reduceMotion ? 0 : -3 * hover.value * (1 - press.value) },
      { scale: reduceMotion ? 1 : 1 - 0.025 * press.value },
    ],
  }));

  return (
    <Pressable
      onPress={() => {
        if (haptic && Platform.OS !== 'web') Haptics.selectionAsync();
        onPress?.();
      }}
      onHoverIn={() => (hover.value = withTiming(1, { duration: 180 }))}
      onHoverOut={() => (hover.value = withTiming(0, { duration: 220 }))}
      onPressIn={() => (press.value = withTiming(1, { duration: 90 }))}
      onPressOut={() => (press.value = withSpring(0, { damping: 14, stiffness: 320 }))}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[wrapStyle, Platform.OS === 'web' && onPress ? ({ cursor: 'pointer' } as object) : null]}
    >
      <Animated.View style={[style, anim]}>{typeof children === 'function' ? children(hover) : children}</Animated.View>
    </Pressable>
  );
}
