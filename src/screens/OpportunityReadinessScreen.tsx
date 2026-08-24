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
  TextInput,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
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

const ThreadsSvg = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 12.8c-.52 2.1-2.24 3.4-4.64 3.4-3.1 0-5.2-2.3-5.2-5.7 0-3.5 2.3-5.8 5.6-5.8 2.9 0 4.9 1.8 5.1 4.5h-2c-.2-1.6-1.3-2.6-3.1-2.6-2 0-3.3 1.5-3.3 3.9 0 2.3 1.2 3.8 3.1 3.8 1.4 0 2.5-.8 2.8-2.2h-2.8v-1.8h4.8v2.5z"
      fill="#000000"
    />
  </Svg>
);

const SnapchatSvg = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12.002 2c-3.57 0-5.76 2.65-5.76 5.28 0 1.2.47 2.37.89 3.09-.3.12-.76.35-1.12.78-.45.54-.34 1.15-.22 1.46.3.77 1.14.93 1.7.97.23.63.78 1.85 2.1 2.23-.97.35-2.62.96-3.4 2.19-.34.54-.15 1.14.34 1.45.62.39 1.63.38 2.76.2 1.34-.21 2.3-.85 2.71-1.15.41.3 1.37.94 2.71 1.15 1.13.18 2.14.19 2.76-.2.49-.31.68-.91.34-1.45-.78-1.23-2.43-1.84-3.4-2.19 1.32-.38 1.87-1.6 2.1-2.23.56-.04 1.4-.2 1.7-.97.12-.31.23-.92-.22-1.46-.36-.43-.82-.66-1.12-.78.42-.72.89-1.89.89-3.09 0-2.63-2.19-5.28-5.76-5.28z"
      fill="#FFFC00"
      stroke="#000000"
      strokeWidth="1.2"
    />
  </Svg>
);

const renderBrandIcon = (id: string, size = 18) => {
  switch (id) {
    case 'tiktok':
      return <TikTokSvg size={size} />;
    case 'instagram':
      return <InstagramSvg size={size} />;
    case 'youtube':
      return <YouTubeSvg size={size} />;
    case 'linkedin':
      return <LinkedInSvg size={size} />;
    case 'x':
    case 'x_twitter':
      return <XSvg size={size} />;
    case 'snapchat':
      return <SnapchatSvg size={size} />;
    case 'threads':
      return <ThreadsSvg size={size} />;
    default:
      return <TikTokSvg size={size} />;
  }
};

interface PlatformAccount {
  id: string;
  name: string;
  handle: string;
  followers: string;
  connected: boolean;
  color: string;
  bgTint: string;
}

const INITIAL_PLATFORMS: PlatformAccount[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@amaracreates',
    followers: '28.4K',
    connected: true,
    color: '#000000',
    bgTint: '#F1F5F9',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@amara.pulse',
    followers: '14.2K',
    connected: true,
    color: '#E1306C',
    bgTint: '#FDF2F8',
  },
  {
    id: 'youtube',
    name: 'YouTube Shorts',
    handle: '@amarashorts',
    followers: '8.9K',
    connected: false,
    color: '#FF0000',
    bgTint: '#FEF2F2',
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    handle: '@amara_builder',
    followers: '4.5K',
    connected: false,
    color: '#000000',
    bgTint: '#F8FAFC',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    handle: 'amara-okafor',
    followers: '6.1K',
    connected: false,
    color: '#0A66C2',
    bgTint: '#EFF6FF',
  },
  {
    id: 'threads',
    name: 'Threads',
    handle: '@amara.threads',
    followers: '3.2K',
    connected: false,
    color: '#000000',
    bgTint: '#F8FAFC',
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    handle: '@amarasnaps',
    followers: '5.8K',
    connected: false,
    color: '#EAB308',
    bgTint: '#FEFCE8',
  },
];

