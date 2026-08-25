import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Animated,
  Modal,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { TinyGoldCheck } from '../components/CreatorStoryModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProIdeaStrategyScreenProps {
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenMessages?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onUseIdea?: (ideaTitle: string) => void;
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface IdeaItem {
  id: string;
  category: 'STREAK-SAVER' | 'GROWTH' | 'AUTHORITY' | 'VIRAL';
  badgeEmoji: string;
  score: number;
  title: string;
  bestFor: string;
  audienceFit: number;
  virality: number;
}

export const ProIdeaStrategyScreen: React.FC<ProIdeaStrategyScreenProps> = ({
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenMessages,
  onOpenJarvisPro,
  onNavigateTab,
  onUseIdea,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showEditStrategyModal, setShowEditStrategyModal] = useState(false);
  const [showSavedIdeasModal, setShowSavedIdeasModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Strategy setup selections
  const [selectedNiche, setSelectedNiche] = useState('Creator Education');
  const [selectedGoal, setSelectedGoal] = useState('Grow engagement');
  const [audiencePrompt, setAudiencePrompt] = useState(
    'Help new creators post more consistently without overthinking.'
  );

  // Ideas List
  const [ideas, setIdeas] = useState<IdeaItem[]>([
    {
      id: 'i1',
      category: 'STREAK-SAVER',
      badgeEmoji: '👏',
      score: 93,
      title: 'One small creator habit that made posting easier',
      bestFor: 'Fast Completion',
      audienceFit: 96,
      virality: 91,
    },
    {
      id: 'i2',
      category: 'GROWTH',
      badgeEmoji: '📈',
      score: 89,
      title: '3 mistakes that slow down new creators',
      bestFor: 'Saves & Reach',
      audienceFit: 92,
      virality: 87,
    },
  ]);

  const [savedIdeas, setSavedIdeas] = useState([
    { id: 's1', title: 'Morning Routine for Peak Editing Flow', score: 94, category: 'WORKFLOW' },
    { id: 's2', title: 'Budget Gear for 4K Quality', score: 90, category: 'GEAR GUIDE' },
    { id: 's3', title: 'How to batch 10 reels in 2 hours', score: 96, category: 'BATCHING' },
    { id: 's4', title: 'Why 90% of creators quit in month 2', score: 92, category: 'MINDSET' },
  ]);

  const [completionData, setCompletionData] = useState({
    title: 'Strategy Workflow Built!',
    subtitle: 'Generated full 3-phase production plan ready for Script Builder.',
    badgeText: '✨ STRATEGY COMPLETE',
    xpEarned: 50,
    speechBubble: 'High upside strategy locked! Ready to script the viral hook! 🚀',
  });

  const flameFloatY = useRef(new Animated.Value(0)).current;
  const modalPopScale = useRef(new Animated.Value(0.88)).current;

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
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

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

  const handleSelectIdea = (ideaTitle: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (onUseIdea) {
      onUseIdea(ideaTitle);
    } else {
      showToast(`Selected: "${ideaTitle}"`);
    }
  };

  const handleBuildWorkflow = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCompletionData({
      title: 'Complete Workflow Built!',
      subtitle: `Loaded "${ideas[0].title}" into your automated production pipeline.`,
      badgeText: '✨ WORKFLOW READY',
      xpEarned: 50,
      speechBubble: 'Complete workflow loaded! Let’s film this master! 🎬',
    });
    setShowCompletionModal(true);
  };

  const handleGenerateMore = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    showToast('✨ Jarvis synthesized 4 new high-upside ideas!');
    setIdeas([
      {
        id: 'i3',
        category: 'VIRAL',
        badgeEmoji: '🔥',
        score: 95,
        title: 'The single iPhone camera toggle you forgot to turn on',
        bestFor: 'Viral Views',
        audienceFit: 97,
        virality: 95,
      },
      {
        id: 'i4',
        category: 'AUTHORITY',
        badgeEmoji: '⚡',
        score: 92,
        title: 'Why posting every day is actually holding you back',
        bestFor: 'Contrarian Debate',
        audienceFit: 94,
        virality: 89,
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* TOAST BANNER */}
        <BrandToast message={toastMessage} />

        {/* 1. TOP HEADER BAR */}
        <View style={styles.headerBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Back Button */}
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
                <Path
                  d="M15 18L9 12L15 6"
                  stroke="#171420"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

            {/* Mascot */}
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

            {/* Mode Switcher Pill */}
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
                <Text style={styles.proHeaderBadgeText}>🔥 PRO</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Right Header */}
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
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
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

            {/* Profile Avatar with Verified Ring */}
            <Pressable
              onPress={() => {
                triggerModalPop();
                setShowProfileModal(true);
              }}
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

        {/* 2. SCROLLABLE CONTENT */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* HERO TITLES & BADGES */}
          <View style={styles.topTitlesSection}>
            <View style={styles.goldStrategyBadge}>
              <Text style={styles.goldStrategyBadgeText}>PRO STRATEGY</Text>
            </View>

            <Text style={styles.mainTitleText}>Find the idea with the strongest upside.</Text>
            <Text style={styles.mainSubText}>
              Generate and score ideas by niche, platform, audience goal, streak impact, brand fit, and collaboration potential.
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <View style={styles.purplePill}>
                <Text style={styles.purplePillText}>Pro Strategy Tool</Text>
              </View>
              <View style={styles.goldPill}>
                <Text style={styles.goldPillText}>AI Scored</Text>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 1: STRATEGY SETUP                                    */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRowBetween}>
            <Text style={styles.sectionHeaderTitle}>STRATEGY SETUP</Text>
            <Pressable
              onPress={() => {
                triggerModalPop();
                setShowEditStrategyModal(true);
              }}
              hitSlop={8}
            >
              <Text style={styles.editAllLink}>EDIT ALL</Text>
            </Pressable>
          </View>

          <View style={styles.strategySetupCard}>
            {/* Niche */}
            <Text style={styles.setupFieldLabel}>NICHE</Text>
            <View style={styles.pillRow}>
              {['Creator Education', 'Lifestyle', 'Business'].map((niche) => (
                <Pressable
                  key={niche}
                  style={[
                    styles.setupOptionPill,
                    selectedNiche === niche && styles.setupOptionPillActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedNiche(niche);
                  }}
                >
                  <Text
                    style={[
                      styles.setupOptionText,
                      selectedNiche === niche && styles.setupOptionTextActive,
                    ]}
                  >
                    {niche}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Audience Goal */}
            <Text style={[styles.setupFieldLabel, { marginTop: 12 }]}>AUDIENCE GOAL</Text>
            <View style={styles.pillRow}>
              {['Grow engagement', 'Protect streak'].map((goal) => (
                <Pressable
                  key={goal}
                  style={[
                    styles.setupOptionPill,
                    selectedGoal === goal && styles.setupOptionPillActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedGoal(goal);
                  }}
                >
                  <Text
                    style={[
                      styles.setupOptionText,
                      selectedGoal === goal && styles.setupOptionTextActive,
                    ]}
                  >
                    {goal}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Audience Question Seed */}
            <Text style={[styles.setupFieldLabel, { marginTop: 12 }]}>AUDIENCE QUESTION / SEED</Text>
            <View style={styles.promptBubbleBox}>
              <Text style={styles.promptBubbleText}>
                &ldquo;{audiencePrompt}&rdquo;
              </Text>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 2: HIGHEST QUALITY SCORE CARD                        */}
          {/* ============================================================ */}
          <View style={styles.scoreHighlightCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={styles.scoreCardLabel}>IDEA QUALITY SCORE</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
                  <Text style={styles.scoreBigNumber}>91</Text>
                  <Text style={styles.scoreDenominator}> / 100</Text>
                </View>
                <View style={styles.proPickBadge}>
                  <Text style={styles.proPickBadgeText}>👉 Strong Pro Pick</Text>
                </View>
              </View>

              <View style={styles.sparkleCircle}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
                    fill="#582CDB"
                  />
                </Svg>
              </View>
            </View>

            {/* Dual Meter Bars */}
            <View style={{ flexDirection: 'row', gap: 14, marginTop: 14 }}>
              {/* Audience Fit */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.meterLabel}>AUDIENCE FIT</Text>
                  <Text style={styles.meterValText}>94%</Text>
                </View>
                <View style={styles.meterTrack}>
                  <View style={[styles.meterFill, { width: '94%', backgroundColor: '#582CDB' }]} />
                </View>
              </View>

              {/* Virality */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.meterLabel}>VIRALITY</Text>
                  <Text style={styles.meterValText}>88%</Text>
                </View>
                <View style={styles.meterTrack}>
                  <View style={[styles.meterFill, { width: '88%', backgroundColor: '#F59E0B' }]} />
                </View>
              </View>
            </View>

            {/* Insight Callout Box */}
            <View style={styles.insightCalloutBox}>
              <Text style={{ fontSize: 14, marginRight: 6 }}>📍</Text>
              <Text style={styles.insightCalloutText}>
                &ldquo;The contrarian angle has a 1.4x higher bookmark rate in your niche/format.&rdquo;
              </Text>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 3: TOP SCORED RECOMMENDATIONS                        */}
          {/* ============================================================ */}
          <View style={[styles.sectionHeaderRowBetween, { marginTop: 22 }]}>
            <Text style={styles.sectionHeaderTitle}>TOP SCORED RECOMMENDATIONS</Text>
            <Text style={styles.totalGeneratedText}>{ideas.length} TOTAL GENERATED</Text>
          </View>

          <View style={{ gap: 10, marginTop: 4 }}>
            {ideas.map((idea) => (
              <View key={idea.id} style={styles.recommendedIdeaCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View
                    style={[
                      styles.categoryTagPill,
                      idea.category === 'STREAK-SAVER' ? styles.tagStreakSaver : styles.tagGrowth,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryTagText,
                        idea.category === 'STREAK-SAVER' ? styles.tagTextStreakSaver : styles.tagTextGrowth,
                      ]}
                    >
                      {idea.category}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.ideaScoreVal}>{idea.score}</Text>
                    <Text style={{ fontSize: 14 }}>{idea.badgeEmoji}</Text>
                  </View>
                </View>

                <Text style={styles.ideaMainHeadline}>&ldquo;{idea.title}&rdquo;</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <View style={styles.bestForPill}>
                    <Text style={styles.bestForText}>Best for: {idea.bestFor}</Text>
                  </View>

                  <Pressable
                    style={({ pressed }) => [styles.arrowCircleBtn, pressed && styles.btnPressed]}
                    onPress={() => handleSelectIdea(idea.title)}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path d="M5 12h14M12 5l7 7-7 7" stroke="#582CDB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          {/* ============================================================ */}
          {/* SECTION 4: COMPACT COMPARISON                                */}
          {/* ============================================================ */}
          <View style={[styles.sectionHeaderRowBetween, { marginTop: 22 }]}>
            <Text style={styles.sectionHeaderTitle}>COMPACT COMPARISON</Text>
          </View>

          <View style={styles.compactTableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeadCol, { flex: 2 }]}>IDEA</Text>
              <Text style={[styles.tableHeadCol, { flex: 1.2, textAlign: 'center' }]}>BEST FOR</Text>
              <Text style={[styles.tableHeadCol, { flex: 0.8, textAlign: 'right' }]}>SCORE</Text>
            </View>

            <View style={styles.tableBodyRow}>
              <Text style={[styles.tableItemTitle, { flex: 2 }]} numberOfLines={1}>
                1. Habit Habit: habit
              </Text>
              <View style={{ flex: 1.2, alignItems: 'center' }}>
                <View style={styles.tableTagGold}>
                  <Text style={styles.tableTagGoldText}>Reach</Text>
                </View>
              </View>
              <Text style={[styles.tableScoreVal, { flex: 0.8, textAlign: 'right' }]}>93</Text>
            </View>

            <View style={[styles.tableBodyRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.tableItemTitle, { flex: 2 }]} numberOfLines={1}>
                2. 3 Mistakes
              </Text>
              <View style={{ flex: 1.2, alignItems: 'center' }}>
                <View style={styles.tableTagPurple}>
                  <Text style={styles.tableTagPurpleText}>Growth</Text>
                </View>
              </View>
              <Text style={[styles.tableScoreVal, { flex: 0.8, textAlign: 'right' }]}>89</Text>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 5: JARVIS INTELLIGENCE CARD                          */}
          {/* ============================================================ */}
          <LinearGradient
            colors={['#EDE9FE', '#DDD6FE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.jarvisIntelligenceCard}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.jarvisGhostIconBox}>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={{ width: 28, height: 28 }}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.jarvisIntelTitle}>Jarvis Intelligence</Text>
                <Text style={styles.jarvisIntelSub}>ACTIVE STRATEGY ENGINE</Text>
              </View>
            </View>

            <Text style={styles.jarvisIntelQuote}>
              &ldquo;Start with the <Text style={{ fontWeight: '700', color: '#582CDB' }}>Growth Idea</Text> if you want stronger saves and authority. Choose the <Text style={{ fontWeight: '700', color: '#D97706' }}>Streak-Saver Idea</Text> if your main goal is to protect today&apos;s streak quickly.&rdquo;
            </Text>

            <Pressable
              style={({ pressed }) => [styles.jarvisBuildWorkflowBtn, pressed && styles.btnPressed]}
              onPress={handleBuildWorkflow}
            >
              <Text style={styles.jarvisBuildWorkflowBtnText}>
                Build Recommended Workflow
              </Text>
            </Pressable>
          </LinearGradient>

          {/* ============================================================ */}
          {/* SECTION 6: SAVED PRO IDEAS                                   */}
          {/* ============================================================ */}
          <View style={[styles.sectionHeaderRowBetween, { marginTop: 22 }]}>
            <Text style={styles.sectionHeaderTitle}>SAVED PRO IDEAS</Text>
            <Pressable
              onPress={() => {
                triggerModalPop();
                setShowSavedIdeasModal(true);
              }}
              hitSlop={8}
            >
              <Text style={styles.editAllLink}>VIEW ALL ➔</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, marginTop: 4, paddingBottom: 6 }}
          >
            {savedIdeas.slice(0, 2).map((item) => (
              <Pressable
                key={item.id}
                style={styles.savedIdeaCardHorizontal}
                onPress={() => handleSelectIdea(item.title)}
              >
                <Text style={styles.savedIdeaTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <View style={styles.savedScorePill}>
                    <Text style={styles.savedScorePillText}>{item.score} SCORE</Text>
                  </View>
                  <Text style={{ fontSize: 14 }}>🔖</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          {/* ============================================================ */}
          {/* BOTTOM ACTION BUTTONS                                        */}
          {/* ============================================================ */}
          <View style={{ gap: 10, marginTop: 20 }}>
            <Pressable
              style={({ pressed }) => [styles.buildCompleteWorkflowBtn, pressed && styles.btnPressed]}
              onPress={handleBuildWorkflow}
            >
              <Text style={styles.buildCompleteWorkflowBtnText}>Build Complete Workflow</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.generateMoreBtn, pressed && styles.btnPressed]}
              onPress={handleGenerateMore}
            >
              <Text style={styles.generateMoreBtnText}>Generate More Ideas</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.backToCreateLinkBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onNavigateTab) {
                  onNavigateTab('create');
                } else {
                  onBack();
                }
              }}
              hitSlop={8}
            >
              <Text style={styles.backToCreateLinkText}>BACK TO CREATE HUB</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* 3. FLOATING TAB BAR */}
        <FloatingTabBar
          activeTab={activeTab}
          onTabPress={(tab) => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setActiveTab(tab);
            if (onNavigateTab) onNavigateTab(tab);
          }}
        />

        {/* EDIT STRATEGY MODAL */}
        <Modal
          visible={showEditStrategyModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowEditStrategyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderBetween}>
                <Text style={styles.modalTitle}>Edit Strategy Setup</Text>
                <Pressable onPress={() => setShowEditStrategyModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
                Customize your niche and audience seed prompt to steer the AI generator.
              </Text>

              <Text style={styles.setupFieldLabel}>AUDIENCE SEED PROMPT</Text>
              <TextInput
                style={styles.modalTextInput}
                multiline
                value={audiencePrompt}
                onChangeText={setAudiencePrompt}
                placeholder="What creator topic should we explore?"
              />

              <Pressable
                style={({ pressed }) => [styles.modalSaveBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  setShowEditStrategyModal(false);
                  setCompletionData({
                    title: 'Strategy Saved & Re-scored!',
                    subtitle: `AI calibrated your new prompt: "${audiencePrompt.slice(0, 45)}..."`,
                    badgeText: '✨ 94 QUALITY SCORE RE-CALIBRATED',
                    xpEarned: 50,
                    speechBubble: 'Strategy locked and re-scored, Pablo! Fresh viral angles ready! 🔥',
                  });
                  setTimeout(() => {
                    setShowCompletionModal(true);
                  }, 200);
                }}
              >
                <Text style={styles.modalSaveBtnText}>Save &amp; Re-score Ideas</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* SAVED IDEAS MODAL */}
        <Modal
          visible={showSavedIdeasModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSavedIdeasModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderBetween}>
                <Text style={styles.modalTitle}>Saved Pro Ideas ({savedIdeas.length})</Text>
                <Pressable onPress={() => setShowSavedIdeasModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 8, marginVertical: 12 }}>
                {savedIdeas.map((idea) => (
                  <Pressable
                    key={idea.id}
                    style={styles.savedModalItem}
                    onPress={() => {
                      setShowSavedIdeasModal(false);
                      handleSelectIdea(idea.title);
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#171420', flex: 1, marginRight: 8 }}>
                        {idea.title}
                      </Text>
                      <View style={styles.savedScorePill}>
                        <Text style={styles.savedScorePillText}>{idea.score} SCORE</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>

              <Pressable style={styles.modalCancelBtn} onPress={() => setShowSavedIdeasModal(false)}>
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* USER PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={(updated) => {
            if (onSaveProfile) onSaveProfile(updated);
          }}
        />

        {/* NOTIFICATIONS MODAL */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderBetween}>
                <Text style={styles.modalTitle}>Strategy Alerts</Text>
                <Pressable onPress={() => setShowNotificationModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>
              <View style={{ gap: 8, marginVertical: 12 }}>
                <View style={styles.savedModalItem}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#171420' }}>
                    🔥 Peak Upside Window
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    Contrarian hooks have 1.4x higher bookmark conversion today.
                  </Text>
                </View>
              </View>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* 3D GHOST CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCompletionModal}
          onDismiss={() => setShowCompletionModal(false)}
          title={completionData.title}
          subtitle={completionData.subtitle}
          badgeText={completionData.badgeText}
          xpEarned={completionData.xpEarned}
          speechBubble={completionData.speechBubble}
        />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerLogoWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    width: 26,
    height: 26,
  },
  proHeaderBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  proHeaderBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0C0A12',
    letterSpacing: 0.3,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
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
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  profileAvatarWrapper: {
    width: 38,
    height: 38,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    position: 'relative',
  },
  headerUserAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarTinyGoldCheckPos: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  topTitlesSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  goldStrategyBadge: {
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
    marginBottom: 8,
  },
  goldStrategyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  mainTitleText: {
    fontSize: 23,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.5,
  },
  mainSubText: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  },
  purplePill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  purplePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  goldPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  goldPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },

  // SECTION 1: STRATEGY SETUP
  sectionHeaderRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  editAllLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  strategySetupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    marginBottom: 16,
  },
  setupFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  setupOptionPill: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  setupOptionPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  setupOptionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  setupOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  promptBubbleBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  promptBubbleText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // SECTION 2: HIGHEST QUALITY SCORE CARD
  scoreHighlightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  scoreCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  scoreBigNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -1,
  },
  scoreDenominator: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
  },
  proPickBadge: {
    marginTop: 2,
  },
  proPickBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  sparkleCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  meterValText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171420',
  },
  meterTrack: {
    height: 6,
    backgroundColor: '#F1EFE9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightCalloutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  insightCalloutText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    flex: 1,
    fontStyle: 'italic',
  },

  // SECTION 3: TOP SCORED RECOMMENDATIONS
  totalGeneratedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  recommendedIdeaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  categoryTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagStreakSaver: {
    backgroundColor: '#FEF3C7',
  },
  tagGrowth: {
    backgroundColor: '#EDE9FE',
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tagTextStreakSaver: {
    color: '#D97706',
  },
  tagTextGrowth: {
    color: '#582CDB',
  },
  ideaScoreVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  ideaMainHeadline: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 21,
    marginTop: 8,
  },
  bestForPill: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  bestForText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  arrowCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // SECTION 4: COMPACT COMPARISON
  compactTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EFE9',
  },
  tableHeadCol: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F5',
  },
  tableItemTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
  },
  tableTagGold: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tableTagGoldText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
  tableTagPurple: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tableTagPurpleText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
  },
  tableScoreVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#582CDB',
  },

  // SECTION 5: JARVIS INTELLIGENCE CARD
  jarvisIntelligenceCard: {
    borderRadius: 22,
    padding: 18,
    marginTop: 20,
  },
  jarvisGhostIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisIntelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  jarvisIntelSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.4,
  },
  jarvisIntelQuote: {
    fontSize: 12.5,
    color: '#171420',
    lineHeight: 18,
    marginVertical: 14,
  },
  jarvisBuildWorkflowBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  jarvisBuildWorkflowBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // SECTION 6: SAVED PRO IDEAS
  savedIdeaCardHorizontal: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  savedIdeaTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 17,
  },
  savedScorePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  savedScorePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },

  // BOTTOM ACTIONS
  buildCompleteWorkflowBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  buildCompleteWorkflowBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  generateMoreBtn: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  generateMoreBtnText: {
    color: '#171420',
    fontSize: 13,
    fontWeight: '700',
  },
  backToCreateLinkBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backToCreateLinkText: {
    color: '#582CDB',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 10, 30, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
  },
  modalHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '700',
  },
  modalTextInput: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 12,
    fontSize: 12.5,
    color: '#171420',
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 4,
    marginBottom: 16,
  },
  modalSaveBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  savedModalItem: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
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
    zIndex: 999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
