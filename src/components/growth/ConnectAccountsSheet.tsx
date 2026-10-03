import React, { useEffect, useState } from 'react';
import { dialogStyles, useDialogMode } from '../glass/dialog';
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AccountsPanel } from '../accounts/AccountsPanel';
import { ds } from '../../theme/colors';

// "Your accounts": connect or disconnect the platforms this server can read. Glides up from the
// bottom (no bounce). Each row does its own connecting through the platform's own sign-in (we
// never ask for passwords or usernames here), so there's nothing to save: "Done" just closes.

interface ConnectAccountsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function ConnectAccountsSheet({ visible, onClose }: ConnectAccountsSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);

  const progress = useSharedValue(0);
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

  const scrim = useAnimatedStyle(() => ({ opacity: progress.value }));
  const dialog = useDialogMode();
  const sheet = useAnimatedStyle(() =>
    dialog
      ? { opacity: progress.value, transform: [{ translateY: (1 - progress.value) * 24 }, { scale: 0.97 + progress.value * 0.03 }] }
      : { transform: [{ translateY: (1 - progress.value) * screenH * 0.7 }] }
  );

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, dialog && dialogStyles.root]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrim]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View style={[styles.sheet, dialog && dialogStyles.sheet, { maxHeight: screenH * 0.9, paddingBottom: insets.bottom + 16 }, sheet]}>
          <BlurView intensity={50} tint="light" style={[StyleSheet.absoluteFill, styles.sheetBlur, dialog && dialogStyles.round]} />
          <View style={[StyleSheet.absoluteFill, styles.sheetFill]} />
          <View style={[styles.handle, dialog && dialogStyles.hidden]} />

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
            <AccountsPanel />
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
  footer: { paddingHorizontal: 20, paddingTop: 10 },
});
