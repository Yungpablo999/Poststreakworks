import React, { useEffect, useMemo, useState } from 'react';
import { usePageWidth } from '../hooks/useBreakpoint';
import { ActivityIndicator, View, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
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
import { ChallengeCard, JarvisPickCard, type PickIdea } from '../components/quests/QuestBlocks';
import { ds } from '../theme/colors';
import { useAsync } from '../hooks/useAsync';
import { joinChallenge, loadQuestBoard, saveChallengeReminders, useQuestBoard } from '../backend/quests';
import { loadIdeaFeed } from '../backend/ideas';
import { trackEvent } from '../backend/track';

// This week's challenge (opened from "Join the challenge" on Quests): post 3 times this week at
// your own pace. The posts shown are the creator's real ones (published through PostStreak or read
// from a connected account); they pick which days suit them and can ask for a note in the bell on
// those days, and grab an idea for the next post. No deadline pressure, no made-up scores.

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PLATFORM_NAME: Record<string, string> = { tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', threads: 'Threads', facebook: 'Facebook' };

interface ChallengeDetailScreenProps {
  onBackToDashboard?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onLogout?: () => void;
  onOpenJarvisPro?: () => void;
  onOpenComposer?: (idea?: string) => void;
  userProfile: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
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
function DayChip({ label, date, today, past, on, onPress }: { label: string; date: number; today: boolean; past: boolean; on: boolean; onPress: () => void }) {
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

export const ChallengeDetailScreen: React.FC<ChallengeDetailScreenProps> = ({ onBackToDashboard, onNavigateTab, onLogout, onOpenJarvisPro, onOpenComposer, userProfile, onSaveProfile }) => {
  const pageWidth = usePageWidth();
  const board = useQuestBoard();
  useAsync(loadQuestBoard, []);
  const ideas = useAsync(() => loadIdeaFeed('often'), []);
  const pick: PickIdea[] = (ideas.data ?? []).slice(0, 5);

  const challenge = board?.challenge;
  const goal = challenge?.goal ?? 3;
  const done = challenge?.done ?? 0;
  const left = Math.max(0, goal - done);

  const [showProfile, setShowProfile] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [days, setDays] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  // Days they already asked to be reminded on
  useEffect(() => {
    if (challenge?.reminderDays) setDays(challenge.reminderDays);
  }, [challenge?.reminderDays?.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast((t) => (t === m ? null : t)), 2800);
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
  const saved = challenge?.reminderDays ?? [];
  const remindersMatch = sorted.length > 0 && sorted.join() === saved.join();

  const setReminders = async () => {
    if (busy) return;
    setBusy(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const kept = await saveChallengeReminders(sorted);
    setBusy(false);
    if (kept) showToast(kept.length ? `You’ll get a note in the bell on ${listDays(kept)}` : 'Reminders cleared');
  };

  const rows = Array.from({ length: goal }).map((_, i) => {
    const posted = challenge?.posts[i];
    if (i < done && posted) {
      const when = new Date(posted.at).toLocaleDateString('en-GB', { weekday: 'long' });
      return { state: 'done' as const, sub: `Posted on ${PLATFORM_NAME[posted.platform] ?? posted.platform}, ${when}` };
    }
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
        <FreeAppHeader backgroundColor="transparent" onBack={onBackToDashboard} onOpenJarvisPro={onOpenJarvisPro} onOpenProfile={() => setShowProfile(true)} userProfile={userProfile} />
        <ScrollView contentContainerStyle={[styles.scroll, pageWidth]} showsVerticalScrollIndicator={false}>
          {!challenge ? (
            <ActivityIndicator color={ds.purple} style={{ marginVertical: 48 }} />
          ) : (
            <>
              {/* Same card they tapped on Quests */}
              <Animated.View entering={enter(0)}>
                <ChallengeCard
                  title={challenge.title}
                  done={done}
                  goal={goal}
                  xp={challenge.xp}
                  others={challenge.others}
                  completed={challenge.completed}
                  cta={challenge.joined ? undefined : { label: 'Join the challenge', onPress: () => void joinChallenge() }}
                />
              </Animated.View>

              {/* The 3 posts */}
              <Animated.View entering={enter(100)}>
                <Text style={styles.section}>Your {goal} posts</Text>
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
              {left > 0 && (
                <Animated.View entering={enter(200)}>
                  <Text style={styles.section}>Pick days that suit you</Text>
                  <GlassCard strong radius={24} padding={16}>
                    <View style={styles.planHead}>
                      <JarvisOrb size={26} />
                      <Text style={styles.planTip}>Leaving a day or two between posts keeps it easy.</Text>
                    </View>
                    <View style={styles.week}>
                      {week.map((d) => (
                        <DayChip key={d.i} label={d.label} date={d.date} today={d.today} past={d.past} on={days.includes(d.i)} onPress={() => toggleDay(d.i)} />
                      ))}
                    </View>
                    <Text style={styles.planCount}>
                      {sorted.length ? `${listDays(sorted)} · ${sorted.length} of ${left} picked` : `Pick up to ${left} ${left === 1 ? 'day' : 'days'}`}
                    </Text>
                    {sorted.length > 0 && (
                      <Animated.View entering={FadeIn.duration(220)} style={styles.planCta}>
                        <AppButton
                          title={remindersMatch ? 'Reminders set' : busy ? 'Saving…' : 'Remind me on these days'}
                          variant={remindersMatch ? 'quiet' : 'primary'}
                          disabled={remindersMatch || busy}
                          onPress={() => void setReminders()}
                        />
                        <Text style={styles.reminderNote}>You’ll find a note in the bell on those days.</Text>
                      </Animated.View>
                    )}
                  </GlassCard>
                </Animated.View>
              )}

              {/* Idea for the next post */}
              {left > 0 && pick.length > 0 && (
                <Animated.View entering={enter(300)}>
                  <Text style={styles.section}>An idea for post {done + 1}</Text>
                  <JarvisPickCard
                    orb={<JarvisOrb size={30} />}
                    ideas={pick}
                    onUse={(idea) => {
                      trackEvent('idea_picked', { title: idea.title.slice(0, 80) });
                      onOpenComposer?.(idea.title);
                    }}
                  />
                </Animated.View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {toast && <AppToast message={toast} />}
      <FloatingTabBar activeTab="quests" onTabPress={(t) => onNavigateTab?.(t)} />

      <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} onLogout={onLogout} initialProfile={userProfile} onSaveProfile={onSaveProfile} />
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
  reminderNote: { fontSize: 12, color: ds.text3, textAlign: 'center', marginTop: 8 },
});
