import { SocialBrandIcon } from '../components/SocialBrandIcon';
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
import { FreeAppHeader } from '../components/FreeAppHeader';

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
    name: 'YouTube',
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
    color: '#F59E0B',
    bgTint: '#FEFCE8',
  },
];

interface CreatorPassportScreenProps {
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

export const CreatorPassportScreen: React.FC<CreatorPassportScreenProps> = ({
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
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
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

  const connectedPlatforms = platformsList.filter((p) => p.connected);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* TOAST BANNER */}
        <BrandToast message={toastMessage} />

        {/* 1. TOP AIRY HEADER BAR */}
        <FreeAppHeader
          onBack={onBack}
          onOpenJarvisPro={onOpenJarvisPro}
          onOpenMessages={() => {
            if (onOpenMessages) {
              onOpenMessages();
            } else if (onNavigateTab) {
              onNavigateTab('match');
            }
          }}
          onOpenNotifications={() => {
            triggerModalPop();
            setShowNotificationModal(true);
          }}
          onOpenProfile={() => {
            triggerModalPop();
            setShowProfileModal(true);
          }}
          userProfile={userProfile}
        />

        {/* 2. SCROLLABLE CONTENT */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO SECTION TITLE */}
          <View style={styles.badgePillRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>CREATOR PASSPORT</Text>
            </View>
          </View>

          <Text style={styles.mainTitle}>Your creator credibility profile.</Text>

          <View style={styles.freePathPillRow}>
            <View style={styles.freePathPill}>
              <View style={styles.yellowDot} />
              <Text style={styles.freePathText}>FREE PASSPORT</Text>
            </View>
          </View>

          {/* CARD 1: CREATOR IDENTITY HERO CARD */}
          <View style={styles.identityCard}>
            <View style={styles.identityTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.creatorName}>{userProfile?.name || 'Ayodeji'}</Text>
                <Text style={styles.creatorNiche}>Creator Education • Short-form Growth</Text>
              </View>

              <View style={styles.percentCircleRing}>
                <Text style={styles.percentCircleRingText}>70%</Text>
              </View>
            </View>

            {/* Badges Row */}
            <View style={styles.identityBadgesRow}>
              <View style={styles.streakBadgePill}>
                <Text style={styles.streakBadgePillText}>🔥 47-DAY STREAK</Text>
              </View>
              <View style={styles.platformsBadgePill}>
                <Text style={styles.platformsBadgePillText}>🔗 {connectedPlatforms.length} PLATFORMS</Text>
              </View>
            </View>

            <View style={styles.identityDivider} />

            <View style={styles.identityBottomRow}>
              <Text style={styles.currentLevelLabel}>CURRENT LEVEL</Text>
              <Text style={styles.currentLevelValue}>Beginner Creator</Text>
            </View>
          </View>

          {/* CARD 2: PROFILE STRENGTH */}
          <View style={styles.profileStrengthCard}>
            <View style={styles.strengthHeaderRow}>
              <Text style={styles.strengthTitle}>Profile Strength</Text>
              <Text style={styles.strengthPercent}>80%</Text>
            </View>

            <View style={styles.strengthTrack}>
              <View style={[styles.strengthFill, { width: '80%' }]} />
            </View>

            <View style={styles.strengthChecklist}>
              <View style={styles.strengthCheckRow}>
                <View style={styles.greenCheckBadge}>
                  <Text style={styles.greenCheckBadgeText}>✓</Text>
                </View>
                <Text style={styles.strengthCheckActive}>Niche defined</Text>
              </View>

              <View style={styles.strengthCheckRow}>
                <View style={styles.greenCheckBadge}>
                  <Text style={styles.greenCheckBadgeText}>✓</Text>
                </View>
                <Text style={styles.strengthCheckActive}>Profile bio active</Text>
              </View>

              <View style={styles.strengthCheckRow}>
                <View style={styles.greyCircleBadge} />
                <Text style={styles.strengthCheckMuted}>Audience goal set</Text>
              </View>

              <View style={styles.strengthCheckRow}>
                <View style={styles.greyCircleBadge} />
                <Text style={styles.strengthCheckMuted}>Content examples</Text>
              </View>
            </View>
          </View>

          {/* CARD 3: STREAK SCORE */}
          <View style={styles.streakScoreCard}>
            <View style={styles.streakScoreTopRow}>
              <Text style={styles.streakScoreLabel}>STREAK SCORE</Text>
              <View style={styles.qualifiedBadge}>
                <Text style={styles.qualifiedBadgeText}>QUALIFIED</Text>
              </View>
            </View>

            <View style={styles.streakDaysRow}>
              <Text style={styles.streakDaysNumber}>47</Text>
              <Text style={styles.streakDaysUnit}>Days</Text>
            </View>

            <Text style={styles.streakSubtext}>Consistency threshold met for standard opportunities.</Text>
          </View>

          {/* CARD 4: POSTING CONSISTENCY */}
          <View style={styles.consistencyCard}>
            <View style={styles.consistencyHeaderRow}>
              <Text style={styles.consistencyTitle}>Posting Consistency</Text>
              <View style={styles.strongTag}>
                <Text style={styles.strongTagText}>📈 STRONG</Text>
              </View>
            </View>

            {/* 7-Day Bar Chart */}
            <View style={styles.barChartContainer}>
              {[
                { day: 'M', height: 42, active: true, opacity: 0.4 },
                { day: 'T', height: 58, active: true, opacity: 0.6 },
                { day: 'W', height: 75, active: true, opacity: 0.85 },
                { day: 'T', height: 48, active: true, opacity: 0.5 },
                { day: 'F', height: 70, active: true, opacity: 0.9 },
                { day: 'S', height: 10, active: false, opacity: 0.15 },
                { day: 'S', height: 10, active: false, opacity: 0.15 },
              ].map((bar, idx) => (
                <View key={idx} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: bar.height,
                          backgroundColor: bar.active ? '#582CDB' : '#CBD5E1',
                          opacity: bar.opacity,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barDayText}>{bar.day}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* CARD 5: CONNECTED PLATFORMS */}
          <View style={styles.passportPlatformsCard}>
            <Text style={styles.passportPlatformsTitle}>Connected Platforms</Text>

            <View style={styles.platformRowsList}>
              {/* TikTok */}
              <View style={styles.passportPlatformItem}>
                <View style={styles.passportPlatformLeft}>
                  <View style={[styles.platformIconCircle, { backgroundColor: '#F1F5F9' }]}>
                    <TikTokSvg size={18} />
                  </View>
                  <Text style={styles.passportPlatformName}>TikTok</Text>
                </View>
                <Text style={styles.connectedGreenLabel}>CONNECTED</Text>
              </View>

              {/* Instagram */}
              <View style={styles.passportPlatformItem}>
                <View style={styles.passportPlatformLeft}>
                  <View style={[styles.platformIconCircle, { backgroundColor: '#FDF2F8' }]}>
                    <InstagramSvg size={18} />
                  </View>
                  <Text style={styles.passportPlatformName}>Instagram</Text>
                </View>
                <Text style={styles.connectedGreenLabel}>CONNECTED</Text>
              </View>

              {/* YouTube */}
              <View style={styles.passportPlatformItem}>
                <View style={styles.passportPlatformLeft}>
                  <View style={[styles.platformIconCircle, { backgroundColor: '#FEF2F2' }]}>
                    <YouTubeSvg size={18} />
                  </View>
                  <Text style={styles.passportPlatformName}>YouTube</Text>
                </View>
                <Pressable
                  onPress={() => {
                    triggerModalPop();
                    setShowConnectPlatformModal(true);
                  }}
                  hitSlop={6}
                >
                  <Text style={styles.connectPurpleLink}>CONNECT</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* CARD 6: CAMPAIGN ACTIVITY */}
          <View style={styles.campaignActivityCard}>
            <Text style={styles.campaignActivityTitle}>Campaign Activity</Text>

            <View style={styles.campaignActivityGrid}>
              <View style={styles.campBoxGrey}>
                <Text style={styles.campBoxLabel}>Completed</Text>
                <Text style={styles.campBoxValue}>0</Text>
              </View>

              <Pressable
                style={styles.campBoxPurple}
                onPress={() => {
                  if (onOpenQuests) {
                    onOpenQuests();
                  } else if (onNavigateTab) {
                    onNavigateTab('quests');
                  }
                }}
              >
                <View>
                  <Text style={styles.campBoxLabelPurple}>In Progress</Text>
                  <Text style={styles.campBoxValuePurple}>1</Text>
                </View>
                <Text style={styles.campArrowText}>➔</Text>
              </Pressable>
            </View>

            {/* Creator Starter Challenge Sub-box */}
            <View style={styles.starterChallengeSubCard}>
              <View style={styles.blueDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.starterChallengeTitle}>Creator Starter Challenge</Text>
                <Text style={styles.starterChallengeSub}>1 of 3 tasks completed</Text>
              </View>
            </View>
          </View>

          {/* CARD 7: CREATOR LEVEL */}
          <View style={styles.levelCard}>
            <View style={styles.levelHeaderRow}>
              <Text style={styles.levelTitle}>Creator Level</Text>
              <Text style={styles.nextLevelText}>56% to next level</Text>
            </View>

            <View style={styles.levelStepRow}>
              <Text style={styles.levelStepLabel}>BEGINNER</Text>
              <Text style={styles.levelStepLabel}>CONSISTENT</Text>
            </View>

            <View style={styles.levelTrack}>
              <View style={[styles.levelFill, { width: '56%' }]} />
            </View>
          </View>

          {/* CARD 8: OPPORTUNITY READINESS */}
          <View style={styles.oppReadinessCard}>
            <Text style={styles.oppReadinessTitle}>Opportunity Readiness</Text>

            <View style={styles.oppReadinessTopRow}>
              <Text style={styles.oppReadinessScore}>70%</Text>
              <Text style={styles.oppReadinessSub}>
                You&apos;re approaching &ldquo;Marketplace Ready&rdquo; status. High-intent brands unlock at 85%.
              </Text>
            </View>

            <View style={styles.oppReadinessChecklist}>
              <View style={styles.oppCheckItem}>
                <View style={styles.greenCheckBadge}>
                  <Text style={styles.greenCheckBadgeText}>✓</Text>
                </View>
                <Text style={styles.oppCheckTextActive}>Identity Verified</Text>
              </View>

              <View style={styles.oppCheckItem}>
                <View style={styles.greenCheckBadge}>
                  <Text style={styles.greenCheckBadgeText}>✓</Text>
                </View>
                <Text style={styles.oppCheckTextActive}>Activity History Valid</Text>
              </View>

              <Pressable
                style={styles.oppCheckItem}
                onPress={() => {
                  if (onOpenJarvisPro) {
                    onOpenJarvisPro();
                  } else {
                    showToast('Unlock Premium Analytics with Jarvis Pro!');
                  }
                }}
              >
                <Text style={{ fontSize: 13, marginRight: 6 }}>🔒</Text>
                <Text style={styles.oppCheckTextMuted}>Unlock Premium Analytics (+15%)</Text>
              </Pressable>
            </View>
          </View>

          {/* CARD 9: JARVIS PASSPORT INSIGHT */}
          <View style={styles.jarvisCard}>
            <View style={styles.jarvisAvatarCircle}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.jarvisTag}>JARVIS PASSPORT INSIGHT</Text>
              <Text style={styles.jarvisText}>
                &ldquo;Your streak is strong. Complete your audience goal and finish the Creator Starter Challenge to improve your Passport.&rdquo;
              </Text>
            </View>
          </View>

          {/* BOTTOM PRIMARY BUTTON: IMPROVE PASSPORT */}
          <Pressable
            style={({ pressed }) => [styles.improvePassportBtn, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              if (onOpenReadiness) {
                onOpenReadiness();
              } else {
                triggerModalPop();
                setShowProfileModal(true);
              }
            }}
          >
            <Text style={styles.improvePassportBtnText}>Improve Passport ✦</Text>
          </Pressable>

          {/* SECONDARY BUTTONS ROW */}
          <View style={styles.secondaryBtnsRow}>
            <Pressable
              style={({ pressed }) => [styles.secondaryHalfBtn, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowRequirementsModal(true);
              }}
            >
              <Text style={{ fontSize: 13, marginRight: 4 }}>📋</Text>
              <Text style={styles.secondaryHalfBtnText}>REQUIREMENTS</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryHalfBtn, pressed && styles.btnPressed]}
              onPress={() => {
                showToast('Creator Passport preview link copied to clipboard! 📋');
              }}
            >
              <Text style={{ fontSize: 13, marginRight: 4 }}>📤</Text>
              <Text style={styles.secondaryHalfBtnText}>SHARE PREVIEW</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* FLOATING LIQUID GLASS TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* 🌐 CONNECTED PLATFORMS MODAL */}
        <Modal
          visible={showConnectPlatformModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConnectPlatformModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCardLarge, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                    <Text style={styles.modalTitle}>Connected Platforms</Text>
                    <View style={styles.activePlatformsCountBadge}>
                      <Text style={styles.activePlatformsCountText}>
                        {platformsList.filter((p) => p.connected).length} Connected
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.modalSubtitle}>
                    Manage connected channels or add more platforms to sync your Passport.
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

                <Text style={styles.modalSectionTitle}>
                  AVAILABLE PLATFORMS TO ADD ({platformsList.filter((p) => !p.connected).length})
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
                          <Text style={styles.platformSubText}>Sync verified reach</Text>
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

                <View style={styles.customAddAccountBox}>
                  <Text style={styles.customAddTitle}>LINK CUSTOM ACCOUNT HANDLE</Text>
                  <Text style={styles.customAddSub}>
                    Select channel and enter your creator username:
                  </Text>

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

              <Pressable
                style={styles.modalDoneBtn}
                onPress={() => setShowConnectPlatformModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Save &amp; Close ✓</Text>
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
                  <Text style={styles.modalTitle}>Passport Alerts</Text>
                  <Text style={styles.modalSubtitle}>Verification updates</Text>
                </View>
                <Pressable onPress={() => setShowNotificationModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.notifCard}>
                <Text style={{ fontSize: 18 }}>🛡️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>Passport Strength: 80%</Text>
                  <Text style={styles.notifBody}>Link 1 more platform to upgrade to Verified Founding Creator tier.</Text>
                </View>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* REQUIREMENTS MODAL */}
        <Modal
          visible={showRequirementsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowRequirementsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Creator Passport Requirements</Text>
                  <Text style={styles.modalSubtitle}>Sponsorship readiness guidelines</Text>
                </View>
                <Pressable onPress={() => setShowRequirementsModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 10, marginVertical: 12 }}>
                <Text style={styles.reqDetailLine}>• 7-Day Posting Streak (Active ✓)</Text>
                <Text style={styles.reqDetailLine}>• Profile Niche &amp; Bio Defined (Active ✓)</Text>
                <Text style={styles.reqDetailLine}>• 2+ Active Connected Social Accounts (Active ✓)</Text>
                <Text style={styles.reqDetailLine}>• 1 Completed Community Quest (In Progress)</Text>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowRequirementsModal(false)}>
                <Text style={styles.modalFullBtnText}>Got It</Text>
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
    width: '100%',
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
    backgroundColor: '#F59E0B',
  },
  freePathText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },

  // CARD 1: IDENTITY
  identityCard: {
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
  identityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  creatorName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.4,
  },
  creatorNiche: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  percentCircleRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentCircleRingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  identityBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  streakBadgePill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  streakBadgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  platformsBadgePill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  platformsBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  identityDivider: {
    height: 1,
    backgroundColor: '#F1EFEA',
    marginBottom: 12,
  },
  identityBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentLevelLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  currentLevelValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#582CDB',
  },

  // CARD 2: PROFILE STRENGTH
  profileStrengthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 20,
  },
  strengthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  strengthPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  strengthTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 14,
  },
  strengthFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  strengthChecklist: {
    gap: 8,
  },
  strengthCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greenCheckBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greenCheckBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  greyCircleBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  strengthCheckActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  strengthCheckMuted: {
    fontSize: 12,
    color: '#64748B',
  },

  // CARD 3: STREAK SCORE
  streakScoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 16,
    marginBottom: 20,
  },
  streakScoreTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  streakScoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  qualifiedBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  qualifiedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  streakDaysRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  streakDaysNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.6,
  },
  streakDaysUnit: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  streakSubtext: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },

  // CARD 4: POSTING CONSISTENCY
  consistencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 20,
  },
  consistencyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  consistencyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  strongTag: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  strongTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 90,
    paddingTop: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barTrack: {
    height: 75,
    width: 26,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  barDayText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 6,
  },

  // CARD 5: PLATFORMS
  passportPlatformsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 20,
  },
  passportPlatformsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 12,
  },
  platformRowsList: {
    gap: 10,
  },
  passportPlatformItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  passportPlatformLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  passportPlatformName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
  },
  connectedGreenLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.4,
  },
  connectPurpleLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.4,
  },

  // CARD 6: CAMPAIGN ACTIVITY
  campaignActivityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 20,
  },
  campaignActivityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 12,
  },
  campaignActivityGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  campBoxGrey: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  campBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
  },
  campBoxValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171420',
  },
  campBoxPurple: {
    flex: 1,
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  campBoxLabelPurple: {
    fontSize: 9,
    fontWeight: '800',
    color: '#582CDB',
    marginBottom: 4,
  },
  campBoxValuePurple: {
    fontSize: 20,
    fontWeight: '700',
    color: '#582CDB',
  },
  campArrowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#582CDB',
  },
  starterChallengeSubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#582CDB',
  },
  starterChallengeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
  },
  starterChallengeSub: {
    fontSize: 11,
    color: '#64748B',
  },

  // CARD 7: LEVEL
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 20,
  },
  levelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  nextLevelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  levelStepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  levelStepLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  levelTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 3,
  },

  // CARD 8: OPPORTUNITY READINESS
  oppReadinessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 20,
  },
  oppReadinessTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 10,
  },
  oppReadinessTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  oppReadinessScore: {
    fontSize: 32,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.6,
  },
  oppReadinessSub: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  oppReadinessChecklist: {
    gap: 8,
  },
  oppCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  oppCheckTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  oppCheckTextMuted: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },

  // CARD 9: JARVIS INSIGHT
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

  // BOTTOM BUTTONS
  improvePassportBtn: {
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
  improvePassportBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryBtnsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  secondaryHalfBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryHalfBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: 0.4,
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
    width: 36,
    height: 36,
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
  reqDetailLine: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
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
