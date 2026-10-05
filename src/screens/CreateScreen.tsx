import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Platform, SafeAreaView, StatusBar } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Reanimated, { FadeInUp } from 'react-native-reanimated';
import { TourTarget, useTourScroll } from '../components/tour/GhostTour';
import { ResponsiveColumns } from '../components/ui/ResponsiveColumns';
import { Text } from '../components/ui/AppText';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassSheet } from '../components/glass/GlassSheet';
import { FitLines } from '../components/ui/FitLines';
import { IdeaHeroCard } from '../components/create/IdeaHeroCard';
import { ToolTile, GlassRow, AllowanceMeter, DraftRow, DraftsEmpty, UnlimitedChip, ProTag } from '../components/create/CreateBlocks';
import { draftAgo, getDrafts, getRepurposeAllowance, removeDraft, subscribeToDrafts, subscribeToRepurposes, whenLabel, type SavedDraft } from '../data';
import { useCapabilities } from '../backend/account';
import { loadHome, useHomeSummary } from '../backend/home';
import type { FeedIdea } from '../../frontend/shared/types/phase1';
import type { UserPersona } from '../types/account';
import { sPadding } from '../utils/responsive';
import { ds } from '../theme/colors';

// Create: today's idea, the tools, what's planned, and the creator's drafts. Every number here is the
// server's (planned posts, the Repurpose allowance, the drafts), and a tool the server can't run
// (the writing tools need an AI switched on there) isn't offered.

interface CreateScreenProps {
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  /** A blank post, or one about this idea. */
  onOpenPostComposer?: (prefillTitle?: string) => void;
  /** Today's idea, into the composer with its opening line. */
  onUseIdea?: (idea: FeedIdea) => void;
  onOpenIdeaAngle?: () => void;
  onOpenScript?: () => void;
  onOpenCaption?: () => void;
  onOpenRepurpose?: () => void;
  onOpenHookStudio?: () => void;
  /** A saved draft: a script opens on Script, a post in the composer. */
  onOpenDraft?: (draft: SavedDraft) => void;
  userPersona?: UserPersona;
  /** Pro members: Hook Studio, unlimited Repurpose. */
  tier?: 'free' | 'pro';
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  threads: 'Threads',
  facebook: 'Facebook',
};

const draftLabel = (d: SavedDraft) => (d.platform ? PLATFORM_LABELS[d.platform] ?? d.platform : d.format);

