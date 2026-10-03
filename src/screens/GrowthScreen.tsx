import { SocialBrandIcon } from '../components/SocialBrandIcon';
import { TourTarget, useTourScroll } from '../components/tour/GhostTour';
import { ResponsiveColumns } from '../components/ui/ResponsiveColumns';
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Platform,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { Text, TextInput } from '../components/ui/AppText';
import { isStage1Platform } from '../config/features';
import type { StudioVideo } from '../data';
import Svg, { Path, Circle, Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import type { UserPersona } from '../types/account';
import { sFont, isNarrowScreen } from '../utils/responsive';
import Reanimated, { FadeInUp } from 'react-native-reanimated';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { FitLines } from '../components/ui/FitLines';
import { JarvisOrb } from '../components/JarvisOrb';
import { PlatformRow } from '../components/onboarding/PlatformRow';
import { ConnectAccountsSheet } from '../components/growth/ConnectAccountsSheet';
import { WeeklyPlanSheet } from '../components/growth/WeeklyPlanSheet';
import { AudienceHero, BestPostCard, FormatsCard, MilestonesCard, WeeklyReportCard } from '../components/growth/GrowthReturning';
import { type PlatformLogoType } from '../components/onboarding/PlatformLogo';
import { ProUpsellCard } from '../components/home/ProUpsellCard';
import { PressableCard } from '../components/ui/PressableCard';
import { AudienceEmptyHero, ComingUpCard, JarvisStrategyCard, FirstReportCard } from '../components/growth/GrowthBlocks';
import { ds } from '../theme/colors';


// AUTHENTIC BRAND SVG ICONS
const TikTokSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19.321 5.562a5.122 5.122 0 0 1-3.585-1.446 5.14 5.14 0 0 1-1.486-3.616H10.5v15.025a3.25 3.25 0 1 1-3.25-3.25 3.2 3.2 0 0 1 1.25.253V8.75a6.975 6.975 0 0 0-1.25-.113 7 7 0 1 0 7 7V9.22a8.775 8.775 0 0 0 5.071 1.595V7.065a5.16 5.16 0 0 1-2.45-.653 5.13 5.13 0 0 1-1.3-.85z"
      fill="#000000"
    />
  </Svg>
);

const InstagramSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="#E1306C" strokeWidth="2.2" />
    <Circle cx="12" cy="12" r="4.5" stroke="#E1306C" strokeWidth="2.2" />
    <Circle cx="17.5" cy="6.5" r="1.2" fill="#E1306C" />
  </Svg>
);

const YouTubeSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.582 6.186a2.75 2.75 0 0 0-1.934-1.946C17.942 3.75 12 3.75 12 3.75s-5.942 0-7.648.49a2.75 2.75 0 0 0-1.934 1.946C1.928 7.892 1.928 12 1.928 12s0 4.108.49 5.814a2.75 2.75 0 0 0 1.934 1.946c1.706.49 7.648.49 7.648.49s5.942 0 7.648-.49a2.75 2.75 0 0 0 1.934-1.946c.49-1.706.49-5.814.49-5.814s0-4.108-.49-5.814z"
      fill="#FF0000"
    />
    <Path d="M9.75 15.02V8.98L15 12l-5.25 3.02z" fill="#FFFFFF" />
  </Svg>
);

const LinkedInSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="4" fill="#0A66C2" />
    <Circle cx="7" cy="7.5" r="1.5" fill="#FFFFFF" />
    <Rect x="5.5" y="10" width="3" height="9" fill="#FFFFFF" />
    <Path
      d="M11 10h2.8v1.3h.1c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.7V19h-3v-4.1c0-1-.1-2.3-1.4-2.3-1.4 0-1.6 1.1-1.6 2.2V19h-3V10z"
      fill="#FFFFFF"
    />
  </Svg>
);

const XSvg = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill="#000000"
    />
  </Svg>
);

const SnapchatSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="5" fill="#FFFC00" />
    <Path
      d="M12 5.5c-2.4 0-3.8 1.8-3.8 3.5 0 .8.3 1.5.3 1.5s-.6.2-.8.5c-.2.3 0 .7.3.7.6.1 1.1-.3 1.1-.3s.5 1.5 1.5 1.7c.3.1.5.3.5.5s-.8.6-1.7.9c-.8.3-1.2.9-.6 1.3.6.4 1.8.3 2.5-.2.4-.3.7-.3.7-.3s.3 0 .7.3c.7.5 1.9.6 2.5.2.6-.4.2-1-.6-1.3-.9-.3-1.7-.7-1.7-.9s.2-.4.5-.5c1-.2 1.5-1.7 1.5-1.7s.5.4 1.1.3c.3 0 .5-.4.3-.7-.2-.3-.8-.5-.8-.5s.3-.7.3-1.5c0-1.7-1.4-3.5-3.8-3.5z"
      fill="#000000"
    />
  </Svg>
);

const ThreadsSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.84 12.3c-.45 2.1-2.03 3.32-4.14 3.32-2.58 0-4.4-1.84-4.4-4.47 0-2.67 1.88-4.57 4.54-4.57 2.45 0 4.1 1.62 4.17 3.86h-1.87c-.07-1.26-.98-2.14-2.3-2.14-1.62 0-2.65 1.25-2.65 2.85 0 1.63 1.05 2.8 2.58 2.8 1.15 0 1.97-.62 2.22-1.65h1.85z"
      fill="#000000"
    />
  </Svg>
);

const renderGrowthPlatformBrandIcon = (id: string, size = 20) => {
  const platKey = id === 'x_twitter' ? 'x' : id;
  return <SocialBrandIcon platform={platKey} size={size} />;
};

interface GrowthPlatformAccount {
  id: string;
  name: string;
  handle: string;
  followers: string;
  countNumeric: number;
  bgTint: string;
  connected: boolean;
  canAdd: boolean;
}

// Only Stage 1 platforms are shown; other entries stay for later stages.
const INITIAL_GROWTH_PLATFORMS: GrowthPlatformAccount[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@pablo.creates',
    followers: '14.2k followers',
    countNumeric: 14200,
    bgTint: '#F1F5F9',
    connected: true,
    canAdd: false,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@pablocreates',
    followers: '7.8k followers',
    countNumeric: 7800,
    bgTint: '#FDF2F8',
    connected: true,
    canAdd: false,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    handle: 'Pablo Creates',
    followers: '2.8k subs',
    countNumeric: 2800,
    bgTint: '#FEF2F2',
    connected: true,
    canAdd: false,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    handle: 'Pablo Creates',
    followers: '4.6k followers',
    countNumeric: 4600,
    bgTint: '#EFF6FF',
    connected: false,
    canAdd: true,
  },
  {
    id: 'threads',
    name: 'Threads',
    handle: '@pablocreates',
    followers: '2.2K',
    countNumeric: 2200,
    bgTint: '#F5F3FF',
    connected: false,
    canAdd: true,
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    handle: '@pablopins',
    followers: '6.8k pins',
    countNumeric: 6800,
    bgTint: '#FFF1F2',
    connected: false,
    canAdd: true,
  },
].filter((p) => isStage1Platform(p.id));

