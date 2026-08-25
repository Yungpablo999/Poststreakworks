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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

interface ContentAngleScreenProps {
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onUseIdea?: (ideaTitle: string) => void;
  onOpenMessages?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  iconEmoji: string;
  badgeBg: string;
  badgeBorder: string;
}

interface IdeaCardItem {
  id: string;
  title: string;
  desc?: string;
  tags: string[];
  format: string;
  goal: string;
  bookmarked: boolean;
}

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Peak Reach Window Active',
    body: '7:30 PM is your optimal viral slot on TikTok & Instagram.',
    time: '5m ago',
    unread: true,
    iconEmoji: '⚡',
    badgeBg: '#EDE9FE',
    badgeBorder: '#DDD6FE',
  },
  {
    id: 'n2',
    title: 'Streak Saver Ready',
    body: "Convert today's idea into a post to keep your 47-day streak.",
    time: '2h ago',
    unread: true,
    iconEmoji: '🔥',
    badgeBg: '#FEF3C7',
    badgeBorder: '#FDE68A',
  },
];

const ALL_IDEAS_LIST: IdeaCardItem[] = [
  {
    id: 'idea_1',
    title: '3 creator habits that made posting easier',
    format: 'Short Reel',
    goal: 'Build consistency',
    tags: ['Reel', 'Habits'],
    bookmarked: false,
  },
  {
    id: 'idea_2',
    title: 'My simple content planning routine',
    format: 'Carousel',
    goal: 'Get saves',
    tags: ['Carousel', 'Planning'],
    bookmarked: true,
  },
  {
    id: 'idea_3',
    title: 'The exact gear I use to film in 10 minutes',
    format: 'TikTok / Short',
    goal: 'Gear review',
    tags: ['Short', 'Gear'],
    bookmarked: false,
  },
  {
    id: 'idea_4',
    title: 'How I turn 1 idea into 4 different posts across platforms',
    format: 'Carousel / Reel',
    goal: 'Content Repurposing',
    tags: ['Growth', 'Repurposing'],
    bookmarked: false,
  },
  {
    id: 'idea_5',
    title: 'The #1 mistake that cost me 3 months of momentum',
    format: 'Talking Head',
    goal: 'Relatable Story',
    tags: ['Story', 'Retention'],
    bookmarked: false,
  },
  {
    id: 'idea_6',
    title: 'My 15-minute morning batch-filming routine',
    format: 'Mini Vlog',
    goal: 'Protect streak',
    tags: ['Routine', 'Vlog'],
    bookmarked: false,
  },
  {
    id: 'idea_7',
    title: 'Stop doing this if you want your posts to get shared',
    format: 'Short Reel',
    goal: 'High shares',
    tags: ['Viral Hook', 'Shares'],
    bookmarked: false,
  },
];

