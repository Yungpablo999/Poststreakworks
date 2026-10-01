import React, { useEffect, useMemo, useRef, useState } from 'react';
import { dialogStyles, useDialogMode } from '../glass/dialog';
import { Modal, View, Pressable, ScrollView, StyleSheet, Platform, PanResponder, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { PlatformLogo } from '../onboarding/PlatformLogo';
import { ds } from '../../theme/colors';
import { getCalendarMonth, subscribeToCheckIns, type CalendarDay, type Persona } from '../../data';

// The calendar behind the Home check-in card: a glass sheet that slides up.
// Month by month (swipe or arrows), each day shows check-ins, posts and
// what's scheduled; tapping a day opens its details underneath.
// No streak freezes or "you'll lose it" language — rest days are just rest days.

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS_BACK = 6;
const MONTHS_AHEAD = 3;
const PLATFORM_NAMES: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  threads: 'Threads',
  facebook: 'Facebook',
};

interface CalendarSheetProps {
  visible: boolean;
  onClose: () => void;
  persona: Persona;
  onPlanPost?: () => void;
}

const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

function Chevron({ dir, color }: { dir: 'left' | 'right'; color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'} stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DayCell({ day, selected, onPress }: { day: CalendarDay; selected: boolean; onPress: () => void }) {
  const posted = day.posts.some((p) => p.status === 'posted');
  const scheduled = !posted && day.posts.length > 0; // scheduled or draft
  return (
    <Pressable
      onPress={onPress}
      style={styles.cellSlot}
      accessibilityRole="button"
      accessibilityLabel={`${day.day}${day.isToday ? ', today' : ''}${posted ? ', posted' : ''}${scheduled ? ', scheduled' : ''}${day.checkedIn ? ', checked in' : ''}`}
      accessibilityState={{ selected }}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.cell,
            posted && styles.cellPosted,
            scheduled && styles.cellScheduled,
            day.isToday && !posted && styles.cellToday,
            selected && (day.isToday && !posted ? styles.cellTodaySelected : styles.cellSelected),
            pressed && { transform: [{ scale: 0.9 }] },
          ]}
        >
          <Text
            style={[
              styles.cellText,
              day.isPast && !posted && styles.cellTextPast,
              scheduled && styles.cellTextScheduled,
              day.isToday && styles.cellTextToday,
              posted && styles.cellTextPosted,
            ]}
          >
            {day.day}
          </Text>
          {day.checkedIn && <View style={[styles.checkDot, posted && styles.checkDotOnPurple]} />}
        </View>
      )}
    </Pressable>
  );
}

