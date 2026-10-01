import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { ds } from '../../theme/colors';

// Round glass notification button. The bell swings when tapped, and the unread
// dot breathes softly so it's noticed without nagging.

const SIZE = 40;

export function BellButton({ unread, onPress }: { unread: boolean; onPress: () => void }) {
  const reduceMotion = useReducedMotion();
  const swing = useSharedValue(0);
  const press = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!unread || reduceMotion) return;
    pulse.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false);
  }, [unread, reduceMotion, pulse]);

  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -6 }, { rotate: `${swing.value}deg` }, { translateY: 6 }],
  }));
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - 0.08 * press.value }] }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: 0.5 * (1 - pulse.value), transform: [{ scale: 1 + 1.2 * pulse.value }] }));

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!reduceMotion) {
      swing.value = withSequence(
        withTiming(16, { duration: 90 }),
        withTiming(-12, { duration: 110 }),
        withTiming(8, { duration: 100 }),
        withTiming(-4, { duration: 90 }),
        withTiming(0, { duration: 80 }),
      );
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => (press.value = withTiming(1, { duration: 80 }))}
      onPressOut={() => (press.value = withTiming(0, { duration: 180 }))}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={unread ? 'Notifications, new' : 'Notifications'}
      style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : undefined}
    >
      <Animated.View style={[styles.btn, btnStyle]}>
        <BlurView intensity={30} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: SIZE / 2, overflow: 'hidden' }]} />
        <Animated.View style={bellStyle}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={ds.ink} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={ds.ink} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>
        {unread && (
          <View style={styles.dotWrap} pointerEvents="none">
            <Animated.View style={[styles.halo, haloStyle]} />
            <View style={styles.dot} />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#3F25BF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  dotWrap: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#FFFFFF' },
});
