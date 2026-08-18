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
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';

// AUTHENTIC BRAND SVG ICONS
const TikTokSvg = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19.321 5.562a5.122 5.122 0 0 1-3.585-1.446 5.14 5.14 0 0 1-1.486-3.616H10.5v15.025a3.25 3.25 0 1 1-3.25-3.25 3.2 3.2 0 0 1 1.25.253V8.75a6.975 6.975 0 0 0-1.25-.113 7 7 0 1 0 7 7V9.22a8.775 8.775 0 0 0 5.071 1.595V7.065a5.16 5.16 0 0 1-2.45-.653 5.13 5.13 0 0 1-1.3-.85z"
      fill="#000000"
    />
  </Svg>
);

const InstagramSvg = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="#E1306C" strokeWidth="2.2" />
    <Circle cx="12" cy="12" r="4.5" stroke="#E1306C" strokeWidth="2.2" />
    <Circle cx="17.5" cy="6.5" r="1.2" fill="#E1306C" />
  </Svg>
);

const YouTubeSvg = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.582 6.186a2.75 2.75 0 0 0-1.934-1.946C17.942 3.75 12 3.75 12 3.75s-5.942 0-7.648.49a2.75 2.75 0 0 0-1.934 1.946C1.928 7.892 1.928 12 1.928 12s0 4.108.49 5.814a2.75 2.75 0 0 0 1.934 1.946c1.706.49 7.648.49 7.648.49s5.942 0 7.648-.49a2.75 2.75 0 0 0 1.934-1.946c.49-1.706.49-5.814.49-5.814s0-4.108-.49-5.814z"
      fill="#FF0000"
    />
    <Path d="M9.75 15.02V8.98L15 12l-5.25 3.02z" fill="#FFFFFF" />
  </Svg>
);

const XSvg = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill="#000000"
    />
  </Svg>
);

interface EarningsScreenProps {
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenMessages?: () => void;
  onOpenSchedule?: () => void;
  onOpenQuests?: () => void;
  onOpenReadiness?: () => void;
  onOpenPlatforms?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  onLogout?: () => void;
}

