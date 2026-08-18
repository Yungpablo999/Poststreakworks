import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
} from 'react-native';
import Svg, { Path, Circle, Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

interface GrowthScreenProps {
  onBackToDashboard?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
}

export const GrowthScreen: React.FC<GrowthScreenProps> = ({
  onBackToDashboard,
  onLogout,
  onNavigateTab,
  onOpenJarvisPro,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('growth');

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
  const [showChatModal, setShowChatModal] = useState(false);

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* 1. TOP AIRY HEADER BAR */}
        <View style={styles.headerBar}>
          {/* Top-Left: Ghost Logo Mascot */}
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

          {/* Right Icons: Messages, Notification Bell, Profile */}
          <View style={styles.headerRightGroup}>
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                triggerModalPop();
                setShowChatModal(true);
              }}
            >
              <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                  stroke="#171420"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                triggerModalPop();
                setShowNotificationModal(true);
              }}
            >
              <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="#171420"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="#171420"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View style={styles.notificationDot} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                triggerModalPop();
                setShowProfileModal(true);
              }}
            >
              <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                  stroke="#171420"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx="12" cy="7" r="4" stroke="#171420" strokeWidth="2.2" />
              </Svg>
            </Pressable>
          </View>
        </View>

        {/* 2. MAIN SCROLLABLE CONTENT */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* TOP PILL BADGES */}
          <View style={styles.topBadgesRow}>
            <View style={styles.growthPill}>
              <Text style={styles.growthPillText}>GROWTH</Text>
            </View>

            <View style={styles.analyticsPill}>
              <Text style={styles.analyticsPillText}>ANALYTICS HUB</Text>
            </View>
          </View>

          {/* HEADLINE & SUBTITLE */}
          <Text style={styles.mainHeading}>See your growth clearly.</Text>
          <Text style={styles.mainSubtitle}>
            Track your weekly growth, top content and audience signals.
          </Text>

          {/* 1. TOTAL AUDIENCE GROWTH HERO CARD */}
          <View style={styles.audienceHeroCard}>
            <View style={styles.audienceHeaderRow}>
              <View>
                <Text style={styles.audienceLabel}>TOTAL AUDIENCE</Text>
                <Text style={styles.audiencePercentText}>+12.4%</Text>
              </View>
              <View style={styles.vs30DaysPill}>
                <Text style={styles.vs30DaysPillText}>VS LAST 30 DAYS</Text>
              </View>
            </View>

            {/* 3 Metric Stat Boxes */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>NEW FOLLOWERS</Text>
                <Text style={styles.statValue}>1.2k</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>PROFILE VISITS</Text>
                <Text style={styles.statValue}>1.9k</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>ENGAGEMENT</Text>
                <Text style={styles.statValue}>600</Text>
              </View>
            </View>

            {/* Interactive Smooth Curve Graph */}
            <View style={styles.graphContainer}>
              <Svg width="100%" height={110} viewBox="0 0 320 110" preserveAspectRatio="none">
                <Defs>
                  <SvgLinearGradient id="curveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#6366F1" stopOpacity="0.22" />
                    <Stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                  </SvgLinearGradient>
                </Defs>

                {/* Area Fill */}
                <Path
                  d="M0,75 C45,75 75,55 120,30 C160,8 190,85 240,65 C270,48 290,15 320,18 L320,110 L0,110 Z"
                  fill="url(#curveGrad)"
                />

                {/* Smooth Curve Line */}
                <Path
                  d="M0,75 C45,75 75,55 120,30 C160,8 190,85 240,65 C270,48 290,15 320,18"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Benchmark Peak Dot */}
                <Circle cx="320" cy="18" r="5" fill="#6366F1" />
                <Circle cx="320" cy="18" r="9" stroke="#6366F1" strokeWidth="1.5" fill="none" opacity="0.4" />
              </Svg>

              <View style={styles.graphDateRow}>
                <Text style={styles.graphDateText}>OCT 01</Text>
                <Text style={styles.graphDateText}>OCT 28</Text>
              </View>
            </View>

            {/* Bottom Link */}
            <Pressable
              style={styles.viewFullAudienceLink}
              onPress={() => {
                triggerModalPop();
                setShowAudienceModal(true);
              }}
              hitSlop={8}
            >
              <Text style={styles.viewFullAudienceText}>View Full Audience Breakdown ➔</Text>
            </Pressable>
          </View>

          {/* 2. CONNECTED PLATFORMS */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>CONNECTED PLATFORMS</Text>
          </View>

          <View style={styles.platformsCard}>
            {/* TikTok */}
            <View style={styles.platformRow}>
              <View style={styles.platformLeft}>
                <View style={[styles.platformIconBox, { backgroundColor: '#000000' }]}>
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>♪</Text>
                </View>
                <View>
                  <Text style={styles.platformName}>TikTok</Text>
                  <Text style={styles.platformFollowers}>14.2k followers</Text>
                </View>
              </View>
              <Text style={styles.platformGrowthGreen}>+8.2%  ▲</Text>
            </View>

            {/* Instagram */}
            <View style={styles.platformRow}>
              <View style={styles.platformLeft}>
                <View style={[styles.platformIconBox, { backgroundColor: '#E1306C' }]}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Rect x="2" y="2" width="20" height="20" rx="5" stroke="#FFFFFF" strokeWidth="2.2" />
                    <Circle cx="12" cy="12" r="4" stroke="#FFFFFF" strokeWidth="2.2" />
                  </Svg>
                </View>
                <View>
                  <Text style={styles.platformName}>Instagram</Text>
                  <Text style={styles.platformFollowers}>7.8k followers</Text>
                </View>
              </View>
              <Text style={styles.platformGrowthGreen}>+3.4%  ▲</Text>
            </View>

            {/* YouTube Shorts */}
            <View style={styles.platformRow}>
              <View style={styles.platformLeft}>
                <View style={[styles.platformIconBox, { backgroundColor: '#FF0000' }]}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path d="M8 5v14l11-7z" fill="#FFFFFF" />
                  </Svg>
                </View>
                <View>
                  <Text style={styles.platformName}>YouTube Shorts</Text>
                  <Text style={styles.platformFollowers}>2.8k subs</Text>
                </View>
              </View>
              <Text style={styles.platformGrowthGreen}>+1.1%  ▲</Text>
            </View>

            {/* Connect More */}
            <View style={[styles.platformRow, { borderBottomWidth: 0 }]}>
              <View style={styles.platformLeft}>
                <View style={[styles.platformIconBox, { backgroundColor: '#0A66C2' }]}>
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>in</Text>
                </View>
                <View>
                  <Text style={styles.platformName}>Unlock multi-platform sync</Text>
                  <Text style={styles.platformFollowers}>Connect YouTube &amp; X</Text>
                </View>
              </View>
              <Pressable
                style={styles.connectPillBtn}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  if (onNavigateTab) onNavigateTab('match');
                }}
              >
                <Text style={styles.connectPillBtnText}>Connect</Text>
              </Pressable>
            </View>
          </View>

          {/* 3. BEST PERFORMING POST HERO CARD */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>BEST PERFORMING POST</Text>
          </View>

          <View style={styles.bestPostCard}>
            <View style={styles.bestPostTopRow}>
              <Image
                source={require('../../assets/images/amara-portrait.jpg')}
                style={styles.bestPostThumbnail}
                resizeMode="cover"
              />
              <View style={styles.bestPostContent}>
                <Text style={styles.bestPostTitle}>
                  &ldquo;3 creator mistakes I stopped making this year&rdquo;
                </Text>
                <Text style={styles.bestPostStatsMeta}>
                  14.2k views • 1.8k likes • 84 shares
                </Text>
              </View>
            </View>

            {/* Multi-Metric Performance Bars */}
            <View style={styles.perfBarsList}>
              <View style={styles.perfBarRow}>
                <View style={styles.perfBarLabelRow}>
                  <Text style={styles.perfBarLabel}>VIEWS</Text>
                  <Text style={styles.perfBarValue}>14.2k</Text>
                </View>
                <View style={styles.perfBarTrack}>
                  <View style={[styles.perfBarFill, { width: '85%', backgroundColor: '#6366F1' }]} />
                </View>
              </View>

              <View style={styles.perfBarRow}>
                <View style={styles.perfBarLabelRow}>
                  <Text style={styles.perfBarLabel}>WATCH TIME</Text>
                  <Text style={styles.perfBarValue}>42s</Text>
                </View>
                <View style={styles.perfBarTrack}>
                  <View style={[styles.perfBarFill, { width: '70%', backgroundColor: '#8B5CF6' }]} />
                </View>
              </View>

              <View style={styles.perfBarRow}>
                <View style={styles.perfBarLabelRow}>
                  <Text style={styles.perfBarLabel}>SHARES</Text>
                  <Text style={styles.perfBarValue}>84 (Top 5%)</Text>
                </View>
                <View style={styles.perfBarTrack}>
                  <View style={[styles.perfBarFill, { width: '92%', backgroundColor: '#EAB308' }]} />
                </View>
              </View>
            </View>

            {/* CTA Button */}
            <Pressable
              style={({ pressed }) => [styles.analyzeBtn, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowPostAnalysisModal(true);
              }}
            >
              <LinearGradient
                colors={['#6366F1', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.analyzeGradient}
              >
                <Text style={styles.analyzeBtnText}>Analyze Why It Worked</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* 4. TOTAL POST REACH BREAKDOWN CARD */}
          <View style={styles.reachCard}>
            <View style={styles.reachHeaderRow}>
              <View>
                <Text style={styles.reachHeaderLabel}>TOTAL POST REACH</Text>
                <Text style={styles.reachNumber}>24,850</Text>
              </View>
              <View style={styles.reachPercentPill}>
                <Text style={styles.reachPercentPillText}>+18%</Text>
              </View>
            </View>

            {/* Multi-Segment Distribution Bar */}
            <View style={styles.distBarTrack}>
              <View style={[styles.distBarSeg, { width: '65%', backgroundColor: '#171420' }]} />
              <View style={[styles.distBarSeg, { width: '25%', backgroundColor: '#6366F1' }]} />
              <View style={[styles.distBarSeg, { width: '10%', backgroundColor: '#EF4444' }]} />
            </View>

            {/* Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#171420' }]} />
                <Text style={styles.legendText}>TikTok</Text>
                <Text style={styles.legendValue}>+65%</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
                <Text style={styles.legendText}>Instagram</Text>
                <Text style={styles.legendValue}>+25%</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>YouTube</Text>
                <Text style={styles.legendValue}>+10%</Text>
              </View>
            </View>

            <Pressable
              style={styles.seeAllReachLink}
              onPress={() => {
                triggerModalPop();
                setShowAudienceModal(true);
              }}
              hitSlop={6}
            >
              <Text style={styles.seeAllReachText}>See All Post Analytics ➔</Text>
            </Pressable>
          </View>

          {/* 5. FORMAT PERFORMANCE BAR CHART */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>FORMAT PERFORMANCE</Text>
          </View>

          <View style={styles.formatCard}>
            <View style={styles.formatBarsContainer}>
              {/* Short Video */}
              <View style={styles.formatBarCol}>
                <Text style={styles.formatPercentLabel}>78%</Text>
                <View style={[styles.formatBarPillar, { height: 110, backgroundColor: '#6366F1' }]} />
                <Text style={styles.formatBarTitle}>Short Video</Text>
              </View>

              {/* Text/Thread */}
              <View style={styles.formatBarCol}>
                <Text style={styles.formatPercentLabel}>54%</Text>
                <View style={[styles.formatBarPillar, { height: 75, backgroundColor: '#C7D2FE' }]} />
                <Text style={styles.formatBarTitle}>Text/Thread</Text>
              </View>

              {/* Carousel */}
              <View style={styles.formatBarCol}>
                <Text style={styles.formatPercentLabel}>32%</Text>
                <View style={[styles.formatBarPillar, { height: 45, backgroundColor: '#E2E8F0' }]} />
                <Text style={styles.formatBarTitle}>Carousel</Text>
              </View>
            </View>

            {/* Insight Callout Box */}
            <View style={styles.formatInsightBox}>
              <Text style={{ fontSize: 16 }}>💡</Text>
              <Text style={styles.formatInsightText}>
                Short Videos scored <Text style={{ fontWeight: '800', color: '#171420' }}>2.4x higher retention</Text> than static posts this week.
              </Text>
            </View>
          </View>

          {/* 6. JARVIS GROWTH STRATEGY (LUXURY DARK NAVY) */}
          <View style={styles.jarvisStrategyCard}>
            <View style={styles.jarvisHeaderRow}>
              <Animated.View
                style={[
                  styles.jarvisFlameCircle,
                  { transform: [{ translateY: flameFloatY }] },
                ]}
              >
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={styles.jarvisFlameIcon}
                  resizeMode="contain"
                />
              </Animated.View>
              <View style={styles.jarvisTitleCol}>
                <Text style={styles.jarvisTagText}>JARVIS AI STRATEGY</Text>
                <Text style={styles.jarvisTitle}>Growth Strategy</Text>
              </View>
            </View>

            <Text style={styles.jarvisBodyQuote}>
              &ldquo;Your audience retention spikes when you deliver your main value within the first 4 seconds. Double down on mistake-based hooks.&rdquo;
            </Text>

            <Pressable
              style={({ pressed }) => [styles.viewStrategyBtn, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowStrategyModal(true);
              }}
            >
              <Text style={styles.viewStrategyBtnText}>View Insight ➔</Text>
            </Pressable>
          </View>

          {/* 7. MILESTONES SECTION */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>MILESTONES</Text>
          </View>

          <View style={styles.milestonesList}>
            {/* Milestone 1 */}
            <View style={styles.milestoneCard}>
              <View style={styles.milestoneLeft}>
                <View style={[styles.milestoneIconCircle, { backgroundColor: '#EDE9FE' }]}>
                  <Text style={{ fontSize: 14 }}>⚡</Text>
                </View>
                <View>
                  <Text style={styles.milestoneTitle}>Reach 15k TikTok Followers</Text>
                  <Text style={styles.milestoneSub}>14.2k / 15k</Text>
                </View>
              </View>
              <View style={styles.milestoneBadgePurple}>
                <Text style={styles.milestoneBadgePurpleText}>800 to go</Text>
              </View>
            </View>

            {/* Milestone 2 */}
            <View style={styles.milestoneCard}>
              <View style={styles.milestoneLeft}>
                <View style={[styles.milestoneIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={{ fontSize: 14 }}>🏆</Text>
                </View>
                <View>
                  <Text style={styles.milestoneTitle}>7-Day Consistency Streak</Text>
                  <Text style={styles.milestoneSub}>Day 7 of 7</Text>
                </View>
              </View>
              <Text style={styles.completedGoldText}>Completed ✓</Text>
            </View>

            {/* Milestone 3 */}
            <View style={styles.milestoneCard}>
              <View style={styles.milestoneLeft}>
                <View style={[styles.milestoneIconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={{ fontSize: 14 }}>🎯</Text>
                </View>
                <View>
                  <Text style={styles.milestoneTitle}>Post 3 Videos This Week</Text>
                  <Text style={styles.milestoneSub}>2 / 3 posted</Text>
                </View>
              </View>
              <Pressable
                style={styles.postNowBtn}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  if (onNavigateTab) onNavigateTab('create');
                }}
              >
                <Text style={styles.postNowBtnText}>Post 1</Text>
              </Pressable>
            </View>
          </View>

          {/* 8. WEEKLY GROWTH REPORT */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>WEEKLY GROWTH REPORT</Text>
          </View>

          <View style={styles.reportCard}>
            <View style={styles.reportTopRow}>
              <View style={styles.reportIconBox}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Rect x="3" y="3" width="18" height="18" rx="3" stroke="#582CDB" strokeWidth="2" />
                  <Path d="M7 14l3-3 3 2 4-5" stroke="#582CDB" strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportTitle}>October 14 - 20 Report</Text>
                <Text style={styles.reportSummary}>
                  Your total impressions jumped 22%. Best day was Wednesday at 7:30 PM.
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.downloadReportLink}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                setCelebrationTitle('Report Exported!');
                setCelebrationSubtitle('Your weekly PDF growth breakdown is ready to review.');
                setCelebrationSpeech('Ghost says: You have maintained top 5% retention all week!');
                setCelebrationBadge('PDF DOWNLOADED');
                setCelebrationXp(30);
                setShowCelebrationModal(true);
              }}
              hitSlop={6}
            >
              <Text style={styles.downloadReportText}>Download Weekly Report PDF ➔</Text>
            </Pressable>
          </View>

          {/* 9. UNLOCK DEEPER GROWTH ANALYTICS PRO CARD */}
          <View style={styles.unlockProCard}>
            <Text style={styles.unlockProTitle}>Unlock deeper growth analytics</Text>

            <View style={styles.proPillarsList}>
              <View style={styles.proPillarItem}>
                <Text style={styles.proPillarCheck}>🔒</Text>
                <Text style={styles.proPillarText}>Real-time retention curve tracking</Text>
              </View>
              <View style={styles.proPillarItem}>
                <Text style={styles.proPillarCheck}>🔒</Text>
                <Text style={styles.proPillarText}>AI script performance scorer</Text>
              </View>
              <View style={styles.proPillarItem}>
                <Text style={styles.proPillarCheck}>🔒</Text>
                <Text style={styles.proPillarText}>Multi-creator audience overlap data</Text>
              </View>
            </View>

            {/* Glowing Equalizer Graphic with Lock */}
            <View style={styles.proWaveGraphicBox}>
              <View style={styles.proGraphicBarWrapper}>
                <View style={[styles.proGraphicBar, { height: 28 }]} />
                <View style={[styles.proGraphicBar, { height: 42 }]} />
                <View style={styles.proGraphicCenterLock}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Rect x="4" y="11" width="16" height="11" rx="2" stroke="#FFFFFF" strokeWidth="2" />
                    <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                  </Svg>
                </View>
                <View style={[styles.proGraphicBar, { height: 42 }]} />
                <View style={[styles.proGraphicBar, { height: 28 }]} />
              </View>
            </View>

            {/* Explore Pro Plans Metallic Gold Button */}
            <Pressable
              style={({ pressed }) => [styles.exploreProBtn, pressed && styles.btnPressed]}
              onPress={handleOpenPro}
            >
              <LinearGradient
                colors={['#FDE047', '#EAB308', '#CA8A04', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.exploreProGradient}
              >
                <Text style={styles.exploreProBtnText}>Explore Pro Plans</Text>
              </LinearGradient>
            </Pressable>
          </View>

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
          streakCount={47}
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

        {/* MODAL: JARVIS AI STRATEGY */}
        <Modal
          visible={showStrategyModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStrategyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Jarvis Weekly Action Plan</Text>
                  <Text style={styles.modalSubtitle}>Recommended next steps for Amara</Text>
                </View>
                <Pressable onPress={() => setShowStrategyModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.modalDetailCard}>
                <Text style={styles.modalDetailTitle}>⚡ Action 1: Batch 2 Shorts</Text>
                <Text style={styles.modalDetailBody}>Schedule them for 7:30 PM Wednesday and Friday.</Text>
              </View>

              <View style={[styles.modalDetailCard, { marginTop: 8 }]}>
                <Text style={styles.modalDetailTitle}>🤝 Action 2: Squad Collab</Text>
                <Text style={styles.modalDetailBody}>Join the 7-Day Consistency Challenge with Elena.</Text>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setShowStrategyModal(false);
                  if (onNavigateTab) onNavigateTab('create');
                }}
              >
                <Text style={styles.modalFullBtnText}>Apply Strategy Now ➔</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

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

        {/* PROFILE MODAL */}
        <Modal
          visible={showProfileModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowProfileModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Creator Passport</Text>
                  <Text style={styles.modalSubtitle}>Growth Tier: Level 12</Text>
                </View>
                <Pressable onPress={() => setShowProfileModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <View style={styles.profileRing}>
                  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                      stroke="#582CDB"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Circle cx="12" cy="7" r="4" stroke="#582CDB" strokeWidth="2.2" />
                  </Svg>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#171420' }}>Amara Okafor</Text>
                <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>⚡ 24.8k Total Reach • 47-Day Streak</Text>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowProfileModal(false)}>
                <Text style={styles.modalFullBtnText}>Done</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* CHAT MODAL */}
        <Modal
          visible={showChatModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowChatModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Squad Chat</Text>
                  <Text style={styles.modalSubtitle}>Collaborate with your creator squad</Text>
                </View>
                <Pressable onPress={() => setShowChatModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.chatCard}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#582CDB', marginBottom: 2 }}>🤖 Jarvis Assistant</Text>
                <Text style={{ fontSize: 13, color: '#334155' }}>Your engagement scored in the top 5% among tech creators!</Text>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowChatModal(false)}>
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>
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
    backgroundColor: '#FAF8F5',
  },
  btnPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
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
    borderRadius: 21,
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
    fontSize: 10.5,
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
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.4,
  },

  // HEADLINE
  mainHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 13.5,
    color: '#524C62',
    lineHeight: 19,
    marginBottom: 20,
    fontWeight: '500',
  },

  // 1. TOTAL AUDIENCE HERO CARD
  audienceHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  audienceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  audienceLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  audiencePercentText: {
    fontSize: 32,
    fontWeight: '900',
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
    fontSize: 8.5,
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
  },
  graphDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  graphDateText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  viewFullAudienceLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  viewFullAudienceText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
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
    gap: 12,
  },
  platformIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  connectPillBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 3. BEST PERFORMING POST
  bestPostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
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
  bestPostTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 19,
    marginBottom: 4,
  },
  bestPostStatsMeta: {
    fontSize: 11.5,
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
    marginBottom: 4,
  },
  perfBarLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  perfBarValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171420',
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
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  analyzeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 4. TOTAL POST REACH CARD
  reachCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
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
    fontSize: 10.5,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  reachNumber: {
    fontSize: 28,
    fontWeight: '900',
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
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
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
    fontSize: 9.5,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 14,
  },
  milestoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  milestoneIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
  },
  milestoneSub: {
    fontSize: 11.5,
    color: '#64748B',
  },
  milestoneBadgePurple: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  milestoneBadgePurpleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },
  completedGoldText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  postNowBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  postNowBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 8. WEEKLY GROWTH REPORT
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
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
    shadowOpacity: 0.3,
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
    borderRadius: 19,
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
    shadowColor: '#FDE047',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  exploreProGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreProBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.2,
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 24, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 22,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseCross: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.4,
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
  modalDetailTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  modalDetailBody: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
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
    fontSize: 11.5,
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
});
