import React, { useEffect } from 'react';
import { TourTarget } from './tour/GhostTour';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from './ui/AppText';
import { AppButton } from './ui/AppButton';
import { GlassCard } from './glass/GlassCard';
import { ds } from '../theme/colors';
import { isNarrowScreen } from '../utils/responsive';
import { useCheckInStreak } from '../hooks/useCheckInStreak';

// The daily check-in streak. Deliberately gentle: no countdowns, no warnings,
// no "you'll lose it" copy. Missing a day is fine — the creator just picks up again.
// Today's circle breathes softly until checked in; checking in pops it with a
// small sparkle burst.

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DOT = isNarrowScreen ? 30 : 34;
const SPARKS = 8;

interface CheckInCardProps {
  title?: string;
  /** When set, the week row and a calendar button open the full calendar. */
  onOpenCalendar?: () => void;
}

function Spark({ index, fire }: { index: number; fire: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!fire) return;
    t.value = 0;
    t.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
  }, [fire, t]);
  const angle = (index / SPARKS) * Math.PI * 2;
  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 ? 0 : 1 - t.value,
    transform: [
      { translateX: Math.cos(angle) * 30 * t.value },
      { translateY: Math.sin(angle) * 30 * t.value },
      { scale: 1 - 0.5 * t.value },
    ],
  }));
  return <Animated.View pointerEvents="none" style={[styles.spark, index % 2 ? styles.sparkDeep : null, style]} />;
}

function TodayDot({ filled, fire }: { filled: boolean; fire: number }) {
  const reduceMotion = useReducedMotion();
  const ring = useSharedValue(0);
  const pop = useSharedValue(1);

  // Soft breathing ring while waiting — an invitation, not a countdown
  useEffect(() => {
    if (filled || reduceMotion) {
      ring.value = withTiming(0, { duration: 200 });
      return;
    }
    ring.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
  }, [filled, reduceMotion, ring]);

  useEffect(() => {
    if (!fire || reduceMotion) return;
    pop.value = withSequence(withTiming(0.7, { duration: 90 }), withSpring(1, { damping: 7, stiffness: 260 }));
  }, [fire, reduceMotion, pop]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - ring.value),
    transform: [{ scale: 1 + 0.45 * ring.value }],
  }));
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <View style={styles.dotBox}>
      {!filled && <Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} />}
      {Array.from({ length: SPARKS }).map((_, i) => (
        <Spark key={i} index={i} fire={fire} />
      ))}
      <Animated.View style={[styles.dayDot, filled ? styles.dayDotFilled : styles.dayDotToday, popStyle]}>
        {filled && (
          <Animated.View entering={ZoomIn.duration(220)}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

export function CheckInCard({ title = 'Daily check-in', onOpenCalendar }: CheckInCardProps) {
  const { streak, checkIn } = useCheckInStreak();
  const checkedIn = streak.checkedInToday;
  const [fire, setFire] = React.useState(0);

  const handleCheckIn = () => {
    if (checkedIn) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFire((f) => f + 1);
    checkIn();
  };

  const openCalendar = () => {
    if (!onOpenCalendar) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    onOpenCalendar();
  };

  const days = streak.currentDays;
  const message = (() => {
    if (days === 0) return 'Check in once a day to build a gentle habit. Missed a day? Just pick up again.';
    if (checkedIn) return days === 1 ? 'Nice start! Come back whenever you can. Every check-in counts.' : `${days} days of showing up. That's a real habit forming.`;
    return `${days} ${days === 1 ? 'day' : 'days'} and counting. Check in whenever you're ready today.`;
  })();

  return (
    <GlassCard strong radius={26} padding={20}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {onOpenCalendar && (
          <Pressable
            onPress={openCalendar}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Open your calendar"
            style={({ pressed }) => [styles.calBtn, pressed && { transform: [{ scale: 0.92 }] }, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Rect x="3" y="4" width="18" height="17" rx="3" stroke={ds.purple} strokeWidth={2.2} />
              <Path d="M16 2v4M8 2v4M3 10h18" stroke={ds.purple} strokeWidth={2.2} strokeLinecap="round" />
            </Svg>
            <Text style={styles.calBtnText}>Calendar</Text>
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={openCalendar}
        disabled={!onOpenCalendar}
        accessibilityRole={onOpenCalendar ? 'button' : undefined}
        accessibilityLabel={onOpenCalendar ? 'This week. Open your calendar' : undefined}
        style={[styles.weekRow, onOpenCalendar && Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
      >
        {DAY_LABELS.map((label, i) => {
          const isToday = i === streak.todayIndex;
          const filled = streak.week[i];
          return (
            <Animated.View key={`${label}-${i}`} entering={FadeInUp.delay(200 + i * 45).duration(380)} style={styles.dayCol}>
              {isToday ? (
                <TodayDot filled={filled} fire={fire} />
              ) : (
                <View style={styles.dotBox}>
                  <View style={[styles.dayDot, filled ? styles.dayDotFilled : styles.dayDotEmpty]}>
                    {filled && (
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    )}
                  </View>
                </View>
              )}
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{label}</Text>
            </Animated.View>
          );
        })}
      </Pressable>

      <Animated.View key={checkedIn ? 'done' : 'todo'} entering={FadeIn.duration(350)}>
        <Text style={styles.body}>{message}</Text>
      </Animated.View>

      {checkedIn ? (
        <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.donePill}>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <Path d="M20 6L9 17l-5-5" stroke={ds.purple} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={styles.donePillText}>Checked in today</Text>
        </Animated.View>
      ) : (
        <TourTarget id="check-in" style={styles.button}>
          <AppButton title="Check in for today" variant="outline" onPress={handleCheckIn} />
        </TourTarget>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 28 },
  title: { flexShrink: 1, fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2 },
  calBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
    backgroundColor: ds.lavender,
  },
  calBtnText: { fontSize: 12, fontWeight: '800', color: ds.purple },
  donePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(237, 233, 254, 0.8)',
  },
  donePillText: { fontSize: 14, fontWeight: '800', color: ds.purple },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  dayCol: { alignItems: 'center', gap: 6 },
  dotBox: { width: DOT, height: DOT, alignItems: 'center', justifyContent: 'center' },
  dayDot: { width: DOT, height: DOT, borderRadius: DOT / 2, alignItems: 'center', justifyContent: 'center' },
  dayDotEmpty: { borderWidth: 1.5, borderColor: ds.line, backgroundColor: 'rgba(255, 255, 255, 0.6)' },
  dayDotToday: { borderWidth: 2, borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  dayDotFilled: { backgroundColor: ds.purple },
  ring: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 2, borderColor: ds.purple },
  spark: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#A78BFA' },
  sparkDeep: { backgroundColor: ds.purple },
  dayLabel: { fontSize: 12, fontWeight: '700', color: ds.text3 },
  dayLabelToday: { color: ds.purple, fontWeight: '800' },
  body: { fontSize: 14, lineHeight: 20, marginTop: 16, color: ds.text2 },
  button: { marginTop: 16 },
});
