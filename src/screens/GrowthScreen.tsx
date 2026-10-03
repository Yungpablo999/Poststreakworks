import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import Reanimated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TourTarget, useTourScroll } from '../components/tour/GhostTour';
import { ResponsiveColumns } from '../components/ui/ResponsiveColumns';
import { Text } from '../components/ui/AppText';
import { FitLines } from '../components/ui/FitLines';
import { AppButton } from '../components/ui/AppButton';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { JarvisOrb } from '../components/JarvisOrb';
import { ProUpsellCard } from '../components/home/ProUpsellCard';
import { ConnectAccountsSheet } from '../components/growth/ConnectAccountsSheet';
import { WeeklyPlanSheet, type PlanStep } from '../components/growth/WeeklyPlanSheet';
import { AccountRows } from '../components/accounts/AccountRows';
import { AudienceEmptyHero, ComingUpCard, FirstReportCard, JarvisStrategyCard } from '../components/growth/GrowthBlocks';
import { AudienceHero, BestPostCard, MilestonesCard, PlatformListCard, PlatformsCompareCard, RecentPostsCard, WeeklyReportCard } from '../components/growth/GrowthReturning';
import { MonthlyHistoryCard } from '../components/growth/ProInsights';
import { ds } from '../theme/colors';
import { useAsync } from '../hooks/useAsync';
import { useCheckInStreak } from '../hooks/useCheckInStreak';
import { loadGrowth, refreshGrowth, useGrowth } from '../backend/growth';
import { loadQuestBoard, useQuestBoard } from '../backend/quests';
import { notify } from '../backend/notice';
import { timeAgo } from '../utils/time';
import { shortDay } from '../utils/format';
import type { ConnectablePlatform, GrowthOverview, GrowthPost } from '../../frontend/shared/types/phase1';

// Growth. Everything here is what the creator's connected accounts have really reported: followers
// and how they moved, how their latest posts did, the best one, the hour they do best at. With
// nothing connected, or nothing read yet, it says so and offers the next step; it never shows a
// number the platforms didn't give.

