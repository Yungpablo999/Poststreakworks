import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { ds } from '../../theme/colors';

// The app's glass "light source": the cream background with a few large, very
// soft brand-purple glows that drift slowly. Frosted glass surfaces placed on top
// blur these glows, which is what makes them read as glass.
// Motion is skipped when the device has Reduce Motion turned on.

type Glow = { color: string; opacity: number; size: number; x: number; y: number; drift: number; duration: number };

const GLOWS: Glow[] = [
  { color: ds.purple, opacity: 0.22, size: 1.1, x: -0.25, y: -0.1, drift: 28, duration: 9000 },
  { color: '#A78BFA', opacity: 0.26, size: 0.9, x: 0.55, y: 0.25, drift: 34, duration: 11000 },
  { color: '#C4B5FD', opacity: 0.3, size: 1.0, x: -0.1, y: 0.7, drift: 24, duration: 13000 },
];

function DriftingGlow({ glow, index, width, height }: { glow: Glow; index: number; width: number; height: number }) {
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(0);
  const size = width * glow.size;

  useEffect(() => {
    if (reduceMotion) return;
    t.value = withRepeat(withTiming(1, { duration: glow.duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduceMotion, glow.duration, t]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: (t.value - 0.5) * glow.drift * (index % 2 === 0 ? 1 : -1) },
      { translateY: (t.value - 0.5) * glow.drift },
      { scale: 1 + t.value * 0.06 },
    ],
  }));

  const id = `glassGlow${index}`;
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: glow.x * width, top: glow.y * height, width: size, height: size }, style]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={glow.color} stopOpacity={glow.opacity} />
            <Stop offset="60%" stopColor={glow.color} stopOpacity={glow.opacity * 0.35} />
            <Stop offset="100%" stopColor={glow.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

export function GlassBackdrop() {
  const { width, height } = useWindowDimensions();
  return (
    <View style={[StyleSheet.absoluteFill, styles.base]} pointerEvents="none">
      {GLOWS.map((glow, i) => (
        <DriftingGlow key={i} glow={glow} index={i} width={width} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: ds.bg,
    overflow: 'hidden',
  },
});
