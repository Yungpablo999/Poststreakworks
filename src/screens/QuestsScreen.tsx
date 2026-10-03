import React, { useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import Reanimated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TourTarget, useTourScroll } from '../components/tour/GhostTour';
import { ResponsiveColumns } from '../components/ui/ResponsiveColumns';
import { Text } from '../components/ui/AppText';
import { CheckInCard } from '../components/CheckInCard';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { FitLines } from '../components/ui/FitLines';
import { JarvisOrb } from '../components/JarvisOrb';
import { CalendarSheet } from '../components/home/CalendarSheet';
import { ProUpsellCard } from '../components/home/ProUpsellCard';
import { TodayQuestCard, QuestRow, LevelCard, ChallengeCard, JarvisTip } from '../components/quests/QuestBlocks';
import { ds } from '../theme/colors';
import { sPadding } from '../utils/responsive';
import { compactCount } from '../utils/format';
import { joinChallenge, loadQuestBoard, useQuestBoard } from '../backend/quests';
import { useAsync } from '../hooks/useAsync';
import type { QuestPlace } from '../../frontend/shared/types/phase1';

// Quests. Everything here is the server's view of what the creator has really done: their level,
// today's quest and its steps, the list of small quests, and this week's challenge. The app
// never ticks a quest off; it reloads the board when the creator comes back to this page.