interface GrowthScreenProps {
  onBackToDashboard?: () => void;
  onOpenPostPerformance?: () => void;
  onOpenPlatformGrowth?: () => void;
  onOpenSchedule?: () => void;
  /** Pro members: no upgrade card, Pro rows in "What you'll see here". */
  tier?: 'free' | 'pro';
  onOpenIdeas?: () => void;
  onOpenChallenge?: () => void;
  /** Send this post into the Repurpose video studio. */
  onMakeMoreLikeThis?: (video: StudioVideo) => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  userPersona?: UserPersona;
  onOpenAudienceBreakdown?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface AudienceChartPoint {
  date: string;
  followers: string;
  gain: string;
  cx: number;
  cy: number;
  percentX: number;
}

const AUDIENCE_CHART_POINTS: AudienceChartPoint[] = [
  { date: 'Oct 01', followers: '22.1K', gain: '+42', cx: 10, cy: 75, percentX: 6 },
  { date: 'Oct 08', followers: '22.9K', gain: '+180', cx: 85, cy: 52, percentX: 27 },
  { date: 'Oct 15', followers: '23.6K', gain: '+310', cx: 155, cy: 26, percentX: 49 },
  { date: 'Oct 21', followers: '24.1K', gain: '+220', cx: 230, cy: 62, percentX: 72 },
  { date: 'Oct 28', followers: '24.8K', gain: '+450', cx: 310, cy: 18, percentX: 92 },
];

export const GrowthScreen: React.FC<GrowthScreenProps> = ({
  onBackToDashboard,
  onOpenPostPerformance,
  onOpenPlatformGrowth,
  onMakeMoreLikeThis,
  onOpenSchedule,
  tier = 'free',
  onOpenIdeas,
  onOpenChallenge,
  onLogout,
  onNavigateTab,
  onOpenJarvisPro,
  userPersona,
  onOpenAudienceBreakdown,
  userProfile,
  onSaveProfile,
}) => {
  // Lets Ghost's tour scroll this page
  const tourScroll = useTourScroll();
  const isDark = false;
  const isNewUser = (userPersona || userProfile?.userPersona || 'new') === 'new';
  const [activeTab, setActiveTab] = useState<TabType>('growth');
  const [selectedChartPointIndex, setSelectedChartPointIndex] = useState(4);

  // Modal States
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Growth Insight Unlocked!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Your 30-day analytics report has been generated.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('Ghost says: You gained 1,200 new followers this month Amara!');
  const [celebrationBadge, setCelebrationBadge] = useState('+12.4% AUDIENCE');
  const [celebrationXp, setCelebrationXp] = useState(50);

  const [showPostAnalysisModal, setShowPostAnalysisModal] = useState(false);
  const [showAudienceModal, setShowAudienceModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showConnectPlatformModal, setShowConnectPlatformModal] = useState(false);
  const [platformsList, setPlatformsList] = useState<GrowthPlatformAccount[]>(INITIAL_GROWTH_PLATFORMS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const openAudience = () => {
    if (onOpenAudienceBreakdown) {
      onOpenAudienceBreakdown();
    } else {
      triggerModalPop();
      setShowAudienceModal(true);
    }
  };

  // Close the plan, then go where the step is done
  const leavePlan = (go: (() => void) | undefined, fallback: TabType) => {
    setShowStrategyModal(false);
    if (go) go();
    else onNavigateTab?.(fallback);
  };

  const handleOpenConnectPlatforms = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowConnectPlatformModal(true);
  };

  // Synchronize platforms list with userProfile connectedPlatforms
  useEffect(() => {
    if (userProfile && userProfile.connectedPlatforms !== undefined) {
      setPlatformsList((prev) =>
        prev.map((p) => ({
          ...p,
          connected: userProfile.connectedPlatforms!.includes(p.id),
          handle:
            p.id === 'tiktok' && userProfile.tiktokHandle
              ? userProfile.tiktokHandle
              : p.id === 'instagram' && userProfile.instagramHandle
              ? userProfile.instagramHandle
              : p.id === 'youtube' && userProfile.youtubeHandle
              ? userProfile.youtubeHandle
              : p.id === 'facebook' && userProfile.facebookHandle
              ? userProfile.facebookHandle
              : p.id === 'threads' && userProfile.threadsHandle
              ? userProfile.threadsHandle
              : p.id === 'pinterest' && userProfile.pinterestHandle
              ? userProfile.pinterestHandle
              : p.handle,
        }))
      );
    }
  }, [
    userProfile?.connectedPlatforms,
    userProfile?.connectedPlatforms?.join(','),
    userProfile?.tiktokHandle,
    userProfile?.instagramHandle,
    userProfile?.youtubeHandle,
    userProfile?.facebookHandle,
    userProfile?.threadsHandle,
    userProfile?.pinterestHandle,
  ]);

  const handleConnectSinglePlatform = (platformId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPlatformsList((prev) =>
      prev.map((p) => (p.id === platformId ? { ...p, connected: true } : p))
    );
    const targetPlat = platformsList.find((p) => p.id === platformId);
    showToast(`✓ ${targetPlat?.name || 'Platform'} connected! Sync active.`);

    if (onSaveProfile && userProfile) {
      const current = userProfile.connectedPlatforms || ['tiktok', 'instagram', 'youtube'];
      if (!current.includes(platformId)) {
        onSaveProfile({
          ...userProfile,
          connectedPlatforms: [...current, platformId],
        });
      }
    }
  };

  const handleRemoveSinglePlatform = (platformId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPlatformsList((prev) =>
      prev.map((p) => (p.id === platformId ? { ...p, connected: false } : p))
    );
    const targetPlat = platformsList.find((p) => p.id === platformId);
    showToast(`Removed ${targetPlat?.name || 'account'}`);

    if (onSaveProfile && userProfile) {
      const current = userProfile.connectedPlatforms || ['tiktok', 'instagram', 'youtube'];
      onSaveProfile({
        ...userProfile,
        connectedPlatforms: current.filter((p) => p !== platformId),
      });
    }
  };


  // Animations
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const modalPopScale = useRef(new Animated.Value(0.88)).current;
  const graphAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -3,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 3,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    );
    flameLoop.start();

