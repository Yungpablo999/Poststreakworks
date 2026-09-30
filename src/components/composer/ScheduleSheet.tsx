import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Pressable, ScrollView, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { JarvisOrb } from '../JarvisOrb';
import { ds } from '../../theme/colors';

// Pick when a post goes out (or when to be reminded to film it).
// One glass sheet: Jarvis's best times first, then any day in the next two
// weeks and a time. Real dates; past times today are unavailable.
// Calm motion: glides up with an ease, no spring overshoot.

type Slot = { minutes: number; label: string; best?: boolean };

const TIMES: Slot[] = [
  { minutes: 9 * 60, label: 'Morning' },
  { minutes: 12 * 60 + 30, label: 'Lunch' },
  { minutes: 18 * 60, label: 'Evening' },
  { minutes: 19 * 60 + 30, label: 'Best time', best: true },
  { minutes: 20 * 60 + 30, label: 'Night' },
];
const DAYS_AHEAD = 14;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const timeLabel = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
const dayName = (d: Date, today: Date) => {
  const diff = Math.round((startOfDay(d).getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

interface ScheduleSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Receives a readable label like "Today, 7:30 PM" or "Fri 2 Oct, 6:00 PM". */
  onConfirm: (label: string) => void;
  /** 'remind' when the creator will film in TikTok etc. */
  mode?: 'schedule' | 'remind';
}

export function ScheduleSheet({ visible, onClose, onConfirm, mode = 'schedule' }: ScheduleSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const now = new Date();
  const today = startOfDay(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const days = useMemo(() => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i)), [today.getTime()]);
  const isPast = (dayIndex: number, minutes: number) => dayIndex === 0 && minutes <= nowMinutes + 5;

  // Jarvis's picks: the next three "best" slots that haven't passed
  const picks = useMemo(() => {
    const out: { dayIndex: number; minutes: number; why: string }[] = [];
    for (let d = 0; d < 3 && out.length < 3; d++) {
      for (const m of [19 * 60 + 30, 11 * 60 + 30]) {
        if (!isPast(d, m) && out.length < 3) out.push({ dayIndex: d, minutes: m, why: m === 19 * 60 + 30 ? 'Your audience is most active' : 'Strong lunchtime scroll' });
      }
    }
    return out.sort((a, b) => a.dayIndex * 1440 + a.minutes - (b.dayIndex * 1440 + b.minutes));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowMinutes, today.getTime()]);

  // Pre-select the audience's best time (7:30 PM), not simply the earliest slot
  const defaultPick = picks.find((p) => p.minutes === 19 * 60 + 30) ?? picks[0];
  const [dayIndex, setDayIndex] = useState(defaultPick?.dayIndex ?? 0);
  const [minutes, setMinutes] = useState(defaultPick?.minutes ?? 19 * 60 + 30);

  // open / close: glide, no bounce
  const progress = useSharedValue(0);
  useEffect(() => {
    if (visible) {
      setMounted(true);
      if (defaultPick) {
        setDayIndex(defaultPick.dayIndex);
        setMinutes(defaultPick.minutes);
      }
      progress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  const scrim = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * screenH * 0.6 }] }));

  const tick = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
  };
  const chosenLabel = `${dayName(days[dayIndex], today)}, ${timeLabel(minutes)}`;
  const selectedPast = isPast(dayIndex, minutes);

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
              <Text style={styles.title}>{mode === 'remind' ? 'When should we remind you?' : 'When should it go out?'}</Text>
              <Text style={styles.subtitle}>Jarvis’s best times, or your own</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke={ds.ink} strokeWidth={2.4} strokeLinecap="round" />
              </Svg>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} bounces={false}>
            {/* Jarvis's picks */}
            <View style={styles.pickHead}>
              <JarvisOrb size={22} />
              <Text style={styles.sectionLabel}>Jarvis picks</Text>
            </View>
            <View style={styles.picks}>
              {picks.map((p) => {
                const on = p.dayIndex === dayIndex && p.minutes === minutes;
                return (
                  <Pressable
                    key={`${p.dayIndex}-${p.minutes}`}
                    onPress={() => {
                      tick();
                      setDayIndex(p.dayIndex);
                      setMinutes(p.minutes);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    style={({ pressed }) => [styles.pick, on && styles.pickOn, pressed && { transform: [{ scale: 0.98 }] }]}
                  >
                    <View style={styles.flex}>
                      <Text style={[styles.pickTime, on && { color: ds.purple }]}>
                        {dayName(days[p.dayIndex], today)}, {timeLabel(p.minutes)}
                      </Text>
                      <Text style={styles.pickWhy}>{p.why}</Text>
                    </View>
                    <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
                  </Pressable>
                );
              })}
            </View>

            {/* Any day in the next two weeks */}
            <Text style={[styles.sectionLabel, styles.ownLabel]}>Or pick a day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
              {days.map((d, i) => {
                const on = i === dayIndex;
                const allPast = TIMES.every((t) => isPast(i, t.minutes));
                return (
                  <Pressable
                    key={i}
                    disabled={allPast}
                    onPress={() => {
                      tick();
                      setDayIndex(i);
                      if (isPast(i, minutes)) {
                        const next = TIMES.find((t) => !isPast(i, t.minutes));
                        if (next) setMinutes(next.minutes);
                      }
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on, disabled: allPast }}
                    accessibilityLabel={d.toDateString()}
                    style={[styles.day, on && styles.dayOn, allPast && { opacity: 0.35 }]}
                  >
                    <Text style={[styles.dayTop, on && styles.dayTextOn]}>
                      {i === 0 ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short' })}
                    </Text>
                    <Text style={[styles.dayNum, on && styles.dayTextOn]}>{d.getDate()}</Text>
                    <Text style={[styles.dayMonth, on && styles.dayTextOn]}>{d.toLocaleDateString('en-GB', { month: 'short' })}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.sectionLabel, styles.ownLabel]}>And a time</Text>
            <View style={styles.times}>
              {TIMES.map((t) => {
                const on = t.minutes === minutes;
                const past = isPast(dayIndex, t.minutes);
                return (
                  <Pressable
                    key={t.minutes}
                    disabled={past}
                    onPress={() => {
                      tick();
                      setMinutes(t.minutes);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on, disabled: past }}
                    style={[styles.time, on && styles.timeOn, past && { opacity: 0.35 }]}
                  >
                    <Text style={[styles.timeText, on && { color: ds.purple }]}>{timeLabel(t.minutes)}</Text>
                    <Text style={[styles.timeSub, t.best && styles.timeSubBest]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Animated.View key={chosenLabel} entering={FadeIn.duration(180)}>
              <Text style={styles.summary}>
                {mode === 'remind' ? 'Reminder: ' : 'Goes out: '}
                <Text style={styles.summaryBold}>{chosenLabel}</Text>
              </Text>
            </Animated.View>
            <AppButton
              title={mode === 'remind' ? 'Set reminder' : 'Use this time'}
              size="lg"
              disabled={selectedPast}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onConfirm(chosenLabel);
              }}
            />
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
  sheetFill: { backgroundColor: 'rgba(247, 245, 240, 0.9)' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(23, 20, 32, 0.15)', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', color: ds.ink, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: ds.text3, marginTop: 2, fontWeight: '600' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  pickHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionLabel: { fontSize: 14, fontWeight: '800', color: ds.ink },
  ownLabel: { marginTop: 20, marginBottom: 10 },
  picks: { gap: 8 },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  pickOn: { borderColor: ds.purple, backgroundColor: 'rgba(237, 233, 254, 0.9)' },
  pickTime: { fontSize: 15.5, fontWeight: '800', color: ds.ink },
  pickWhy: { fontSize: 12.5, color: ds.text2, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: ds.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  radioOn: { borderColor: ds.purple },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: ds.purple },
  days: { gap: 8, paddingRight: 8 },
  day: {
    width: 58,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  dayOn: { backgroundColor: ds.purple, borderColor: ds.purple },
  dayTop: { fontSize: 11, fontWeight: '800', color: ds.text3 },
  dayNum: { fontSize: 18, fontWeight: '800', color: ds.ink, marginTop: 2 },
  dayMonth: { fontSize: 10.5, fontWeight: '700', color: ds.text3 },
  dayTextOn: { color: '#FFFFFF' },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  time: {
    width: '31%',
    flexGrow: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  timeOn: { borderColor: ds.purple, backgroundColor: 'rgba(237, 233, 254, 0.9)' },
  timeText: { fontSize: 14, fontWeight: '800', color: ds.ink },
  timeSub: { fontSize: 11, fontWeight: '700', color: ds.text3, marginTop: 1 },
  timeSubBest: { color: ds.purple },
  footer: { paddingHorizontal: 20, paddingTop: 12, gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(23, 20, 32, 0.1)' },
  summary: { fontSize: 13.5, color: ds.text2, textAlign: 'center' },
  summaryBold: { fontWeight: '800', color: ds.ink },
});
