import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { Easing, FadeInUp } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { FitLines } from '../ui/FitLines';
import { GlassCard } from '../glass/GlassCard';
import { CheckInCard } from '../CheckInCard';
import { CalendarSheet } from './CalendarSheet';
import { FloatingGhost, PreviewRow } from './HomeDayZero';
import { TodayQuestCard } from '../quests/QuestBlocks';
import { getScheduleSummary, getWeekSchedule } from '../../data';
import { ds } from '../../theme/colors';

// Home for creators who've been posting: the same glass design as day 0, now
// with their own numbers. One clear next step, the calm check-in, today's
// quest, and a quick look at schedule / growth / quests. No streak pressure,
// no brand deals (Stage 2).

interface HomeReturningProps {
  firstName?: string;
  onPlanPost: () => void;
  onOpenSchedule?: () => void;
  onOpenGrowth?: () => void;
  onOpenQuests?: () => void;
  onStartQuest?: () => void;
}

export function HomeReturning({ firstName, onPlanPost, onOpenSchedule, onOpenGrowth, onOpenQuests, onStartQuest }: HomeReturningProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const week = getWeekSchedule('returning');
  const next = getScheduleSummary('returning').nextPostLabel;
  const enter = (d: number) => FadeInUp.delay(d).duration(550).easing(Easing.out(Easing.cubic));

  const glance = [
    {
      key: 'schedule',
      title: 'Your schedule',
      body: `${week.plannedCount} ${week.plannedCount === 1 ? 'post' : 'posts'} this week${next ? ` · next ${next}` : ''}`,
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="17" rx="3" stroke={ds.purple} strokeWidth={2} />
          <Path d="M16 2v4M8 2v4M3 10h18" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      ),
      onPress: onOpenSchedule,
    },
    {
      key: 'growth',
      title: 'Your audience',
      body: '24.8K followers · up 1,280 this week',
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M3 17l6-6 4 4 8-8M21 7h-6M21 7v6" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ),
      onPress: onOpenGrowth,
    },
    {
      key: 'quests',
      title: 'Quests',
      body: 'Level 12 · 1 of 3 posts in this week’s challenge',
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" stroke={ds.purple} strokeWidth={2} strokeLinejoin="round" />
        </Svg>
      ),
      onPress: onOpenQuests,
    },
  ];

  return (
    <View style={styles.stack}>
      {/* 1. Welcome back + the one next step */}
      <Animated.View entering={enter(0)}>
        <GlassCard strong radius={26} padding={20}>
          <View style={styles.welcomeRow}>
            <View style={styles.flex}>
              <View style={styles.chip}>
                <View style={styles.chipDot} />
                <Text style={styles.chipText}>TODAY</Text>
              </View>
              <FitLines
                lines={firstName ? ['Welcome back,', <Text key="n" style={styles.name}>{firstName}</Text>] : ['Welcome back']}
                textStyle={styles.title}
                maxFontSize={28}
                align="left"
                accessibilityLabel={`Welcome back${firstName ? `, ${firstName}` : ''}`}
              />
            </View>
            <FloatingGhost />
          </View>
          <Text style={styles.body}>Ready for today? One post keeps your rhythm going.</Text>

          {next && (
            <View style={styles.nextRow}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z" stroke={ds.purple} strokeWidth={2.2} strokeLinecap="round" />
              </Svg>
              <Text style={styles.nextText}>
                Next post: <Text style={styles.nextBold}>{next}</Text>
              </Text>
            </View>
          )}

          <View style={styles.cta}>
            <AppButton
              title="Plan today’s post"
              size="lg"
              onPress={onPlanPost}
              iconRight={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              }
            />
          </View>
        </GlassCard>
      </Animated.View>

      {/* 2. Gentle daily check-in */}
      <Animated.View entering={enter(120)}>
        <CheckInCard persona="returning" onOpenCalendar={() => setCalendarOpen(true)} />
      </Animated.View>

      {/* 3. Today's quest */}
      <Animated.View entering={enter(200)}>
        <TodayQuestCard title="Share one post today" body="Whenever suits you. One post keeps your rhythm going." xp={80} done={false} onStart={() => onStartQuest?.()} />
      </Animated.View>

      {/* 4. At a glance, with their numbers */}
      <Animated.View entering={enter(280)}>
        <GlassCard radius={26} padding={0}>
          <View style={styles.glanceHeader}>
            <Text style={styles.cardTitle}>At a glance</Text>
            <Text style={styles.cardSub}>Tap to see more</Text>
          </View>
          {glance.map((g, i) => (
            <PreviewRow key={g.key} first={i === 0} title={g.title} body={g.body} icon={g.icon} onPress={g.onPress} />
          ))}
        </GlassCard>
      </Animated.View>

      <CalendarSheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} persona="returning" onPlanPost={onPlanPost} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  flex: { flex: 1 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 999,
    backgroundColor: ds.lavender,
    marginBottom: 8,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ds.purple },
  chipText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  title: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  name: { color: ds.purple },
  body: { fontSize: 15.5, lineHeight: 22, color: ds.text2, marginTop: 10 },

  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, alignSelf: 'flex-start', paddingHorizontal: 10, height: 30, borderRadius: 999, backgroundColor: ds.lavenderSoft },
  nextText: { fontSize: 13, fontWeight: '600', color: ds.text2 },
  nextBold: { fontWeight: '800', color: ds.ink },
  cta: { marginTop: 18 },

  glanceHeader: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2 },
  cardSub: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 2 },
});
