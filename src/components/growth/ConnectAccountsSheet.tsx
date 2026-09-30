import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Svg, { Path, Rect } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { PlatformRow } from '../onboarding/PlatformRow';
import { PlatformLogo, type PlatformLogoType } from '../onboarding/PlatformLogo';
import { ds } from '../../theme/colors';

// "Your accounts": connect or disconnect the Stage 1 platforms. Glides up
// from the bottom (no bounce). Each row does its own connect (spinner, then a
// green tick), so there's nothing to save: "Done" just closes.
// (Mock: a real build opens each platform's own sign-in; we never ask for
// passwords or usernames here.)

export interface SheetPlatform {
  id: string;
  name: string;
  connected: boolean;
  handle?: string;
}

interface ConnectAccountsSheetProps {
  visible: boolean;
  onClose: () => void;
  platforms: SheetPlatform[];
  onToggle: (id: string) => void;
}

function LogoDot({ id, on }: { id: string; on: boolean }) {
  const o = useSharedValue(on ? 1 : 0.3);
  useEffect(() => {
    o.value = withTiming(on ? 1 : 0.3, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [on, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={style}>
      <PlatformLogo type={id as PlatformLogoType} size={26} />
    </Animated.View>
  );
}

export function ConnectAccountsSheet({ visible, onClose, platforms, onToggle }: ConnectAccountsSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const connected = platforms.filter((p) => p.connected).length;

  const progress = useSharedValue(0);
  const bar = useSharedValue(0);
  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  useEffect(() => {
    bar.value = withTiming(platforms.length ? connected / platforms.length : 0, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [connected, platforms.length, bar]);

  const scrim = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * screenH * 0.7 }] }));
  const fill = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrim]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View style={[styles.sheet, { maxHeight: screenH * 0.9, paddingBottom: insets.bottom + 16 }, sheet]}>
          <BlurView intensity={50} tint="light" style={[StyleSheet.absoluteFill, styles.sheetBlur]} />
          <View style={[StyleSheet.absoluteFill, styles.sheetFill]} />
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={styles.title}>Your accounts</Text>
              <Text style={styles.subtitle}>Connect where you post to see your stats</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke={ds.ink} strokeWidth={2.4} strokeLinecap="round" />
              </Svg>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} bounces={false}>
            {/* How many are connected */}
            <View style={styles.summary}>
              <View style={styles.dots}>
                {platforms.map((p) => (
                  <LogoDot key={p.id} id={p.id} on={p.connected} />
                ))}
              </View>
              <View style={styles.track}>
                <Animated.View style={[styles.trackFill, fill]} />
              </View>
              <Text style={styles.summaryText}>
                {connected === 0
                  ? 'None connected yet. One is enough to start.'
                  : `${connected} of ${platforms.length} connected`}
              </Text>
            </View>

            <View style={styles.list}>
              {platforms.map((p) => (
                <PlatformRow
                  key={p.id}
                  name={p.name}
                  logo={p.id as PlatformLogoType}
                  description={p.connected ? p.handle || 'Connected' : `Sign in with ${p.name}`}
                  connected={p.connected}
                  onToggle={() => onToggle(p.id)}
                />
              ))}
            </View>

            <View style={styles.privacy}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Rect x="5" y="11" width="14" height="10" rx="2.5" stroke={ds.purple} strokeWidth={2} />
                <Path d="M8 11V8a4 4 0 118 0v3" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" />
              </Svg>
              <Text style={styles.privacyText}>We only read your stats. Nothing is posted without you, and you can disconnect any time.</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <AppButton title="Done" size="lg" onPress={onClose} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  flex: { flex: 1 },
  scrim: { backgroundColor: 'rgba(23, 20, 32, 0.28)' },
  sheet: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  sheetBlur: { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  sheetFill: { backgroundColor: 'rgba(247, 245, 240, 0.92)' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(23, 20, 32, 0.15)', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', color: ds.ink, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: ds.text3, marginTop: 2, fontWeight: '600' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.85)' },
  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },

  summary: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  dots: { flexDirection: 'row', gap: 8 },
  track: { height: 6, borderRadius: 3, backgroundColor: ds.lavender, marginTop: 12, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: ds.greenFill },
  summaryText: { fontSize: 13, fontWeight: '700', color: ds.text2, marginTop: 8 },

  list: { gap: 10, marginTop: 14 },

  privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16, padding: 12, borderRadius: 16, backgroundColor: 'rgba(245, 243, 255, 0.9)' },
  privacyText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: ds.text2 },
  footer: { paddingHorizontal: 20, paddingTop: 10 },
});