interface GrowthScreenProps {
  tier?: 'free' | 'pro';
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenChallenge?: () => void;
  onOpenSchedule?: () => void;
  onOpenIdeas?: () => void;
  onOpenPostPerformance: (key: string) => void;
  onOpenPlatformGrowth: (platform?: ConnectablePlatform) => void;
  onOpenAudienceBreakdown: () => void;
  /** Only given when the server can write ideas (the AI is set up): "Make more like this". */
  onMakeMoreLikeThis?: (post: GrowthPost) => void;
  onLogout?: () => void;
  userProfile: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

/** Days we have follower counts for, up to seven (for "your first report arrives after 7 days"). */
function daysOfData(o: GrowthOverview): number {
  const since = o.platforms.map((p) => p.trackedSince).filter((d): d is string => !!d).sort()[0];
  if (!since) return 0;
  const days = Math.floor((Date.now() - Date.parse(`${since}T00:00:00Z`)) / 86_400_000) + 1;
  return Math.max(1, Math.min(7, days));
}

/** One true sentence for the strategy card, from this creator's own numbers. */
function strategyQuote(o: GrowthOverview): string {
  const best = o.bestPost;
  if (best?.comparison && best.comparison.percent >= 10) {
    return `Your best lately, “${best.title}”, got ${best.comparison.percent}% more views than your usual ${best.platformName} post. A good one to build on.`;
  }
  if (o.bestTime) return `Your posts do best around ${o.bestTime.label}. That’s a good time to plan the next one.`;
  if (o.hasData) return 'Post a few more times and Jarvis can tell you what works best for you.';
  return 'Jarvis learns your patterns as you post. Connect an account and your first tip shows up after a few posts.';
}

export const GrowthScreen: React.FC<GrowthScreenProps> = ({
  tier = 'free',
  onNavigateTab,
  onOpenJarvisPro,
  onOpenChallenge,
  onOpenSchedule,
  onOpenIdeas,
  onOpenPostPerformance,
  onOpenPlatformGrowth,
  onOpenAudienceBreakdown,
  onMakeMoreLikeThis,
  onLogout,
  userProfile,
  onSaveProfile,
}) => {
  // Lets Ghost's tour scroll this page
  const tourScroll = useTourScroll();
  const pro = tier === 'pro';
  const [showProfile, setShowProfile] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const overview = useGrowth();
  const board = useQuestBoard();
  const { streak } = useCheckInStreak();
  // Each time this page opens it asks the server how things stand
  const { failed, reload } = useAsync(async () => {
    void loadQuestBoard();
    return loadGrowth();
  }, []);

  const tap = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const refresh = async () => {
    if (!overview || refreshing) return;
    tap();
    setRefreshing(true);
    const r = await refreshGrowth(overview);
    setRefreshing(false);
    notify(r.ok ? 'Up to date' : r.message);
  };

  const challenge = board?.challenge ? { done: board.challenge.done, goal: board.challenge.goal, joined: board.challenge.joined } : null;
  const leavePlan = (go: (() => void) | undefined, fallback: TabType) => {
    setShowPlan(false);
    if (go) go();
    else onNavigateTab?.(fallback);
  };

  const planSteps = (o: GrowthOverview): PlanStep[] => {
    const steps: PlanStep[] = [];
    if (!o.hasAccounts) {
      steps.push({ id: 'connect', title: 'Connect one account', body: 'So Jarvis can start learning what works for you.', action: 'Connect', onAction: () => { setShowPlan(false); setShowAccounts(true); } });
    } else if (o.needsReconnect.length > 0) {
      steps.push({ id: 'reconnect', title: 'Connect your account again', body: 'The platform needs you to approve PostStreak again before it shares new numbers.', action: 'Reconnect', onAction: () => { setShowPlan(false); setShowAccounts(true); } });
    }
    if (!o.hasData) {
      steps.push({ id: 'idea', title: 'Pick your first idea', body: 'Choose one that feels easy to make.', action: 'See ideas', onAction: () => leavePlan(onOpenIdeas, 'create') });
      steps.push({ id: 'post', title: 'Post once this week', body: 'Any day, any format. One post gives Jarvis something to learn from.', action: 'Start a post', onAction: () => leavePlan(undefined, 'create') });
      return steps.slice(0, 3);
    }
    if (challenge && challenge.done < challenge.goal) {
      const left = challenge.goal - challenge.done;
      steps.push({ id: 'challenge', title: `Post ${left} more ${left === 1 ? 'time' : 'times'} this week`, body: 'That finishes this week’s challenge. Any days that suit you.', action: 'See the challenge', onAction: () => leavePlan(onOpenChallenge, 'quests') });
    }
    if (o.bestTime) {
      steps.push({ id: 'time', title: `Plan a post for around ${o.bestTime.label}`, body: 'That’s when your posts have done best.', action: 'Open schedule', onAction: () => leavePlan(onOpenSchedule, 'create') });
    }
    if (o.bestPost) {
      steps.push({ id: 'again', title: 'Build on your best post', body: `“${o.bestPost.title}” did well. A new angle on the same idea is an easy next one.`, action: 'Get ideas', onAction: () => leavePlan(onOpenIdeas, 'create') });
    }
    return steps.slice(0, 3);
  };

  const body = (o: GrowthOverview) => {
    // Nothing yet: say why, and what to do
    if (!o.hasData) {
      const onlyNeedsReconnect = o.hasAccounts && o.connected === 0;
      return (
        <ResponsiveColumns split={2} gap={16}>
          <Reanimated.View entering={FadeInUp.delay(100).duration(550)}>
            <TourTarget id="growth-card">
              <AudienceEmptyHero
                state={!o.hasAccounts ? 'none' : onlyNeedsReconnect ? 'reconnect' : 'reading'}
                connectedCount={o.connected}
                onConnect={() => { tap(); setShowAccounts(true); }}
                onReconnect={() => { tap(); setShowAccounts(true); }}
              />
            </TourTarget>
          </Reanimated.View>
          <Reanimated.View entering={FadeInUp.delay(200).duration(550)}>
            <Text style={styles.sectionLabel}>Your platforms</Text>
            <View style={styles.rows}>
              <AccountRows />
            </View>
          </Reanimated.View>
          <Reanimated.View entering={FadeInUp.delay(300).duration(550)} style={styles.section}>
            <ComingUpCard pro={pro} />
          </Reanimated.View>
          <Reanimated.View entering={FadeInUp.delay(400).duration(550)} style={styles.section}>
            <JarvisStrategyCard orb={<JarvisOrb size={34} />} title="Learning your style" quote={strategyQuote(o)} buttonTitle="See your starter plan" onOpen={() => setShowPlan(true)} />
          </Reanimated.View>
          <Reanimated.View entering={FadeInUp.delay(500).duration(550)} style={styles.section}>
            <FirstReportCard daysOfData={daysOfData(o)} />
          </Reanimated.View>
        </ResponsiveColumns>
      );
    }

    return (
      <ResponsiveColumns split={2} gap={16}>
        {/* 1. TOTAL AUDIENCE */}
        <Reanimated.View entering={FadeInUp.delay(100).duration(550)}>
          <TourTarget id="growth-card">
            <AudienceHero overview={o} onOpen={onOpenAudienceBreakdown} />
          </TourTarget>
        </Reanimated.View>

        {/* 2. YOUR PLATFORMS */}
        <Reanimated.View entering={FadeInUp.delay(200).duration(550)} style={styles.section}>
          <PlatformListCard platforms={o.platforms} onOpen={(p) => onOpenPlatformGrowth(p.platform)} onManage={() => setShowAccounts(true)} />
        </Reanimated.View>

        {/* 3. BEST POST */}
        {o.bestPost && (
          <Reanimated.View entering={FadeInUp.delay(300).duration(550)} style={styles.section}>
            <Text style={[styles.sectionLabel, styles.labelTight]}>Your best post lately</Text>
            <BestPostCard post={o.bestPost} onWhy={() => onOpenPostPerformance(o.bestPost!.key)} onMore={onMakeMoreLikeThis ? () => onMakeMoreLikeThis(o.bestPost!) : undefined} />
          </Reanimated.View>
        )}

        {/* 4. LATEST POSTS */}
        {o.recentPosts.length > 0 && (
          <Reanimated.View entering={FadeInUp.delay(340).duration(550)} style={styles.section}>
            <RecentPostsCard posts={o.recentPosts.slice(0, 5)} onOpen={(p) => onOpenPostPerformance(p.key)} />
          </Reanimated.View>
        )}

        {/* 5. WHERE POSTS DO BEST (two or more accounts with posts) */}
        {o.platforms.filter((p) => p.avgViews30 !== null).length >= 2 && (
          <Reanimated.View entering={FadeInUp.delay(380).duration(550)} style={styles.section}>
            <PlatformsCompareCard platforms={o.platforms} onOpen={(p) => onOpenPlatformGrowth(p.platform)} />
          </Reanimated.View>
        )}

        {/* 6. STRATEGY */}
        <Reanimated.View entering={FadeInUp.delay(420).duration(550)} style={styles.section}>
          <JarvisStrategyCard orb={<JarvisOrb size={34} />} title="Your growth strategy" quote={strategyQuote(o)} buttonTitle="See this week’s plan" onOpen={() => setShowPlan(true)} />
        </Reanimated.View>

        {/* 7. MILESTONES */}
        <Reanimated.View entering={FadeInUp.delay(460).duration(550)} style={styles.section}>
          <MilestonesCard overview={o} challenge={challenge} streakDays={streak.currentDays} onChallenge={() => (onOpenChallenge ? onOpenChallenge() : onNavigateTab?.('quests'))} />
        </Reanimated.View>

        {/* 8. THIS WEEK */}
        <Reanimated.View entering={FadeInUp.delay(500).duration(550)} style={styles.section}>
          <WeeklyReportCard overview={o} />
        </Reanimated.View>

        {/* 9. PRO: month by month for members, the upgrade card for free (gold = Pro only) */}
        {pro ? (
          o.months.length > 0 && (
            <Reanimated.View entering={FadeInUp.delay(600).duration(550)} style={styles.section}>
              <MonthlyHistoryCard months={o.months} />
            </Reanimated.View>
          )
        ) : (
          <Reanimated.View entering={FadeInUp.delay(600).duration(550)} style={styles.section}>
            <ProUpsellCard
              title="Unlock deeper analytics"
              benefits={['Growth month by month', 'Every platform you post on', 'Unlimited ideas and repurposing']}
              buttonTitle="Explore Pro"
              onUpgrade={() => onOpenJarvisPro?.()}
            />
          </Reanimated.View>
        )}
      </ResponsiveColumns>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        <GlassBackdrop />
        <FreeAppHeader backgroundColor="transparent" onOpenJarvisPro={onOpenJarvisPro} userPersona={userProfile.userPersona} onOpenProfile={() => setShowProfile(true)} userProfile={userProfile} />

        <ScrollView {...tourScroll} style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces>
          {/* HEADLINE — same two-line structure on every screen size */}
          <Reanimated.View entering={FadeInUp.duration(500)} style={styles.headline}>
            <FitLines
              lines={['See your growth', <Text key="c" style={styles.headlineAccent}>clearly</Text>]}
              textStyle={styles.headlineText}
              maxFontSize={34}
              align="left"
              accessibilityLabel="See your growth clearly"
            />
          </Reanimated.View>

          {!overview ? (
            <View style={styles.loading}>
              {failed ? (
                <>
                  <Text style={styles.loadingText}>Couldn’t load your growth.</Text>
                  <Text style={[styles.loadingText, styles.retry]} onPress={reload} accessibilityRole="button">
                    Try again
                  </Text>
                </>
              ) : (
                <ActivityIndicator color={ds.purple} />
              )}
            </View>
          ) : (
            <>
              {/* An account that needs approving again */}
              {overview.needsReconnect.length > 0 && overview.hasData && (
                <Reanimated.View entering={FadeInUp.duration(400)} style={styles.banner}>
                  <GlassCard radius={20} padding={14}>
                    <Text style={styles.bannerText}>
                      {overview.needsReconnect.length === 1 ? 'One of your accounts needs you to connect it again' : 'Some of your accounts need you to connect them again'}, so its numbers can update.
                    </Text>
                    <View style={styles.bannerButton}>
                      <AppButton title="Reconnect" onPress={() => { tap(); setShowAccounts(true); }} />
                    </View>
                  </GlassCard>
                </Reanimated.View>
              )}

              {/* When the numbers were last read, and a way to read them now */}
              {overview.hasData && (
                <View style={styles.updated}>
                  <Text style={styles.updatedText}>{overview.updatedAt ? `Numbers from ${timeAgo(overview.updatedAt)}` : overview.platforms[0]?.trackedSince ? `Tracking since ${shortDay(overview.platforms[0].trackedSince)}` : ''}</Text>
                  <Pressable onPress={refresh} disabled={refreshing} accessibilityRole="button" accessibilityLabel="Refresh your numbers now" hitSlop={8} style={styles.refreshBtn}>
                    {refreshing ? <ActivityIndicator size="small" color={ds.purple} /> : <Text style={styles.refreshText}>Refresh</Text>}
                  </Pressable>
                </View>
              )}

              {body(overview)}
            </>
          )}
          {/* Bottom Space for Floating Tab Bar */}
          <View style={{ height: 110 }} />
        </ScrollView>

        {/* FLOATING LIQUID GLASS TAB BAR */}
        <FloatingTabBar activeTab="growth" onTabPress={(tab) => onNavigateTab?.(tab)} />

        {/* Connect or reconnect accounts: glass sheet */}
        <ConnectAccountsSheet visible={showAccounts} onClose={() => { setShowAccounts(false); void loadGrowth(); }} />

        {/* Jarvis's plan for the week */}
        <WeeklyPlanSheet visible={showPlan} onClose={() => setShowPlan(false)} isNewUser={!overview?.hasData} steps={overview ? planSteps(overview) : []} />

        <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} onLogout={onLogout} initialProfile={userProfile} onSaveProfile={onSaveProfile} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ds.bg },
  container: { flex: 1, width: '100%' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  headlineAccent: { color: ds.purple },
  sectionLabel: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24 },
  labelTight: { marginTop: 0, marginBottom: 12 },
  section: { marginTop: 24 },
  rows: { marginTop: 12 },
  loading: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  loadingText: { fontSize: 14.5, fontWeight: '600', color: ds.text2 },
  retry: { color: ds.purple, fontWeight: '800' },
  banner: { marginBottom: 14 },
  bannerText: { fontSize: 13.5, lineHeight: 19, fontWeight: '600', color: ds.text2 },
  bannerButton: { alignSelf: 'flex-start', marginTop: 10 },
  updated: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 2 },
  updatedText: { fontSize: 12.5, fontWeight: '600', color: ds.text3 },
  refreshBtn: { minWidth: 56, height: 28, alignItems: 'flex-end', justifyContent: 'center' },
  refreshText: { fontSize: 13.5, fontWeight: '800', color: ds.purple },
});
