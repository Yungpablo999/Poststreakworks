import React, { useEffect, useState } from 'react';
import { ResponsiveColumns } from '../ui/ResponsiveColumns';
import { Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { JarvisOrb } from '../JarvisOrb';
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
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
import { getScheduleSummary, getVoiceCloneSummary, getWeekSchedule } from '../../data';
import { ds, goldTokens } from '../../theme/colors';

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
  /** Pro members: today's brief from Jarvis and a Voice Studio row. */
  pro?: boolean;
  onOpenHookStudio?: () => void;
  onOpenVoiceStudio?: () => void;
}

// ─── Pro: today's brief from Jarvis (tick the steps off) ────────────────────
const BRIEF = [
  { id: 'hook', title: 'Open with a mistake', body: 'Your mistake-style openings kept people watching longest last week.', action: 'Write the hook' },
  { id: 'film', title: 'Film one short video', body: 'About 30 seconds, talking to camera. TikTok first.', action: 'Plan it' },
  { id: 'time', title: 'Post at 7:30 PM', body: 'When your audience is most active today.', action: null },
] as const;

function BriefCheck({ done }: { done: boolean }) {
  const t = useSharedValue(done ? 1 : 0);
  useEffect(() => {
    t.value = withTiming(done ? 1 : 0, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [done, t]);
  const fill = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scale: 0.6 + 0.4 * t.value }] }));
  return (
    <View style={styles.check}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.checkFill, fill]}>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function DailyBrief({ onHook, onPlan }: { onHook: () => void; onPlan: () => void }) {
  const [done, setDone] = useState<string[]>([]);
  const count = done.length;
  return (
    <GlassCard strong radius={26} padding={18}>
      <View style={styles.briefHead}>
        <JarvisOrb size={32} />
        <View style={styles.flex}>
          <Text style={styles.briefTitle}>Today’s brief</Text>
          <Text style={styles.briefSub}>{count === BRIEF.length ? 'All done. Nice work.' : `${count} of ${BRIEF.length} done`}</Text>
        </View>
        <View style={styles.proTag}>
          <Text style={styles.proTagText}>PRO</Text>
        </View>
      </View>
      <Text style={styles.briefLead}>Your best move today: one creator-advice video, posted this evening.</Text>
      {BRIEF.map((b) => {
        const on = done.includes(b.id);
        return (
          <View key={b.id} style={styles.briefRow}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setDone((d) => (d.includes(b.id) ? d.filter((x) => x !== b.id) : [...d, b.id]));
              }}
              hitSlop={8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={b.title}
            >
              <BriefCheck done={on} />
            </Pressable>
            <View style={[styles.flex, { opacity: on ? 0.55 : 1 }]}>
              <Text style={[styles.briefStep, on && styles.briefStepDone]}>{b.title}</Text>
              <Text style={styles.briefBody}>{b.body}</Text>
              {!on && b.action && (
                <Pressable onPress={b.id === 'hook' ? onHook : onPlan} hitSlop={6} accessibilityRole="button" style={styles.briefAction}>
                  <Text style={styles.briefActionText}>{b.action}</Text>
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path d="M9 6l6 6-6 6" stroke={ds.purple} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}
    </GlassCard>
  );
}

export function HomeReturning({ firstName, onPlanPost, onOpenSchedule, onOpenGrowth, onOpenQuests, onStartQuest, pro = false, onOpenHookStudio, onOpenVoiceStudio }: HomeReturningProps) {
  const voice = getVoiceCloneSummary('returning');
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
    ...(pro
      ? [
          {
            key: 'voice',
            title: 'Voice Studio',
            body: `${voice.voiceName ?? 'Your voice'} · ${Math.max(0, voice.minutesIncluded - voice.minutesUsed)} of ${voice.minutesIncluded} minutes left`,
            icon: (
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Rect x="9" y="2" width="6" height="12" rx="3" stroke={ds.purple} strokeWidth={2} />
                <Path d="M5 11a7 7 0 0014 0M12 18v4" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            ),
            onPress: onOpenVoiceStudio,
          },
        ]
      : []),
  ];

  return (
    <View style={styles.stack}>
      {/* Desktop: the main card on the left, the rest beside it */}
      <ResponsiveColumns split={pro ? 2 : 1} gap={14} leftFlex={1.15}>
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

      {/* Pro: today's brief from Jarvis */}
      {pro && (
        <Animated.View entering={enter(80)}>
          <DailyBrief onHook={() => onOpenHookStudio?.()} onPlan={onPlanPost} />
        </Animated.View>
      )}

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

      </ResponsiveColumns>

      <CalendarSheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} persona="returning" onPlanPost={onPlanPost} />
    </View>
  );
}

const styles = StyleSheet.create({
  proTag: { paddingHorizontal: 7, height: 20, borderRadius: 999, justifyContent: 'center', backgroundColor: goldTokens.light, borderWidth: 1, borderColor: goldTokens.border },
  proTagText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: goldTokens.dark },
  briefHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  briefTitle: { fontSize: 17, fontWeight: '800', color: ds.ink },
  briefSub: { fontSize: 12.5, fontWeight: '700', color: ds.text3, marginTop: 1 },
  briefLead: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: ds.ink, marginTop: 12, marginBottom: 4 },
  briefRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 12 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#C4B5FD', overflow: 'hidden', marginTop: 1 },
  checkFill: { backgroundColor: ds.greenFill, alignItems: 'center', justifyContent: 'center' },
  briefStep: { fontSize: 15, fontWeight: '800', color: ds.ink },
  briefStepDone: { textDecorationLine: 'line-through' },
  briefBody: { fontSize: 13, lineHeight: 18, color: ds.text2, marginTop: 2 },
  briefAction: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, height: 30, borderRadius: 999, backgroundColor: ds.lavender },
  briefActionText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
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
