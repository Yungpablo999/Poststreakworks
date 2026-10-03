import React, { useState } from 'react';
import { ResponsiveColumns } from '../ui/ResponsiveColumns';
import { Pressable } from 'react-native';
import { JarvisOrb } from '../JarvisOrb';
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
import { whenLabel } from '../../data';
import { ds, goldTokens } from '../../theme/colors';
import { useHomeSummary } from '../../backend/home';
import { compactCount, plural } from '../../utils/format';
import type { Brief } from '../../../frontend/shared/types/phase1';

// Home for creators who've been posting: the same glass design as day 0, now with their own
// numbers. One clear next step, the calm check-in, today's quest, and a quick look at schedule /
// audience / quests. Every figure is read from their account (GET /home); a row with nothing to
// say yet says what would fill it. No streak pressure, no brand deals (Stage 2).

interface HomeReturningProps {
  firstName?: string;
  onPlanPost: () => void;
  onOpenSchedule?: () => void;
  onOpenGrowth?: () => void;
  /** Where they connect an account (the audience row asks for one until they have). */
  onOpenAccounts?: () => void;
  onOpenQuests?: () => void;
  onStartQuest?: () => void;
  /** Pro members: today's brief from Jarvis. */
  pro?: boolean;
  onOpenHookStudio?: () => void;
  onOpenCreate?: () => void;
}

// ─── Pro: today's brief from Jarvis ─────────────────────────────────────────
// Each step ticks itself when they do the thing (the server sees it); nobody has to tick boxes.
function BriefCheck({ done }: { done: boolean }) {
  return (
    <View style={[styles.check, done && styles.checkDone]}>
      {done ? (
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ) : null}
    </View>
  );
}

function DailyBrief({ brief, onHook, onPlan }: { brief: Brief; onHook: () => void; onPlan: () => void }) {
  const count = brief.steps.filter((s) => s.done).length;
  return (
    <GlassCard strong radius={26} padding={18}>
      <View style={styles.briefHead}>
        <JarvisOrb size={32} />
        <View style={styles.flex}>
          <Text style={styles.briefTitle}>Today’s brief</Text>
          <Text style={styles.briefSub}>{count === brief.steps.length ? 'All done. Nice work.' : `${count} of ${brief.steps.length} done`}</Text>
        </View>
        <View style={styles.proTag}>
          <Text style={styles.proTagText}>PRO</Text>
        </View>
      </View>
      <Text style={styles.briefLead}>{brief.lead}</Text>
      {brief.steps.map((b) => (
        <View key={b.id} style={styles.briefRow} accessible accessibilityLabel={`${b.title}${b.done ? ', done' : ''}`}>
          <BriefCheck done={b.done} />
          <View style={[styles.flex, { opacity: b.done ? 0.55 : 1 }]}>
            <Text style={[styles.briefStep, b.done && styles.briefStepDone]}>{b.title}</Text>
            <Text style={styles.briefBody}>{b.body}</Text>
            {!b.done && b.action && (
              <Pressable onPress={b.action.place === 'hook-studio' ? onHook : onPlan} hitSlop={6} accessibilityRole="button" style={styles.briefAction}>
                <Text style={styles.briefActionText}>{b.action.label}</Text>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                  <Path d="M9 6l6 6-6 6" stroke={ds.purple} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </Pressable>
            )}
          </View>
        </View>
      ))}
    </GlassCard>
  );
}

