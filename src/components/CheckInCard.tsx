import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from './ui/AppText';
import { getTheme } from '../theme/colors';
import { useCheckInStreak } from '../hooks/useCheckInStreak';
import type { Persona } from '../data';

// The daily check-in streak. Deliberately gentle: no countdowns, no warnings,
// no "you'll lose it" copy. Missing a day is fine — the creator just picks up again.

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface CheckInCardProps {
  persona: Persona;
  isDark?: boolean;
  title?: string;
}

export function CheckInCard({ persona, isDark = false, title = 'Daily check-in' }: CheckInCardProps) {
  const t = getTheme(isDark);
  const { streak, checkIn } = useCheckInStreak(persona);
  const checkedIn = streak.checkedInToday;

  const handleCheckIn = () => {
    if (checkedIn) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    checkIn();
  };

  const message = (() => {
    if (persona === 'new') {
      return checkedIn
        ? 'Nice start! Come back whenever you can. Every check-in counts.'
        : 'Check in once a day to build a gentle habit. Missed a day? Just pick up again.';
    }
    return checkedIn
      ? `${streak.currentDays} days of showing up. That's a real habit forming.`
      : `${streak.currentDays} days and counting. Check in whenever you're ready today.`;
  })();

  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.text }]}>{title}</Text>
        {checkedIn && (
          <View style={[styles.softPill, { backgroundColor: t.primaryLight }]}>
            <Text style={[styles.softPillText, { color: t.primary }]}>Done for today</Text>
          </View>
        )}
      </View>

      <View style={styles.weekRow}>
        {DAY_LABELS.map((label, i) => {
          const isToday = i === streak.todayIndex;
          const filled = streak.week[i];
          return (
            <View key={`${label}-${i}`} style={styles.dayCol}>
              <View
                style={[
                  styles.dayDot,
                  {
                    borderColor: isToday || filled ? t.primary : t.border,
                    backgroundColor: filled ? t.primary : 'transparent',
                  },
                ]}
              >
                {filled && (
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
              </View>
              <Text style={[styles.dayLabel, { color: isToday ? t.primary : t.textMuted }]}>{label}</Text>
            </View>
          );
        })}
      </View>

      <Text style={[styles.body, { color: t.textSecondary }]}>{message}</Text>

      {!checkedIn && (
        <Pressable
          onPress={handleCheckIn}
          style={({ pressed }) => [styles.button, { borderColor: t.primary }, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, { color: t.primary }]}>Check in for today</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  softPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  softPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  button: {
    marginTop: 14,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
