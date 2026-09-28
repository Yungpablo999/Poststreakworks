import React, { useState } from 'react';
import { View, Image, Pressable, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { getTheme, goldTokens } from '../../theme/colors';
import { getCheckInStreak } from '../../data';

// Day-0 Home for brand-new creators. No stats, no streak counts, no fake
// numbers: a warm welcome, one clear next step, and a gentle check-in.

interface HomeDayZeroProps {
  tier: 'free' | 'pro';
  firstName?: string;
  isDark?: boolean;
  onPlanFirstPost: () => void;
  onOpenSchedule?: () => void;
  onOpenGrowth?: () => void;
  onOpenQuests?: () => void;
  onOpenVoiceStudio?: () => void;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function HomeDayZero({
  tier,
  firstName,
  isDark = false,
  onPlanFirstPost,
  onOpenSchedule,
  onOpenGrowth,
  onOpenQuests,
  onOpenVoiceStudio,
}: HomeDayZeroProps) {
  const t = getTheme(isDark);
  const streak = getCheckInStreak('new');
  const [checkedIn, setCheckedIn] = useState(streak.checkedInToday);

  const tap = (style = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(style);
  };

  const handleCheckIn = () => {
    if (checkedIn) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCheckedIn(true);
  };

  const previews: { key: string; title: string; body: string; icon: React.ReactNode; onPress?: () => void; pro?: boolean }[] = [
    {
      key: 'schedule',
      title: 'Your schedule',
      body: 'Posts you plan will line up here.',
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="17" rx="3" stroke={t.primary} strokeWidth={2} />
          <Path d="M16 2v4M8 2v4M3 10h18" stroke={t.primary} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      ),
      onPress: onOpenSchedule,
    },
    {
      key: 'insights',
      title: 'Insights',
      body: 'After your first posts, see what your audience loves.',
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M3 17l6-6 4 4 8-8M21 7h-6M21 7v6" stroke={t.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ),
      onPress: onOpenGrowth,
    },
    tier === 'pro'
      ? {
          key: 'voice',
          title: 'Voice Studio',
          body: 'Clone your voice for hands-free voiceovers.',
          pro: true,
          icon: (
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Rect x="9" y="2" width="6" height="12" rx="3" stroke={t.primary} strokeWidth={2} />
              <Path d="M5 11a7 7 0 0014 0M12 18v4" stroke={t.primary} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          ),
          onPress: onOpenVoiceStudio,
        }
      : {
          key: 'quests',
          title: 'Quests',
          body: 'Small weekly goals to help you find your rhythm.',
          icon: (
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" stroke={t.primary} strokeWidth={2} strokeLinejoin="round" />
            </Svg>
          ),
          onPress: onOpenQuests,
        },
  ];

  return (
    <View style={styles.stack}>
      {/* 1. Welcome + the one clear next action */}
      <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
        <View style={styles.welcomeRow}>
          <View style={[styles.ghostBadge, { backgroundColor: t.primaryLight }]}>
            <Image
              source={require('../../../assets/images/jarvis-ghost-clean.png')}
              style={styles.ghostImage}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
          <View style={styles.welcomeText}>
            <Text style={[styles.eyebrow, { color: t.primary }]}>DAY 1</Text>
            <Text style={[styles.welcomeTitle, { color: t.text }]}>
              {firstName ? `Welcome, ${firstName}!` : 'Welcome to PostStreak!'}
            </Text>
          </View>
        </View>
        <Text style={[styles.welcomeBody, { color: t.textSecondary }]}>
          Let's plan your first post together. Jarvis will help with the idea, the caption and a good time to share it.
        </Text>
        <Pressable
          onPress={() => {
            tap(Haptics.ImpactFeedbackStyle.Medium);
            onPlanFirstPost();
          }}
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: t.primary }, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>Plan your first post</Text>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      </View>

      {/* 2. Gentle daily check-in */}
      <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
        <View style={styles.checkInHeader}>
          <Text style={[styles.cardTitle, { color: t.text }]}>Daily check-in</Text>
          {checkedIn && (
            <View style={[styles.softPill, { backgroundColor: t.primaryLight }]}>
              <Text style={[styles.softPillText, { color: t.primary }]}>Done for today</Text>
            </View>
          )}
        </View>

        <View style={styles.weekRow}>
          {DAY_LABELS.map((label, i) => {
            const isToday = i === streak.todayIndex;
            const filled = isToday && checkedIn;
            return (
              <View key={`${label}-${i}`} style={styles.dayCol}>
                <View
                  style={[
                    styles.dayDot,
                    { borderColor: isToday ? t.primary : t.border, backgroundColor: filled ? t.primary : 'transparent' },
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

        <Text style={[styles.checkInBody, { color: t.textSecondary }]}>
          {checkedIn
            ? 'Nice start! Come back whenever you can. Every check-in counts.'
            : 'Check in once a day to build a gentle habit. Missed a day? Just pick up again.'}
        </Text>

        {!checkedIn && (
          <Pressable
            onPress={handleCheckIn}
            style={({ pressed }) => [styles.secondaryBtn, { borderColor: t.primary }, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={[styles.secondaryBtnText, { color: t.primary }]}>Check in for today</Text>
          </Pressable>
        )}
      </View>

      {/* 3. What will appear here — a preview with no numbers */}
      <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
        <Text style={[styles.cardTitle, { color: t.text, marginBottom: 4 }]}>Coming up on your Home</Text>
        {previews.map((p, i) => (
          <Pressable
            key={p.key}
            onPress={() => {
              if (!p.onPress) return;
              tap();
              p.onPress();
            }}
            disabled={!p.onPress}
            style={({ pressed }) => [
              styles.previewRow,
              i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
              pressed && { opacity: 0.6 },
            ]}
            accessibilityRole={p.onPress ? 'button' : undefined}
          >
            <View style={[styles.previewIcon, { backgroundColor: t.primaryLight }]}>{p.icon}</View>
            <View style={styles.previewText}>
              <View style={styles.previewTitleRow}>
                <Text style={[styles.previewTitle, { color: t.text }]}>{p.title}</Text>
                {p.pro && (
                  <View style={styles.proBadge}>
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.previewBody, { color: t.textSecondary }]}>{p.body}</Text>
            </View>
            {p.onPress && (
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M9 6l6 6-6 6" stroke={t.textMuted} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 14,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ghostBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostImage: {
    width: 40,
    height: 40,
  },
  welcomeText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  welcomeBody: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  primaryBtn: {
    marginTop: 16,
    minHeight: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  checkInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
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
  checkInBody: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  secondaryBtn: {
    marginTop: 14,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    minHeight: 56,
  },
  previewIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    flex: 1,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  previewBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: goldTokens.light,
    borderColor: goldTokens.border,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  proBadgeText: {
    color: goldTokens.dark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