export const EarningsScreen: React.FC<EarningsScreenProps> = ({
  onBack,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenMessages,
  onOpenSchedule,
  onOpenQuests,
  onOpenReadiness,
  onOpenPlatforms,
  userProfile,
  onSaveProfile,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('growth');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animations
  const modalPopScale = useRef(new Animated.Value(0.88)).current;
  const flameFloatY = useRef(new Animated.Value(0)).current;

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
    return () => flameLoop.stop();
  }, [flameFloatY]);

  const showToast = (msg: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
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

  const handleTabPress = (tab: TabType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* TOAST BANNER */}
        {toastMessage && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        {/* 1. TOP AIRY HEADER BAR */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onBack();
              }}
              hitSlop={8}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 12H5M12 19l-7-7 7-7"
                  stroke="#171420"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

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
          </View>

          <View style={styles.headerRight}>
            {/* Message Bubble Icon */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenMessages) {
                  onOpenMessages();
                } else if (onNavigateTab) {
                  onNavigateTab('match');
                }
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

            {/* Notification Bell Icon */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
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

            {/* User Profile Avatar */}
            <Pressable
              style={({ pressed }) => [styles.headerProfileBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalPop();
                setShowProfileModal(true);
              }}
              hitSlop={8}
            >
              <Image
                source={userProfile?.avatarSource || require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerProfileImg}
                resizeMode="cover"
              />
            </Pressable>
          </View>
        </View>

        {/* 2. SCROLLABLE CONTENT */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO SECTION TITLE */}
          <View style={styles.badgePillRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>EARNINGS</Text>
            </View>
            <View style={styles.freeTierPill}>
              <Text style={styles.freeTierPillText}>Free Tier</Text>
            </View>
          </View>

          <Text style={styles.mainTitle}>Build your creator income path.</Text>
          <Text style={styles.mainSubtitle}>
            Track your readiness, grow your creator profile, and unlock future opportunities.
          </Text>

          {/* CARD 1: CURRENT BALANCE & READINESS */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceTopRow}>
              <View>
                <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
                <Text style={styles.balanceNumber}>$0.00</Text>
              </View>
              <View style={styles.walletIconCircle}>
                <Text style={{ fontSize: 20 }}>💰</Text>
              </View>
            </View>

            {/* Opportunity Readiness Progress Bar */}
            <View style={styles.readinessHeaderRow}>
              <Text style={styles.readinessLabel}>Opportunity Readiness</Text>
              <Text style={styles.readinessPercent}>35%</Text>
            </View>

            <View style={styles.readinessTrack}>
              <View style={[styles.readinessFill, { width: '35%' }]} />
            </View>

            {/* Readiness Checklist */}
            <View style={styles.readinessChecklist}>
              <View style={styles.checkItem}>
                <Text style={styles.checkIconActive}>✓</Text>
                <Text style={styles.checkTextActive}>Creator profile added</Text>
              </View>
              <View style={styles.checkItem}>
                <Text style={styles.checkIconActive}>✓</Text>
                <Text style={styles.checkTextActive}>47-day streak active 🔥</Text>
              </View>
              <View style={styles.checkItem}>
                <Text style={styles.checkIconPending}>○</Text>
                <Text style={styles.checkTextPending}>1 of 3 starter quests completed</Text>
              </View>
            </View>

            {/* Primary Action Button */}
            <Pressable
              style={({ pressed }) => [styles.improveBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenReadiness) {
                  onOpenReadiness();
                } else if (onOpenQuests) {
                  onOpenQuests();
                } else if (onNavigateTab) {
                  onNavigateTab('quests');
                }
              }}
            >
              <Text style={styles.improveBtnText}>Improve Readiness</Text>
            </Pressable>
          </View>

          {/* CARD 2: CONNECTED PLATFORMS PREVIEW */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Connected Platforms Preview</Text>
            <View style={styles.previewOnlyPill}>
              <Text style={styles.previewOnlyPillText}>PREVIEW ONLY</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtext}>
            Connect platforms to prepare for future earnings tracking.
          </Text>

          {/* Platform Pills Grid */}
          <View style={styles.platformsPillGrid}>
            <View style={styles.platformPillItem}>
              <TikTokSvg size={14} />
              <Text style={styles.platformPillText}>TikTok</Text>
              <View style={styles.activeDot} />
            </View>
            <View style={styles.platformPillItem}>
              <InstagramSvg size={14} />
              <Text style={styles.platformPillText}>Instagram</Text>
              <View style={styles.activeDot} />
            </View>
            <View style={styles.platformPillItem}>
              <YouTubeSvg size={14} />
              <Text style={styles.platformPillText}>YouTube</Text>
              <View style={styles.activeDot} />
            </View>
            <View style={styles.platformPillItem}>
              <XSvg size={13} />
              <Text style={styles.platformPillText}>X</Text>
              <View style={styles.activeDot} />
            </View>
          </View>

          {/* Estimated Tracked Earnings Card with Metallic Gold Unlock Button */}
          <View style={styles.estimatedCard}>
            <View style={styles.estimatedHeaderRow}>
              <Text style={styles.estimatedLabel}>Estimated tracked earnings</Text>
              <Text style={styles.estimatedAmount}>$1,420.50</Text>
            </View>

            <View style={styles.estimatedBullets}>
              <View style={styles.estimatedBulletRow}>
                <Text style={{ fontSize: 11 }}>🔒</Text>
                <Text style={styles.estimatedBulletText}>Platform breakdown: Pro feature</Text>
              </View>
              <View style={styles.estimatedBulletRow}>
                <Text style={{ fontSize: 11 }}>🔒</Text>
                <Text style={styles.estimatedBulletText}>Monthly platform insights: Pro feature</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.unlockTrackingBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenJarvisPro) {
                  onOpenJarvisPro();
                } else {
                  showToast('Jarvis Pro tracking enabled!');
                }
              }}
            >
              <LinearGradient
                colors={['#FDE047', '#EAB308', '#CA8A04', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.unlockTrackingGradient}
              >
                <Text style={styles.unlockTrackingBtnText}>Unlock Tracking ➔</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* CARD 3: UNLOCK YOUR FIRST OPPORTUNITIES */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Unlock your first opportunities</Text>
          </View>

          <View style={styles.opportunityCardsRow}>
            {/* Quest Opportunity */}
            <View style={styles.oppCard}>
              <View style={styles.oppTopRow}>
                <Text style={{ fontSize: 20 }}>📜</Text>
                <View style={styles.oppXpBadge}>
                  <Text style={styles.oppXpBadgeText}>+500 XP</Text>
                </View>
              </View>
              <Text style={styles.oppTitle}>Complete 3 starter quests</Text>
              <Text style={styles.oppSub}>1 of 3 completed</Text>

              <Pressable
                style={({ pressed }) => [styles.oppGhostBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  if (onOpenQuests) {
                    onOpenQuests();
                  } else if (onNavigateTab) {
                    onNavigateTab('quests');
                  }
                }}
              >
                <Text style={styles.oppGhostBtnText}>Continue</Text>
              </Pressable>
            </View>

            {/* Social Account Opportunity */}
            <View style={styles.oppCard}>
              <View style={styles.oppTopRow}>
                <Text style={{ fontSize: 20 }}>🔗</Text>
                <View style={styles.oppXpBadge}>
                  <Text style={styles.oppXpBadgeText}>READY</Text>
                </View>
              </View>
              <Text style={styles.oppTitle}>Connect one extra account</Text>
              <Text style={styles.oppSub}>Improve matching score</Text>

              <Pressable
                style={({ pressed }) => [styles.oppPurpleBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  if (onOpenPlatforms) {
                    onOpenPlatforms();
                  } else {
                    showToast('Opening social platforms sync...');
                  }
                }}
              >
                <Text style={styles.oppPurpleBtnText}>Connect Now</Text>
              </Pressable>
            </View>
          </View>

          {/* CARD 4: CREATOR PASSPORT */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Creator Passport</Text>
            <View style={styles.unlockedPill}>
              <Text style={styles.unlockedPillText}>UNLOCKED</Text>
            </View>
          </View>

          <View style={styles.passportCard}>
            <View style={styles.passportGrid}>
              {/* Profile Completion */}
              <View style={styles.passportGridItem}>
                <View style={styles.passportItemTop}>
                  <Text style={styles.passportItemLabel}>PROFILE COMPLETION</Text>
                  <Text style={{ fontSize: 13 }}>👤</Text>
                </View>
                <Text style={styles.passportItemValue}>70%</Text>
                <View style={styles.miniTrack}>
                  <View style={[styles.miniFill, { width: '70%' }]} />
                </View>
              </View>

              {/* Consistency */}
              <View style={styles.passportGridItem}>
                <View style={styles.passportItemTop}>
                  <Text style={styles.passportItemLabel}>CONSISTENCY</Text>
                  <Text style={{ fontSize: 13 }}>🗓️</Text>
                </View>
                <Text style={[styles.passportItemValue, { color: '#582CDB' }]}>Strong</Text>
                <View style={styles.miniSegmentBar}>
                  <View style={[styles.segmentUnit, { backgroundColor: '#582CDB' }]} />
                  <View style={[styles.segmentUnit, { backgroundColor: '#582CDB' }]} />
                  <View style={[styles.segmentUnit, { backgroundColor: '#582CDB' }]} />
                  <View style={[styles.segmentUnit, { backgroundColor: '#E2E8F0' }]} />
                </View>
              </View>

              {/* Collaboration */}
              <View style={styles.passportGridItem}>
                <View style={styles.passportItemTop}>
                  <Text style={styles.passportItemLabel}>COLLABORATION</Text>
                  <Text style={{ fontSize: 13 }}>🤝</Text>
                </View>
                <Text style={styles.passportItemValue}>Beginner</Text>
                <View style={styles.miniTrack}>
                  <View style={[styles.miniFill, { width: '30%' }]} />
                </View>
              </View>

              {/* Quests */}
              <View style={styles.passportGridItem}>
                <View style={styles.passportItemTop}>
                  <Text style={styles.passportItemLabel}>QUESTS</Text>
                  <Text style={{ fontSize: 13 }}>✨</Text>
                </View>
                <Text style={styles.passportItemValue}>1/3</Text>
                <View style={styles.miniTrack}>
                  <View style={[styles.miniFill, { width: '33%' }]} />
                </View>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.passportViewBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowProfileModal(true);
              }}
            >
              <Text style={styles.passportViewBtnText}>View Passport</Text>
            </Pressable>
          </View>

          {/* CARD 5: STARTER CREATOR CAMPAIGNS */}
          <View style={styles.campaignsCard}>
            <View style={styles.campaignsHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.campaignsTitle}>Starter Creator Campaigns</Text>
                <Text style={styles.campaignsSub}>
                  Build your Creator Passport to qualify for future paid opportunities.
                </Text>
              </View>
              <View style={styles.lockBadgeCircle}>
                <Text style={{ fontSize: 16 }}>🔒</Text>
              </View>
            </View>

            <View style={styles.campaignRequirementsGrid}>
              <View style={styles.reqCol}>
                <View style={styles.reqItem}>
                  <Text style={styles.reqCheckActive}>✓</Text>
                  <Text style={styles.reqTextActive}>7-day streak</Text>
                </View>
                <View style={styles.reqItem}>
                  <Text style={styles.reqCheckActive}>✓</Text>
                  <Text style={styles.reqTextActive}>Complete Passport</Text>
                </View>
              </View>

              <View style={styles.reqCol}>
                <View style={styles.reqItem}>
                  <Text style={styles.reqCheckPending}>🕒</Text>
                  <Text style={styles.reqTextPending}>Add social account</Text>
                </View>
                <View style={styles.reqItem}>
                  <Text style={styles.reqCheckPending}>🕒</Text>
                  <Text style={styles.reqTextPending}>Finish 3 quests</Text>
                </View>
              </View>
            </View>

            <View style={styles.campaignStatusRow}>
              <Text style={styles.campaignStatusText}>○ Status: Not unlocked yet</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.viewRequirementsBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                setShowRequirementsModal(true);
              }}
            >
              <Text style={styles.viewRequirementsBtnText}>View Requirements</Text>
            </Pressable>
          </View>

          {/* CARD 6: STARTER GOAL ($50 GOAL) */}
          <View style={styles.goalCard}>
            <Text style={styles.goalTag}>STARTER GOAL</Text>
            <Text style={styles.goalTitle}>First $50 Goal</Text>

            <View style={styles.goalTrack}>
              <View style={[styles.goalFill, { width: '8%' }]} />
            </View>
            <Text style={styles.goalPercent}>0%</Text>

            <Text style={styles.goalStepsFlow}>
              PROFILE • STREAK • QUESTS • APPLY
            </Text>

            <Pressable
              style={({ pressed }) => [styles.setGoalBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                setShowGoalModal(true);
              }}
            >
              <Text style={styles.setGoalBtnText}>Set Goal</Text>
            </Pressable>
          </View>

          {/* CARD 7: PRO EARNINGS TOOLS (SIGNATURE METALLIC GOLD) */}
          <View style={styles.proToolsCard}>
            <View style={styles.proToolsHeaderRow}>
              <Text style={styles.proToolsTitle}>Pro Earnings Tools</Text>
              <Text style={{ fontSize: 22 }}>🚀</Text>
            </View>
            <Text style={styles.proToolsSub}>
              Scale your business with professional utilities.
            </Text>

            <View style={styles.proFeaturesList}>
              <View style={styles.proFeatureRow}>
                <Text style={{ fontSize: 13 }}>📈</Text>
                <Text style={styles.proFeatureText}>Platform earnings tracking</Text>
              </View>
              <View style={styles.proFeatureRow}>
                <Text style={{ fontSize: 13 }}>📊</Text>
                <Text style={styles.proFeatureText}>Earnings breakdown by app</Text>
              </View>
              <View style={styles.proFeatureRow}>
                <Text style={{ fontSize: 13 }}>📄</Text>
                <Text style={styles.proFeatureText}>Media Kit Builder</Text>
              </View>
              <View style={styles.proFeatureRow}>
                <Text style={{ fontSize: 13 }}>💳</Text>
                <Text style={styles.proFeatureText}>Rate Card Generator</Text>
              </View>
              <View style={styles.proFeatureRow}>
                <Text style={{ fontSize: 13 }}>🛡️</Text>
                <Text style={styles.proFeatureText}>Advanced Creator Passport</Text>
              </View>
              <View style={styles.proFeatureRow}>
                <Text style={{ fontSize: 13 }}>🔍</Text>
                <Text style={styles.proFeatureText}>Opportunity matching insights</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.exploreProBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenJarvisPro) {
                  onOpenJarvisPro();
                } else {
                  showToast('Exploring Jarvis Pro features...');
                }
              }}
            >
              <LinearGradient
                colors={['#FDE047', '#EAB308', '#CA8A04', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.exploreProGradient}
              >
                <Text style={styles.exploreProBtnText}>Explore Pro</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* CARD 8: JARVIS CORE INSIGHT */}
          <View style={styles.jarvisInsightCard}>
            <View style={styles.jarvisAvatarCircle}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.jarvisTag}>JARVIS CORE INSIGHT</Text>
              <Text style={styles.jarvisText}>
                Your streak is strong, but your passport needs campaign proof before bigger opportunities unlock.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* FLOATING LIQUID GLASS TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
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
                  <Text style={styles.modalTitle}>Earnings Alerts</Text>
                  <Text style={styles.modalSubtitle}>Monetization readiness updates</Text>
                </View>
                <Pressable onPress={() => setShowNotificationModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.notifCard}>
                <Text style={{ fontSize: 18 }}>💰</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>Passport Readiness: 35%</Text>
                  <Text style={styles.notifBody}>Complete your next starter quest to unlock $50 campaign matching.</Text>
                </View>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* GOAL MODAL */}
        <Modal
          visible={showGoalModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowGoalModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Set Income Milestone</Text>
                  <Text style={styles.modalSubtitle}>Target: First $50 Creator Earnings</Text>
                </View>
                <Pressable onPress={() => setShowGoalModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.goalCheckRow}>
                <Text style={styles.checkIconActive}>✓</Text>
                <Text style={styles.goalCheckText}>Maintain daily posting streak (47 days)</Text>
              </View>
              <View style={styles.goalCheckRow}>
                <Text style={styles.checkIconActive}>✓</Text>
                <Text style={styles.goalCheckText}>Verify Creator Passport details</Text>
              </View>
              <View style={styles.goalCheckRow}>
                <Text style={styles.checkIconPending}>○</Text>
                <Text style={styles.goalCheckText}>Complete 2 remaining starter quests</Text>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  showToast('✓ Income Milestone Activated!');
                  setShowGoalModal(false);
                }}
              >
                <Text style={styles.modalFullBtnText}>Activate Milestone ✓</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* CAMPAIGN REQUIREMENTS MODAL */}
        <Modal
          visible={showRequirementsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowRequirementsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Campaign Requirements</Text>
                  <Text style={styles.modalSubtitle}>How to qualify for paid brand deals</Text>
                </View>
                <Pressable onPress={() => setShowRequirementsModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 10, marginVertical: 12 }}>
                <View style={styles.reqModalItem}>
                  <Text style={{ fontSize: 16 }}>🔥</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reqModalTitle}>7-Day Streak Active</Text>
                    <Text style={styles.reqModalSub}>Demonstrates consistency to brand sponsors.</Text>
                  </View>
                </View>
                <View style={styles.reqModalItem}>
                  <Text style={{ fontSize: 16 }}>📋</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reqModalTitle}>Creator Passport Verification</Text>
                    <Text style={styles.reqModalSub}>Completes your niche, bio, and target demographic.</Text>
                  </View>
                </View>
                <View style={styles.reqModalItem}>
                  <Text style={{ fontSize: 16 }}>⚡</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reqModalTitle}>3 Starter Quests Completed</Text>
                    <Text style={styles.reqModalSub}>Unlocks your verified creator score.</Text>
                  </View>
                </View>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowRequirementsModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Got It</Text>
              </Pressable>
            </View>
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
    transform: [{ scale: 0.98 }],
  },

  // 1. TOP HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EFEA',
    backgroundColor: '#FAF8F5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerLogoWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGhostLogo: {
    width: 28,
    height: 28,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  headerProfileBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#582CDB',
  },
  headerProfileImg: {
    width: '100%',
    height: '100%',
  },

  // SCROLL CONTENT
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  // HERO
  badgePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  heroPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  freeTierPill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  freeTierPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 18,
  },

  // CARD 1: BALANCE & READINESS
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 18,
    marginBottom: 20,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  balanceNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.8,
  },
  walletIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF9C3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  readinessHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  readinessLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },
  readinessPercent: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#582CDB',
  },
  readinessTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 14,
  },
  readinessFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 4,
  },
  readinessChecklist: {
    gap: 8,
    marginBottom: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkIconActive: {
    fontSize: 13,
    fontWeight: '900',
    color: '#582CDB',
  },
  checkTextActive: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
  },
  checkIconPending: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '800',
  },
  checkTextPending: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  improveBtn: {
    height: 44,
    borderRadius: 14,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  improveBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // CARD 2: CONNECTED PLATFORMS PREVIEW
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.3,
  },
  sectionSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  previewOnlyPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 5,
  },
  previewOnlyPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  platformsPillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  platformPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  platformPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#171420',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#582CDB',
    marginLeft: 2,
  },
  estimatedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 20,
  },
  estimatedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  estimatedLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },
  estimatedAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#582CDB',
  },
  estimatedBullets: {
    gap: 6,
    marginBottom: 14,
  },
  estimatedBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  estimatedBulletText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  unlockTrackingBtn: {
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FDE047',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  unlockTrackingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockTrackingBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#171420',
  },

  // CARD 3: OPPORTUNITIES
  opportunityCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  oppCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  oppTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  oppXpBadge: {
    backgroundColor: '#FEF9C3',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  oppXpBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#A16207',
  },
  oppTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 2,
    lineHeight: 16,
  },
  oppSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
  },
  oppGhostBtn: {
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  oppGhostBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  oppPurpleBtn: {
    height: 34,
    borderRadius: 10,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  oppPurpleBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // CARD 4: PASSPORT
  unlockedPill: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 5,
  },
  unlockedPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 0.3,
  },
  passportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 20,
  },
  passportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  passportGridItem: {
    width: '48.5%',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  passportItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  passportItemLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  passportItemValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 6,
  },
  miniTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 2,
  },
  miniSegmentBar: {
    flexDirection: 'row',
    gap: 3,
    height: 4,
  },
  segmentUnit: {
    flex: 1,
    borderRadius: 2,
  },
  passportViewBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passportViewBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },

  // CARD 5: CAMPAIGNS
  campaignsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 20,
  },
  campaignsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  campaignsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 2,
  },
  campaignsSub: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  lockBadgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  campaignRequirementsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    marginBottom: 12,
  },
  reqCol: {
    flex: 1,
    gap: 6,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqCheckActive: {
    fontSize: 12,
    fontWeight: '900',
    color: '#582CDB',
  },
  reqTextActive: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#171420',
  },
  reqCheckPending: {
    fontSize: 12,
    color: '#94A3B8',
  },
  reqTextPending: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  campaignStatusRow: {
    marginBottom: 12,
  },
  campaignStatusText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '700',
  },
  viewRequirementsBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewRequirementsBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // CARD 6: GOAL CARD
  goalCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 16,
    marginBottom: 20,
  },
  goalTag: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 10,
  },
  goalTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E9D5FF',
    overflow: 'hidden',
    marginBottom: 4,
  },
  goalFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 3,
  },
  goalPercent: {
    fontSize: 10,
    fontWeight: '900',
    color: '#582CDB',
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  goalStepsFlow: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  setGoalBtn: {
    height: 40,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setGoalBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // CARD 7: PRO TOOLS
  proToolsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FEF08A',
    padding: 18,
    marginBottom: 20,
    shadowColor: '#FDE047',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 3,
  },
  proToolsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  proToolsTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
  },
  proToolsSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  proFeaturesList: {
    gap: 8,
    marginBottom: 16,
  },
  proFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proFeatureText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  exploreProBtn: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FDE047',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  exploreProGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreProBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.2,
  },

  // CARD 8: JARVIS INSIGHT
  jarvisInsightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF8F5',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    marginBottom: 20,
  },
  jarvisAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  jarvisTag: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  jarvisText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 24, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 17,
    fontWeight: '900',
    color: '#171420',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
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
    marginVertical: 8,
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
  goalCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  goalCheckText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  reqModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  reqModalTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },
  reqModalSub: {
    fontSize: 11,
    color: '#64748B',
  },
  modalFullBtn: {
    height: 44,
    borderRadius: 14,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  modalFullBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // TOAST
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
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
  },
  toastText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
