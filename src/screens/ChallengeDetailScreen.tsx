import React, { useMemo, useState } from 'react';
import { usePageWidth } from '../hooks/useBreakpoint';
import { View, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, FadeInUp } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { AppToast } from '../components/ui/AppToast';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { JarvisOrb } from '../components/JarvisOrb';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import type { UserPersona } from '../types/account';
import { ChallengeCard, JarvisPickCard, type PickIdea } from '../components/quests/QuestBlocks';
import { getStarterIdeas } from '../data';
import { ds } from '../theme/colors';

// This week's challenge (opened from "Join the challenge" on Quests): post 3
// times this week at your own pace. The creator can see their 3 posts, pick
// which days suit them (with an optional reminder), and grab an idea for the
// next one. No deadline pressure, no made-up scores.

const GOAL = 3;
const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export interface QuestScriptDraft {
  title: string;
  hook: string;
  story: string;
  lesson: string;
  cta: string;
}

interface ChallengeDetailScreenProps {
  onBackToDashboard?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onLogout?: () => void;
  onOpenJarvisPro?: () => void;
  onOpenComposer?: (idea?: string, platform?: string, questDraft?: QuestScriptDraft) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  userPersona?: UserPersona;
}

const listDays = (days: number[]) => {
  const names = days.map((d) => DAY_SHORT[d]);
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

// ─── One of the 3 posts ─────────────────────────────────────────────────────
function PostRow({ n, state, sub }: { n: number; state: 'done' | 'next' | 'later'; sub: string }) {
  return (
    <Animated.View style={styles.postRow}>
      <View style={[styles.postDot, state === 'done' && styles.postDotDone, state === 'next' && styles.postDotNext]}>
        {state === 'done' ? (
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        ) : (
          <Text style={[styles.postNum, state === 'next' && { color: '#FFFFFF' }]}>{n}</Text>
        )}
      </View>
      <View style={styles.flex}>
        <View style={styles.postTop}>
          <Text style={styles.postTitle}>Post {n}</Text>
          {state === 'next' && (
            <View style={styles.nextChip}>
              <Text style={styles.nextChipText}>Next up</Text>
            </View>
          )}
        </View>
        <Animated.View key={sub} entering={FadeIn.duration(200)}>
          <Text style={[styles.postSub, state === 'done' && { color: ds.greenFill }]}>{sub}</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// ─── Day chip ───────────────────────────────────────────────────────────────
function DayChip({
  label,
  date,
  today,
  past,
  on,
  onPress,
}: {
  label: string;
  date: number;
  today: boolean;
  past: boolean;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={past}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on, disabled: past }}
      accessibilityLabel={`${label} ${date}${today ? ', today' : ''}`}
      style={({ pressed }) => [styles.day, on && styles.dayOn, past && styles.dayPast, pressed && styles.pressed, !past && pointer]}
    >
      <Text style={[styles.dayLabel, on && styles.dayTextOn]}>{label.charAt(0)}</Text>
      <Text style={[styles.dayDate, on && styles.dayTextOn]}>{date}</Text>
      {today && <View style={[styles.todayDot, on && { backgroundColor: '#FFFFFF' }]} />}
    </Pressable>
  );
}

export const ChallengeDetailScreen: React.FC<ChallengeDetailScreenProps> = ({
  onBackToDashboard,
  onNavigateTab,
  onLogout,
  onOpenJarvisPro,
  onOpenComposer,
  userProfile,
  onSaveProfile,
  userPersona,
}) => {
  const pageWidth = usePageWidth();
  const isNew = (userPersona || userProfile?.userPersona || 'new') === 'new';
  const done = isNew ? 0 : 1;
  const left = GOAL - done;

  const [showProfile, setShowProfile] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [days, setDays] = useState<number[]>([]);
  const [reminded, setReminded] = useState<number[] | null>(null);

  // This week, Monday first
  const week = useMemo(() => {
    const now = new Date();
    const todayIdx = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - todayIdx);
    return DAY_SHORT.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { i, label, date: d.getDate(), today: i === todayIdx, past: i < todayIdx };
    });
  }, []);

  const ideas: PickIdea[] = useMemo(
    () => getStarterIdeas(userProfile?.niches ?? [], (userProfile as { platforms?: string[] } | undefined)?.platforms ?? []).slice(0, 5),
    [userProfile],
  );

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast((t) => (t === m ? null : t)), 2400);
  };

  const toggleDay = (i: number) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setDays((prev) => {
      if (prev.includes(i)) return prev.filter((d) => d !== i);
      // Keep only as many days as posts left (drop the earliest pick)
      const next = [...prev, i];
      return next.length > left ? next.slice(next.length - left) : next;
    });
  };

  const sorted = [...days].sort((a, b) => a - b);
  const remindersMatch = reminded !== null && reminded.join() === sorted.join();

  const setReminders = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setReminded(sorted);
    showToast(`Reminders set for ${listDays(sorted)}`);
  };

  const rows = Array.from({ length: GOAL }).map((_, i) => {
    if (i < done) return { state: 'done' as const, sub: 'Posted on TikTok, Tuesday' };
    const planned = sorted[i - done];
    const when = planned !== undefined ? `Planned for ${DAY_LONG[planned]}` : null;
    if (i === done) return { state: 'next' as const, sub: when ?? 'Grab an idea below to start' };
    return { state: 'later' as const, sub: when ?? 'Any day this week' };
  });

  const enter = (d: number) => FadeInUp.delay(d).duration(500).easing(Easing.out(Easing.cubic));

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FreeAppHeader
          backgroundColor="transparent"
          onBack={onBackToDashboard}
          onOpenJarvisPro={onOpenJarvisPro}
          onOpenProfile={() => setShowProfile(true)}
          userPersona={userPersona}
          userProfile={userProfile}
        />
        <ScrollView contentContainerStyle={[styles.scroll, pageWidth]} showsVerticalScrollIndicator={false}>
          {/* Same card they tapped on Quests */}
          <Animated.View entering={enter(0)}>
            <ChallengeCard done={done} goal={GOAL} />
          </Animated.View>

          {/* The 3 posts */}
          <Animated.View entering={enter(100)}>
            <Text style={styles.section}>Your 3 posts</Text>
            <GlassCard radius={24} padding={16}>
              <View style={styles.posts}>
                {rows.map((r, i) => (
                  <PostRow key={i} n={i + 1} state={r.state} sub={r.sub} />
                ))}
              </View>
              <Text style={styles.anyNote}>Any platform and any format counts.</Text>
            </GlassCard>
          </Animated.View>

          {/* Plan the days */}
          <Animated.View entering={enter(200)}>
            <Text style={styles.section}>Pick days that suit you</Text>
            <GlassCard strong radius={24} padding={16}>
              <View style={styles.planHead}>
                <JarvisOrb size={26} />
                <Text style={styles.planTip}>Leaving a day or two between posts keeps it easy.</Text>
              </View>
              <View style={styles.week}>
                {week.map((d) => (
                  <DayChip
                    key={d.i}
                    label={d.label}
                    date={d.date}
                    today={d.today}
                    past={d.past}
                    on={days.includes(d.i)}
                    onPress={() => toggleDay(d.i)}
                  />
                ))}
              </View>
              <Text style={styles.planCount}>
                {sorted.length ? `${listDays(sorted)} · ${sorted.length} of ${left} picked` : `Pick up to ${left} ${left === 1 ? 'day' : 'days'}`}
              </Text>
              {sorted.length > 0 && (
                <Animated.View entering={FadeIn.duration(220)} style={styles.planCta}>
                  <AppButton
                    title={remindersMatch ? 'Reminders set' : 'Remind me on these days'}
                    variant={remindersMatch ? 'quiet' : 'primary'}
                    disabled={remindersMatch}
                    onPress={setReminders}
                  />
                </Animated.View>
              )}
            </GlassCard>
          </Animated.View>

          {/* Idea for the next post */}
          {ideas.length > 0 && (
            <Animated.View entering={enter(300)}>
              <Text style={styles.section}>An idea for post {done + 1}</Text>
              <JarvisPickCard orb={<JarvisOrb size={30} />} ideas={ideas} onUse={(idea) => onOpenComposer?.(idea.title)} />
            </Animated.View>
          )}

        </ScrollView>
      </SafeAreaView>

      {toast && <AppToast message={toast} />}
      <FloatingTabBar activeTab="quests" onTabPress={(t) => onNavigateTab?.(t)} />

      <UserProfileModal
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        onLogout={onLogout}
        initialProfile={userProfile}
        onSaveProfile={onSaveProfile}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  flex: { flex: 1 },
  pressed: { transform: [{ scale: 0.94 }] },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 130, width: '100%', maxWidth: 560, alignSelf: 'center' },
  section: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24, marginBottom: 12 },

  posts: { gap: 14 },
  postRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  postDot: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C4B5FD',
  },
  postDotDone: { backgroundColor: ds.greenFill, borderColor: ds.greenFill, borderStyle: 'solid' },
  postDotNext: {
    backgroundColor: ds.purple,
    borderColor: ds.purple,
    borderStyle: 'solid',
    shadowColor: ds.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  postNum: { fontSize: 14, fontWeight: '800', color: ds.purple },
  postTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postTitle: { fontSize: 15.5, fontWeight: '800', color: ds.ink },
  nextChip: { paddingHorizontal: 8, height: 20, borderRadius: 999, backgroundColor: ds.lavender, justifyContent: 'center' },
  nextChipText: { fontSize: 10.5, fontWeight: '800', color: ds.purple },
  postSub: { fontSize: 13, fontWeight: '600', color: ds.text3, marginTop: 1 },
  anyNote: { fontSize: 12.5, color: ds.text3, marginTop: 14 },

  planHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planTip: { flex: 1, fontSize: 13.5, lineHeight: 19, color: ds.text2 },
  week: { flexDirection: 'row', justifyContent: 'space-between', gap: 4, marginTop: 14 },
  day: {
    flex: 1,
    maxWidth: 48,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: ds.lavender,
  },
  dayOn: { backgroundColor: ds.purple, borderColor: ds.purple },
  dayPast: { opacity: 0.35 },
  dayLabel: { fontSize: 11, fontWeight: '800', color: ds.text3 },
  dayDate: { fontSize: 15, fontWeight: '800', color: ds.ink, marginTop: 1 },
  dayTextOn: { color: '#FFFFFF' },
  todayDot: { position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 2, backgroundColor: ds.purple },
  planCount: { fontSize: 12.5, fontWeight: '700', color: ds.text3, marginTop: 10 },
  planCta: { marginTop: 12 },

});