interface QuestsScreenProps {
  onBackToDashboard?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenMissionDetail?: () => void;
  onOpenCommunityChallenge?: () => void;
  onOpenJarvisPro?: () => void;
  /** Where a quest's button takes the creator (the Create page, the schedule, the accounts…). */
  onOpenPlace: (place: QuestPlace) => void;
  userProfile: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

export const QuestsScreen: React.FC<QuestsScreenProps> = ({
  onNavigateTab,
  onOpenMissionDetail,
  onOpenCommunityChallenge,
  onOpenJarvisPro,
  onOpenPlace,
  onLogout,
  userProfile,
  onSaveProfile,
}) => {
  // Lets Ghost's tour scroll this page
  const tourScroll = useTourScroll();
  const isNewUser = userProfile.userPersona === 'new';
  const pro = userProfile.tier === 'pro' || userProfile.tier === 'founding';
  const [showProfile, setShowProfile] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const board = useQuestBoard();
  // Each time this page opens it asks the server where the creator is
  const { failed, reload } = useAsync(loadQuestBoard, []);

  const tap = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const challenge = board?.challenge;
  const openChallenge = async () => {
    tap();
    if (challenge && !challenge.joined) await joinChallenge();
    onOpenCommunityChallenge?.();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        <GlassBackdrop />
        <FreeAppHeader backgroundColor="transparent" onOpenJarvisPro={onOpenJarvisPro} onOpenProfile={() => setShowProfile(true)} userProfile={userProfile} />

        <ScrollView {...tourScroll} style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces>
          {/* HEADLINE — same two-line structure on every screen size */}
          <Reanimated.View entering={FadeInUp.duration(500)} style={styles.headline}>
            <FitLines
              lines={['Small quests,', <Text key="r" style={styles.headlineAccent}>steady rhythm</Text>]}
              textStyle={styles.headlineText}
              maxFontSize={34}
              align="left"
              accessibilityLabel="Small quests, steady rhythm"
            />
          </Reanimated.View>

          {!board ? (
            <View style={styles.loading}>
              {failed ? (
                <>
                  <Text style={styles.loadingText}>Couldn’t load your quests.</Text>
                  <Text style={[styles.loadingText, styles.retry]} onPress={reload} accessibilityRole="button">
                    Try again
                  </Text>
                </>
              ) : (
                <ActivityIndicator color={ds.purple} />
              )}
            </View>
          ) : (
            // Desktop: today's quest and check-in on the left, the rest beside them
            <ResponsiveColumns split={2} gap={16}>
              {/* 1. TODAY'S QUEST */}
              <Reanimated.View entering={FadeInUp.delay(100).duration(550)}>
                <TourTarget id="quest-card">
                  <TodayQuestCard
                    title={isNewUser ? 'Complete your first Studio session' : 'Share one post today'}
                    body={
                      isNewUser
                        ? 'Try one Studio tool to get your first idea ready.'
                        : board.today.steps.some((s) => s.done) && !board.today.done
                          ? `${board.today.steps.filter((s) => s.done).length} of ${board.today.steps.length} steps done. Whenever suits you.`
                          : 'Whenever suits you. One post keeps your rhythm going.'
                    }
                    xp={board.today.xp}
                    done={board.today.done}
                    progress={board.today.steps.filter((s) => s.done).length / board.today.steps.length}
                    onStart={() => {
                      tap();
                      onOpenMissionDetail?.();
                    }}
                  />
                </TourTarget>
              </Reanimated.View>

              {/* 2. LEVEL (creators who post) + CHECK-IN */}
              <Reanimated.View entering={FadeInUp.delay(200).duration(550)} style={styles.stack}>
                {!isNewUser && <LevelCard level={board.level} xp={compactCount(board.xp)} active={board.active} progress={board.xpIntoLevel / board.xpPerLevel} />}
                <CheckInCard onOpenCalendar={() => setCalendarOpen(true)} />
              </Reanimated.View>

              {/* 3. QUESTS LIST */}
              <Reanimated.View entering={FadeInUp.delay(300).duration(550)}>
                <Text style={styles.sectionLabel}>{isNewUser ? 'Starter quests' : 'This week'}</Text>
                <View style={styles.stack}>
                  {board.list.map((q) => (
                    <QuestRow
                      key={q.key}
                      icon={q.icon}
                      title={q.title}
                      xp={q.xp}
                      cadence={q.cadence}
                      action={q.action}
                      done={q.done}
                      progress={q.progress}
                      onPress={() => {
                        tap();
                        onOpenPlace(q.place);
                      }}
                    />
                  ))}
                </View>
              </Reanimated.View>

              {/* 4. WEEKLY CHALLENGE */}
              <Reanimated.View entering={FadeInUp.delay(400).duration(550)} style={styles.section}>
                <ChallengeCard
                  title={board.challenge.title}
                  done={board.challenge.done}
                  goal={board.challenge.goal}
                  xp={board.challenge.xp}
                  others={board.challenge.others}
                  completed={board.challenge.completed}
                  cta={{ label: board.challenge.joined ? 'See the challenge' : 'Join the challenge', onPress: openChallenge }}
                />
              </Reanimated.View>

              {/* 5. PRO: Pro quests for members, the upgrade card for free (gold = Pro only) */}
              {pro && board.pro && board.pro.length > 0 ? (
                <Reanimated.View entering={FadeInUp.delay(500).duration(550)}>
                  <Text style={styles.sectionLabel}>Pro quests</Text>
                  <View style={styles.stack}>
                    {board.pro.map((q) => (
                      <QuestRow
                        key={q.key}
                        pro
                        icon={q.icon}
                        title={q.title}
                        xp={q.xp}
                        cadence={q.cadence}
                        action={q.action}
                        done={q.done}
                        progress={q.progress}
                        onPress={() => {
                          tap();
                          onOpenPlace(q.place);
                        }}
                      />
                    ))}
                  </View>
                </Reanimated.View>
              ) : !pro ? (
                <Reanimated.View entering={FadeInUp.delay(500).duration(550)} style={styles.section}>
                  <ProUpsellCard title="Get more with Jarvis Pro" buttonTitle="Explore Pro" onUpgrade={() => onOpenJarvisPro?.()} />
                </Reanimated.View>
              ) : null}

              {/* 6. JARVIS TIP */}
              <Reanimated.View entering={FadeInUp.delay(600).duration(550)} style={styles.section}>
                <JarvisTip orb={<JarvisOrb size={30} />} text="Start with today's quest. Small daily steps add up faster than you'd think." />
              </Reanimated.View>
            </ResponsiveColumns>
          )}
          {/* Bottom Space for Floating Tab Bar */}
          <View style={{ height: 110 }} />
        </ScrollView>

        <CalendarSheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} onPlanPost={() => onNavigateTab?.('create')} />

        {/* FLOATING LIQUID GLASS TAB BAR */}
        <FloatingTabBar activeTab="quests" onTabPress={(tab) => onNavigateTab?.(tab)} />

        <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} onLogout={onLogout} initialProfile={userProfile} onSaveProfile={onSaveProfile} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ds.bg },
  container: { flex: 1, width: '100%' },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  headlineAccent: { color: ds.purple },
  sectionLabel: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24 },
  stack: { gap: 12, marginTop: 12 },
  section: { marginTop: 24 },
  scrollContent: { paddingHorizontal: sPadding(18), paddingTop: 8 },
  loading: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 48 },
  loadingText: { fontSize: 14.5, fontWeight: '600', color: ds.text2 },
  retry: { color: ds.purple, fontWeight: '800' },
});
