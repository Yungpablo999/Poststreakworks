import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, ZoomIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { ds } from '../../theme/colors';
import { PlatformLogo, type PlatformLogoType } from './PlatformLogo';
import { BACKEND } from '../../config/backend';
import { useSession } from '../../backend/session';
import { connectTikTok, disconnectTikTok, useAccounts } from '../../backend/accounts';
import { notify } from '../../backend/notice';

// A glass platform card. "Connect" shows a short connecting spinner, then a
// green tick pops in. Tapping the tick disconnects.
//
// Two modes, chosen by whether a creator is signed in to the backend:
//  - sample (no backend, or still signing up): the connection is pretend, as it
//    always was; before an account exists it only records which platforms the
//    creator uses.
//  - real (signed in): TikTok really connects through TikTok's own sign-in page,
//    and the other platforms say they're coming soon instead of pretending.

interface PlatformRowProps {
  name: string;
  description: string;
  logo: PlatformLogoType;
  connected: boolean;
  onToggle: () => void;
}

const CONNECT_MS = 750;
const SPRING = { damping: 15, stiffness: 320 };

/** 1234 → "1.2K", 2500000 → "2.5M" */
function shortCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

/** Asks before removing a real connection. */
function confirmDisconnect(name: string): Promise<boolean> {
  const message = `PostStreak will stop reading your ${name} stats and delete the numbers it saved. You can connect again any time.`;
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`Disconnect ${name}?\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(`Disconnect ${name}?`, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Disconnect', style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }),
  );
}

export function PlatformRow({ name, description, logo, connected, onToggle }: PlatformRowProps) {
  const [connecting, setConnecting] = useState(false);
  // Narrow phones: slimmer Connect button
  const compact = useWindowDimensions().width < 360;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const signedIn = useSession().status === 'signedIn';
  const accounts = useAccounts();
  const real = BACKEND.enabled && signedIn;
  const isTikTok = logo === 'tiktok';
  const comingSoon = real && !isTikTok;
  const tiktok = real && isTikTok ? accounts.find((a) => a.platform === 'tiktok') : undefined;
  const needsReauth = tiktok?.status === 'needs_reauth';

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleReal = async () => {
    if (comingSoon) {
      notify(`${name} is coming soon. TikTok is ready now.`);
      return;
    }
    setConnecting(true);
    try {
      if (connected && !needsReauth) {
        if (await confirmDisconnect(name)) {
          const r = await disconnectTikTok();
          notify(r.ok ? `${name} disconnected` : r.message);
        }
      } else {
        // Reconnecting and first-time connecting are the same trip to TikTok.
        const r = await connectTikTok();
        if (!r.ok) notify(r.message);
      }
    } finally {
      if (alive.current) setConnecting(false);
    }
  };

  const handlePress = () => {
    if (connecting) return;
    if (real) {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void handleReal();
      return;
    }
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

  // A real TikTok connection says who it is: "Lagos Creator · 1.2K followers"
  const realDescription = tiktok
    ? `${tiktok.name ?? 'Connected'}${tiktok.followers != null ? ` · ${shortCount(tiktok.followers)} followers` : ''}`
    : null;
  const shownDescription = comingSoon
    ? 'Coming soon'
    : needsReauth
      ? 'Connect again to keep your stats fresh'
      : realDescription ?? description;
  const showTick = connected && !needsReauth;

  return (
    <Animated.View style={[styles.card, showTick && styles.cardConnected, comingSoon && { opacity: 0.6 }, pressStyle]}>
      <BlurView intensity={28} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 20.5, overflow: 'hidden' }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: showTick ? 'rgba(234, 247, 238, 0.7)' : 'rgba(255, 255, 255, 0.58)' }]} />

      <PlatformLogo type={logo} size={44} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.description} numberOfLines={2}>{shownDescription}</Text>
      </View>

      <Pressable
        onPress={handlePress}
        onPressIn={() => (scale.value = withSpring(0.97, SPRING))}
        onPressOut={() => (scale.value = withSpring(1, SPRING))}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={comingSoon ? `${name} is coming soon` : needsReauth ? `Reconnect ${name}` : connected ? `${name} connected. Tap to disconnect` : `Connect ${name}`}
        accessibilityState={{ busy: connecting, checked: showTick, disabled: comingSoon }}
        style={[styles.action, compact && styles.actionCompact, showTick ? styles.actionConnected : styles.actionIdle, showTick && styles.actionTickOnly]}
      >
        {connecting ? (
          <ActivityIndicator size="small" color={ds.purple} />
        ) : comingSoon ? (
          <Text style={styles.actionText}>Soon</Text>
        ) : needsReauth ? (
          <Text style={styles.actionText}>Reconnect</Text>
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
