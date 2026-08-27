import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Pressable,
  Animated,
  Modal,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { TinyGoldCheck } from '../components/CreatorStoryModal';
import { sFont, isNarrowScreen } from '../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProMissionDetailScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenMessages?: () => void;
  onOpenSchedule?: () => void;
  onOpenPostComposer?: (ideaTitle?: string) => void;
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

export const ProMissionDetailScreen: React.FC<ProMissionDetailScreenProps> = ({
  onBack,
  onLogout,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenMessages,
  onOpenSchedule,
  onOpenPostComposer,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animations
  const flameFloatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -4,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [flameFloatY]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleStartCreating = (customTitle?: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const title = customTitle || 'Publish a personal lesson Reel before 7:30 PM';
    if (onOpenPostComposer) {
      onOpenPostComposer(title);
    } else if (onNavigateTab) {
      onNavigateTab('create');
    }
  };

  const handleUseBlueprint = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    showToast('Blueprint loaded into Post Composer!');
    if (onOpenPostComposer) {
      onOpenPostComposer('One mistake I stopped making as a creator');
    } else if (onNavigateTab) {
      onNavigateTab('create');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* ============================================================ */}
        {/* 1. TOP HEADER BAR                                            */}
        {/* ============================================================ */}
        <View style={styles.headerBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {onBack && (
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  onBack();
                }}
                style={({ pressed }) => [styles.backBtnCircle, pressed && styles.btnPressed]}
                hitSlop={8}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M15 18L9 12L15 6" stroke="#171420" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </Pressable>
            )}

            {/* PostStreak 3D Ghost Mascot */}
            <Animated.View
              style={[
                styles.headerLogoWrapper,
                { transform: [{ translateY: flameFloatY }] },
              ]}
            >
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerGhostLogo}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Mode Switcher */}
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                if (onSwitchToFree) {
                  onSwitchToFree();
                } else if (onSaveProfile && userProfile) {
                  onSaveProfile({ ...userProfile, tier: 'free' });
                }
              }}
              hitSlop={8}
            >
              <LinearGradient
                colors={['#FDE68A', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.proHeaderBadge}
              >
                <Text style={styles.proHeaderBadgeText}>👑 PRO</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Right Header: Chat, Notification Bell, User Avatar */}
          <View style={styles.headerRightGroup}>
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                if (onOpenMessages) onOpenMessages();
                else if (onNavigateTab) onNavigateTab('match');
              }}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                  stroke="#171420"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => showToast('No new notifications')}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="#171420"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

            {/* User Profile Avatar with Tiny Gold Check Badge */}
            <Pressable
              onPress={() => setShowProfileModal(true)}
              style={styles.profileAvatarWrapper}
              hitSlop={8}
            >
              <Image
                source={userProfile?.avatarSource || require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerUserAvatar}
                resizeMode="cover"
              />
              <View style={styles.avatarTinyGoldCheckPos}>
                <TinyGoldCheck size={14} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* 2. MAIN SCROLLABLE CONTENT */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* HEADER TAG & TITLES */}
          <View style={styles.topTitlesSection}>
            <View style={styles.proIntelligenceTagBox}>
              <Text style={styles.proIntelligenceTagText}>✨ PRO INTELLIGENCE ACTIVE</Text>
            </View>
            <Text style={styles.mainTitleText}>
              Create the one post most likely to move you forward.
            </Text>
            <Text style={styles.mainSubText}>
              Your daily plan is based on your streak, recent analytics, best posting window and content performance.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* CARD 1: TODAY'S PRO PLAN (HERO PLAN CARD)                    */}
          {/* ============================================================ */}
          <View style={styles.heroPlanCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.heroPlanTag}>TODAY&apos;S PRO PLAN</Text>
              <View style={styles.optimizedBadge}>
                <Text style={styles.optimizedBadgeText}>⚡ Optimized for algorithm</Text>
              </View>
            </View>

            <Text style={styles.heroPlanTitle}>Publish a personal lesson Reel before 7:30 PM</Text>
            <Text style={styles.heroPlanDescription}>
              Share one honest creator lesson and turn it into a short Reel your audience can save.
            </Text>

            {/* 2x2 Metric Tiles (Explicit 2 Rows) */}
            <View style={{ gap: 8, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[styles.planMetricTile, { flex: 1 }]}>
                  <Text style={styles.planMetricTileLabel}>⏱️ BEST TIME</Text>
                  <Text style={styles.planMetricTileVal}>7:30 PM</Text>
                </View>
                <View style={[styles.planMetricTile, { flex: 1 }]}>
                  <Text style={styles.planMetricTileLabel}>📹 FORMAT</Text>
                  <Text style={styles.planMetricTileVal}>Short Reel</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[styles.planMetricTile, { flex: 1, backgroundColor: '#FEF3C7', borderColor: '#FBBF24' }]}>
                  <Text style={[styles.planMetricTileLabel, { color: '#B45309' }]}>🔥 FOCUS</Text>
                  <Text style={[styles.planMetricTileVal, { color: '#B45309' }]}>Streak Lock</Text>
                </View>
                <View style={[styles.planMetricTile, { flex: 1, backgroundColor: '#EDE9FE', borderColor: '#DDD6FE' }]}>
                  <Text style={[styles.planMetricTileLabel, { color: '#582CDB' }]}>📈 SIGNAL</Text>
                  <Text style={[styles.planMetricTileVal, { color: '#4C1D95' }]}>High Saves</Text>
                </View>
              </View>
            </View>

            {/* Plan Success Score Progress */}
            <View style={styles.planSuccessHeaderRow}>
              <Text style={styles.planSuccessLabel}>Plan success score:</Text>
              <Text style={styles.planSuccessVal}>72%</Text>
            </View>
            <View style={styles.planSuccessProgressBarTrack}>
              <LinearGradient
                colors={['#582CDB', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.planSuccessProgressBarFill, { width: '72%' }]}
              />
            </View>

            {/* Action Buttons: Start Creating & Schedule */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable
                style={({ pressed }) => [styles.startCreatingBtn, pressed && styles.btnPressed]}
                onPress={() => handleStartCreating()}
              >
                <Text style={styles.startCreatingBtnText}>Start Creating ➔</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.scheduleOutlineBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (onOpenSchedule) onOpenSchedule();
                  else if (onNavigateTab) onNavigateTab('growth');
                }}
              >
                <Text style={styles.scheduleOutlineBtnText}>Schedule</Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 2: TODAY'S CONTENT BLUEPRINT                         */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRowWithBadge}>
            <Text style={styles.sectionHeaderTitleBold}>Today&apos;s Content Blueprint</Text>
            <View style={styles.durationBadge}>
              <Text style={styles.durationBadgeText}>⚡ 30 - 45s</Text>
            </View>
          </View>

          <View style={styles.blueprintCard}>
            <Text style={styles.blueprintHookTag}>RECOMMENDED HOOK</Text>
            <Text style={styles.blueprintMainTitle}>&ldquo;One mistake I stopped making as a creator&rdquo;</Text>

            {/* 4-Step Script Timeline */}
            <View style={styles.scriptTimeline}>
              <View style={styles.scriptStepRow}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepLabelText}>HOOK</Text>
                  <Text style={styles.stepBodyText}>
                    &ldquo;Stop making this mistake if you want to stay consistent.&rdquo;
                  </Text>
                </View>
              </View>

              <View style={styles.scriptStepRow}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepLabelText}>BODY</Text>
                  <Text style={styles.stepBodyText}>
                    Briefly explain the mistake you made and the impact it had on your output.
                  </Text>
                </View>
              </View>

              <View style={styles.scriptStepRow}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepLabelText}>LESSON</Text>
                  <Text style={styles.stepBodyText}>
                    Share exactly what you changed and the result you&apos;re seeing now.
                  </Text>
                </View>
              </View>

              <View style={styles.scriptStepRow}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>4</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepLabelText}>CTA</Text>
                  <Text style={styles.stepBodyText}>
                    Ask creators what single habit helped them improve their consistency the most.
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Chips */}
            <View style={{ flexDirection: 'row', gap: 6, marginVertical: 14 }}>
              <Pressable
                style={({ pressed }) => [styles.blueprintMiniChip, pressed && styles.btnPressed]}
                onPress={() => showToast('Playing sample voiceover audio...')}
              >
                <Text style={styles.blueprintMiniChipText} numberOfLines={1}>▶ Play Audio</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.blueprintMiniChip, pressed && styles.btnPressed]}
                onPress={() => showToast('Trending audio attached')}
              >
                <Text style={styles.blueprintMiniChipText} numberOfLines={1}>⚡ Trending</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.blueprintMiniChip, pressed && styles.btnPressed]}
                onPress={() => showToast('Opening CapCut 9:16 Template')}
              >
                <Text style={styles.blueprintMiniChipText} numberOfLines={1}>📹 CapCut</Text>
              </Pressable>
            </View>

            {/* Use Blueprint Button */}
            <Pressable
              style={({ pressed }) => [styles.useBlueprintBtn, pressed && styles.btnPressed]}
              onPress={handleUseBlueprint}
            >
              <Text style={styles.useBlueprintBtnText}>Use Blueprint ➔</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* SECTION 3: WHY THIS PLAN?                                    */}
          {/* ============================================================ */}
          <View style={styles.whyThisPlanCard}>
            <Text style={styles.whyThisPlanTitle}>Why this plan?</Text>
            <Text style={styles.whyThisPlanText}>
              This plan was picked because personal lessons performed well with your audience, your streak is active, and your evening posting window is strong.
            </Text>

            {/* Trait Badges */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 }}>
              <View style={styles.traitBadge}>
                <Text style={styles.traitBadgeText}>Higher Saves</Text>
              </View>
              <View style={styles.traitBadge}>
                <Text style={styles.traitBadgeText}>Low Time Friction</Text>
              </View>
              <View style={styles.traitBadge}>
                <Text style={styles.traitBadgeText}>Streak Protection</Text>
              </View>
            </View>

            <Text style={styles.whyThisPlanFooterNote}>
              🔄 Based on your last 7 days of performance activity.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* SECTION 4: BEST TIME TO POST (HISTOGRAM CARD)                */}
          {/* ============================================================ */}
          <Text style={styles.sectionHeaderTitleBold}>Best Time to Post</Text>
          <View style={styles.bestTimeCard}>
            <Text style={styles.bestTimeHighlightText}>7:30 PM – 9:00 PM</Text>
            <Text style={styles.bestTimeSubText}>
              Your audience is most active and comments are highest.
            </Text>

            {/* Activity Histogram Bars */}
            <View style={styles.histogramContainer}>
              {[
                { time: '12p', h: 20, peak: false },
                { time: '2p', h: 30, peak: false },
                { time: '4p', h: 45, peak: false },
                { time: '6p', h: 65, peak: false },
                { time: '7:30p', h: 100, peak: true },
                { time: '8:30p', h: 90, peak: true },
                { time: '9:30p', h: 75, peak: true },
                { time: '10p', h: 40, peak: false },
                { time: '11p', h: 25, peak: false },
              ].map((bar, bIdx) => (
                <View key={bIdx} style={styles.histogramBarCol}>
                  <View
                    style={[
                      styles.histogramBarFill,
                      { height: `${bar.h}%` },
                      bar.peak ? styles.histogramBarPeak : styles.histogramBarNormal,
                    ]}
                  />
                </View>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [styles.scheduleForTimeBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (onOpenSchedule) onOpenSchedule();
                else showToast('Scheduled for 7:30 PM');
              }}
            >
              <Text style={styles.scheduleForTimeBtnText}>📅 Schedule for 7:30 PM</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* SECTION 5: GROWTH SIGNALS                                    */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRowWithBadge}>
            <Text style={styles.sectionHeaderTitleBold}>Growth Signals</Text>
            <Pressable onPress={() => showToast('Opening detailed signals')} hitSlop={8}>
              <Text style={styles.viewDetailsLink}>View Details ↗</Text>
            </Pressable>
          </View>

          <View style={styles.growthSignalsCard}>
            <View style={styles.signalRow}>
              <Text style={styles.signalLabel}>Personal lessons post</Text>
              <Text style={styles.signalValGreen}>+52% saves</Text>
            </View>
            <View style={styles.signalDivider} />
            <View style={styles.signalRow}>
              <Text style={styles.signalLabel}>Viral Reels</Text>
              <Text style={styles.signalValGreen}>+76% reach</Text>
            </View>
            <View style={styles.signalDivider} />
            <View style={styles.signalRow}>
              <Text style={styles.signalLabel}>Evening window</Text>
              <Text style={styles.signalValGreen}>+14% activity</Text>
            </View>

            {/* Performance Indicators */}
            <View style={{ marginTop: 14 }}>
              <View style={styles.signalProgressHeader}>
                <Text style={styles.signalProgressLabel}>FORMAT PERFORMANCE</Text>
                <Text style={styles.signalProgressScore}>67 SCORE</Text>
              </View>
              <View style={styles.signalProgressTrack}>
                <View style={[styles.signalProgressFill, { width: '67%' }]} />
              </View>
            </View>

            <View style={{ marginTop: 10 }}>
              <View style={styles.signalProgressHeader}>
                <Text style={styles.signalProgressLabel}>TIMING ACCURACY</Text>
                <Text style={styles.signalProgressScore}>91 SCORE</Text>
              </View>
              <View style={styles.signalProgressTrack}>
                <View style={[styles.signalProgressFill, { width: '91%', backgroundColor: '#F59E0B' }]} />
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 6: JARVIS PRO BRIEF (DEEP PURPLE CARD)               */}
          {/* ============================================================ */}
          <LinearGradient
            colors={['#3B14A7', '#582CDB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.jarvisBriefCard}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={{ width: 30, height: 30 }}
                resizeMode="contain"
              />
              <Text style={styles.jarvisBriefHeader}>Jarvis Pro Brief</Text>
            </View>

            <Text style={styles.jarvisBriefBody}>
              Create one short Reel around a specific lesson. Keep the hook direct, show what changed, and post during your strongest evening window.
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 10 }}>
              <Pressable
                style={styles.jarvisBriefChip}
                onPress={() => showToast('Hook Idea: Stop doing this if you want results')}
              >
                <Text style={styles.jarvisBriefChipText}>View Hook Idea</Text>
              </Pressable>
              <Pressable
                style={styles.jarvisBriefChip}
                onPress={() => showToast('Caption preview ready in Composer')}
              >
                <Text style={styles.jarvisBriefChipText}>Write Caption</Text>
              </Pressable>
            </View>

            {/* Luminous 24K Gold Button */}
            <Pressable
              style={({ pressed }) => [styles.useAiStrategyBtnWrapper, pressed && styles.btnPressed]}
              onPress={() => handleStartCreating('Personal lesson Reel (Jarvis AI Strategy)')}
            >
              <LinearGradient
                colors={['#FDE68A', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.useAiStrategyBtnGradient}
              >
                <Text style={styles.useAiStrategyBtnText}>🪄 Use AI Strategy ➔</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>

          {/* ============================================================ */}
          {/* SECTION 7: WHAT THIS UNLOCKS                                 */}
          {/* ============================================================ */}
          <Text style={styles.sectionHeaderTitleBold}>WHAT THIS UNLOCKS</Text>
          <View style={[styles.unlocksCard, { marginBottom: 140 }]}>
            <View style={styles.unlockItemRow}>
              <Text style={styles.unlockItemText}>🔥 47-day streak protected</Text>
              <Text style={styles.unlockArrow}>↗</Text>
            </View>
            <View style={styles.unlockDivider} />
            <View style={styles.unlockItemRow}>
              <Text style={styles.unlockItemText}>⚡ +100 Creator XP</Text>
              <Text style={styles.unlockArrow}>↗</Text>
            </View>
          </View>
        </ScrollView>

        {/* ============================================================ */}
        {/* FLOATING BOTTOM TAB BAR                                      */}
        {/* ============================================================ */}
        <FloatingTabBar
          activeTab={activeTab}
          onTabPress={(tab) => {
            setActiveTab(tab);
            if (onNavigateTab) {
              onNavigateTab(tab);
            }
          }}
        />

        {/* PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={(updated) => {
            if (onSaveProfile) onSaveProfile(updated);
          }}
        />

        {/* TOAST */}
        <BrandToast message={toastMessage} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FAF8F5',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
  },
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoWrapper: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerGhostLogo: {
    width: 34,
    height: 34,
  },
  proHeaderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  proHeaderBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: 0.3,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarWrapper: {
    position: 'relative',
  },
  headerUserAvatar: {
    width: 38,
    height: 38,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  avatarTinyGoldCheckPos: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 135,
  },

  // TITLES SECTION
  topTitlesSection: {
    marginBottom: 16,
  },
  proIntelligenceTagBox: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    marginBottom: 8,
  },
  proIntelligenceTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.6,
  },
  mainTitleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  mainSubText: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },

  // HERO PLAN CARD
  heroPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  heroPlanTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.6,
  },
  optimizedBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  optimizedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  heroPlanTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
    marginTop: 4,
    marginBottom: 6,
  },
  heroPlanDescription: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  planMetrics2x2Grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  planMetricTile: {
    width: (SCREEN_WIDTH - 80 - 8) / 2,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1EFE9',
  },
  planMetricTileLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  planMetricTileVal: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
  },
  planSuccessHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planSuccessLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  planSuccessVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  planSuccessProgressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  planSuccessProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  startCreatingBtn: {
    flex: 1.2,
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  startCreatingBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scheduleOutlineBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  scheduleOutlineBtnText: {
    color: '#171420',
    fontSize: 13,
    fontWeight: '800',
  },

  // BLUEPRINT SECTION
  sectionHeaderRowWithBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitleBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  durationBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  blueprintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 20,
  },
  blueprintHookTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  blueprintMainTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 14,
  },
  scriptTimeline: {
    gap: 12,
  },
  scriptStepRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNumCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  stepLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  stepBodyText: {
    fontSize: 12.5,
    color: '#171420',
    lineHeight: 18,
    fontWeight: '600',
  },
  blueprintMiniChip: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueprintMiniChipText: {
    fontSize: sFont(11),
    fontWeight: '800',
    color: '#582CDB',
    textAlign: 'center',
  },
  useBlueprintBtn: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  useBlueprintBtnText: {
    color: '#582CDB',
    fontSize: 13,
    fontWeight: '700',
  },

  // WHY THIS PLAN
  whyThisPlanCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 20,
  },
  whyThisPlanTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 6,
  },
  whyThisPlanText: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  traitBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  traitBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171420',
  },
  whyThisPlanFooterNote: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },

  // BEST TIME TO POST
  bestTimeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 20,
    marginTop: 10,
  },
  bestTimeHighlightText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 2,
  },
  bestTimeSubText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  histogramContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 70,
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  histogramBarCol: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  histogramBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  histogramBarNormal: {
    backgroundColor: '#F1EFE9',
  },
  histogramBarPeak: {
    backgroundColor: '#F59E0B',
  },
  scheduleForTimeBtn: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  scheduleForTimeBtnText: {
    color: '#171420',
    fontSize: 13,
    fontWeight: '800',
  },

  // GROWTH SIGNALS
  growthSignalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 20,
  },
  viewDetailsLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  signalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  signalValGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
  },
  signalDivider: {
    height: 1,
    backgroundColor: '#F1EFE9',
    marginVertical: 10,
  },
  signalProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  signalProgressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  signalProgressScore: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  signalProgressTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  signalProgressFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 3,
  },

  // JARVIS BRIEF
  jarvisBriefCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  jarvisBriefHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  jarvisBriefBody: {
    fontSize: 13,
    color: '#EDE9FE',
    lineHeight: 19,
  },
  jarvisBriefChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  jarvisBriefChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  useAiStrategyBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  useAiStrategyBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 14,
  },
  useAiStrategyBtnText: {
    color: '#0C0A12',
    fontSize: 14,
    fontWeight: '700',
  },

  // WHAT THIS UNLOCKS
  unlocksCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 10,
  },
  unlockItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unlockItemText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  unlockArrow: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700',
  },
  unlockDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },

  // COMMON
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  toastContainer: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: 'rgba(23, 20, 32, 0.94)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