function DayDetails({ day, label, onPlanPost }: { day: CalendarDay; label: string; onPlanPost?: () => void }) {
  return (
    <Animated.View key={day.key} entering={FadeInUp.duration(280)} style={styles.details}>
      <View style={styles.detailsHeader}>
        <Text style={styles.detailsDate}>{label}</Text>
        {day.checkedIn && (
          <View style={styles.checkedChip}>
            <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
              <Path d="M20 6L9 17l-5-5" stroke={ds.green} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.checkedChipText}>Checked in</Text>
          </View>
        )}
      </View>

      {day.posts.length > 0 ? (
        day.posts.map((p, i) => (
          <Animated.View key={p.id} entering={FadeInUp.delay(60 * i).duration(260)} style={styles.postRow}>
            <PlatformLogo type={p.platform} size={30} />
            <View style={styles.postText}>
              <Text style={styles.postTitle} numberOfLines={2}>
                {p.title}
              </Text>
              <Text style={styles.postMeta} numberOfLines={1}>
                {PLATFORM_NAMES[p.platform]} · {p.time}
              </Text>
            </View>
            <View
              style={[
                styles.statusChip,
                p.status === 'posted' ? styles.statusPosted : p.status === 'draft' ? styles.statusDraft : styles.statusScheduled,
              ]}
            >
              <Text style={[styles.statusText, { color: p.status === 'posted' ? ds.greenFill : p.status === 'draft' ? ds.text2 : ds.purple }]}>
                {p.status === 'posted' ? 'Posted' : p.status === 'draft' ? 'Draft' : 'Scheduled'}
              </Text>
            </View>
          </Animated.View>
        ))
      ) : day.isPast ? (
        <Text style={styles.emptyText}>A quiet day. Rest is part of the rhythm.</Text>
      ) : (
        <View>
          <Text style={styles.emptyText}>{day.isToday ? 'Nothing planned for today yet.' : 'Nothing planned yet.'}</Text>
          {onPlanPost && (
            <View style={styles.planBtn}>
              <AppButton title={day.isToday ? 'Plan a post for today' : 'Plan a post for this day'} variant="outline" onPress={onPlanPost} />
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

export function CalendarSheet({ visible, onClose, persona, onPlanPost }: CalendarSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const now = new Date();
  const [offset, setOffset] = useState(0); // months from the current month
  const [dir, setDir] = useState<1 | -1>(1);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [, setVersion] = useState(0);
  const [mounted, setMounted] = useState(visible);

  // Re-read when a check-in happens elsewhere
  useEffect(() => subscribeToCheckIns(() => setVersion((v) => v + 1)), []);

  const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const month = getCalendarMonth(persona, target.getFullYear(), target.getMonth());
  const today = month.days.find((d) => d.isToday);
  const selected = month.days.find((d) => d.key === selectedKey) ?? today ?? null;

  // ── open / close animation ────────────────────────────────────────────────
  const progress = useSharedValue(0);
  useEffect(() => {
    if (visible) {
      setMounted(true);
      setOffset(0);
      setSelectedKey(null);
      progress.value = withSpring(1, { damping: 20, stiffness: 190, mass: 0.9 });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const dialog = useDialogMode();
  const sheetStyle = useAnimatedStyle(() =>
    dialog
      ? { opacity: progress.value, transform: [{ translateY: (1 - progress.value) * 24 }, { scale: 0.97 + progress.value * 0.03 }] }
      : { transform: [{ translateY: (1 - progress.value) * screenH * 0.9 }] }
  );

  // ── month navigation (arrows + swipe) ─────────────────────────────────────
  const go = (step: 1 | -1) => {
    const next = offset + step;
    if (next < -MONTHS_BACK || next > MONTHS_AHEAD) return;
    tick();
    setDir(step);
    setOffset(next);
    setSelectedKey(null);
  };
  const goRef = useRef(go);
  goRef.current = go;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_, g) => {
          if (g.dx < -50) goRef.current(1);
          else if (g.dx > 50) goRef.current(-1);
        },
      }),
    [],
  );

  const selectedLabel = selected
    ? new Date(month.year, month.month, selected.day).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';
  const isEmptyMonth = month.postedCount + month.scheduledCount + month.checkInCount === 0;

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, dialog && dialogStyles.root]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close calendar" />
        </Animated.View>

        <Animated.View style={[styles.sheet, dialog && dialogStyles.sheet, { maxHeight: screenH * 0.9, paddingBottom: insets.bottom + 16 }, sheetStyle]}>
          <BlurView intensity={50} tint="light" style={[StyleSheet.absoluteFill, styles.sheetBlur, dialog && dialogStyles.round]} />
          <View style={[StyleSheet.absoluteFill, styles.sheetFill]} />
          <View style={[styles.handle, dialog && dialogStyles.hidden]} />

          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={styles.title}>Your calendar</Text>
              <Text style={styles.subtitle}>Check-ins, posts and plans</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke={ds.ink} strokeWidth={2.4} strokeLinecap="round" />
              </Svg>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} bounces={false}>
            {/* Month switcher */}
            <View style={styles.monthRow}>
              <Pressable
                onPress={() => go(-1)}
                disabled={offset <= -MONTHS_BACK}
                style={[styles.navBtn, offset <= -MONTHS_BACK && styles.navBtnOff]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <Chevron dir="left" color={ds.purple} />
              </Pressable>
              <View style={styles.monthTitleWrap}>
                <Animated.View key={month.label} entering={FadeIn.duration(220)}>
                  <Text style={styles.monthTitle}>{month.label}</Text>
                </Animated.View>
                {offset !== 0 && (
                  <Pressable
                    onPress={() => {
                      tick();
                      setDir(offset > 0 ? -1 : 1);
                      setOffset(0);
                      setSelectedKey(null);
                    }}
                    hitSlop={6}
                    style={styles.todayChip}
                    accessibilityRole="button"
                  >
                    <Text style={styles.todayChipText}>Today</Text>
                  </Pressable>
                )}
              </View>
              <Pressable
                onPress={() => go(1)}
                disabled={offset >= MONTHS_AHEAD}
                style={[styles.navBtn, offset >= MONTHS_AHEAD && styles.navBtnOff]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <Chevron dir="right" color={ds.purple} />
              </Pressable>
            </View>

            {/* Month at a glance */}
            {isEmptyMonth ? (
              <Text style={styles.hint}>Your calendar fills in as you check in and schedule posts.</Text>
            ) : (
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{month.checkInCount}</Text>
                  <Text style={styles.statLabel}>Check-ins</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statNum, { color: ds.purple }]}>{month.postedCount}</Text>
                  <Text style={styles.statLabel}>Posted</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{month.scheduledCount}</Text>
                  <Text style={styles.statLabel}>Scheduled</Text>
                </View>
              </View>
            )}

            {/* Grid (swipe left / right to change month) */}
            <View {...pan.panHandlers}>
              <View style={styles.weekRow}>
                {WEEKDAYS.map((w, i) => (
                  <Text key={i} style={styles.weekday}>
                    {w}
                  </Text>
                ))}
              </View>
              <Animated.View
                key={month.label}
                entering={(dir === 1 ? FadeInRight : FadeInLeft).duration(260)}
                style={styles.grid}
              >
                {Array.from({ length: month.startOffset }).map((_, i) => (
                  <View key={`e${i}`} style={styles.cellSlot} />
                ))}
                {month.days.map((d) => (
                  <DayCell
                    key={d.key}
                    day={d}
                    selected={selected?.key === d.key}
                    onPress={() => {
                      tick();
                      setSelectedKey(d.key);
                    }}
                  />
                ))}
              </Animated.View>
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, styles.cellPosted]} />
                <Text style={styles.legendText}>Posted</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, styles.cellScheduled]} />
                <Text style={styles.legendText}>Scheduled</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>Checked in</Text>
              </View>
            </View>

            {selected && (
              <DayDetails
                day={selected}
                label={selected.isToday ? `Today · ${selectedLabel}` : selectedLabel}
                onPlanPost={
                  onPlanPost
                    ? () => {
                        onClose();
                        onPlanPost();
                      }
                    : undefined
                }
              />
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const CELL = 38;

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
  sheetFill: { backgroundColor: 'rgba(247, 245, 240, 0.86)' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(23, 20, 32, 0.15)', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 },
  title: { fontSize: 20, fontWeight: '800', color: ds.ink, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: ds.text3, marginTop: 2, fontWeight: '600' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  body: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(237, 233, 254, 0.9)',
  },
  navBtnOff: { opacity: 0.35 },
  monthTitleWrap: { flex: 1, alignItems: 'center', gap: 4 },
  monthTitle: { fontSize: 17, fontWeight: '800', color: ds.ink },
  todayChip: { paddingHorizontal: 10, height: 22, justifyContent: 'center', borderRadius: 999, backgroundColor: '#FFFFFF' },
  todayChipText: { fontSize: 11.5, fontWeight: '800', color: ds.purple },
  hint: { fontSize: 13.5, lineHeight: 19, color: ds.text2, textAlign: 'center', marginTop: 12, marginBottom: 4 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  statNum: { fontSize: 20, fontWeight: '800', color: ds.ink, letterSpacing: -0.5 },
  statLabel: { fontSize: 11.5, fontWeight: '700', color: ds.text3, marginTop: 1 },
  weekRow: { flexDirection: 'row', marginTop: 16, marginBottom: 4 },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11.5, fontWeight: '800', color: ds.text3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellSlot: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  cell: {
    width: CELL,
    maxWidth: '92%',
    aspectRatio: 1,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cellPosted: { backgroundColor: ds.purple },
  cellScheduled: { backgroundColor: ds.lavender },
  cellToday: { borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  cellSelected: { borderColor: ds.ink },
  cellTodaySelected: { borderColor: ds.purple, borderWidth: 2.5 },
  cellText: { fontSize: 14, fontWeight: '700', color: ds.ink },
  cellTextPast: { color: ds.text3 },
  cellTextScheduled: { color: ds.purple },
  cellTextToday: { color: ds.purple, fontWeight: '800' },
  cellTextPosted: { color: '#FFFFFF' },
  checkDot: { position: 'absolute', bottom: 4, width: 5, height: 5, borderRadius: 3, backgroundColor: ds.green },
  checkDotOnPurple: { backgroundColor: '#FFFFFF' },
  legend: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 14, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 12, height: 12, borderRadius: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ds.green, marginHorizontal: 3 },
  legendText: { fontSize: 12, fontWeight: '700', color: ds.text2 },
  details: {
    marginTop: 16,
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    gap: 10,
  },
  detailsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  detailsDate: { flexShrink: 1, fontSize: 15, fontWeight: '800', color: ds.ink },
  checkedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    height: 22,
    borderRadius: 999,
    backgroundColor: ds.greenBg,
  },
  checkedChipText: { fontSize: 11, fontWeight: '800', color: ds.greenFill },
  postRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postText: { flex: 1 },
  postTitle: { fontSize: 14, fontWeight: '700', color: ds.ink },
  postMeta: { fontSize: 12, fontWeight: '600', color: ds.text3, marginTop: 1 },
  statusChip: { paddingHorizontal: 8, height: 22, justifyContent: 'center', borderRadius: 999 },
  statusPosted: { backgroundColor: ds.greenBg },
  statusScheduled: { backgroundColor: ds.lavender },
  statusDraft: { backgroundColor: ds.cream },
  statusText: { fontSize: 11, fontWeight: '800' },
  emptyText: { fontSize: 13.5, lineHeight: 19, color: ds.text2 },
  planBtn: { marginTop: 12 },
});
