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

const LinkedInSvg = ({ size = 18 }: { size?: number }) => (
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

interface OpportunityReadinessScreenProps {
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenMessages?: () => void;
  onOpenSchedule?: () => void;
  onOpenPlatforms?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  onLogout?: () => void;
}

export const OpportunityReadinessScreen: React.FC<OpportunityReadinessScreenProps> = ({
  onBack,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenMessages,
  onOpenSchedule,
  onOpenPlatforms,
  userProfile,
  onSaveProfile,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('growth');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
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
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO SECTION TITLE */}
          <View style={styles.badgePillRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>OPPORTUNITY READINESS</Text>
            </View>
          </View>

          <Text style={styles.mainTitle}>Get ready for creator opportunities.</Text>

          <View style={styles.freePathPillRow}>
            <View style={styles.freePathPill}>
              <View style={styles.yellowDot} />
              <Text style={styles.freePathText}>Free Readiness Path</Text>
            </View>
          </View>

          {/* CARD 1: CURRENT SCORE HERO CARD */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreTopRow}>
              <View>
                <Text style={styles.scoreLabel}>CURRENT SCORE</Text>
                <View style={styles.scoreNumberRow}>
                  <Text style={styles.scoreNumber}>70%</Text>
                  <Text style={styles.scoreStatusText}>Almost Ready</Text>
                </View>
              </View>

              <View style={styles.starCircle}>
                <Text style={{ fontSize: 18 }}>⭐</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.scoreTrack}>
              <View style={[styles.scoreFill, { width: '70%' }]} />
            </View>

            {/* 4-Metric Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricItemLabel}>PROFILE</Text>
                <Text style={styles.metricItemValue}>80%</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricItemLabel}>PLATFORMS</Text>
                <Text style={styles.metricItemValue}>2 Connected</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricItemLabel}>STREAK</Text>
                <Text style={[styles.metricItemValue, { color: '#15803D' }]}>Strong</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricItemLabel}>STARTER CHALLENGE</Text>
                <Text style={styles.metricItemValue}>1/3</Text>
              </View>
            </View>

            {/* Insight Callout Box */}
            <View style={styles.insightBox}>
              <Text style={styles.insightBoxText}>
                <Text style={{ fontWeight: '800', color: '#171420' }}>Insight: </Text>
                Complete your profile and connect one more platform to improve your readiness.
              </Text>
            </View>
          </View>

          {/* CARD 2: READINESS CHECKLIST */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Readiness Checklist</Text>
          </View>

          <View style={styles.checklistContainer}>
            {/* 1. Profile Completion */}
            <View style={styles.checklistCard}>
              <View style={styles.checklistLeft}>
                <View style={[styles.checkIconBox, { backgroundColor: '#FEF9C3' }]}>
                  <Text style={{ fontSize: 14 }}>👤</Text>
                </View>
                <Text style={styles.checkTitle}>Profile Completion</Text>
              </View>
              <View style={styles.inProgressBadge}>
                <Text style={styles.inProgressBadgeText}>IN PROGRESS</Text>
              </View>
            </View>

            {/* 2. 2+ Platforms Connected */}
            <View style={styles.checklistCard}>
              <View style={styles.checklistLeft}>
                <View style={[styles.checkIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={{ fontSize: 14 }}>🌐</Text>
                </View>
                <Text style={styles.checkTitle}>2+ Platforms Connected</Text>
              </View>
              <View style={styles.greenCheckCircle}>
                <Text style={styles.greenCheckText}>✓</Text>
              </View>
            </View>

            {/* 3. Creator Passport */}
            <View style={styles.checklistCard}>
              <View style={styles.checklistLeft}>
                <View style={[styles.checkIconBox, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={{ fontSize: 14 }}>🪪</Text>
                </View>
                <Text style={styles.checkTitle}>Creator Passport</Text>
              </View>
              <View style={styles.inProgressBadge}>
                <Text style={styles.inProgressBadgeText}>IN PROGRESS</Text>
              </View>
            </View>

            {/* 4. 7-day Streak */}
            <View style={styles.checklistCard}>
              <View style={styles.checklistLeft}>
                <View style={[styles.checkIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={{ fontSize: 14 }}>🔥</Text>
                </View>
                <Text style={styles.checkTitle}>7-day Streak</Text>
              </View>
              <View style={styles.greenCheckCircle}>
                <Text style={styles.greenCheckText}>✓</Text>
              </View>
            </View>
          </View>

          {/* CARD 3: PROFILE DETAILS */}
          <View style={styles.profileDetailsCard}>
            <View style={styles.profileDetailsHeader}>
              <View>
                <Text style={styles.profileDetailsTitle}>Profile Details</Text>
                <Text style={styles.profileDetailsSub}>80% complete</Text>
              </View>
              <View style={styles.percentCircleBadge}>
                <Text style={styles.percentCircleText}>80%</Text>
              </View>
            </View>

            {/* Tag Pills */}
            <View style={styles.tagsRow}>
              <View style={styles.tagGreen}>
                <Text style={styles.tagGreenText}>Photo ✓</Text>
              </View>
              <View style={styles.tagGreen}>
                <Text style={styles.tagGreenText}>Bio ✓</Text>
              </View>
              <View style={styles.tagGrey}>
                <Text style={styles.tagGreyText}>Audience Goal ...</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.profileOutlineBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalPop();
                setShowProfileModal(true);
              }}
            >
              <Text style={styles.profileOutlineBtnText}>Complete Profile</Text>
            </Pressable>
          </View>

          {/* CARD 4: CONNECTED PLATFORMS */}
          <View style={styles.platformsCard}>
            <Text style={styles.platformsCardTitle}>Connected Platforms</Text>

            <View style={styles.platformBadgeList}>
              {/* TikTok */}
              <View style={styles.platformBadgeItem}>
                <View style={[styles.platformRoundIcon, { backgroundColor: '#F1F5F9' }]}>
                  <TikTokSvg size={18} />
                </View>
                <Text style={[styles.platformBadgeLabel, { color: '#059669', fontWeight: '800' }]}>TIKTOK</Text>
              </View>

              {/* Instagram */}
              <View style={styles.platformBadgeItem}>
                <View style={[styles.platformRoundIcon, { backgroundColor: '#FDF2F8' }]}>
                  <InstagramSvg size={18} />
                </View>
                <Text style={[styles.platformBadgeLabel, { color: '#059669', fontWeight: '800' }]}>INSTA</Text>
              </View>

              {/* YouTube */}
              <View style={styles.platformBadgeItem}>
                <View style={[styles.platformRoundIcon, { backgroundColor: '#FEF2F2' }]}>
                  <YouTubeSvg size={18} />
                </View>
                <Text style={styles.platformBadgeLabel}>YT</Text>
              </View>

              {/* X */}
              <View style={styles.platformBadgeItem}>
                <View style={[styles.platformRoundIcon, { backgroundColor: '#F8FAFC' }]}>
                  <XSvg size={15} />
                </View>
                <Text style={styles.platformBadgeLabel}>X</Text>
              </View>

              {/* LinkedIn */}
              <View style={styles.platformBadgeItem}>
                <View style={[styles.platformRoundIcon, { backgroundColor: '#EFF6FF' }]}>
                  <LinkedInSvg size={18} />
                </View>
                <Text style={styles.platformBadgeLabel}>LI</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.connectPlatformBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenPlatforms) {
                  onOpenPlatforms();
                } else {
                  showToast('Opening Platforms Hub...');
                }
              }}
            >
              <Text style={styles.connectPlatformBtnText}>Connect Platform</Text>
            </Pressable>
          </View>

          {/* CARD 5: JARVIS INTELLIGENCE */}
          <View style={styles.jarvisCard}>
            <View style={styles.jarvisAvatarCircle}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.jarvisTag}>JARVIS INTELLIGENCE</Text>
              <Text style={styles.jarvisText}>
                &ldquo;You already meet the streak requirement. The fastest way to improve readiness is to complete your profile and connect one more platform.&rdquo;
              </Text>
            </View>
          </View>

          {/* PRIMARY BOTTOM ACTION BUTTON */}
          <Pressable
            style={({ pressed }) => [styles.primaryBottomBtn, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              triggerModalPop();
              setShowProfileModal(true);
            }}
          >
            <Text style={styles.primaryBottomBtnText}>Complete Profile</Text>
          </Pressable>
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
                  <Text style={styles.modalTitle}>Readiness Alerts</Text>
                  <Text style={styles.modalSubtitle}>Campaign matching status</Text>
                </View>
                <Pressable onPress={() => setShowNotificationModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.notifCard}>
                <Text style={{ fontSize: 18 }}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>Score: 70% (Almost Ready)</Text>
                  <Text style={styles.notifBody}>Link 1 more platform to reach 100% and unlock campaign matching.</Text>
                </View>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowNotificationModal(false)}>
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
    marginBottom: 6,
  },
  heroPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#582CDB',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  heroPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  freePathPillRow: {
    marginBottom: 16,
  },
  freePathPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  yellowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EAB308',
  },
  freePathText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
  },

  // CARD 1: SCORE
  scoreCard: {
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
  scoreTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  scoreNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  scoreNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.8,
  },
  scoreStatusText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#B45309',
  },
  starCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FEF9C3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  scoreTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 16,
  },
  scoreFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  metricItem: {
    width: '48.5%',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  metricItemLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  metricItemValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171420',
  },
  insightBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    borderLeftWidth: 3.5,
    borderLeftColor: '#582CDB',
    padding: 12,
  },
  insightBoxText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },

  // CARD 2: CHECKLIST
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.3,
  },
  checklistContainer: {
    gap: 8,
    marginBottom: 20,
  },
  checklistCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  checklistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
  },
  inProgressBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 5,
  },
  inProgressBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  greenCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#15803D',
  },
  greenCheckText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#15803D',
  },

  // CARD 3: PROFILE DETAILS
  profileDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 20,
  },
  profileDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileDetailsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
  },
  profileDetailsSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  percentCircleBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentCircleText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#582CDB',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tagGreen: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  tagGreenText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  tagGrey: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagGreyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  profileOutlineBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileOutlineBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#582CDB',
  },

  // CARD 4: PLATFORMS
  platformsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 20,
  },
  platformsCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 14,
  },
  platformBadgeList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  platformBadgeItem: {
    alignItems: 'center',
    gap: 6,
  },
  platformRoundIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  platformBadgeLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
  },
  connectPlatformBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectPlatformBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#582CDB',
  },

  // CARD 5: JARVIS INTELLIGENCE
  jarvisCard: {
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
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    fontStyle: 'italic',
  },

  // BOTTOM PRIMARY BTN
  primaryBottomBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  primaryBottomBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
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
