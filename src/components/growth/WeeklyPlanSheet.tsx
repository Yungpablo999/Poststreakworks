import React, { useEffect, useState } from 'react';
import { dialogStyles, useDialogMode } from '../glass/dialog';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { JarvisOrb } from '../JarvisOrb';
import { ds } from '../../theme/colors';

// Jarvis's plan for the week as a short checklist. Glides up (no bounce).
// Tick a step off by tapping its circle; each step has one button that takes
// you where you do it. New creators get a starter plan instead of advice
// built on numbers they don't have yet.

export interface PlanStep {
  id: string;
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}

interface WeeklyPlanSheetProps {
  visible: boolean;
  onClose: () => void;
  isNewUser: boolean;
  steps: PlanStep[];
}

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;

function Check({ done }: { done: boolean }) {
  const t = useSharedValue(done ? 1 : 0);
  useEffect(() => {
    t.value = withTiming(done ? 1 : 0, { duration: 240, easing: Easing.out(Easing.cubic) });
  }, [done, t]);
  const fill = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scale: 0.6 + 0.4 * t.value }] }));
  return (
    <View style={styles.check}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.checkFill, fill]}>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function StepCard({ step, index, done, onToggle }: { step: PlanStep; index: number; done: boolean; onToggle: () => void }) {
  const fade = useSharedValue(done ? 1 : 0);
  useEffect(() => {
    fade.value = withTiming(done ? 1 : 0, { duration: 240, easing: Easing.out(Easing.cubic) });
  }, [done, fade]);
  const textStyle = useAnimatedStyle(() => ({ opacity: 1 - 0.45 * fade.value }));
  return (
    <View style={[styles.step, done && styles.stepDone]}>
      <Pressable
        onPress={onToggle}
        hitSlop={10}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={`Step ${index + 1}: ${step.title}`}
        style={pointer}
      >
        <Check done={done} />
      </Pressable>
      <Animated.View style={[styles.flex, textStyle]}>
        <Text style={[styles.stepTitle, done && styles.stepTitleDone]}>{step.title}</Text>
        <Text style={styles.stepBody}>{step.body}</Text>
        {!done && (
          <Pressable
            onPress={step.onAction}
            accessibilityRole="button"
            style={({ pressed }) => [styles.action, pressed && styles.pressed, pointer]}
          >
            <Text style={styles.actionText}>{step.action}</Text>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path d="M9 6l6 6-6 6" stroke={ds.purple} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

export function WeeklyPlanSheet({ visible, onClose, isNewUser, steps }: WeeklyPlanSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [done, setDone] = useState<string[]>([]);
  const count = steps.filter((s) => done.includes(s.id)).length;

  const progress = useSharedValue(0);
  const bar = useSharedValue(0);
  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, (d) => {
        if (d) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  useEffect(() => {
    bar.value = withTiming(steps.length ? count / steps.length : 0, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [count, steps.length, bar]);

  const scrim = useAnimatedStyle(() => ({ opacity: progress.value }));
  const dialog = useDialogMode();
  const sheet = useAnimatedStyle(() =>
    dialog
      ? { opacity: progress.value, transform: [{ translateY: (1 - progress.value) * 24 }, { scale: 0.97 + progress.value * 0.03 }] }
      : { transform: [{ translateY: (1 - progress.value) * screenH * 0.7 }] }
  );
  const fill = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));

  const toggle = (id: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setDone((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, dialog && dialogStyles.root]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrim]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View style={[styles.sheet, dialog && dialogStyles.sheet, { maxHeight: screenH * 0.9, paddingBottom: insets.bottom + 20 }, sheet]}>
          <BlurView intensity={50} tint="light" style={[StyleSheet.absoluteFill, styles.sheetBlur, dialog && dialogStyles.round]} />
          <View style={[StyleSheet.absoluteFill, styles.sheetFill]} />
          <View style={[styles.handle, dialog && dialogStyles.hidden]} />

          <View style={styles.header}>
            <JarvisOrb size={34} />
            <View style={styles.flex}>
              <Text style={styles.title}>This week’s plan</Text>
              <Text style={styles.subtitle}>{isNewUser ? 'A simple start while Jarvis learns your style' : 'From Jarvis, based on your last 30 days'}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke={ds.ink} strokeWidth={2.4} strokeLinecap="round" />
              </Svg>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} bounces={false}>
            <View style={styles.progressRow}>
              <View style={styles.track}>
                <Animated.View style={[styles.trackFill, fill]} />
              </View>
              <Text style={styles.progressText}>
                {count === steps.length ? 'All done this week' : `${count} of ${steps.length} done`}
              </Text>
            </View>

            <View style={styles.list}>
              {steps.map((s, i) => (
                <StepCard key={s.id} step={s} index={i} done={done.includes(s.id)} onToggle={() => toggle(s.id)} />
              ))}
            </View>

            <Text style={styles.footnote}>Tap a circle to tick a step off. No rush, any order works.</Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  flex: { flex: 1 },
  pressed: { transform: [{ scale: 0.96 }] },
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
  subtitle: { fontSize: 13, lineHeight: 17, color: ds.text3, marginTop: 2, fontWeight: '600' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.85)' },
  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },

  progressRow: { gap: 8 },
  track: { height: 6, borderRadius: 3, backgroundColor: ds.lavender, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: ds.greenFill },
  progressText: { fontSize: 12.5, fontWeight: '700', color: ds.text3 },

  list: { gap: 10, marginTop: 14 },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  stepDone: { backgroundColor: 'rgba(234, 247, 238, 0.8)', borderColor: 'rgba(31, 157, 85, 0.2)' },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#C4B5FD', marginTop: 1, overflow: 'hidden' },
  checkFill: { backgroundColor: ds.greenFill, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 15.5, lineHeight: 21, fontWeight: '800', color: ds.ink },
  stepTitleDone: { textDecorationLine: 'line-through' },
  stepBody: { fontSize: 13.5, lineHeight: 19, color: ds.text2, marginTop: 2 },
  action: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    backgroundColor: ds.lavender,
  },
  actionText: { fontSize: 13, fontWeight: '800', color: ds.purple },
  footnote: { fontSize: 12, color: ds.text3, textAlign: 'center', marginTop: 14 },
});
