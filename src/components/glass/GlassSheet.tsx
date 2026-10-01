import React, { useEffect, useState } from 'react';
import { dialogStyles, useDialogMode } from './dialog';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { ds } from '../../theme/colors';

// A frosted sheet that glides up from the bottom (no bounce) and glides back
// down when closed. Title row with an optional badge, a close button, a body
// the caller fills (usually a ScrollView) and an optional footer.

interface GlassSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Above the footer, e.g. a toast */
  overlay?: React.ReactNode;
  /** Fraction of the screen the sheet may use */
  maxHeight?: number;
  /** Fill the max height even when the content is short (keeps tab switches steady) */
  fill?: boolean;
}

export function GlassSheet({ visible, onClose, title, subtitle, badge, children, footer, overlay, maxHeight = 0.92, fill = false }: GlassSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
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
      : { transform: [{ translateY: (1 - progress.value) * screenH * 0.8 }] }
  );

  if (!mounted) return null;
  const h = screenH * maxHeight - insets.top;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, dialog && dialogStyles.root]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrim]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View style={[styles.sheet, dialog && dialogStyles.sheet, fill ? { height: h } : { maxHeight: h }, { paddingBottom: insets.bottom + 14 }, sheet]}>
          <BlurView intensity={50} tint="light" style={[StyleSheet.absoluteFill, styles.round, dialog && dialogStyles.round]} />
          <View style={[StyleSheet.absoluteFill, styles.sheetFill]} />
          <View style={[styles.handle, dialog && dialogStyles.hidden]} />

          <View style={styles.header}>
            <View style={styles.flex}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                {badge}
              </View>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={({ pressed }) => [styles.closeBtn, pressed && { transform: [{ scale: 0.92 }] }]} accessibilityRole="button" accessibilityLabel="Close">
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke={ds.ink} strokeWidth={2.4} strokeLinecap="round" />
              </Svg>
            </Pressable>
          </View>

          <View style={fill ? styles.flex : styles.shrink}>{children}</View>
          {overlay}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  scrim: { backgroundColor: 'rgba(23, 20, 32, 0.32)' },
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
  round: { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  sheetFill: { backgroundColor: 'rgba(247, 245, 240, 0.93)' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(23, 20, 32, 0.15)', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '800', color: ds.ink, letterSpacing: -0.4, flexShrink: 1 },
  subtitle: { fontSize: 13, color: ds.text3, marginTop: 2, fontWeight: '600' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.85)' },
  footer: { paddingHorizontal: 20, paddingTop: 10 },
});