    Animated.timing(graphAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    return () => flameLoop.stop();
  }, [flameFloatY, graphAnim]);

  const triggerModalPop = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    modalPopScale.setValue(0.88);
    Animated.spring(modalPopScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 26,
      bounciness: 12,
    }).start();
  };

  const handleTabPress = (tab: TabType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const handleOpenPro = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onOpenJarvisPro) {
      onOpenJarvisPro();
    } else if (onNavigateTab) {
      onNavigateTab('growth');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0C0A12" : "#FAF8F5"} />
      <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
        <GlassBackdrop />
        {/* 1. TOP AIRY HEADER BAR */}
        <FreeAppHeader
          backgroundColor="transparent"
          onOpenJarvisPro={onOpenJarvisPro}
          userPersona={userPersona || userProfile?.userPersona}
          onOpenNotifications={() => {
            triggerModalPop();
            setShowNotificationModal(true);
          }}
          onOpenProfile={() => {
            triggerModalPop();
            setShowProfileModal(true);
          }}
          userProfile={userProfile}
          isDark={isDark}
        />

        {/* 2. MAIN SCROLLABLE CONTENT */}
        <ScrollView
          {...tourScroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
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

          {/* Desktop: audience and platforms on the left, the rest beside them */}
          <ResponsiveColumns split={2} gap={16}>
          {/* 1. TOTAL AUDIENCE */}
          <Reanimated.View entering={FadeInUp.delay(100).duration(550)} style={styles.section0}>
          <TourTarget id="growth-card">
          {isNewUser ? (
            <AudienceEmptyHero
              connectedCount={platformsList.filter((p) => p.connected && isStage1Platform(p.id)).length}
              onConnect={handleOpenConnectPlatforms}
            />
          ) : (
            <AudienceHero onOpen={openAudience} />
          )}
          </TourTarget>
          </Reanimated.View>

          {/* 2. PLATFORMS — tap Connect: spinner, then a green tick */}
          <Reanimated.View entering={FadeInUp.delay(200).duration(550)}>
            <Text style={styles.sectionLabel}>Your platforms</Text>
            <View style={styles.stack}>
              {platformsList
                .filter((p) => isStage1Platform(p.id))
                .map((p) => (
                  <PlatformRow
                    key={p.id}
                    name={p.name}
                    logo={p.id as PlatformLogoType}
                    description={
                      p.connected
                        ? isNewUser
                          ? 'Connected · syncing'
                          : p.handle || 'Connected'
                        : 'Tap to connect'
                    }
                    connected={p.connected}
                    onToggle={() => (p.connected ? handleRemoveSinglePlatform(p.id) : handleConnectSinglePlatform(p.id))}
                  />
                ))}
            </View>
          </Reanimated.View>

          {isNewUser && (
            <Reanimated.View entering={FadeInUp.delay(300).duration(550)} style={styles.section}>
              <ComingUpCard pro={tier === 'pro'} />
            </Reanimated.View>
          )}

          {/* 3. BEST POST + WHAT'S WORKING (returning) */}
          {!isNewUser && (
            <>
              <Reanimated.View entering={FadeInUp.delay(300).duration(550)}>
                <Text style={[styles.sectionLabel, { marginBottom: 12 }]}>Your best post lately</Text>
                <BestPostCard
                  onWhy={() => {
                    if (onOpenPostPerformance) onOpenPostPerformance();
                    else {
                      triggerModalPop();
                      setShowPostAnalysisModal(true);
                    }
                  }}
                  onMore={() =>
                    onMakeMoreLikeThis?.({ name: '3 creator mistakes I stopped making this year', seconds: 42, source: 'post', platform: 'tiktok' })
                  }
                />
              </Reanimated.View>
              <Reanimated.View entering={FadeInUp.delay(360).duration(550)} style={styles.section}>
                <FormatsCard />
              </Reanimated.View>
            </>
          )}

          {/* 6. JARVIS STRATEGY */}
          <Reanimated.View entering={FadeInUp.delay(400).duration(550)} style={styles.section}>
            <JarvisStrategyCard
              orb={<JarvisOrb size={34} />}
              isNewUser={isNewUser}
              onOpen={() => setShowStrategyModal(true)}
            />
          </Reanimated.View>

          {/* 7. MILESTONES (returning) */}
          {!isNewUser && (
            <Reanimated.View entering={FadeInUp.delay(450).duration(550)} style={styles.section}>
              <MilestonesCard onChallenge={() => (onOpenChallenge ? onOpenChallenge() : onNavigateTab?.('quests'))} />
            </Reanimated.View>
          )}

          {/* 8. WEEKLY GROWTH REPORT */}
          {isNewUser ? (
            <Reanimated.View entering={FadeInUp.delay(500).duration(550)} style={styles.section}>
              <FirstReportCard daysOfData={0} />
            </Reanimated.View>
          ) : (
            <Reanimated.View entering={FadeInUp.delay(500).duration(550)} style={styles.section}>
              <WeeklyReportCard />
            </Reanimated.View>
          )}

          {/* 9. PRO (gold = Pro only; members don't see the upgrade) */}
          {tier !== 'pro' && (
          <Reanimated.View entering={FadeInUp.delay(600).duration(550)} style={styles.section}>
            <ProUpsellCard
              title="Unlock deeper analytics"
              benefits={['Who your audience is', 'When they’re online', 'How you’ve grown over months']}
              buttonTitle="Explore Pro"
              onUpgrade={handleOpenPro}
            />
          </Reanimated.View>
          )}

          </ResponsiveColumns>
          {/* Bottom Space for Floating Tab Bar */}
          <View style={{ height: 110 }} />
        </ScrollView>

        {/* FLOATING LIQUID GLASS TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* SIGNATURE ANIMATED GHOST CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCelebrationModal}
          title={celebrationTitle}
          subtitle={celebrationSubtitle}
          speechBubble={celebrationSpeech}
          badgeText={celebrationBadge}
          xpEarned={celebrationXp}
          streakCount={userProfile?.streakCount || 1}
          actionText="Continue ➔"
          onDismiss={() => setShowCelebrationModal(false)}
        />

        {/* MODAL: POST RETENTION BREAKDOWN */}
        <Modal
          visible={showPostAnalysisModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPostAnalysisModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Viral Post Retention</Text>
                  <Text style={styles.modalSubtitle}>Hook Retention: 88% at 3 seconds</Text>
                </View>
                <Pressable onPress={() => setShowPostAnalysisModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.modalDetailCard}>
                <Text style={styles.modalDetailTitle}>🔥 Why It Succeeded</Text>
                <Text style={styles.modalDetailBody}>
                  Starting with &ldquo;3 creator mistakes&rdquo; created immediate curiosity. 42% of viewers replayed the video twice.
                </Text>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setShowPostAnalysisModal(false);
                  if (onNavigateTab) onNavigateTab('create');
                }}
              >
                <Text style={styles.modalFullBtnText}>Make Another Post Like This ➔</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL: AUDIENCE BREAKDOWN */}
        <Modal
          visible={showAudienceModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAudienceModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Audience Demographics</Text>
                  <Text style={styles.modalSubtitle}>Your primary viewer signals</Text>
                </View>
                <Pressable onPress={() => setShowAudienceModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 10, marginVertical: 10 }}>
                <View style={styles.modalDetailCard}>
                  <Text style={styles.modalDetailTitle}>📍 Top Locations</Text>
                  <Text style={styles.modalDetailBody}>United States (48%), UK (24%), Canada (14%)</Text>
                </View>
                <View style={styles.modalDetailCard}>
                  <Text style={styles.modalDetailTitle}>🕒 Peak Active Time</Text>
                  <Text style={styles.modalDetailBody}>7:30 PM - 9:00 PM EST daily</Text>
                </View>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowAudienceModal(false)}>
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* Jarvis's plan for the week */}
        <WeeklyPlanSheet
          visible={showStrategyModal}
          onClose={() => setShowStrategyModal(false)}
          isNewUser={isNewUser}
          steps={
            isNewUser
              ? [
                  {
                    id: 'connect',
                    title: 'Connect one account',
                    body: 'So Jarvis can start learning what works for you.',
                    action: 'Connect',
                    onAction: () => {
                      setShowStrategyModal(false);
                      setShowConnectPlatformModal(true);
                    },
                  },
                  {
                    id: 'idea',
                    title: 'Pick your first idea',
                    body: 'Choose one that feels easy to make.',
                    action: 'See ideas',
                    onAction: () => leavePlan(onOpenIdeas, 'create'),
                  },
                  {
                    id: 'post',
                    title: 'Post once this week',
                    body: 'Any day, any format. One post gives Jarvis something to learn from.',
                    action: 'Start a post',
                    onAction: () => leavePlan(undefined, 'create'),
                  },
                ]
              : [
                  {
                    id: 'shorts',
                    title: 'Post 2 short videos',
                    body: 'Wednesday and Friday around 7:30 PM, when your audience is most active.',
                    action: 'Plan them',
                    onAction: () => leavePlan(onOpenSchedule, 'create'),
                  },
                  {
                    id: 'hooks',
                    title: 'Open with a mistake',
                    body: 'Hooks like “The mistake I made…” kept people watching longest.',
                    action: 'Get hook ideas',
                    onAction: () => leavePlan(onOpenIdeas, 'create'),
                  },
                  {
                    id: 'challenge',
                    title: 'Join this week’s challenge',
                    body: 'Post 3 times this week, at your own pace.',
                    action: 'See the challenge',
                    onAction: () => leavePlan(onOpenChallenge, 'quests'),
                  },
                ]
          }
        />

        {/* NOTIFICATION MODAL */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Growth Alerts</Text>
                  <Text style={styles.modalSubtitle}>Recent follower spikes</Text>
                </View>
                <Pressable onPress={() => setShowNotificationModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.notifCard}>
                <Text style={{ fontSize: 18 }}>📈</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>+12.4% Audience Spike</Text>
                  <Text style={styles.notifBody}>Your consistency is paying off this month!</Text>
                </View>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        
        {/* Connect accounts: glass sheet */}
        <ConnectAccountsSheet
          visible={showConnectPlatformModal}
          onClose={() => setShowConnectPlatformModal(false)}
          platforms={platformsList.filter((p) => isStage1Platform(p.id))}
          onToggle={(id) => {
            const p = platformsList.find((x) => x.id === id);
            if (p?.connected) handleRemoveSinglePlatform(id);
            else handleConnectSinglePlatform(id);
          }}
        />

        {/* PROFILE MODAL */}
        {/* UNIVERSAL CREATOR PASSPORT & PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />

        {/* TOAST BANNER */}
        <BrandToast message={toastMessage} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  headlineAccent: { color: ds.purple },
  sectionLabel: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24 },
  stack: { gap: 10, marginTop: 12 },
  section: { marginTop: 24 },
  section0: { marginBottom: 0 },
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F0',
  },
  container: {
    flex: 1,
    width: '100%',
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  // 1. TOP HEADER BAR
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FAF8F5',
  },
  headerLogoWrapper: {
    width: 42,
    height: 42,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  headerGhostLogo: {
    width: 36,
    height: 36,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // TOP PILL BADGES
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  growthPill: {
    backgroundColor: '#784DF0',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  growthPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  analyticsPill: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  analyticsPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.4,
  },

  // HEADLINE
  mainHeading: {
    fontSize: Platform.OS === 'web' ? ('clamp(15px, 3.8vw, 17px)' as any) : sFont(16),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.35,
    lineHeight: 22,
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#524C62',
    lineHeight: 19,
    marginBottom: 20,
    fontWeight: '500',
  },

  // 1. TOTAL AUDIENCE HERO CARD
  audienceHeroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  audienceEmptyContainer: {
    paddingVertical: 4,
  },
  audienceEmptyHeadline: {
    fontSize: 24,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.4,
    marginTop: 4,
    marginBottom: 4,
  },
  audienceEmptySubtext: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 18,
  },
  connectAccountBtn: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  connectAccountGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  connectAccountBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  connectPlatformSmallBtn: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 100,
    flexShrink: 0,
  },
  connectPlatformSmallBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  audienceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  audienceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  audienceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    marginBottom: 2,
  },
  audienceMainNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.6,
  },
  growthBadgePill: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 100,
  },
  growthBadgePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  audienceSubCompare: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  audiencePercentText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.8,
  },
  vs30DaysPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  vs30DaysPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.4,
    marginBottom: 3,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
  },
  graphContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  chartTooltipBubble: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  chartTooltipText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  chartInteractiveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 20,
    flexDirection: 'row',
  },
  chartTouchSlice: {
    flex: 1,
    height: '100%',
  },
  graphDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  graphFollowersLegend: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366F1',
  },
  graphDateText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  viewFullAudienceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  viewFullAudienceText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#5B3EE8',
  },

  // 2. CONNECTED PLATFORMS
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
  },
  sectionSubheading: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  platformsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
  },
  platformRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  platformLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 140,
    marginRight: 8,
  },
  platformIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  platformName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
  },
  platformFollowers: {
    fontSize: 11.5,
    color: '#64748B',
  },
  platformGrowthGreen: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#10B981',
  },
  connectPillBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    flexShrink: 0,
  },
  connectPillBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 3. BEST PERFORMING POST
  bestPostCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  bestPostTopRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  bestPostThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
  },
  bestPostContent: {
    flex: 1,
    justifyContent: 'center',
  },
  bestPostPlatformTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FAF5FF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 4,
  },
  bestPostPlatformTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  bestPostTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 19,
    marginBottom: 4,
  },
  bestPostStatsMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  perfBarsList: {
    gap: 10,
    marginBottom: 16,
  },
  perfBarRow: {},
  perfBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  perfBarLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  perfBarValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171420',
  },
  perfBarComparison: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#10B981',
  },
  perfBarCompGold: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#5B3EE8',
  },
  perfBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  perfBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  analyzeBtn: {
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  analyzeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
  },
  moreLikeText: { fontSize: 15, fontWeight: '800', color: '#5B3EE8' },
  analyzeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 4. TOTAL POST REACH CARD
  reachCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    marginBottom: 20,
  },
  reachHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reachHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  reachNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#171420',
  },
  reachPercentPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  reachPercentPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },
  distBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 14,
  },
  distBarSeg: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  legendValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#171420',
  },
  seeAllReachLink: {
    alignItems: 'center',
  },
  seeAllReachText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },

  // 5. FORMAT PERFORMANCE
  formatCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    marginBottom: 20,
  },
  formatBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: 16,
    paddingTop: 10,
  },
  formatBarCol: {
    alignItems: 'center',
    width: 70,
  },
  formatPercentLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    marginBottom: 6,
  },
  formatBarPillar: {
    width: 44,
    borderRadius: 8,
    marginBottom: 8,
  },
  formatBarTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171420',
  },
  formatInsightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
  },
  formatInsightText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },

  // 6. JARVIS GROWTH STRATEGY
  jarvisStrategyCard: {
    backgroundColor: '#1E1B2E',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
  },
  jarvisHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  jarvisFlameCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisFlameIcon: {
    width: 22,
    height: 22,
  },
  jarvisTitleCol: {
    flex: 1,
  },
  jarvisTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E0E7FF',
    letterSpacing: 0.6,
  },
  jarvisTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  jarvisBodyQuote: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  viewStrategyBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewStrategyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 7. MILESTONES
  milestonesList: {
    gap: 10,
    marginBottom: 20,
  },
  milestoneCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    padding: 14,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  milestoneTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  milestoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  milestoneTextCol: {
    flex: 1,
    minWidth: 0,
  },
  milestoneIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  milestoneTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  milestoneSub: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  milestoneBadgePurple: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneBadgePurpleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },
  milestoneBadgeGold: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedGoldText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5B3EE8',
  },
  milestoneProgressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  milestoneProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  postNowBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    flexShrink: 0,
  },
  postNowBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 8. WEEKLY GROWTH REPORT
  reportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    padding: 18,
    marginBottom: 20,
  },
  reportTopRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  reportIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 3,
  },
  reportSummary: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  reportGlanceBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
  },
  reportGlanceTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#6B637B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  reportGlanceList: {
    gap: 6,
  },
  reportGlanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportGlanceIcon: {
    fontSize: 13,
  },
  reportGlanceText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '500',
  },
  reportGlanceBold: {
    fontWeight: '800',
    color: '#171420',
  },
  downloadReportLink: {
    alignItems: 'flex-start',
  },
  downloadReportText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },

  // 9. UNLOCK PRO CARD
  unlockProCard: {
    backgroundColor: '#582CDB',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  unlockProTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  proPillarsList: {
    gap: 8,
    marginBottom: 16,
  },
  proPillarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proPillarCheck: {
    fontSize: 12,
  },
  proPillarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E0E7FF',
  },
  proWaveGraphicBox: {
    alignItems: 'center',
    marginVertical: 14,
  },
  proGraphicBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proGraphicBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  proGraphicCenterLock: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  exploreProBtn: {
    height: 48,
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  exploreProGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreProBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 24, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 40 : 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 10,
    alignSelf: 'center',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 8,
  },
  modalCloseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  modalCloseCross: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B637B',
    lineHeight: 18,
  },
  modalDetailCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
  },
  modalActionItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    gap: 10,
  },
  modalActionContent: {
    flex: 1,
    marginRight: 6,
  },
  modalActionMiniBtn: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    flexShrink: 0,
  },
  modalActionMiniBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  modalDetailTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  modalDetailBody: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 16,
  },
  modalFullBtn: {
    backgroundColor: '#582CDB',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  modalFullBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 12,
    color: '#64748B',
  },
  profileRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  chatCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 12,
    marginBottom: 10,
  },

  // CONNECT PLATFORM MODAL STYLES
  modalCardLarge: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 10,
  },
  activePlatformsCountBadge: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  activePlatformsCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  modalSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 6,
  },
  modalSubDescription: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  connectedPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  availablePlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  platformIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
    flexShrink: 0,
  },
  platformMiddleCol: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginRight: 4,
  },
  platformNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    rowGap: 2,
  },
  platformNameText: {
    fontSize: sFont(13),
    fontWeight: '800',
    color: '#171420',
  },
  autoSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    borderRadius: 4,
    flexShrink: 0,
  },
  autoSyncDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  autoSyncText: {
    fontSize: sFont(8.5),
    fontWeight: '700',
    color: '#059669',
  },
  platformSubText: {
    fontSize: sFont(10.5),
    color: '#64748B',
    marginTop: 1,
  },
  removePlatformBtn: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    flexShrink: 0,
  },
  removePlatformBtnText: {
    fontSize: sFont(10),
    fontWeight: '800',
    color: '#DC2626',
  },
  addPlatformActionBtn: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  addPlatformActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  customAddAccountBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 10,
  },
  customAddTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.6,
  },
  customAddSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  platformSelectChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  platformSelectChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#582CDB',
  },
  platformSelectChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  platformSelectChipTextActive: {
    color: '#582CDB',
    fontWeight: '700',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  customTextInput: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    fontSize: sFont(12),
    color: '#171420',
    fontWeight: '600',
  },
  linkAccountConfirmBtn: {
    backgroundColor: '#582CDB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  linkAccountConfirmBtnText: {
    fontSize: sFont(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalDoneBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalDoneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 30,
    left: 20,
    right: 20,
    backgroundColor: '#171420',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // CREATOR EARNINGS HUB CARD
  earningsHubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  earningsHubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  earningsHubHeaderLeft: {
    flex: 1,
    flexShrink: 1,
  },
  earningsHubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    rowGap: 4,
  },
  earningsHubTitle: {
    fontSize: sFont(15.5),
    fontWeight: '700',
    color: '#171420',
  },
  readinessTag: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    flexShrink: 0,
  },
  readinessTagText: {
    fontSize: sFont(9),
    fontWeight: '700',
    color: '#582CDB',
  },
  earningsHubSub: {
    fontSize: sFont(11.5),
    color: '#64748B',
    marginTop: 2,
  },
  earningsHubIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF9C3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
    flexShrink: 0,
  },
  earningsHubStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    marginBottom: 12,
  },
  earningsHubStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  earningsHubStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  earningsHubStatVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  earningsHubDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  earningsHubBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsHubBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