interface OpportunityReadinessScreenProps {
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenMessages?: () => void;
  onOpenSchedule?: () => void;
  onOpenPlatforms?: () => void;
  onOpenCreatorPassport?: () => void;
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
  onOpenCreatorPassport,
  userProfile,
  onSaveProfile,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('growth');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showConnectPlatformModal, setShowConnectPlatformModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Platform Management State
  const [platformsList, setPlatformsList] = useState<PlatformAccount[]>(INITIAL_PLATFORMS);
  const [selectedPlatformToAdd, setSelectedPlatformToAdd] = useState<string>('youtube');
  const [customHandleInput, setCustomHandleInput] = useState<string>('');

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

  // Platform Connect/Disconnect Handlers
  const handleConnectSinglePlatform = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPlatformsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, connected: true } : p))
    );
    const target = platformsList.find((p) => p.id === id);
    showToast(`✓ ${target?.name || 'Platform'} connected & auto-synced!`);
  };

  const handleRemoveSinglePlatform = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPlatformsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, connected: false } : p))
    );
    const target = platformsList.find((p) => p.id === id);
    showToast(`Removed ${target?.name || 'Platform'}`);
  };

  const handleAddCustomPlatform = () => {
    if (!customHandleInput.trim()) {
      showToast('Please enter a creator username');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const formatted = customHandleInput.startsWith('@') ? customHandleInput : `@${customHandleInput}`;
    setPlatformsList((prev) =>
      prev.map((p) =>
        p.id === selectedPlatformToAdd
          ? { ...p, connected: true, handle: formatted }
          : p
      )
    );
    const target = platformsList.find((p) => p.id === selectedPlatformToAdd);
    setCustomHandleInput('');
    showToast(`✓ Linked ${target?.name} account (${formatted})!`);
  };

  const connectedCount = platformsList.filter((p) => p.connected).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* TOAST BANNER */}
        <BrandToast message={toastMessage} />

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
                source={userProfile?.avatarSource || require('../../assets/images/jarvis-core-flame.png')}
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
              <View style={[styles.scoreFill, { width: `${Math.min(100, 50 + connectedCount * 10)}%` }]} />
            </View>

            {/* 4-Metric Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricItemLabel}>PROFILE</Text>
                <Text style={styles.metricItemValue}>80%</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricItemLabel}>PLATFORMS</Text>
                <Text style={styles.metricItemValue}>{connectedCount} Connected</Text>
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
            <Pressable
              style={styles.checklistCard}
              onPress={() => {
                triggerModalPop();
                setShowProfileModal(true);
              }}
            >
              <View style={styles.checklistLeft}>
                <View style={[styles.checkIconBox, { backgroundColor: '#FEF9C3' }]}>
                  <Text style={{ fontSize: 14 }}>👤</Text>
                </View>
                <Text style={styles.checkTitle}>Profile Completion</Text>
              </View>
              <View style={styles.inProgressBadge}>
                <Text style={styles.inProgressBadgeText}>IN PROGRESS</Text>
              </View>
            </Pressable>

            {/* 2. 2+ Platforms Connected */}
            <Pressable
              style={styles.checklistCard}
              onPress={() => {
                triggerModalPop();
                setShowConnectPlatformModal(true);
              }}
            >
              <View style={styles.checklistLeft}>
                <View style={[styles.checkIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={{ fontSize: 14 }}>🌐</Text>
                </View>
                <Text style={styles.checkTitle}>2+ Platforms Connected</Text>
              </View>
              {connectedCount >= 2 ? (
                <View style={styles.greenCheckCircle}>
                  <Text style={styles.greenCheckText}>✓</Text>
                </View>
              ) : (
                <View style={styles.inProgressBadge}>
                  <Text style={styles.inProgressBadgeText}>IN PROGRESS</Text>
                </View>
              )}
            </Pressable>

            {/* 3. Creator Passport */}
            <Pressable
              style={styles.checklistCard}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenCreatorPassport) {
                  onOpenCreatorPassport();
                } else {
                  triggerModalPop();
                  setShowProfileModal(true);
                }
              }}
            >
              <View style={styles.checklistLeft}>
                <View style={[styles.checkIconBox, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={{ fontSize: 14 }}>🪪</Text>
                </View>
                <Text style={styles.checkTitle}>Creator Passport</Text>
              </View>
              <View style={styles.inProgressBadge}>
                <Text style={styles.inProgressBadgeText}>IN PROGRESS</Text>
              </View>
            </Pressable>

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
              {platformsList.slice(0, 5).map((plat) => (
                <Pressable
                  key={plat.id}
                  style={styles.platformBadgeItem}
                  onPress={() => {
                    triggerModalPop();
                    setShowConnectPlatformModal(true);
                  }}
                >
                  <View style={[styles.platformRoundIcon, { backgroundColor: plat.bgTint }]}>
                    {renderBrandIcon(plat.id, 18)}
                  </View>
                  <Text
                    style={[
                      styles.platformBadgeLabel,
                      plat.connected && { color: '#059669', fontWeight: '800' },
                    ]}
                  >
                    {plat.name.split(' ')[0].toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [styles.connectPlatformBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalPop();
                setShowConnectPlatformModal(true);
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
        </ScrollView>

        {/* FLOATING LIQUID GLASS TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* 🌐 COMPREHENSIVE CONNECT PLATFORMS & SYNC HUB POPUP MODAL */}
        <Modal
          visible={showConnectPlatformModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConnectPlatformModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCardLarge, { transform: [{ scale: modalPopScale }] }]}>
              {/* Modal Top Header */}
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.modalTitle}>Connected Platforms</Text>
                    <View style={styles.activePlatformsCountBadge}>
                      <Text style={styles.activePlatformsCountText}>
                        {platformsList.filter((p) => p.connected).length} Connected
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.modalSubtitle}>
                    Manage connected channels or add more platforms to sync your audience.
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowConnectPlatformModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView
                style={{ maxHeight: Dimensions.get('window').height * 0.58 }}
                showsVerticalScrollIndicator={false}
              >
                {/* 1. ACTIVE CONNECTED ACCOUNTS */}
                <Text style={styles.modalSectionTitle}>ACTIVE CONNECTED PLATFORMS</Text>

                <View style={{ gap: 8, marginBottom: 16 }}>
                  {platformsList
                    .filter((p) => p.connected)
                    .map((plat) => (
                      <View key={plat.id} style={styles.connectedPlatformRow}>
                        <View style={[styles.platformIconCircle, { backgroundColor: plat.bgTint }]}>
                          {renderBrandIcon(plat.id, 20)}
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.platformNameText}>{plat.name}</Text>
                            <View style={styles.autoSyncBadge}>
                              <Text style={styles.autoSyncText}>🟢 Auto-Sync</Text>
                            </View>
                          </View>
                          <Text style={styles.platformSubText}>
                            {plat.handle} • ⚡ {plat.followers}
                          </Text>
                        </View>
                        {/* REMOVE BUTTON */}
                        <Pressable
                          style={styles.removePlatformBtn}
                          onPress={() => handleRemoveSinglePlatform(plat.id)}
                          hitSlop={6}
                        >
                          <Text style={styles.removePlatformBtnText}>Remove</Text>
                        </Pressable>
                      </View>
                    ))}
                </View>

                {/* 2. AVAILABLE PLATFORMS TO ADD MORE */}
                <Text style={styles.modalSectionTitle}>
                  AVAILABLE PLATFORMS TO ADD ({platformsList.filter((p) => !p.connected).length})
                </Text>
                <Text style={styles.modalSubDescription}>
                  Connect more platforms to aggregate your cross-channel creator reach:
                </Text>

                <View style={{ gap: 8, marginBottom: 16 }}>
                  {platformsList
                    .filter((p) => !p.connected)
                    .map((plat) => (
                      <View key={plat.id} style={styles.availablePlatformRow}>
                        <View style={[styles.platformIconCircle, { backgroundColor: plat.bgTint }]}>
                          {renderBrandIcon(plat.id, 20)}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.platformNameText}>{plat.name}</Text>
                          <Text style={styles.platformSubText}>
                            Sync video metrics &amp; audience velocity
                          </Text>
                        </View>
                        <Pressable
                          style={styles.addPlatformActionBtn}
                          onPress={() => handleConnectSinglePlatform(plat.id)}
                        >
                          <Text style={styles.addPlatformActionBtnText}>+ Connect</Text>
                        </Pressable>
                      </View>
                    ))}
                </View>

                {/* 3. CUSTOM ACCOUNT LINKER BOX */}
                <View style={styles.customAddAccountBox}>
                  <Text style={styles.customAddTitle}>LINK CUSTOM ACCOUNT HANDLE</Text>
                  <Text style={styles.customAddSub}>
                    Select channel and enter your creator username:
                  </Text>

                  {/* Channel Chips with Real Icons */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6, marginVertical: 8 }}
                  >
                    {platformsList.map((p) => {
                      const isChosen = selectedPlatformToAdd === p.id;
                      return (
                        <Pressable
                          key={p.id}
                          style={[
                            styles.platformSelectChip,
                            isChosen && styles.platformSelectChipActive,
                          ]}
                          onPress={() => setSelectedPlatformToAdd(p.id)}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            {renderBrandIcon(p.id, 14)}
                            <Text
                              style={[
                                styles.platformSelectChipText,
                                isChosen && styles.platformSelectChipTextActive,
                              ]}
                            >
                              {p.name.split(' ')[0]}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {/* Input and Add Button */}
                  <View style={styles.customInputRow}>
                    <TextInput
                      value={customHandleInput}
                      onChangeText={setCustomHandleInput}
                      placeholder="@your_username"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      style={styles.customTextInput}
                    />
                    <Pressable
                      style={styles.linkAccountConfirmBtn}
                      onPress={handleAddCustomPlatform}
                    >
                      <Text style={styles.linkAccountConfirmBtnText}>Link Account ➔</Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>

              {/* Done Button */}
              <Pressable
                style={styles.modalDoneBtn}
                onPress={() => setShowConnectPlatformModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Save &amp; Close ✓</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

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
    opacity: 0.9,
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
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
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
    fontSize: 11,
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
    fontSize: 10,
    fontWeight: '700',
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
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.8,
  },
  scoreStatusText: {
    fontSize: 13,
    fontWeight: '700',
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
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  metricItemValue: {
    fontSize: 14,
    fontWeight: '700',
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
    fontSize: 12,
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
    fontWeight: '700',
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
    fontSize: 14,
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
    fontSize: 9,
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
    color: '#171420',
  },
  profileDetailsSub: {
    fontSize: 12,
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontSize: 9,
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
    fontWeight: '700',
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
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  jarvisText: {
    fontSize: 12,
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
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  primaryBottomBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 24, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 8,
  },
  modalCardLarge: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  activePlatformsCountBadge: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activePlatformsCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
  },
  modalSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  modalSubDescription: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  connectedPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    gap: 10,
  },
  availablePlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    gap: 10,
  },
  platformIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  autoSyncBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  autoSyncText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  platformSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  removePlatformBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  removePlatformBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  addPlatformActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#582CDB',
  },
  addPlatformActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  customAddAccountBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    marginTop: 6,
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
    borderColor: '#E2E8F0',
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
    gap: 8,
    marginTop: 6,
  },
  customTextInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    fontSize: 12.5,
    color: '#171420',
    fontWeight: '600',
  },
  linkAccountConfirmBtn: {
    backgroundColor: '#582CDB',
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkAccountConfirmBtnText: {
    fontSize: 11,
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
    fontSize: 12,
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
    fontSize: 14,
    fontWeight: '700',
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
});
