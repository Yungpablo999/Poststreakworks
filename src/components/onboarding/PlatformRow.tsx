import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, ZoomIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { ds } from '../../theme/colors';
import { PlatformLogo, type PlatformLogoType } from './PlatformLogo';

// A glass platform card. "Connect" shows a short connecting spinner, then a
// green tick pops in. Tapping the tick disconnects.
// (Mock: a real backend would run the platform's sign-in here.)

interface PlatformRowProps {
  name: string;
  description: string;
  logo: PlatformLogoType;
  connected: boolean;
  onToggle: () => void;
}

const CONNECT_MS = 750;
const SPRING = { damping: 15, stiffness: 320 };

export function PlatformRow({ name, description, logo, connected, onToggle }: PlatformRowProps) {
  const [connecting, setConnecting] = useState(false);
  // Narrow phones: slimmer Connect button
  const compact = useWindowDimensions().width < 360;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handlePress = () => {
    if (connecting) return;
    if (connected) {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggle();
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConnecting(true);
    timer.current = setTimeout(() => {
      setConnecting(false);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onToggle();
    }, CONNECT_MS);
  };

  return (
    <Animated.View style={[styles.card, connected && styles.cardConnected, pressStyle]}>
      <BlurView intensity={28} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 20.5, overflow: 'hidden' }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: connected ? 'rgba(234, 247, 238, 0.7)' : 'rgba(255, 255, 255, 0.58)' }]} />

      <PlatformLogo type={logo} size={44} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
      </View>

      <Pressable
        onPress={handlePress}
        onPressIn={() => (scale.value = withSpring(0.97, SPRING))}
        onPressOut={() => (scale.value = withSpring(1, SPRING))}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={connected ? `${name} connected. Tap to disconnect` : `Connect ${name}`}
        accessibilityState={{ busy: connecting, checked: connected }}
        style={[styles.action, compact && styles.actionCompact, connected ? styles.actionConnected : styles.actionIdle, connected && styles.actionTickOnly]}
      >
        {connecting ? (
          <ActivityIndicator size="small" color={ds.purple} />
        ) : connected ? (
          // Connected = a green tick on every screen size (user preference)
          <Animated.View entering={ZoomIn.duration(240).easing(Easing.out(Easing.cubic))} style={styles.connectedInner}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Animated.View>
        ) : (
          <Text style={styles.actionText}>Connect</Text>
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