const tap = () => {
  if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const CreateScreen: React.FC<CreateScreenProps> = ({
  onLogout,
  onNavigateTab,
  onOpenSchedule,
  onOpenJarvisPro,
  onOpenPostComposer,
  onUseIdea,
  onOpenIdeaAngle,
  onOpenScript,
  onOpenCaption,
  onOpenRepurpose,
  onOpenHookStudio,
  onOpenDraft,
  userPersona,
  tier = 'free',
  userProfile,
  onSaveProfile,
}) => {
  // Lets Ghost's tour scroll this page
  const tourScroll = useTourScroll();
  const { ai } = useCapabilities();
  const isNewUser = (userPersona || userProfile?.userPersona || 'new') === 'new';
  const isPro = tier === 'pro';

  const drafts = React.useSyncExternalStore(subscribeToDrafts, getDrafts, getDrafts);
  const repurpose = React.useSyncExternalStore(subscribeToRepurposes, getRepurposeAllowance, getRepurposeAllowance);
  const repurposesLeft = repurpose.weeklyLimit === null ? null : Math.max(0, repurpose.weeklyLimit - repurpose.usedThisWeek);

  // What's planned: the server's summary, read again each time Create opens
  const home = useHomeSummary();
  useEffect(() => {
    void loadHome();
  }, []);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAllDrafts, setShowAllDrafts] = useState(false);

  const openDraft = (d: SavedDraft) => {
    tap();
    setShowAllDrafts(false);
    onOpenDraft?.(d);
  };

  const scheduleTitle = !home
    ? 'Your schedule'
    : home.waiting > 0
      ? `${home.waiting} post${home.waiting === 1 ? '' : 's'} ready to post`
      : home.weekPlanned > 0
        ? `${home.weekPlanned} post${home.weekPlanned === 1 ? '' : 's'} planned this week`
        : home.nextPost
          ? 'Your next post is planned'
          : 'Nothing planned yet';
  const scheduleSubtitle = home?.nextPost
    ? `Next up: ${home.nextPost.title} · ${whenLabel(Date.parse(home.nextPost.at))}`
    : home && home.waiting > 0
      ? 'Post them, then tap “I posted it”'
      : 'Pick an idea, then choose a time';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={ds.bg} />
      <View style={styles.container}>
        <GlassBackdrop />
        <FreeAppHeader
          backgroundColor="transparent"
          userPersona={userPersona || userProfile?.userPersona}
          onOpenJarvisPro={onOpenJarvisPro}
          onOpenProfile={() => setShowProfileModal(true)}
          userProfile={userProfile}
        />

        <ScrollView {...tourScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Reanimated.View entering={FadeInUp.duration(500)} style={styles.headline}>
            <FitLines
              lines={['Create your', <Text key="n" style={styles.headlineAccent}>next post</Text>]}
              textStyle={styles.headlineText}
              maxFontSize={34}
              align="left"
              accessibilityLabel="Create your next post"
            />
          </Reanimated.View>

          {/* Desktop: idea and tools on the left, the rest beside them */}
          <ResponsiveColumns split={2} gap={16}>
            {/* 1. TODAY'S IDEA */}
            <Reanimated.View entering={FadeInUp.delay(100).duration(550)}>
              <TourTarget id="create-idea">
                <IdeaHeroCard
                  isNewUser={isNewUser}
                  platforms={userProfile?.connectedPlatforms ?? []}
                  onUseIdea={(idea) => {
                    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (onUseIdea) onUseIdea(idea);
                    else onOpenPostComposer?.(idea.title);
                  }}
                />
              </TourTarget>
            </Reanimated.View>

            {/* 2. TOOLS */}
            <Reanimated.View entering={FadeInUp.delay(200).duration(550)}>
              <Text style={styles.sectionLabel}>Tools</Text>
              <View style={styles.toolRow}>
                <ToolTile
                  featured
                  title="New post"
                  subtitle="Start from scratch"
                  onPress={() => {
                    tap();
                    onOpenPostComposer?.();
                  }}
                  icon={
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" />
                    </Svg>
                  }
                />
                <ToolTile
                  title="Ideas"
                  subtitle="Find your next angle"
                  onPress={() => {
                    tap();
                    onOpenIdeaAngle?.();
                  }}
                  icon={
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4L12 2z" fill={ds.purple} />
                      <Path d="M19 16l1 2.3 2.3 1-2.3 1-1 2.3-1-2.3-2.3-1 2.3-1 1-2.3z" fill={ds.purple} />
                    </Svg>
                  }
                />
              </View>
              {ai && (
                <View style={styles.toolRow}>
                  <ToolTile
                    title="Script"
                    subtitle="Build a story"
                    onPress={() => {
                      tap();
                      onOpenScript?.();
                    }}
                    icon={
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Rect x="3" y="3" width="18" height="18" rx="3" stroke={ds.purple} strokeWidth={2.1} />
                        <Path d="M8 3v18M16 3v18M3 8h5M3 16h5M16 8h5M16 16h5" stroke={ds.purple} strokeWidth={2.1} />
                      </Svg>
                    }
                  />
                  <ToolTile
                    title="Caption"
                    subtitle="Write in your voice"
                    onPress={() => {
                      tap();
                      onOpenCaption?.();
                    }}
                    icon={
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke={ds.purple} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    }
                  />
                </View>
              )}
            </Reanimated.View>

            {/* 3. REPURPOSE, HOOK STUDIO, SCHEDULE */}
            <Reanimated.View entering={FadeInUp.delay(300).duration(550)} style={styles.stack}>
              {ai && (
                <GlassRow
                  title="Repurpose"
                  subtitle="Turn an idea or a post into one for each platform"
                  onPress={() => {
                    tap();
                    onOpenRepurpose?.();
                  }}
                  extra={repurposesLeft === null ? <UnlimitedChip /> : <AllowanceMeter left={repurposesLeft} limit={repurpose.weeklyLimit ?? 0} />}
                  icon={
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" stroke={ds.purple} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  }
                />
              )}
              {ai && isPro && (
                <GlassRow
                  title="Hook Studio"
                  subtitle="Strong first lines for your next video"
                  onPress={() => {
                    tap();
                    onOpenHookStudio?.();
                  }}
                  extra={
                    <View style={styles.proTag}>
                      <ProTag />
                    </View>
                  }
                  icon={
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke={ds.purple} strokeWidth={2.1} strokeLinejoin="round" />
                    </Svg>
                  }
                />
              )}
              <GlassRow
                title={scheduleTitle}
                subtitle={scheduleSubtitle}
                onPress={() => {
                  tap();
                  if (onOpenSchedule) onOpenSchedule();
                  else onNavigateTab?.('schedule' as TabType);
                }}
                icon={
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Rect x="3" y="4" width="18" height="17" rx="3" stroke={ds.purple} strokeWidth={2.1} />
                    <Path d="M16 2v4M8 2v4M3 10h18" stroke={ds.purple} strokeWidth={2.1} strokeLinecap="round" />
                  </Svg>
                }
              />
            </Reanimated.View>

            {/* 4. DRAFTS */}
            <Reanimated.View entering={FadeInUp.delay(400).duration(550)}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, styles.sectionLabelInline]}>Your drafts</Text>
                {drafts.length > 0 && (
                  <Pressable onPress={() => setShowAllDrafts(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`See all ${drafts.length} drafts`}>
                    <Text style={styles.sectionLink}>{drafts.length > 3 ? `See all ${drafts.length}` : 'Manage'}</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.stack}>
                {drafts.length === 0 ? (
                  <DraftsEmpty onStart={() => onOpenPostComposer?.()} />
                ) : (
                  drafts.slice(0, 3).map((d) => <DraftRow key={d.id} title={d.title} platform={draftLabel(d)} edited={draftAgo(d.savedAt)} onPress={() => openDraft(d)} />)
                )}
              </View>
            </Reanimated.View>
          </ResponsiveColumns>
          {/* Room for the floating tab bar */}
          <View style={{ height: 110 }} />
        </ScrollView>

        <FloatingTabBar activeTab="create" onTabPress={(tab) => onNavigateTab?.(tab)} />

        {/* EVERY DRAFT: open one, or remove it */}
        <GlassSheet visible={showAllDrafts} onClose={() => setShowAllDrafts(false)} title="Your drafts" subtitle="Pick up where you left off">
          <ScrollView contentContainerStyle={styles.sheetList} showsVerticalScrollIndicator={false}>
            {drafts.length === 0 ? (
              <Text style={styles.sheetEmpty}>No drafts left.</Text>
            ) : (
              drafts.map((d) => (
                <View key={d.id} style={styles.sheetRow}>
                  <View style={styles.flex}>
                    <DraftRow title={d.title} platform={draftLabel(d)} edited={draftAgo(d.savedAt)} onPress={() => openDraft(d)} />
                  </View>
                  <Pressable
                    onPress={() => {
                      tap();
                      removeDraft(d.id);
                    }}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete the draft “${d.title}”`}
                    style={({ pressed }) => [styles.remove, pressed && { transform: [{ scale: 0.92 }] }, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
                  >
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" stroke={ds.text2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>
        </GlassSheet>

        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: ds.bg },
  container: { flex: 1, width: '100%' },
  scrollContent: { paddingHorizontal: sPadding(20), paddingTop: 8 },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  headlineAccent: { color: ds.purple },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  sectionLabel: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24, marginBottom: 10 },
  sectionLabelInline: { marginTop: 0, marginBottom: 0 },
  sectionLink: { fontSize: 13.5, fontWeight: '800', color: ds.purple },
  toolRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stack: { gap: 12 },
  proTag: { marginTop: 8 },
  sheetList: { gap: 10, paddingBottom: 16 },
  sheetEmpty: { fontSize: 14, color: ds.text2, textAlign: 'center', paddingVertical: 20 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  remove: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: ds.line,
  },
});
