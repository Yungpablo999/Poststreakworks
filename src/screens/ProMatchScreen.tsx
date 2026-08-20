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
  PanResponder,
  Modal,
  TextInput,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const TinyGoldCheck = ({ size = 13 }: { size?: number }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: '#F59E0B',
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#CA8A04',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.35,
      shadowRadius: 2,
      elevation: 2,
    }}
  >
    <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 12 12" fill="none">
      <Path
        d="M2.5 6.2L4.8 8.5L9.5 3.5"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

const SWIPE_THRESHOLD = 95;

interface ProMatchScreenProps {
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenMessages?: () => void;
  onOpenJarvisPro?: () => void;
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface CreatorProfile {
  id: string;
  name: string;
  role: string;
  followers: string;
  location: string;
  coverImage: any;
  bio: string;
  tags: string[];
  streak: number;
  matchScore: number;
  whyMatch: string;
  platforms: string[];
  proposedConcept: string;
  conceptDesc: string;
}

const PRO_CREATORS: CreatorProfile[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    role: 'Travel & Lifestyle Creator',
    followers: '85K',
    location: 'Lagos, Nigeria',
    coverImage: require('../../assets/images/amara-avatar.jpg'),
    bio: 'Documenting hidden gems, culture, and high-energy street stories across West Africa.',
    tags: ['Lifestyle', 'Travel', 'Storytelling', 'Available This Week'],
    streak: 44,
    matchScore: 94,
    whyMatch:
      'Your audiences overlap in lifestyle, travel and personality-led storytelling. A joint Reel could help both creators reach new viewers with strong short-form chemistry.',
    platforms: ['Instagram', 'TikTok'],
    proposedConcept: '24 Hours Creating in Lagos',
    conceptDesc:
      'A fast-moving lifestyle collaboration showing how two creators work, explore and create in the city.',
  },
  {
    id: 'elena',
    name: 'Elena Rostova',
    role: 'Design & Visual AI',
    followers: '42.8K',
    location: 'Berlin / Remote',
    coverImage: require('../../assets/images/elena-avatar.jpg'),
    bio: 'Sharing UI/UX micro-interactions, generative visual art, and creative workflow hacks.',
    tags: ['Tech & AI', 'Design', 'Storytelling', 'Open to Squads'],
    streak: 52,
    matchScore: 96,
    whyMatch:
      'Elena posts at the exact same 11:30 AM cadence. Her audience values high production aesthetics and creative tools.',
    platforms: ['Instagram', 'YouTube'],
    proposedConcept: 'The 3 AI Tools I Use to 10x Editing Speed',
    conceptDesc:
      'A side-by-side split screen comparing manual workflows vs autonomous AI co-piloting.',
  },
  {
    id: 'david',
    name: 'David Adebayo',
    role: 'Tech & Productivity',
    followers: '112K',
    location: 'London, UK',
    coverImage: require('../../assets/images/david-avatar.jpg'),
    bio: 'Obsessed with deep work, creator economy monetization, and high-performance habits.',
    tags: ['Business & Wealth', 'Tech', 'Available This Week'],
    streak: 61,
    matchScore: 91,
    whyMatch:
      'High affinity with your business and streak consistency followers. Perfect for an accountability challenge.',
    platforms: ['YouTube', 'TikTok'],
    proposedConcept: '7-Day Zero-Distraction Challenge',
    conceptDesc:
      'A co-hosted challenge tracking daily posting streaks and focus routines across both channels.',
  },
];

interface NotificationItem {
  id: string;
  type: 'streak' | 'collab' | 'quest' | 'level' | 'growth';
  title: string;
  body: string;
  time: string;
  unread: boolean;
  iconEmoji: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'collab',
    title: 'New Priority Match Found',
    body: 'Amara Okafor (94% Fit) is available for collab this week in Lagos.',
    time: '10m ago',
    unread: true,
    iconEmoji: '🤝',
  },
  {
    id: 'n2',
    type: 'streak',
    title: 'Squad Duel Leading by 4 Pts',
    body: 'Momentum Makers leads Lagos Storytellers (62 pts vs 58 pts).',
    time: '1h ago',
    unread: true,
    iconEmoji: '🏆',
  },
];

