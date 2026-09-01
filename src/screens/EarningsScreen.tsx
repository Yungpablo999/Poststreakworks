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
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { sFont, isNarrowScreen } from '../utils/responsive';

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

import { SocialBrandIcon } from '../components/SocialBrandIcon';

const renderBrandIcon = (id: string, size = 18) => {
  return <SocialBrandIcon platform={id} size={size} />;
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
    id: 'facebook',
    name: 'Facebook',
    handle: '@amara.creator',
    followers: '5.6K',
    connected: false,
    color: '#1877F2',
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
    id: 'pinterest',
    name: 'Pinterest',
    handle: '@amarapins',
    followers: '11.8K',
    connected: false,
    color: '#E60023',
    bgTint: '#FFF1F2',
  },
];

interface EarningsScreenProps {
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenMessages?: () => void;
  onOpenSchedule?: () => void;
  onOpenQuests?: () => void;
  onOpenReadiness?: () => void;
  onOpenCreatorPassport?: () => void;
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
  onOpenCreatorPassport,
  onOpenPlatforms,
  userProfile,
  onSaveProfile,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('growth');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showConnectPlatformModal, setShowConnectPlatformModal] = useState(false);
  // Celebration Modal States
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Income Goal Set!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Your path to your first creator payout is now locked in.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('Ghost says: Let\'s get that bag Amara! 💰');
  const [celebrationBadge, setCelebrationBadge] = useState('MILESTONE ACTIVE');
  const [celebrationXp, setCelebrationXp] = useState(100);
  const [selectedGoal, setSelectedGoal] = useState('First $50 Goal');
  const [selectedGoalIndex, setSelectedGoalIndex] = useState(0);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Platform Management State
  const [platformsList, setPlatformsList] = useState<PlatformAccount[]>(INITIAL_PLATFORMS);
  const [selectedPlatformToAdd, setSelectedPlatformToAdd] = useState<string>('threads');
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
          contentContainerStyle={{ paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO SECTION TITLE */}
          <View style={styles.badgePillRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>CREATOR EARNINGS</Text>
            </View>
          </View>

          <Text style={styles.mainTitle}>
            Build your path to paid brand campaigns.
          </Text>

          {/* CARD 1: CURRENT BALANCE & READINESS */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceTopRow}>
              <View>
                <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
                <Text style={styles.balanceAmount}>$0.00</Text>
              </View>
              <View style={styles.walletIconCircle}>
                <Text style={{ fontSize: 18 }}>💰</Text>
              </View>
            </View>

            {/* Opportunity Readiness Progress Bar */}
            <View style={styles.readinessHeaderRow}>
              <Text style={styles.readinessLabel}>Opportunity Readiness</Text>
              <Text style={styles.readinessPercent}>70%</Text>
            </View>
            <View style={styles.readinessTrack}>
              <View style={[styles.readinessFill, { width: '70%' }]} />
            </View>

            {/* Checklist */}
            <View style={styles.readinessChecklist}>
              <View style={styles.checklistRow}>
                <Text style={{ color: '#15803D', fontSize: 13, fontWeight: '700' }}>✓</Text>
                <Text style={styles.checkTextActive}>Creator profile added</Text>
              </View>
              <View style={styles.checklistRow}>
                <Text style={{ color: '#15803D', fontSize: 13, fontWeight: '700' }}>✓</Text>
                <Text style={styles.checkTextActive}>{userProfile?.streakCount || 1}-day streak active 🔥</Text>
              </View>
              <View style={styles.checklistRow}>
                <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>○</Text>
                <Text style={styles.checkText}>1 / 3 starter quests completed</Text>
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
              <Text style={styles.improveBtnText}>Improve Readiness →</Text>
            </Pressable>
          </View>

          {/* CARD 2: CONNECTED PLATFORMS PREVIEW & PRO TRACKING */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Connected Platforms</Text>
          </View>

          {/* 4 Active Brand Pills */}
          <View style={styles.platformPillsRow}>
            {platformsList.filter((p) => p.connected).slice(0, 4).map((plat) => (
              <Pressable
                key={plat.id}
                style={styles.platformPillItem}
                onPress={() => {
                  triggerModalPop();
                  setShowConnectPlatformModal(true);
                }}
              >
                {renderBrandIcon(plat.id, 14)}
                <Text style={styles.platformPillText}>{plat.name.split(' ')[0]}</Text>
                <View style={styles.activeDot} />
              </Pressable>
            ))}
          </View>

          {/* Estimated Tracked Earnings Card (DUAL-TIER: FREE SNEAK PEEK vs PRO UNLOCKED) */}
          {userProfile?.tier === 'pro' || userProfile?.tier === 'founding' ? (
            <View style={[styles.estimatedCard, { backgroundColor: '#FAF5FF', borderColor: '#C084FC' }]}>
              <View style={styles.estimatedHeaderRow}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.estimatedLabel}>Tracked Platform Earnings</Text>
                    <View style={{ backgroundColor: '#FEF9C3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#A16207' }}>PRO ACTIVE</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Auto-synced across 4 channels</Text>
                </View>
                <Text style={styles.estimatedAmount}>$1,420.50</Text>
              </View>

              <View style={{ gap: 8, marginVertical: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F3E8FF' }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#171420' }}>● TikTok Creator Rewards</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#582CDB' }}>$740.00</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F3E8FF' }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#171420' }}>● Instagram Gifts &amp; Bonus</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#582CDB' }}>$480.50</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#171420' }}>● YouTube Shorts Ad Revenue</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#582CDB' }}>$200.00</Text>
                </View>
              </View>

              <View style={{ backgroundColor: '#EDE9FE', padding: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#582CDB' }}>⚡ Real-time Daily Revenue Sync Active</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#582CDB' }}>✓</Text>
              </View>
            </View>
          ) : (
            <View style={styles.estimatedCard}>
              <View style={styles.estimatedHeaderRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.estimatedLabel}>Estimated Potential Earnings</Text>
                  <Text style={styles.estimatedSubExplanation}>
                    Estimated potential earnings based on your creator activity and available opportunities.
                  </Text>
                </View>
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
                  colors={['#F59E0B', '#F59E0B', '#F59E0B', '#A16207']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.unlockTrackingGradient}
                >
                  <Text style={styles.unlockTrackingBtnText}>Unlock Tracking ➔</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}

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
              <Text style={styles.oppBenefit}>Earn +500 XP</Text>

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
              <Text style={styles.oppSub}>2 platforms connected</Text>
              <Text style={styles.oppBenefit}>Improve your matching score</Text>

              {/* CONNECT NOW BUTTON POPPING UP SOCIAL MEDIA MODAL */}
              <Pressable
                style={({ pressed }) => [styles.oppPurpleBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  triggerModalPop();
                  setShowConnectPlatformModal(true);
                }}
              >
                <Text style={styles.oppPurpleBtnText}>Connect Now</Text>
              </Pressable>
            </View>
          </View>

          {/* CARD 4: CREATOR PASSPORT */}
          <View style={styles.passportCard}>
            <View style={styles.passportHeaderRow}>
              <Text style={styles.passportTitle}>Creator Passport</Text>
              <View style={styles.passportBadge}>
                <Text style={styles.passportBadgeText}>FOUNDING CREATOR</Text>
              </View>
            </View>
            <Text style={styles.passportSub}>Your verified creator credentials for brand campaigns</Text>

            {/* 2x2 Grid */}
            <View style={styles.passportGrid}>
              <View style={styles.passportGridItem}>
                <Text style={styles.passportGridLabel}>PROFILE COMPLETION</Text>
                <Text style={styles.passportGridValue}>80%</Text>
              </View>
              <View style={styles.passportGridItem}>
                <Text style={styles.passportGridLabel}>CONSISTENCY</Text>
                <Text style={[styles.passportGridValue, { color: '#582CDB' }]}>Strong</Text>
              </View>
              <View style={styles.passportGridItem}>
                <Text style={styles.passportGridLabel}>COLLABORATION</Text>
                <Text style={styles.passportGridValue}>Beginner</Text>
              </View>
              <View style={styles.passportGridItem}>
                <Text style={styles.passportGridLabel}>QUESTS</Text>
                <Text style={styles.passportGridValue}>1/3</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.passportBtn, pressed && styles.btnPressed]}
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
              <Text style={styles.passportBtnText}>View Passport →</Text>
            </Pressable>
          </View>

          {/* CARD 5: STARTER CREATOR CAMPAIGNS */}
          <View style={styles.campaignCard}>
            <View style={styles.campaignHeaderRow}>
              <Text style={styles.campaignTitle}>Starter Creator Campaigns</Text>
              <View style={styles.lockPill}>
                <Text style={styles.lockPillText}>🔒 LOCKED</Text>
              </View>
            </View>
            <Text style={styles.campaignSub}>Complete requirements to unlock incoming brand deals.</Text>

            <View style={styles.campaignChecklist}>
              <Pressable
                style={({ pressed }) => [styles.campaignCheckItem, pressed && styles.rowPressed]}
                onPress={() => {
                  triggerModalPop();
                  setShowCampaignModal(true);
                }}
              >
                <Text style={{ color: '#15803D', fontSize: 13, fontWeight: '800' }}>✓</Text>
                <Text style={styles.campCheckActive}>7-day streak</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.campaignCheckItem, pressed && styles.rowPressed]}
                onPress={() => {
                  if (onOpenCreatorPassport) {
                    onOpenCreatorPassport();
                  } else {
                    triggerModalPop();
                    setShowProfileModal(true);
                  }
                }}
              >
                <Text style={{ color: '#15803D', fontSize: 13, fontWeight: '800' }}>✓</Text>
                <Text style={styles.campCheckActive}>Complete Creator Passport</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.campaignCheckItem, pressed && styles.rowPressed]}
                onPress={() => {
                  triggerModalPop();
                  setShowConnectPlatformModal(true);
                }}
              >
                <Text style={{ color: '#582CDB', fontSize: 12 }}>◷</Text>
                <Text style={styles.campCheckActionable}>Connect another social account →</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.campaignCheckItem, pressed && styles.rowPressed]}
                onPress={() => {
                  if (onOpenQuests) {
                    onOpenQuests();
                  } else if (onNavigateTab) {
                    onNavigateTab('quests');
                  }
                }}
              >
                <Text style={{ color: '#582CDB', fontSize: 12 }}>◷</Text>
                <Text style={styles.campCheckActionable}>Finish 3 quests →</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.campaignBtn, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowCampaignModal(true);
              }}
            >
              <Text style={styles.campaignBtnText}>View Requirements</Text>
            </Pressable>
          </View>

          {/* CARD 6: STARTER GOAL */}
          <View style={styles.goalCard}>
            <View style={styles.goalHeaderRow}>
              <View>
                <Text style={styles.goalTitle}>Starter Goal</Text>
                <Text style={styles.goalTarget}>{selectedGoal}</Text>
              </View>
              <View style={styles.trophyCircle}>
                <Text style={{ fontSize: 18 }}>🏆</Text>
              </View>
            </View>

            <View style={styles.goalTrackLabels}>
              <Text style={styles.goalStepActive}>PROFILE</Text>
              <Text style={styles.goalStepActive}>STREAK</Text>
              <Text style={styles.goalStepActive}>QUESTS</Text>
              <Text style={styles.goalStepMuted}>APPLY</Text>
            </View>
            <View style={styles.goalTrack}>
              <View style={[styles.goalFill, { width: '75%' }]} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.goalBtn, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowMilestoneModal(true);
              }}
            >
              <Text style={styles.goalBtnText}>Set Goal</Text>
            </Pressable>
          </View>

          {/* CARD 7: PRO EARNINGS TOOLS (METALLIC GOLD) */}
          <View style={styles.proCard}>
            <View style={styles.proHeaderRow}>
              <Text style={styles.proTitle}>Pro Earnings Tools</Text>
              <View style={styles.goldProBadge}>
                <Text style={styles.goldProBadgeText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.proSub}>Advanced monetization features for high-growth creators.</Text>

            <View style={styles.proFeaturesList}>
              <View style={styles.proFeatureRow}>
                <Text style={{ color: '#D97706', fontSize: 12 }}>⚡</Text>
                <Text style={styles.proFeatureText}>Auto platform earnings tracking</Text>
              </View>
              <View style={styles.proFeatureRow}>
                <Text style={{ color: '#D97706', fontSize: 12 }}>⚡</Text>
                <Text style={styles.proFeatureText}>Custom Media Kit builder</Text>
              </View>
              <View style={styles.proFeatureRow}>
                <Text style={{ color: '#D97706', fontSize: 12 }}>⚡</Text>
                <Text style={styles.proFeatureText}>Dynamic brand deal rate card</Text>
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
                  showToast('Opening Jarvis Pro...');
                }
              }}
            >
              <LinearGradient
                colors={['#F59E0B', '#F59E0B', '#F59E0B', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.exploreProGradient}
              >
                <Text style={styles.exploreProBtnText}>Explore Pro ➔</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* CARD 8: JARVIS INSIGHT */}
          <View style={styles.jarvisCard}>
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
                &ldquo;Your streak is strong, but your passport needs campaign proof before bigger opportunities unlock.&rdquo;
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* FLOATING LIQUID GLASS TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* 🌐 CONNECTED PLATFORMS & SYNC HUB MODAL */}
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
                    Manage connected channels or add more platforms to sync your earnings.
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
                        <View style={styles.platformMiddleCol}>
                          <View style={styles.platformNameRow}>
                            <Text style={styles.platformNameText} numberOfLines={1}>{plat.name}</Text>
                            <View style={styles.autoSyncBadge}>
                              <View style={styles.autoSyncDot} />
                              <Text style={styles.autoSyncText}>Auto-Sync</Text>
                            </View>
                          </View>
                          <Text style={styles.platformSubText} numberOfLines={1}>
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
                  Connect more platforms to aggregate your cross-channel creator earnings:
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
                      hitSlop={6}
                    >
                      <Text style={styles.linkAccountConfirmBtnText} numberOfLines={1}>Link Account ➔</Text>
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

        {/* USER PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />

        {/* EARNINGS ALERTS MODAL */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.modalTitle}>Earnings Alerts</Text>
                  <Text style={styles.modalSubtitle}>Payout and opportunity updates</Text>
                </View>
                <Pressable onPress={() => setShowNotificationModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.notifCard}>
                <Text style={{ fontSize: 18 }}>🎉</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>Campaign Readiness: 70%</Text>
                  <Text style={styles.notifBody}>Finish 2 more starter quests to qualify for micro-sponsorships.</Text>
                </View>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* SET GOAL MODAL */}
        <Modal
          visible={showMilestoneModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMilestoneModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.modalTitle}>Set Income Milestone</Text>
                  <Text style={styles.modalSubtitle}>Target your next creator milestone</Text>
                </View>
                <Pressable onPress={() => setShowMilestoneModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.milestoneGrid}>
                {['First $50 Goal', '$250 Micro Creator', '$1,000 Pro Tier'].map((goal, idx) => {
                  const isSelected = selectedGoalIndex === idx;
                  return (
                    <Pressable
                      key={idx}
                      style={[styles.milestoneOption, isSelected && styles.milestoneOptionActive]}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setSelectedGoalIndex(idx);
                        setSelectedGoal(goal);
                      }}
                    >
                      <Text style={[styles.milestoneOptionText, isSelected && styles.milestoneOptionTextActive]}>
                        {goal}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  setShowMilestoneModal(false);
                  setCelebrationTitle('Income Goal Set!');
                  setCelebrationSubtitle(`Targeting ${selectedGoal}. Your creator monetization roadmap is now active.`);
                  setCelebrationSpeech(`Ghost says: You're on track for ${selectedGoal}! 🚀`);
                  setCelebrationBadge('GOAL LOCKED IN');
                  setCelebrationXp(100);
                  setTimeout(() => {
                    setShowCelebrationModal(true);
                  }, 250);
                }}
              >
                <Text style={styles.modalFullBtnText}>Save Goal</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        
        {/* SIGNATURE ANIMATED GHOST CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCelebrationModal}
          title={celebrationTitle}
          subtitle={celebrationSubtitle}
          speechBubble={celebrationSpeech}
          badgeText={celebrationBadge}
          xpEarned={celebrationXp}
          streakCount={userProfile?.streakCount || 1}
          actionText="Let's Build ➔"
          onDismiss={() => setShowCelebrationModal(false)}
        />

        {/* CAMPAIGN REQUIREMENTS MODAL */}
        <Modal
          visible={showCampaignModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCampaignModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.modalTitle}>Campaign Requirements</Text>
                  <Text style={styles.modalSubtitle}>Brand sponsor eligibility</Text>
                </View>
                <Pressable onPress={() => setShowCampaignModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              {/* Tier Callout Banner */}
              <View style={styles.reqGoalBanner}>
                <Text style={styles.reqGoalBannerText}>
                  🎯 <Text style={{ fontWeight: '800', color: '#171420' }}>Starter Campaigns:</Text> Passport ≥ 70% •{' '}
                  <Text style={{ fontWeight: '800', color: '#582CDB' }}>High-Intent Brands:</Text> Readiness ≥ 85%
                </Text>
              </View>

              {/* Structured Requirements List */}
              <View style={styles.reqListContainer}>
                {/* 1. Streak */}
                <View style={styles.reqItemRow}>
                  <View style={styles.greenCheckBadge}>
                    <Text style={styles.greenCheckBadgeText}>✓</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reqItemTitle}>7-Day Posting Streak</Text>
                    <Text style={styles.reqItemStatusActive}>Active</Text>
                  </View>
                </View>

                {/* 2. Passport Score */}
                <View style={styles.reqItemRow}>
                  <View style={styles.greenCheckBadge}>
                    <Text style={styles.greenCheckBadgeText}>✓</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reqItemTitle}>Creator Passport Score ≥ 70%</Text>
                    <Text style={styles.reqItemStatusActive}>Achieved (70%)</Text>
                  </View>
                </View>

                {/* 3. Social Account */}
                <View style={styles.reqItemRow}>
                  <View style={styles.greenCheckBadge}>
                    <Text style={styles.greenCheckBadgeText}>✓</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reqItemTitle}>At least 1 linked social account with 10K+ reach</Text>
                    <Text style={styles.reqItemStatusActive}>Active (28.4K TikTok)</Text>
                  </View>
                </View>

                {/* 4. Complete 3 community quests */}
                <View style={styles.reqItemRow}>
                  <View style={styles.greyCircleBadge}>
                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>○</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reqItemTitle}>Complete 3 community quests</Text>
                    <Text style={styles.reqItemStatusPending}>1 of 3 completed</Text>
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.modalFullBtn, pressed && styles.btnPressed]}
                onPress={() => setShowCampaignModal(false)}
              >
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
    fontSize: Platform.OS === 'web' ? ('clamp(14px, 3.8vw, 16.5px)' as any) : (isNarrowScreen ? 14.5 : sFont(15.5)),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 16,
  },

  // CARD 1: BALANCE
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
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.8,
  },
  walletIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FEF9C3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
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
    fontWeight: '700',
    color: '#582CDB',
  },
  readinessTrack: {
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 12,
  },
  readinessFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 3.5,
  },
  readinessChecklist: {
    gap: 6,
    marginBottom: 14,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  checkText: {
    fontSize: 12,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // CARD 2: CONNECTED PLATFORMS
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
  platformPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  platformPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  platformPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  estimatedCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 20,
  },
  estimatedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  estimatedLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  estimatedSubExplanation: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 3,
  },
  estimatedAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#582CDB',
  },
  estimatedBullets: {
    gap: 4,
    marginBottom: 14,
  },
  estimatedBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  estimatedBulletText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  unlockTrackingBtn: {
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  unlockTrackingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockTrackingBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: 0.3,
  },

  // CARD 3: OPPORTUNITIES
  opportunityCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  oppCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  oppTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  oppXpBadge: {
    backgroundColor: '#F4F0FF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  oppXpBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
  },
  oppTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
    minHeight: 34,
  },
  oppSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  oppBenefit: {
    fontSize: 10.5,
    color: '#582CDB',
    fontWeight: '700',
    marginBottom: 12,
  },
  oppGhostBtn: {
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F4F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  oppGhostBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // CARD 4: PASSPORT
  passportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  passportHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  passportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  passportBadge: {
    backgroundColor: '#FFFBEB',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  passportBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
  passportSub: {
    fontSize: 11,
    color: '#5E576E',
    marginBottom: 12,
  },
  passportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  passportGridItem: {
    width: '48%',
    backgroundColor: '#FAF9FD',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.04)',
  },
  passportGridLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8E869E',
    marginBottom: 2,
  },
  passportGridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  passportBtn: {
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F4F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },

  // CARD 5: CAMPAIGNS
  campaignCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  campaignHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  campaignTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  lockPill: {
    backgroundColor: 'rgba(23, 20, 32, 0.05)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  lockPillText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#5E576E',
  },
  campaignSub: {
    fontSize: 11,
    color: '#5E576E',
    marginBottom: 12,
  },
  campaignChecklist: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  campaignCheckItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  campCheckActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 16,
  },
  campCheckActionable: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
    lineHeight: 16,
  },
  campCheckText: {
    fontSize: 12,
    color: '#5E576E',
    lineHeight: 16,
  },
  rowPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.985 }],
  },
  campaignBtn: {
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F4F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  campaignBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },

  // CARD 6: GOAL
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E869E',
    marginBottom: 2,
  },
  goalTarget: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
  },
  trophyCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  goalTrackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  goalStepActive: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
  },
  goalStepMuted: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8E869E',
  },
  goalTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(23, 20, 32, 0.06)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  goalFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 3,
  },
  goalBtn: {
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F4F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },

  // CARD 7: PRO TOOLS
  proCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  proHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  proTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  goldProBadge: {
    backgroundColor: '#FFFBEB',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  goldProBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
  proSub: {
    fontSize: 11,
    color: '#5E576E',
    marginBottom: 12,
  },
  proFeaturesList: {
    gap: 6,
    marginBottom: 14,
  },
  proFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proFeatureText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  exploreProBtn: {
    height: 42,
    borderRadius: 12,
    overflow: 'hidden',
  },
  exploreProGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreProBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
  },

  // CARD 8: JARVIS INSIGHT
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
    gap: 8,
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
    fontSize: 17,
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
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  availablePlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  platformIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#DCFCE7',
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    borderRadius: 4,
    flexShrink: 0,
  },
  autoSyncDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
  },
  autoSyncText: {
    fontSize: sFont(8.5),
    fontWeight: '800',
    color: '#15803D',
  },
  platformSubText: {
    fontSize: sFont(11),
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
  milestoneGrid: {
    gap: 8,
    marginVertical: 12,
  },
  milestoneOption: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  milestoneOptionActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#582CDB',
  },
  milestoneOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  milestoneOptionTextActive: {
    color: '#582CDB',
    fontWeight: '700',
  },
  reqDetailLine: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  greenCheckBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  reqGoalBanner: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  reqGoalBannerText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    fontWeight: '600',
  },
  reqListContainer: {
    gap: 8,
    marginBottom: 4,
  },
  reqItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  reqItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 1,
  },
  reqItemStatusActive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  reqItemStatusPending: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
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