export function HomeReturning({ firstName, onPlanPost, onOpenSchedule, onOpenGrowth, onOpenAccounts, onOpenQuests, onStartQuest, pro = false, onOpenHookStudio, onOpenCreate }: HomeReturningProps) {
  const home = useHomeSummary();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const enter = (d: number) => FadeInUp.delay(d).duration(550).easing(Easing.out(Easing.cubic));

  const next = home?.nextPost ? whenLabel(Date.parse(home.nextPost.at)) : null;
  const waiting = home?.waiting ?? 0;
  const brief = pro ? home?.brief ?? null : null;

  // What each row says depends on what their account really holds.
  const glance = home
    ? [
        {
          key: 'schedule',
          title: 'Your schedule',
          body: home.weekPlanned > 0 ? `${plural(home.weekPlanned, 'post')} this week${next ? ` · next ${next}` : ''}` : next ? `Next post ${next}` : 'Nothing planned this week yet',
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
          body: home.audience
            ? `${compactCount(home.audience.followers)} followers${home.audience.delta7d === null ? '' : home.audience.delta7d === 0 ? ' · steady this week' : ` · ${home.audience.delta7d > 0 ? 'up' : 'down'} ${compactCount(Math.abs(home.audience.delta7d))} this week`}`
            : 'Connect an account to see your followers here',
          icon: (
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M3 17l6-6 4 4 8-8M21 7h-6M21 7v6" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          ),
          onPress: home.audience ? onOpenGrowth : onOpenAccounts,
        },
        {
          key: 'quests',
          title: 'Quests',
          body: `Level ${home.level.level} · ${home.challenge.done} of ${home.challenge.goal} posts in this week’s challenge`,
          icon: (
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" stroke={ds.purple} strokeWidth={2} strokeLinejoin="round" />
            </Svg>
          ),
          onPress: onOpenQuests,
        },
      ]
    : [];

  return (
    <View style={styles.stack}>
      {/* Desktop: the main card on the left, the rest beside it */}
      <ResponsiveColumns fullFirst split={brief ? 2 : 1} gap={14}>
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

            {waiting > 0 ? (
              <Pressable onPress={onOpenSchedule} accessibilityRole="button" style={styles.waitingRow}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z" stroke={ds.purple} strokeWidth={2.2} strokeLinecap="round" />
                </Svg>
                <Text style={styles.nextText}>
                  <Text style={styles.nextBold}>{plural(waiting, 'post')}</Text> {waiting === 1 ? 'is' : 'are'} ready to go out. Tap to confirm.
                </Text>
              </Pressable>
            ) : next ? (
              <View style={styles.nextRow}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z" stroke={ds.purple} strokeWidth={2.2} strokeLinecap="round" />
                </Svg>
                <Text style={styles.nextText}>
                  Next post: <Text style={styles.nextBold}>{next}</Text>
                </Text>
              </View>
            ) : null}

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
        {brief && (
          <Animated.View entering={enter(80)}>
            <DailyBrief brief={brief} onHook={() => onOpenHookStudio?.()} onPlan={onPlanPost} />
          </Animated.View>
        )}

        {/* 2. Gentle daily check-in */}
        <Animated.View entering={enter(120)}>
          <CheckInCard onOpenCalendar={() => setCalendarOpen(true)} />
        </Animated.View>

        {/* 3. Today's quest */}
        {home && (
          <Animated.View entering={enter(200)}>
            <TodayQuestCard
              title="Share one post today"
              body={home.today.stepsDone > 0 && !home.today.done ? `${home.today.stepsDone} of ${home.today.stepsTotal} steps done. Whenever suits you.` : 'Whenever suits you. One post keeps your rhythm going.'}
              xp={home.today.xp}
              done={home.today.done}
              progress={home.today.stepsTotal ? home.today.stepsDone / home.today.stepsTotal : 0}
              onStart={() => onStartQuest?.()}
            />
          </Animated.View>
        )}

        {/* 4. At a glance, with their numbers */}
        <Animated.View entering={enter(280)}>
          <GlassCard radius={26} padding={0}>
            <View style={styles.glanceHeader}>
              <Text style={styles.cardTitle}>At a glance</Text>
              <Text style={styles.cardSub}>{home ? 'Tap to see more' : 'Loading…'}</Text>
            </View>
            {glance.map((g, i) => (
              <PreviewRow key={g.key} first={i === 0} title={g.title} body={g.body} icon={g.icon} onPress={g.onPress} />
            ))}
            {!home && <View style={styles.glanceLoading} />}
          </GlassCard>
        </Animated.View>
      </ResponsiveColumns>

      <CalendarSheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} onPlanPost={onOpenCreate ?? onPlanPost} />
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
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#C4B5FD', overflow: 'hidden', marginTop: 1, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: ds.greenFill, borderColor: ds.greenFill },
  briefStep: { fontSize: 15, fontWeight: '800', color: ds.ink },
  briefStepDone: { textDecorationLine: 'line-through' },
  briefBody: { fontSize: 13, lineHeight: 18, color: ds.text2, marginTop: 2 },
  briefAction: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, height: 30, borderRadius: 999, backgroundColor: ds.lavender },
  briefActionText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  stack: { gap: 14 },
  flex: { flex: 1 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 5 },
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

  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, alignSelf: 'flex-start', paddingHorizontal: 10, minHeight: 30, borderRadius: 999, backgroundColor: ds.lavenderSoft },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: ds.lavender },
  nextText: { flexShrink: 1, fontSize: 13, fontWeight: '600', color: ds.text2 },
  nextBold: { fontWeight: '800', color: ds.ink },
  cta: { marginTop: 18 },

  glanceHeader: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6 },
  glanceLoading: { height: 120 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2 },
  cardSub: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 2 },
});