export const ContentAngleScreen: React.FC<ContentAngleScreenProps> = ({
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
  onUseIdea,
  onOpenMessages,

  userProfile,
  onSaveProfile,}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('create');

  // Niche & Goal Filters (Select & Unselect)
  const [selectedNiches, setSelectedNiches] = useState<string[]>(['Creator Advice']);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Grow engagement', 'Protect streak']);

  // Idea items state
  const [isHeroSaved, setIsHeroSaved] = useState(false);
  const [allIdeas, setAllIdeas] = useState<IdeaCardItem[]>(ALL_IDEAS_LIST);
  const [showAllIdeas, setShowAllIdeas] = useState(false);
  const [savedIdeasCount, setSavedIdeasCount] = useState(2);
  const [quotaUsed, setQuotaUsed] = useState(3);
  const [selectedAngleFilters, setSelectedAngleFilters] = useState<string[]>(['faster']);
  const [selectedJarvisChips, setSelectedJarvisChips] = useState<string[]>([]);

  // Modals
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Idea Generated!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('New batch of viral content angles added to your vault.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('Great work exploring new creator angles!');

  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>(NOTIFICATIONS);

  // Animations
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const modalPopScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const floatAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -4,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    floatAnim.start();
    return () => floatAnim.stop();
  }, [flameFloatY]);

  const triggerModalAnim = () => {
    modalPopScale.setValue(0.9);
    Animated.spring(modalPopScale, {
      toValue: 1,
      tension: 65,
      friction: 8,
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

  const toggleNiche = (niche: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedNiches.includes(niche)) {
      setSelectedNiches(selectedNiches.filter((n) => n !== niche));
    } else {
      setSelectedNiches([...selectedNiches, niche]);
    }
  };

  const toggleGoal = (goal: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const toggleAngleFilter = (filterId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedAngleFilters.includes(filterId)) {
      setSelectedAngleFilters(selectedAngleFilters.filter((f) => f !== filterId));
    } else {
      setSelectedAngleFilters([...selectedAngleFilters, filterId]);
    }
  };

  const toggleJarvisChip = (chipId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedJarvisChips.includes(chipId)) {
      setSelectedJarvisChips(selectedJarvisChips.filter((c) => c !== chipId));
    } else {
      setSelectedJarvisChips([...selectedJarvisChips, chipId]);
    }
  };

  const handleToggleHeroSave = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const nextSaved = !isHeroSaved;
    setIsHeroSaved(nextSaved);
    setSavedIdeasCount((c) => (nextSaved ? c + 1 : Math.max(0, c - 1)));

    if (nextSaved) {
      setCelebrationTitle('Idea Saved!');
      setCelebrationSubtitle('"One thing I wish I knew before I started creating" has been saved to your vault.');
      setCelebrationSpeech('47-day streak protected! Idea ready to turn into a post anytime.');
      setShowCelebrationModal(true);
    }
  };

  const toggleBookmark = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    let savedTitle = '';
    let becameSaved = false;

    setAllIdeas((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = !item.bookmarked;
          becameSaved = next;
          savedTitle = item.title;
          setSavedIdeasCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
          return { ...item, bookmarked: next };
        }
        return item;
      })
    );

    if (becameSaved) {
      setCelebrationTitle('Idea Saved!');
      setCelebrationSubtitle(`"${savedTitle}" has been saved to your vault.`);
      setCelebrationSpeech('47-day streak protected! Idea ready in your vault.');
      setShowCelebrationModal(true);
    }
  };

  const handleSelectIdea = (ideaTitle: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (onUseIdea) {
      onUseIdea(ideaTitle);
    }
  };

  const handleToggleViewAll = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowAllIdeas((prev) => !prev);
  };

  const handleGenerateMoreIdeas = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (quotaUsed < 5) {
      setQuotaUsed((q) => q + 1);
    }

    const newIdea: IdeaCardItem = {
      id: `idea_${Date.now()}`,
      title: 'How I turn 1 idea into 4 different posts across platforms',
      format: 'Short Reel',
      goal: 'Content Repurposing',
      tags: ['Growth', 'Workflow'],
      bookmarked: false,
    };

    setAllIdeas([newIdea, ...allIdeas]);
    setCelebrationTitle('New Ideas Generated!');
    setCelebrationSubtitle('Fresh angles tailored for your niche are ready to create.');
    setCelebrationSpeech('47-day streak protected! Keep up this awesome momentum.');
    setShowCelebrationModal(true);
  };

  const unreadNotifCount = notificationsList.filter((n) => n.unread).length;
  const displayedIdeas = showAllIdeas ? allIdeas : allIdeas.slice(0, 2);

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0C0A12" : "#FAF8F5"} />
      <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
        {/* 1. TOP AIRY HEADER BAR (UNIFIED APP-WIDE) */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeftGroup}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onBack();
              }}
              style={({ pressed }) => [styles.backCircleBtn, pressed && styles.btnPressed]}
              hitSlop={8}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M15 18L9 12L15 6" stroke="#171420" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>

            {/* Mascot Logo with Floating Animation */}
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

          {/* Right Icons: Messages, Notification Bell, Profile */}
          <View style={styles.headerRightGroup}>
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenMessages) {
                  onOpenMessages();
                } else {
                  triggerModalAnim();
                  setShowChatModal(true);
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

            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                triggerModalAnim();
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
              {unreadNotifCount > 0 && <View style={styles.notificationDot} />}
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                triggerModalAnim();
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
          {/* Top Pill Badge (Free Ideas) */}
          <View style={styles.topBadgesRow}>
            <View style={styles.freeIdeasPill}>
              <View style={styles.freeIdeasDot} />
              <Text style={styles.freeIdeasPillText}>Free Ideas</Text>
            </View>
          </View>

          {/* Main Headline & Subtitle */}
          <Text style={styles.mainTitle}>Find your next content angle.</Text>
          <Text style={styles.mainSubtitle}>
            Choose your niche and goal, then generate ideas you can turn into posts.
          </Text>

          {/* 1. NICHE PILLS ROW (SELECT & UNSELECT) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsRow}
          >
            {['Creator Advice', 'Lifestyle', 'Comedy', 'Education', 'Fitness'].map((niche) => {
              const isSelected = selectedNiches.includes(niche);
              return (
                <Pressable
                  key={niche}
                  onPress={() => toggleNiche(niche)}
                  style={[
                    styles.filterPill,
                    isSelected && styles.filterPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isSelected && styles.filterPillTextActive,
                    ]}
                  >
                    {niche}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 2. GOAL PILLS ROW (SELECT & UNSELECT) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsRow}
          >
            {[
              { id: 'Grow engagement', label: 'Grow engagement' },
              { id: 'Protect streak', label: '⚡ Protect streak' },
              { id: 'Get saves', label: 'Get saves' },
              { id: 'Start conversation', label: 'Start conversation' },
            ].map((goal) => {
              const isSelected = selectedGoals.includes(goal.id);
              return (
                <Pressable
                  key={goal.id}
                  onPress={() => toggleGoal(goal.id)}
                  style={[
                    styles.filterPill,
                    isSelected && styles.filterPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isSelected && styles.filterPillTextActive,
                    ]}
                  >
                    {goal.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 3. HERO STREAK SAVER PICK CARD */}
          <View style={styles.heroIdeaCard}>
            {/* Header Badge */}
            <View style={styles.heroBadgeRow}>
              <View style={styles.streakSaverPickBadge}>
                <Text style={styles.streakSaverPickStar}>⭐</Text>
                <Text style={styles.streakSaverPickText}>STREAK SAVER PICK</Text>
              </View>
            </View>

            {/* Title & Desc */}
            <Text style={styles.heroIdeaTitle}>
              &ldquo;One thing I wish I knew before I started creating&rdquo;
            </Text>
            <Text style={styles.heroIdeaDesc}>
              Share one honest lesson that would help another creator stay consistent or avoid a mistake.
            </Text>

            {/* Why It Works Inner Box */}
            <View style={styles.whyItWorksBox}>
              <Text style={styles.whyItWorksLabel}>WHY IT WORKS</Text>
              <Text style={styles.whyItWorksText}>
                Personal lessons are fast to create and easy for audiences to save.
              </Text>
            </View>

            {/* Tags Row */}
            <View style={styles.heroTagsRow}>
              <View style={styles.heroTagPill}>
                <Text style={styles.heroTagPillText}>Personal Lesson</Text>
              </View>
              <View style={styles.heroTagPill}>
                <Text style={styles.heroTagPillText}>30-sec Reel</Text>
              </View>
              <View style={styles.heroSaveTagPill}>
                <Text style={styles.heroSaveTagPillText}>High Save Potential</Text>
              </View>
            </View>

            {/* Action Row: Use Idea + Bookmark */}
            <View style={styles.heroActionRow}>
              <Pressable
                style={({ pressed }) => [styles.useIdeaMainBtn, pressed && styles.btnPressed]}
                onPress={() => handleSelectIdea('One thing I wish I knew before I started creating')}
              >
                <LinearGradient
                  colors={['#7C3AED', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.useIdeaMainGradient}
                >
                  <Text style={styles.useIdeaMainBtnText}>Use Idea</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.bookmarkIconBtn,
                  isHeroSaved && styles.bookmarkIconBtnActive,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleToggleHeroSave}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill={isHeroSaved ? '#FFFFFF' : 'none'}>
                  <Path
                    d="M19 21L12 16L5 21V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21Z"
                    stroke={isHeroSaved ? '#FFFFFF' : '#582CDB'}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Pressable>
            </View>
          </View>

          {/* 4. MORE IDEAS SECTION (BEAUTIFIED & SEAMLESS EXPANSION) */}
          <View style={styles.moreIdeasHeaderRow}>
            <Text style={styles.moreIdeasTitle}>More Ideas</Text>
            <Pressable onPress={handleToggleViewAll} hitSlop={8}>
              <Text style={styles.viewAllLink}>
                {showAllIdeas ? 'Show Less ‹' : `View All (${allIdeas.length}) ›`}
              </Text>
            </Pressable>
          </View>

          {/* Quick Filters (Select & Unselect Support) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickFilterRow}
            style={{ flexGrow: 0, marginBottom: 14 }}
          >
            {[
              { id: 'faster', label: 'Faster formats' },
              { id: 'saves', label: 'Higher save potential' },
              { id: 'trend', label: 'Trend-based' },
            ].map((f) => {
              const isActive = selectedAngleFilters.includes(f.id);
              return (
                <Pressable
                  key={f.id}
                  onPress={() => toggleAngleFilter(f.id)}
                  style={[
                    styles.quickFilterPill,
                    isActive && styles.quickFilterPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.quickFilterPillText,
                      isActive && styles.quickFilterPillTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* More Idea Cards (Clean & Compact) */}
          {displayedIdeas.map((item) => (
            <View key={item.id} style={styles.moreIdeaCard}>
              <View style={styles.moreIdeaCardHeader}>
                <Text style={styles.moreIdeaCardTitle}>&ldquo;{item.title}&rdquo;</Text>
                <Pressable hitSlop={8}>
                  <Text style={styles.moreIdeaDots}>•••</Text>
                </Pressable>
              </View>

              <View style={styles.moreIdeaMetaRow}>
                <Text style={styles.moreIdeaMetaText}>🎬 {item.format}</Text>
                <Text style={styles.moreIdeaMetaText}>📈 {item.goal}</Text>
              </View>

              <View style={styles.moreIdeaActionRow}>
                <Pressable
                  style={({ pressed }) => [styles.moreIdeaUseBtn, pressed && styles.btnPressed]}
                  onPress={() => handleSelectIdea(item.title)}
                >
                  <Text style={styles.moreIdeaUseBtnText}>Use Idea</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.moreIdeaBookmarkBtn,
                    item.bookmarked && styles.moreIdeaBookmarkBtnActive,
                  ]}
                  onPress={() => toggleBookmark(item.id)}
                >
                  <Svg width={17} height={17} viewBox="0 0 24 24" fill={item.bookmarked ? '#FFFFFF' : 'none'}>
                    <Path
                      d="M19 21L12 16L5 21V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21Z"
                      stroke={item.bookmarked ? '#FFFFFF' : '#582CDB'}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </Pressable>
              </View>
            </View>
          ))}

          {/* 5. DAILY QUOTA CARD */}
          <View style={styles.quotaCard}>
            <View style={styles.quotaHeaderRow}>
              <Text style={styles.quotaLabel}>DAILY QUOTA</Text>
              <Pressable
                onPress={() => {
                  if (onOpenJarvisPro) onOpenJarvisPro();
                }}
                hitSlop={8}
              >
                <Text style={styles.quotaUpgradeLink}>Upgrade ⚡</Text>
              </Pressable>
            </View>

            <Text style={styles.quotaCountText}>{quotaUsed} / 5 used today</Text>

            {/* Gold/Amber Progress Track */}
            <View style={styles.quotaProgressTrack}>
              <View style={[styles.quotaProgressFill, { width: `${(quotaUsed / 5) * 100}%` }]} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.quotaGenerateBtn, pressed && styles.btnPressed]}
              onPress={handleGenerateMoreIdeas}
            >
              <Text style={styles.quotaGenerateBtnText}>Generate More</Text>
            </Pressable>
          </View>

          {/* 6. JARVIS INSIGHT CARD (HARMONIOUS LAVENDER-CREAM) */}
          <LinearGradient
            colors={['#FFFFFF', '#F8F5FE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.jarvisCard}
          >
            <View style={styles.jarvisHeaderRow}>
              <View style={styles.jarvisFlameIconBox}>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={styles.jarvisFlameImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.jarvisTitle}>Jarvis Insight</Text>
            </View>

            <Text style={styles.jarvisBodyText}>
              Ideas based on personal lessons are easier to finish quickly and protect your streak.
            </Text>

            {/* Jarvis Chips (Select & Unselect Support) */}
            <View style={styles.jarvisChipsRow}>
              {[
                { id: 'personal', label: 'Make It Personal' },
                { id: 'hook', label: 'Add Hook' },
              ].map((chip) => {
                const isChipActive = selectedJarvisChips.includes(chip.id);
                return (
                  <Pressable
                    key={chip.id}
                    onPress={() => toggleJarvisChip(chip.id)}
                    style={[
                      styles.jarvisChip,
                      isChipActive && styles.jarvisChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.jarvisChipText,
                        isChipActive && styles.jarvisChipTextActive,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </LinearGradient>

          {/* 7. SAVED IDEAS SECTION */}
          <Text style={styles.sectionHeaderLabel}>SAVED IDEAS ({savedIdeasCount})</Text>
          <Pressable
            style={styles.savedIdeaItemCard}
            onPress={() => handleSelectIdea('My morning setup routine')}
          >
            <View style={styles.savedIdeaIconBox}>
              <Text style={{ fontSize: 16, color: '#64748B' }}>≡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.savedIdeaTitle}>My morning setup routine...</Text>
              <Text style={styles.savedIdeaTime}>Saved 2 h ago</Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M9 18L15 12L9 6" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>

          {/* 8. PRIMARY BOTTOM ACTION: GENERATE MORE IDEAS */}
          <Pressable
            style={({ pressed }) => [styles.generateMoreMainBtn, pressed && styles.btnPressed]}
            onPress={handleGenerateMoreIdeas}
          >
            <LinearGradient
              colors={['#7C3AED', '#582CDB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateMoreMainGradient}
            >
              <Text style={styles.generateMoreMainBtnText}>✨ Generate More Ideas</Text>
            </LinearGradient>
          </Pressable>

          {/* Bottom spacing to clear floating tab bar */}
          <View style={{ height: 110 }} />
        </ScrollView>

        {/* UNIFIED SIGNATURE FLOATING TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* MODAL: NOTIFICATIONS CENTER */}
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
                  <Text style={styles.modalTitle}>Notifications</Text>
                  <Text style={styles.modalSubtitle}>Streak updates &amp; creator alerts</Text>
                </View>
                <Pressable
                  onPress={() => setShowNotificationModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                {notificationsList.map((notif) => (
                  <View key={notif.id} style={[styles.notifCard, notif.unread && styles.notifCardUnread]}>
                    <View style={[styles.notifBadge, { backgroundColor: notif.badgeBg, borderColor: notif.badgeBorder }]}>
                      <Text style={{ fontSize: 16 }}>{notif.iconEmoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{notif.title}</Text>
                      <Text style={styles.notifBody}>{notif.body}</Text>
                      <Text style={styles.notifTime}>{notif.time}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setNotificationsList(notificationsList.map((n) => ({ ...n, unread: false })));
                  setShowNotificationModal(false);
                }}
              >
                <Text style={styles.modalFullBtnText}>Mark All Read &amp; Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL: CREATOR PROFILE PASSPORT */}
        {/* UNIVERSAL CREATOR PASSPORT & PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />

        {/* MODAL: CREATOR CHAT */}
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
                  <Text style={styles.modalTitle}>Jarvis AI Chat</Text>
                  <Text style={styles.modalSubtitle}>Real-time creative assistant</Text>
                </View>
                <Pressable
                  onPress={() => setShowChatModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.chatCard}>
                <Text style={styles.chatSpeaker}>Jarvis AI</Text>
                <Text style={styles.chatMsg}>
                  I filtered these angles based on your 47-day streak history! Personal lessons have your highest completion rate.
                </Text>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowChatModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Close Chat</Text>
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
          badgeText="IDEAS READY"
          xpEarned={30}
          streakCount={47}
          actionText="Keep Exploring ➔"
          onDismiss={() => {
            setShowCelebrationModal(false);
          }}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 135,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  // 1. TOP HEADER
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerLogoWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGhostLogo: {
    width: 40,
    height: 40,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },

  // Top Pill Badges
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  freeIdeasPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8FC',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 4.5,
    paddingHorizontal: 11,
    borderRadius: 100,
    gap: 6,
  },
  freeIdeasDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  freeIdeasPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.4,
  },

  mainTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 4,
    marginTop: 4,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },

  // Filter Pills Rows
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  filterPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 7,
    paddingHorizontal: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  filterPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Hero Streak Saver Card
  heroIdeaCard: {
    backgroundColor: '#FAF8FE',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    padding: 18,
    marginTop: 6,
    marginBottom: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  streakSaverPickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 5,
  },
  streakSaverPickStar: {
    fontSize: 12,
  },
  streakSaverPickText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  heroIdeaTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 23,
    marginBottom: 8,
  },
  heroIdeaDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  whyItWorksBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    padding: 12,
    marginBottom: 14,
  },
  whyItWorksLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6D28D9',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  whyItWorksText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  heroTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  heroTagPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  heroTagPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  heroSaveTagPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  heroSaveTagPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  useIdeaMainBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  useIdeaMainGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useIdeaMainBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  bookmarkIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bookmarkIconBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  // 4. More Ideas Section
  moreIdeasHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  moreIdeasTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
  },
  viewAllLink: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  quickFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  quickFilterPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  quickFilterPillActive: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  quickFilterPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  quickFilterPillTextActive: {
    color: '#6D28D9',
    fontWeight: '800',
  },

  // More Idea Card (Clean, Compact & Elegant)
  moreIdeaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 15,
    marginBottom: 11,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  moreIdeaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  moreIdeaCardTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 20,
    paddingRight: 10,
  },
  moreIdeaDots: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '800',
  },
  moreIdeaMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  moreIdeaMetaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  moreIdeaActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreIdeaUseBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreIdeaUseBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  moreIdeaBookmarkBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreIdeaBookmarkBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },

  // 5. Daily Quota
  quotaCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  quotaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  quotaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  quotaUpgradeLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  quotaCountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 10,
  },
  quotaProgressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  quotaProgressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  quotaGenerateBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quotaGenerateBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E293B',
  },

  // 6. Jarvis Insight Card
  jarvisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E8E1F7',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  jarvisHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  jarvisFlameIconBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisFlameImage: {
    width: 18,
    height: 18,
  },
  jarvisTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#582CDB',
  },
  jarvisBodyText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  jarvisChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  jarvisChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  jarvisChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#DDD6FE',
  },
  jarvisChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  jarvisChipTextActive: {
    color: '#582CDB',
    fontWeight: '700',
  },

  // 7. Saved Ideas Section
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  savedIdeaItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 14,
    gap: 12,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  savedIdeaIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedIdeaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  savedIdeaTime: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // 8. Generate More Ideas Main Action
  generateMoreMainBtn: {
    height: 50,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  generateMoreMainGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateMoreMainBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171420',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseCross: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  notifCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F5F2EC',
  },
  notifCardUnread: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  notifBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  notifTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  modalFullBtn: {
    backgroundColor: '#582CDB',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalFullBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileModalCardInner: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  profileModalIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileModalName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
  },
  profileModalNiche: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  profileModalLevelPill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  profileModalLevelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  chatCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 12,
    marginBottom: 10,
  },
  chatSpeaker: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  chatMsg: {
    fontSize: 12.5,
    color: '#171420',
    lineHeight: 18,
  },
});
