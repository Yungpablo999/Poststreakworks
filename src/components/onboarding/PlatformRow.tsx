import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, ZoomIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { ds } from '../../theme/colors';
import { PlatformLogo, type PlatformLogoType } from './PlatformLogo';

// A glass platform card: the platform, one line about it, and one button. The button shows
// "Connect" (or whatever `idleLabel` says), "Reconnect", a spinner while something is happening,
// or a green tick when it's on. It only draws: what pressing it does is decided by whoever uses
// it (AccountRow connects for real; the sign-up step just remembers a pick).

export type PlatformRowState = 'idle' | 'connected' | 'reconnect';

interface PlatformRowProps {
  name: string;
  description: string;
  logo: PlatformLogoType;
  state: PlatformRowState;
  busy?: boolean;
  /** The button's words when nothing is on yet. */
  idleLabel?: string;
  onPress: () => void;
}

const SPRING = { damping: 15, stiffness: 320 };

export function PlatformRow({ name, description, logo, state, busy = false, idleLabel = 'Connect', onPress }: PlatformRowProps) {
  // Narrow phones: slimmer button
  const compact = useWindowDimensions().width < 360;
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const on = state === 'connected';

  return (
    <Animated.View style={[styles.card, on && styles.cardConnected, pressStyle]}>
      <BlurView intensity={28} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 20.5, overflow: 'hidden' }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: on ? 'rgba(234, 247, 238, 0.7)' : 'rgba(255, 255, 255, 0.58)' }]} />

      <PlatformLogo type={logo} size={44} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
      </View>

      <Pressable
        onPress={busy ? undefined : onPress}
        onPressIn={() => (scale.value = withSpring(0.97, SPRING))}
        onPressOut={() => (scale.value = withSpring(1, SPRING))}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={state === 'reconnect' ? `Reconnect ${name}` : on ? `${name} connected. Tap to disconnect` : `${idleLabel} ${name}`}
        accessibilityState={{ busy, checked: on }}
        style={[styles.action, compact && styles.actionCompact, on ? styles.actionConnected : styles.actionIdle, on && styles.actionTickOnly]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={ds.purple} />
        ) : state === 'reconnect' ? (
          <Text style={styles.actionText}>Reconnect</Text>
        ) : on ? (
          // Connected = a green tick on every screen size (user preference)
          <Animated.View entering={ZoomIn.duration(240).easing(Easing.out(Easing.cubic))} style={styles.connectedInner}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Animated.View>
        ) : (
          <Text style={styles.actionText}>{idleLabel}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#3F25BF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  cardConnected: {
    borderColor: 'rgba(31, 157, 85, 0.45)',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: ds.ink,
  },
  description: {
    fontSize: 12.5,
    lineHeight: 17,
    color: ds.text2,
    marginTop: 2,
  },
  action: {
    minWidth: 104,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  actionCompact: {
    minWidth: 84,
    paddingHorizontal: 10,
  },
  actionTickOnly: {
    minWidth: 40,
    width: 40,
    paddingHorizontal: 0,
  },
  actionIdle: {
    borderWidth: 1.5,
    borderColor: ds.purple,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  actionConnected: {
    backgroundColor: ds.greenFill,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '800',
    color: ds.purple,
  },
  connectedInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});
