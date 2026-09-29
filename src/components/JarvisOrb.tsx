import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

// Jarvis, the AI assistant, is the glowing flame orb (as on the website).
// The ghost is the PostStreak brand mascot — don't use it to represent Jarvis.
// The orb gently "breathes": a slow scale + glow pulse, off when Reduce Motion is on.

interface JarvisOrbProps {
  size?: number;
}

export function JarvisOrb({ size = 32 }: JarvisOrbProps) {
  const reduceMotion = useReducedMotion();
  const breath = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    breath.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduceMotion, breath]);

  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + breath.value * 0.08 }] }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + breath.value * 0.45,
    transform: [{ scale: 1 + breath.value * 0.15 }],
  }));

  const glow = size * 1.6;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View pointerEvents="none" style={[styles.center, { width: glow, height: glow }, glowStyle]}>
        <Svg width={glow} height={glow}>
          <Defs>
            <RadialGradient id="jarvisOrbGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#7C5CFF" stopOpacity={0.55} />
              <Stop offset="45%" stopColor="#A78BFA" stopOpacity={0.3} />
              <Stop offset="75%" stopColor="#EC4899" stopOpacity={0.1} />
              <Stop offset="100%" stopColor="#A78BFA" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={glow / 2} cy={glow / 2} r={glow / 2} fill="url(#jarvisOrbGlow)" />
        </Svg>
      </Animated.View>
      <Animated.View style={flameStyle}>
        <Image
          source={require('../../assets/images/jarvis-core-flame.png')}
          style={{ width: size * 1.2, height: size * 1.2 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