export const ProMatchScreen: React.FC<ProMatchScreenProps> = ({
  onLogout,
  onNavigateTab,
  onOpenMessages,
  onOpenJarvisPro,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('match');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('High Fit');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCollabPlanModal, setShowCollabPlanModal] = useState(false);
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [showCreatorDetailModal, setShowCreatorDetailModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Animations
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(1)).current;
  const modalPopScale = useRef(new Animated.Value(0.92)).current;

  // Swipe Animation Ref
  const position = useRef(new Animated.ValueXY()).current;

  const currentCreator = PRO_CREATORS[currentIndex % PRO_CREATORS.length];

  // PanResponder for Interactive Swipe Cards
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: false,
    }).start();
  };

  const swipeRight = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex((prev) => prev + 1);
      triggerModalPop();
      setShowCelebrationModal(true);
    });
  };

  const swipeLeft = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex((prev) => prev + 1);
      showToast('Passed. Showing next high-fit creator...');
    });
  };

  const swipeUp = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.timing(position, {
      toValue: { x: 0, y: -SCREEN_WIDTH },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex((prev) => prev + 1);
      showToast(`Saved ${currentCreator.name} to your Collab Vault!`);
    });
  };

  // Card Rotation on Drag
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });

  const rotateAndTranslate = {
    transform: [
      { rotate: rotate },
      ...position.getTranslateTransform(),
    ],
  };

  useEffect(() => {
    // Mascot floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(ghostFloatY, {
          toValue: -4,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(ghostFloatY, {
          toValue: 2,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const triggerModalPop = () => {
    modalPopScale.setValue(0.92);
    Animated.spring(modalPopScale, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
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

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* ============================================================ */}
        {/* 1. TOP HEADER BAR                                            */}
        {/* ============================================================ */}
        <View style={styles.headerBar}>
          {/* Top-Left: Mascot + Mode Switcher */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Animated.View
              style={[
                styles.headerLogoWrapper,
                {
                  transform: [
                    { translateY: ghostFloatY },
                    { scale: ghostScale },
                  ],
                },
              ]}
            >
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerGhostLogo}
                resizeMode="contain"
              />
            </Animated.View>

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
                colors={['#FDE047', '#EAB308', '#CA8A04']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.proHeaderBadge}
              >
                <Text style={styles.proHeaderBadgeText}>👑 PRO</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Right Action Icons: Messages, Notification Bell & Profile Avatar */}
          <View style={styles.headerRightGroup}>
            {/* Chat Messages */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenMessages) {
                  onOpenMessages();
                }
              }}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                  stroke="#1A1626"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

            {/* Notification Bell */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalPop();
                setShowNotificationModal(true);
              }}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="#1A1626"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="#1A1626"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              {unreadCount > 0 && <View style={styles.notificationDot} />}
            </Pressable>

            {/* Profile Avatar */}
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalPop();
                setShowProfileModal(true);
              }}
              style={({ pressed }) => [
                styles.profilePhotoBtn,
                styles.profilePhotoBtnPro,
                pressed && styles.headerIconBtnPressed,
              ]}
              hitSlop={8}
            >
              <Image
                source={userProfile?.avatarSource || require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerCustomAvatarImage}
                resizeMode="cover"
              />
              <View style={{ position: 'absolute', bottom: -2, right: -2 }}>
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
          {/* TOP TAGS ROW: MATCH — PRO & PRO MATCH ACTIVE */}
          <View style={styles.topTagsRow}>
            <View style={styles.matchProPill}>
              <Text style={styles.matchProPillText}>MATCH — PRO</Text>
            </View>

            <View style={styles.proMatchActivePill}>
              <Text style={styles.proMatchActivePillText}>👑 PRO MATCH ACTIVE</Text>
            </View>
          </View>

          {/* MAIN HEADLINE & SUBTITLE */}
          <Text style={styles.mainTitleText}>Welcome to the Creator Arena.</Text>
          <Text style={styles.mainSubtitleText}>
            Discover high-fit creators, build smarter collaborations and level up with your squad.
          </Text>

          {/* ============================================================ */}
          {/* CARD 1: 2x2 DISCOVERY HUB & FILTER CHIPS                     */}
          {/* ============================================================ */}
          <View style={styles.discoveryHubCard}>
            <View style={styles.metricsGrid2x2}>
              {/* 1. Discovery */}
              <Pressable
                style={styles.metricHubItem}
                onPress={() => showToast('Unlimited Discovery active on Pro!')}
              >
                <Text style={styles.metricHubLabel}>DISCOVERY</Text>
                <Text style={styles.metricHubValPurple}>Unlimited ›</Text>
              </Pressable>

              {/* 2. Priority */}
              <Pressable
                style={styles.metricHubItem}
                onPress={() => showToast('4 AI Priority matches ready in queue')}
              >
                <Text style={styles.metricHubLabel}>PRIORITY</Text>
                <Text style={styles.metricHubValPurple}>4 Matches ›</Text>
              </Pressable>

              {/* 3. Mutual */}
              <Pressable
                style={styles.metricHubItem}
                onPress={() => showToast('3 Creators mutually matched with you!')}
              >
                <Text style={styles.metricHubLabel}>MUTUAL</Text>
                <Text style={styles.metricHubValPurple}>3 Matches ›</Text>
              </Pressable>

              {/* 4. Squad */}
              <Pressable
                style={styles.metricHubItem}
                onPress={() => {
                  triggerModalPop();
                  setShowSquadModal(true);
                }}
              >
                <Text style={styles.metricHubLabel}>SQUAD</Text>
                <Text style={styles.metricHubValPurple}>1 Invitation ›</Text>
              </Pressable>
            </View>

            {/* QUICK FILTERS ROW */}
            <View style={styles.quickFiltersRow}>
              {['Same Niche', 'Nearby', 'High Fit', 'Available This Week'].map((f, idx) => {
                const isSelected = f === selectedFilter;
                return (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setSelectedFilter(f);
                    }}
                    style={[styles.quickFilterChip, isSelected && styles.quickFilterChipActive]}
                  >
                    <Text style={[styles.quickFilterChipText, isSelected && styles.quickFilterChipTextActive]}>
                      {f}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 2: SMART FILTERS                                     */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.smartFiltersTitle}>SMART FILTERS</Text>
            <Pressable
              style={styles.proFiltersPill}
              onPress={() => showToast('Advanced AI Filter Presets Unlocked!')}
            >
              <Text style={styles.proFiltersText}>✨ Pro Filters</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
            {['Same Niche', 'High Fit', 'Content Style', 'Follower Range', 'Location'].map((filter, i) => {
              const isSelected = filter === selectedFilter;
              return (
                <Pressable
                  key={i}
                  onPress={() => setSelectedFilter(filter)}
                  style={[styles.smartFilterPill, isSelected && styles.smartFilterPillActive]}
                >
                  <Text style={[styles.smartFilterPillText, isSelected && styles.smartFilterPillTextActive]}>
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ============================================================ */}
          {/* CARD 3: SWIPEABLE CREATOR CARD STACK                         */}
          {/* ============================================================ */}
          <View style={styles.cardStackWrapper}>
            <Animated.View
              {...panResponder.panHandlers}
              style={[styles.featuredCreatorCard, rotateAndTranslate]}
            >
              {/* Photo & Collaboration Fit Badge */}
              <View style={styles.creatorImageContainer}>
                <Image
                  source={currentCreator.coverImage}
                  style={styles.creatorCoverImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(15, 10, 30, 0.85)']}
                  style={styles.photoGradientOverlay}
                />

                <View style={styles.collabFitBadge}>
                  <Text style={styles.collabFitBadgeText}>{currentCreator.matchScore}% Collaboration Fit</Text>
                </View>

                <View style={styles.creatorNameLocationBox}>
                  <Text style={styles.creatorHeroName}>{currentCreator.name}</Text>
                  <Text style={styles.creatorHeroLocation}>📍 {currentCreator.location}</Text>
                </View>
              </View>

              {/* Metrics Strip */}
              <View style={styles.creatorMetricsStrip}>
                <View style={styles.metricItemBox}>
                  <Text style={styles.metricSmallLabel}>FOLLOWERS</Text>
                  <Text style={styles.metricBoldVal}>{currentCreator.followers}</Text>
                </View>

                <View style={styles.metricDividerLine} />

                <View style={styles.metricItemBox}>
                  <Text style={styles.metricSmallLabel}>STREAK</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.metricBoldVal, { color: '#582CDB' }]}>{currentCreator.streak} 🔥</Text>
                    <Text style={{ fontSize: 12, color: '#582CDB', fontWeight: '900' }}>↗</Text>
                  </View>
                </View>

                <View style={styles.metricDividerLine} />

                <View style={styles.metricItemBox}>
                  <Text style={styles.metricSmallLabel}>PLATFORM</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                    <Text style={{ fontSize: 16 }}>📷</Text>
                    <Text style={{ fontSize: 16 }}>🎵</Text>
                  </View>
                </View>
              </View>

              {/* Tags & Availability */}
              <View style={styles.creatorTagsRow}>
                {currentCreator.tags.map((tag, idx) => {
                  const isGold = tag === 'Available This Week';
                  return (
                    <View key={idx} style={isGold ? styles.goldAvailPill : styles.grayNichePill}>
                      <Text style={isGold ? styles.goldAvailText : styles.grayNicheText}>{tag}</Text>
                    </View>
                  );
                })}
              </View>

              {/* WHY THIS MATCH CALLOUT */}
              <View style={styles.whyMatchContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontSize: 14 }}>💡</Text>
                  <Text style={styles.whyMatchHeading}>WHY THIS MATCH?</Text>
                </View>
                <Text style={styles.whyMatchBodyText}>{currentCreator.whyMatch}</Text>

                <View style={styles.sparkleCalloutRow}>
                  <Image
                    source={require('../../assets/images/jarvis-ghost-clean.png')}
                    style={{ width: 18, height: 18 }}
                    resizeMode="contain"
                  />
                  <Text style={styles.sparkleCalloutText}>
                    Potential reach: high discovery exposure for both.
                  </Text>
                </View>
              </View>

              {/* 3-BUTTON ACTION BAR */}
              <View style={styles.actionButtonsRow}>
                <Pressable
                  style={({ pressed }) => [styles.passOutlineBtn, pressed && styles.btnPressed]}
                  onPress={swipeLeft}
                >
                  <Text style={styles.passBtnText}>Pass</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.saveOutlineBtn, pressed && styles.btnPressed]}
                  onPress={swipeUp}
                >
                  <Text style={styles.saveBtnText}>Save</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.connectSolidBtn, pressed && styles.btnPressed]}
                  onPress={swipeRight}
                >
                  <Text style={styles.connectBtnText}>⚡ Connect</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 4: AI COLLABORATION PLAN                             */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.collabSectionTitle}>AI Collaboration Plan</Text>
            <View style={styles.proMatchInsightPill}>
              <Text style={styles.proMatchInsightText}>PRO MATCH INSIGHT</Text>
            </View>
          </View>

          <View style={styles.collabPlanCard}>
            <Text style={styles.proposedConceptLabel}>PROPOSED CONCEPT</Text>
            <Text style={styles.proposedConceptTitle}>&ldquo;{currentCreator.proposedConcept}&rdquo;</Text>
            <Text style={styles.proposedConceptDesc}>{currentCreator.conceptDesc}</Text>

            <View style={styles.formatPillsRow}>
              <View style={styles.formatPillGray}>
                <Text style={styles.formatPillGrayText}>🎬 Reel (30–45 sec)</Text>
              </View>
              <View style={styles.formatPillGray}>
                <Text style={styles.formatPillGrayText}>🗓️ Sat, 2 PM</Text>
              </View>
              <View style={styles.formatPillGold}>
                <Text style={styles.formatPillGoldText}>📈 High discovery potential</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.buildPlanBtn, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowCollabPlanModal(true);
              }}
            >
              <Text style={styles.buildPlanBtnText}>Build Collaboration Plan</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* SECTION 5: YOUR CREATOR SQUAD                                */}
          {/* ============================================================ */}
          <Text style={styles.squadSectionHeaderTitle}>Your Creator Squad</Text>

          <View style={styles.squadMainCard}>
            <View style={styles.squadHeaderRow}>
              <View>
                <Text style={styles.squadNameText}>Momentum Makers</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <View style={styles.squadLevelPill}>
                    <Text style={styles.squadLevelText}>LEVEL 12</Text>
                  </View>
                  <Text style={styles.squadStreakText}>78-Day Streak</Text>
                </View>
              </View>

              {/* Stacked Avatar Group */}
              <View style={styles.stackedAvatarsRow}>
                <Image source={require('../../assets/images/elena-avatar.jpg')} style={[styles.squadMiniAvatar, { zIndex: 3 }]} />
                <Image source={require('../../assets/images/amara-avatar.jpg')} style={[styles.squadMiniAvatar, { marginLeft: -10, zIndex: 2 }]} />
                <Image source={require('../../assets/images/david-avatar.jpg')} style={[styles.squadMiniAvatar, { marginLeft: -10, zIndex: 1 }]} />
                <View style={styles.squadPlusBadge}>
                  <Text style={styles.squadPlusText}>+1</Text>
                </View>
              </View>
            </View>

            <View style={styles.squadMetricsRow}>
              <Text style={styles.squadGoalText}>🎯 Goal: 8 posts this week</Text>
              <Text style={styles.squadActiveText}>⚡ 3 of 4 active today</Text>
            </View>

            {/* XP PROGRESS BAR */}
            <View style={{ marginTop: 10, marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.squadXpLabel}>8,450 XP</Text>
                <Text style={styles.squadLevelNextLabel}>LEVEL 13</Text>
              </View>
              <View style={styles.squadXpTrackBg}>
                <LinearGradient
                  colors={['#582CDB', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.squadXpTrackFill, { width: '84%' }]}
                />
              </View>
            </View>

            <Text style={styles.nextUnlockText}>Next unlock: Priority Match Boost</Text>

            <View style={styles.squadActionButtonsRow}>
              <Pressable
                style={({ pressed }) => [styles.openSquadSolidBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  triggerModalPop();
                  setShowSquadModal(true);
                }}
              >
                <Text style={styles.openSquadSolidBtnText}>Open Squad</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.findSquadOutlineBtn, pressed && styles.btnPressed]}
                onPress={() => showToast('Searching for verified public squads...')}
              >
                <Text style={styles.findSquadOutlineBtnText}>Find a Squad</Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 6: LIVE DUEL BANNER                                     */}
          {/* ============================================================ */}
          <View style={styles.liveDuelBannerCard}>
            <View style={styles.duelTrophyBox}>
              <Text style={{ fontSize: 20 }}>🏆</Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.liveDuelTag}>LIVE DUEL</Text>
              </View>
              <Text style={styles.duelTitleText}>Momentum Makers vs Lagos Storytellers</Text>
            </View>

            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={styles.duelScoreText}>62 pts • 58 pts</Text>
              <Pressable
                style={styles.viewDuelPillBtn}
                onPress={() => showToast('Momentum Makers leads by 4 points!')}
              >
                <Text style={styles.viewDuelPillText}>View Duel</Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 7: QUICK ACTIONS                                     */}
          {/* ============================================================ */}
          <Text style={styles.quickActionsSectionTitle}>Quick Actions</Text>

          <View style={{ gap: 8, marginBottom: 16 }}>
            {/* Quick Action 1 */}
            <View style={styles.quickActionItemCard}>
              <Image source={require('../../assets/images/tomi-avatar.jpg')} style={styles.quickActionAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.quickActionName}>Tomi Adebayo</Text>
                <Text style={styles.quickActionSub}>Idea waiting • 2h ago</Text>
              </View>
              <Pressable
                style={styles.openPlanPillBtn}
                onPress={() => {
                  triggerModalPop();
                  setShowCollabPlanModal(true);
                }}
              >
                <Text style={styles.openPlanPillText}>Open Plan</Text>
              </Pressable>
            </View>

            {/* Quick Action 2 */}
            <View style={styles.quickActionItemCard}>
              <Image source={require('../../assets/images/zainab-avatar.jpg')} style={styles.quickActionAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.quickActionName}>Zainab Okafor</Text>
                <Text style={styles.quickActionSub}>Mutual Match</Text>
              </View>
              <Pressable
                style={styles.messageOutlinePillBtn}
                onPress={() => {
                  if (onOpenMessages) onOpenMessages();
                }}
              >
                <Text style={styles.messageOutlinePillText}>Message</Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 8: JARVIS CO-OP INTELLIGENCE                            */}
          {/* ============================================================ */}
          <View style={[styles.coopIntelligenceCard, { marginBottom: 120 }]}>
            <Image
              source={require('../../assets/images/jarvis-ghost-clean.png')}
              style={{ width: 28, height: 28, alignSelf: 'center', marginBottom: 8 }}
              resizeMode="contain"
            />
            <Text style={styles.coopIntelligenceQuote}>
              &ldquo;Creators who publish on a similar rhythm are more likely to complete collaborations successfully.&rdquo;
            </Text>
            <Text style={styles.coopIntelligenceTag}>JARVIS CO-OP INTELLIGENCE</Text>
          </View>
        </ScrollView>

        {/* 10. FLOATING LIQUID GLASS BOTTOM NAVIGATION BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* ============================================================ */}
        {/* MODAL: AI COLLABORATION PLAN                                 */}
        {/* ============================================================ */}
        <Modal
          visible={showCollabPlanModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCollabPlanModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <View style={styles.proMatchInsightPill}>
                    <Text style={styles.proMatchInsightText}>AI COLLAB BLUEPRINT</Text>
                  </View>
                  <Text style={[styles.modalTitle, { marginTop: 4 }]}>&ldquo;{currentCreator.proposedConcept}&rdquo;</Text>
                  <Text style={styles.modalSubtitle}>Co-created for {userProfile?.name || 'Pablo'} &amp; {currentCreator.name}</Text>
                </View>
                <Pressable onPress={() => setShowCollabPlanModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 280, marginVertical: 10 }}>
                <Text style={styles.planStepTitle}>🎬 PART 1: THE DUAL HOOK (0-5s)</Text>
                <Text style={styles.planStepBody}>
                  &ldquo;We run creator channels in two completely different ways — here is what happens when we swap workflows for 24 hours.&rdquo;
                </Text>

                <Text style={styles.planStepTitle}>🔥 PART 2: THE CHALLENGE (5-30s)</Text>
                <Text style={styles.planStepBody}>
                  Show rapid-fire B-roll of editing shortcuts, script hooks, and audience engagement tests.
                </Text>

                <Text style={styles.planStepTitle}>🎯 PART 3: THE SQUAD CTA (30-45s)</Text>
                <Text style={styles.planStepBody}>
                  &ldquo;Drop a comment below on whose workflow you would try!&rdquo;
                </Text>
              </ScrollView>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setShowCollabPlanModal(false);
                  showToast(`Collab Blueprint sent to ${currentCreator.name}!`);
                }}
              >
                <Text style={styles.modalFullBtnText}>Send Collab Pitch ➔</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: SQUAD DASHBOARD                                       */}
        {/* ============================================================ */}
        <Modal
          visible={showSquadModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSquadModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Momentum Makers</Text>
                  <Text style={styles.modalSubtitle}>Squad Level 12 • 78-Day Collective Streak</Text>
                </View>
                <Pressable onPress={() => setShowSquadModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 8, marginVertical: 10 }}>
                <Text style={styles.squadMemberRow}>• {userProfile?.name || 'Pablo'} (You) — 47-Day Streak (Active 🔥)</Text>
                <Text style={styles.squadMemberRow}>• Amara Okafor — 44-Day Streak (Active 🔥)</Text>
                <Text style={styles.squadMemberRow}>• Elena Rostova — 52-Day Streak (Active 🔥)</Text>
                <Text style={styles.squadMemberRow}>• David Adebayo — 61-Day Streak (Queued ⚡)</Text>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setShowSquadModal(false);
                  showToast('Squad Daily Boost activated! +200 Squad XP');
                }}
              >
                <Text style={styles.modalFullBtnText}>Boost Squad (+200 XP) 🚀</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: MATCH CELEBRATION                                     */}
        {/* ============================================================ */}
        <Modal
          visible={showCelebrationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCelebrationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <Text style={{ fontSize: 44, textAlign: 'center', marginBottom: 8 }}>🤝🔥</Text>
              <Text style={[styles.modalTitle, { textAlign: 'center' }]}>It&apos;s a Collab Match!</Text>
              <Text style={[styles.modalSubtitle, { textAlign: 'center', marginVertical: 6 }]}>
                You and {currentCreator.name} both want to collaborate.
              </Text>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <Pressable
                  style={[styles.modalFullBtn, { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }]}
                  onPress={() => setShowCelebrationModal(false)}
                >
                  <Text style={[styles.modalFullBtnText, { color: '#171420' }]}>Keep Swiping</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalFullBtn, { flex: 1 }]}
                  onPress={() => {
                    setShowCelebrationModal(false);
                    if (onOpenMessages) onOpenMessages();
                  }}
                >
                  <Text style={styles.modalFullBtnText}>Message Now ➔</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

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
        {toastMessage && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
  },
  headerLogoWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    width: 28,
    height: 28,
  },
  proHeaderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  proHeaderBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#92400E',
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
    borderRadius: 19,
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
  headerIconBtnPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.8,
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  profilePhotoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profilePhotoBtnPro: {
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  headerCustomAvatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  addPhotoPlusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  addPhotoPlusText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // HERO TAGS & HEADLINE
  topTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  matchProPill: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  matchProPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  proMatchActivePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  proMatchActivePillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#92400E',
  },
  mainTitleText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  mainSubtitleText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },

  // CARD 1: DISCOVERY HUB
  discoveryHubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
    marginBottom: 16,
  },
  metricsGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 12,
  },
  metricHubItem: {
    width: '48%',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
  },
  metricHubLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricHubValPurple: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#582CDB',
  },
  quickFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickFilterChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  quickFilterChipActive: {
    backgroundColor: '#582CDB',
  },
  quickFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  quickFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // SECTION 2: SMART FILTERS
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  smartFiltersTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  proFiltersPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proFiltersText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#582CDB',
  },
  filterPillsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 16,
  },
  smartFilterPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  smartFilterPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  smartFilterPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  smartFilterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // CARD 3: CREATOR SWIPE CARD
  cardStackWrapper: {
    marginBottom: 20,
  },
  featuredCreatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#EFECE6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  creatorImageContainer: {
    height: 280,
    position: 'relative',
  },
  creatorCoverImage: {
    width: '100%',
    height: '100%',
  },
  photoGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  collabFitBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#582CDB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  collabFitBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  creatorNameLocationBox: {
    position: 'absolute',
    bottom: 14,
    left: 16,
  },
  creatorHeroName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  creatorHeroLocation: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 2,
  },
  creatorMetricsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metricItemBox: {
    alignItems: 'center',
  },
  metricSmallLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 2,
  },
  metricBoldVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
  },
  metricDividerLine: {
    width: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
  },
  creatorTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 14,
  },
  grayNichePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  grayNicheText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  goldAvailPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  goldAvailText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#92400E',
  },
  whyMatchContainer: {
    backgroundColor: '#F5F3FF',
    marginHorizontal: 14,
    marginBottom: 16,
    borderRadius: 16,
    padding: 14,
  },
  whyMatchHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  whyMatchBodyText: {
    fontSize: 12.5,
    color: '#4C1D95',
    lineHeight: 18,
    marginBottom: 10,
  },
  sparkleCalloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sparkleCalloutText: {
    fontSize: 11,
    color: '#6D28D9',
    fontWeight: '700',
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  passOutlineBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  passBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  saveOutlineBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  connectSolidBtn: {
    flex: 2,
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // SECTION 4: AI COLLABORATION PLAN
  collabSectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
  },
  proMatchInsightPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proMatchInsightText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#582CDB',
  },
  collabPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 18,
    marginBottom: 20,
  },
  proposedConceptLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  proposedConceptTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 6,
  },
  proposedConceptDesc: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  formatPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  formatPillGray: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  formatPillGrayText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  formatPillGold: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  formatPillGoldText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#92400E',
  },
  buildPlanBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  buildPlanBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#582CDB',
  },

  // SECTION 5: CREATOR SQUAD
  squadSectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 10,
  },
  squadMainCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 18,
    marginBottom: 16,
  },
  squadHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  squadNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
  },
  squadLevelPill: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  squadLevelText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  squadStreakText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  stackedAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  squadMiniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  squadPlusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  squadPlusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  squadMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  squadGoalText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  squadActiveText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#15803D',
  },
  squadXpLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
  },
  squadLevelNextLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  squadXpTrackBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  squadXpTrackFill: {
    height: '100%',
    borderRadius: 3,
  },
  nextUnlockText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 14,
  },
  squadActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  openSquadSolidBtn: {
    flex: 1,
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  openSquadSolidBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  findSquadOutlineBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  findSquadOutlineBtnText: {
    color: '#171420',
    fontSize: 13,
    fontWeight: '800',
  },

  // CARD 6: LIVE DUEL
  liveDuelBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  duelTrophyBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveDuelTag: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  duelTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
    marginTop: 1,
  },
  duelScoreText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#582CDB',
  },
  viewDuelPillBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  viewDuelPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#171420',
  },

  // SECTION 7: QUICK ACTIONS
  quickActionsSectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 10,
  },
  quickActionItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 12,
    gap: 12,
  },
  quickActionAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  quickActionName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
  },
  quickActionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  openPlanPillBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  openPlanPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  messageOutlinePillBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  messageOutlinePillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#171420',
  },

  // CARD 8: COOP INTELLIGENCE
  coopIntelligenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 18,
    alignItems: 'center',
  },
  coopIntelligenceQuote: {
    fontSize: 13,
    fontWeight: '600',
    color: '#171420',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  coopIntelligenceTag: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.5,
  },

  // MODALS
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 10, 30, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseCross: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '900',
  },
  modalFullBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  modalFullBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  planStepTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#582CDB',
    marginTop: 10,
    marginBottom: 3,
  },
  planStepBody: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  squadMemberRow: {
    fontSize: 12.5,
    color: '#171420',
    fontWeight: '700',
    lineHeight: 20,
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
    fontSize: 12,
    fontWeight: '800',
  },
});
