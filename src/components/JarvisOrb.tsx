import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// Jarvis, the AI assistant, is the glowing flame orb (as on the website).
// The ghost is the PostStreak brand mascot — don't use it to represent Jarvis.
//
// Matches the website's orb: no backdrop behind it; the flame itself glows and
// "breathes" every 2.6s (grows ~8%, glow brightens and picks up pink + gold).
//   • Web: the website's exact CSS drop-shadow filter, animated.
//   • iOS/Android: drop-shadow filters aren't available, so blurred, tinted
//     copies of the flame sit behind it to make a glow that hugs its shape.
// Reduce Motion keeps the resting glow and stops the breathing.

const FLAME = require('../../assets/images/jarvis-core-flame.png');
const BREATH_MS = 1300; // half of the website's 2.6s cycle

interface JarvisOrbProps {
  size?: number;
}

export function JarvisOrb({ size = 32 }: JarvisOrbProps) {
  const reduceMotion = useReducedMotion();
  const breath = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    breath.value = withRepeat(withTiming(1, { duration: BREATH_MS, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [reduceMotion, breath]);

  const img = size * 1.2; // the site renders the flame at 1.2× the orb box
  const layer = { width: img, height: img };

  // Website values: rest → peak (see PostIT-web home.css @keyframes ap-orb-glow)
  const webFlameStyle = useAnimatedStyle(() => {
    const b = breath.value;
    return {
      transform: [{ scale: 1 + b * 0.08 }],
      filter:
        `saturate(${1.4 + b * 0.2}) brightness(${1.05 + b * 0.15}) ` +
        `drop-shadow(0 0 ${2 + b * 2}px rgba(124, 92, 255, ${0.9 + b * 0.1})) ` +
        `drop-shadow(0 0 ${5 + b * 5}px rgba(167, 139, 250, 0.7)) ` +
        `drop-shadow(0 0 ${10 * b}px rgba(236, 72, 153, ${0.75 * b})) ` +
        `drop-shadow(0 0 ${16 * b}px rgba(245, 181, 30, ${0.45 * b}))`,
    } as object;
  });

  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + breath.value * 0.08 }] }));
  const innerGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.75 + breath.value * 0.25,
    transform: [{ scale: 1.04 + breath.value * 0.08 }],
  }));
  const outerGlowStyle = useAnimatedStyle(() => ({
    opacity: breath.value * 0.55,
    transform: [{ scale: 1.12 + breath.value * 0.1 }],
  }));

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Platform.OS === 'web' ? (
        <Animated.Image source={FLAME} resizeMode="contain" style={[layer, webFlameStyle]} />
      ) : (
        <>
          <Animated.Image source={FLAME} resizeMode="contain" blurRadius={Math.max(4, size * 0.22)} style={[styles.layer, layer, { tintColor: '#EC4899' }, outerGlowStyle]} />
          <Animated.Image source={FLAME} resizeMode="contain" blurRadius={Math.max(2, size * 0.1)} style={[styles.layer, layer, { tintColor: '#7C5CFF' }, innerGlowStyle]} />
          <Animated.Image source={FLAME} resizeMode="contain" style={[layer, flameStyle]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
  },
});
