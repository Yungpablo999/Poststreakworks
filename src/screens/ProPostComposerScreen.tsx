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
  TextInput,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { TinyGoldCheck } from '../components/CreatorStoryModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProPostComposerScreenProps {
  ideaTitle?: string;
  initialPlatform?: string;
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenMessages?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface PlatformOption {
  id: string;
  name: string;
  shortName: string;
  format: string;
  multiplier: string;
  bgColor: string;
  gradient?: string[];
  iconType: 'tiktok' | 'instagram' | 'youtube' | 'linkedin' | 'x' | 'threads';
}

const SAMPLE_IDEAS = [
  'One thing I wish I knew before I started creating',
  'The #1 habit that doubled my views in 30 days',
  '3 mistakes almost every beginner creator makes',
  'How I batch-film 10 videos in 2 hours',
  'The exact iPhone camera settings I use for 4K Reels',
];

const PRO_PLATFORMS: PlatformOption[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    shortName: 'TikTok',
    format: '9:16 Video / Reels',
    multiplier: '1.4x Viral Reach',
    bgColor: '#000000',
    iconType: 'tiktok',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    shortName: 'Instagram',
    format: 'Reels & Carousels',
    multiplier: 'Highest Saves',
    bgColor: '#E1306C',
    iconType: 'instagram',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    shortName: 'YouTube',
    format: 'Shorts & Community',
    multiplier: '1.8x Evergreen',
    bgColor: '#FF0000',
    iconType: 'youtube',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    shortName: 'LinkedIn',
    format: 'Thought Leadership',
    multiplier: '2.4x B2B Impact',
    bgColor: '#0A66C2',
    iconType: 'linkedin',
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    shortName: 'X',
    format: 'Viral Thread',
    multiplier: 'High Discussion',
    bgColor: '#000000',
    iconType: 'x',
  },
  {
    id: 'threads',
    name: 'Threads',
    shortName: 'Threads',
    format: 'Text & Visuals',
    multiplier: 'Organic Feed',
    bgColor: '#101010',
    iconType: 'threads',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    shortName: 'Pinterest',
    format: 'Idea Pins & Visuals',
    multiplier: 'High Intent',
    bgColor: '#E60023',
    iconType: 'pinterest' as any,
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    shortName: 'Snapchat',
    format: 'Spotlight 9:16',
    multiplier: 'Gen-Z Viral',
    bgColor: '#FFFC00',
    iconType: 'snapchat' as any,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    shortName: 'Facebook',
    format: 'Reels & Groups',
    multiplier: 'Broad Demographic',
    bgColor: '#1877F2',
    iconType: 'facebook' as any,
  },
];

export const ProPostComposerScreen: React.FC<ProPostComposerScreenProps> = ({
  ideaTitle,
  initialPlatform,
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenMessages,
  onOpenJarvisPro,
  onNavigateTab,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<{
    title: string;
    subtitle: string;
    badgeText: string;
    xpEarned: number;
    speechBubble: string;
  }>({
    title: 'Post Published!',
    subtitle: 'Your 4K content has been synced and pushed to all active platforms.',
    badgeText: '👑 PRO POST PUBLISHED',
    xpEarned: 50,
    speechBubble: 'Boom! Algorithmic distribution triggered!',
  });

  // State
  const [currentIdea, setCurrentIdea] = useState(
    ideaTitle || 'One thing I wish I knew before I started creating'
  );
  const [captionText, setCaptionText] = useState(
    'One thing I wish I knew before I started creating:\n\nStop waiting for the "perfect" idea. Consistency and honest lessons outperform polished perfection every single time.\n\nSave this for when you feel stuck. 🚀\n\n#CreatorTips #ContentStrategy #GrowthHacks'
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'instagram', 'youtube']);
  const [selectedCategoryChip, setSelectedCategoryChip] = useState('Personal Lesson');
  const [customIdeaInput, setCustomIdeaInput] = useState('');
  const [selectedHookIndex, setSelectedHookIndex] = useState(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('7:30 PM (Peak Reach)');
  const [autopilotEnabled, setAutopilotEnabled] = useState(true);
  const [showAllPlatformsModal, setShowAllPlatformsModal] = useState(false);
  const [showChangeIdeaModal, setShowChangeIdeaModal] = useState(false);
  const [hasUploadedMedia, setHasUploadedMedia] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const flameFloatY = useRef(new Animated.Value(0)).current;

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
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const togglePlatform = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedPlatforms.includes(id)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== id));
      } else {
        showToast('At least 1 platform must remain active');
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, id]);
    }
  };

  const handlePublishNow = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCompletionData({
      title: 'Post Published Successfully!',
      subtitle: `Your content is live on ${selectedPlatforms.map(p => p.toUpperCase()).join(', ')}.`,
      badgeText: '👑 PRO INSTANT PUBLISH',
      xpEarned: 50,
      speechBubble: 'Boom! Reach multiplier engaged!',
    });
    setShowCompletionModal(true);
  };

  const handleScheduleAutopilot = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCompletionData({
      title: 'Queued to Pro Autopilot!',
      subtitle: `Scheduled for ${selectedTimeSlot} across ${selectedPlatforms.length} platforms.`,
      badgeText: '✨ AUTOPILOT SECURED',
      xpEarned: 75,
      speechBubble: 'Peak window locked! Relax while Jarvis distributes.',
    });
    setShowCompletionModal(true);
  };

  const renderPlatformIcon = (iconType: string, size = 26) => {
    switch (iconType) {
      case 'tiktok':
        return (
          <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
              {/* Real TikTok 3D Note */}
              <Path
                d="M12.5 3v11.8a3.2 3.2 0 1 1-2.3-3.1v-2.3a5.5 5.5 0 1 0 4.6 5.4V7.5a6.8 6.8 0 0 0 4.2 1.5V6.7a4.6 4.6 0 0 1-3.5-3.7h-3z"
                fill="#000000"
              />
              <Path
                d="M19 6.7a4.6 4.6 0 0 1-3.5-3.7h-1.2v2.3a4.6 4.6 0 0 0 3.5 3.7V6.7z"
                fill="#00F2FE"
              />
              <Path
                d="M10.2 14.8a3.2 3.2 0 0 1 2.3-3.1V9.4a5.5 5.5 0 0 0-4.6 5.4 5.5 5.5 0 0 0 5.5 5.5v-2.3a3.2 3.2 0 0 1-3.2-3.2z"
                fill="#FE2C55"
              />
            </Svg>
          </View>
        );

      case 'instagram':
        return (
          <View style={{ width: size, height: size, borderRadius: size * 0.28, overflow: 'hidden' }}>
            <LinearGradient
              colors={['#833AB4', '#FD1D1D', '#F77737', '#FFDC80']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
            >
              <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 24 24" fill="none">
                <Rect x="2" y="2" width="20" height="20" rx="6" stroke="#FFFFFF" strokeWidth="2.2" />
                <Circle cx="12" cy="12" r="4.5" stroke="#FFFFFF" strokeWidth="2.2" />
                <Circle cx="17.8" cy="6.2" r="1.3" fill="#FFFFFF" />
              </Svg>
            </LinearGradient>
          </View>
        );

      case 'youtube':
        return (
          <View style={{ width: size, height: size * 0.75, backgroundColor: '#FF0000', borderRadius: size * 0.22, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
              <Path d="M9.5 7.5L16.5 12L9.5 16.5V7.5Z" fill="#FFFFFF" />
            </Svg>
          </View>
        );

      case 'linkedin':
        return (
          <View style={{ width: size, height: size, backgroundColor: '#0A66C2', borderRadius: size * 0.22, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="#FFFFFF">
              <Path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 1 0-.01-3.3 1.65 1.65 0 0 0 .01 3.3m1.4 9.74v-8.37H5.06v8.37h2.8z" />
            </Svg>
          </View>
        );

      case 'x':
        return (
          <View style={{ width: size, height: size, backgroundColor: '#000000', borderRadius: size * 0.22, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="#FFFFFF">
              <Path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </Svg>
          </View>
        );

      case 'threads':
        return (
          <View style={{ width: size, height: size, backgroundColor: '#000000', borderRadius: size * 0.22, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.8 12.2c-.3 1.6-1.5 2.6-3.2 2.6-2.1 0-3.6-1.6-3.6-3.8 0-2.3 1.6-3.9 3.8-3.9 1.7 0 2.8.9 3.2 2.3h-1.5c-.3-.7-.9-1.1-1.7-1.1-1.3 0-2.2 1-2.2 2.7s.9 2.6 2.1 2.6c.9 0 1.5-.5 1.7-1.4h1.4z"
                fill="#FFFFFF"
              />
            </Svg>
          </View>
        );

      case 'pinterest':
        return (
          <View style={{ width: size, height: size, backgroundColor: '#E60023', borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="#FFFFFF">
              <Path d="M12 0a12 12 0 0 0-4.37 23.18c-.06-.98-.12-2.5.02-3.58l.74-3.13s-.19-.38-.19-.94c0-.88.51-1.54 1.15-1.54.54 0 .8.41.8.9 0 .55-.35 1.37-.53 2.13-.15.64.32 1.16.95 1.16 1.14 0 2.02-1.2 2.02-2.94 0-1.54-1.1-2.61-2.68-2.61-1.83 0-2.9 1.37-2.9 2.79 0 .55.21 1.14.48 1.46.05.06.06.12.04.18l-.18.74c-.03.12-.1.17-.23.11-1.07-.5-1.74-2.07-1.74-3.33 0-2.71 1.97-5.2 5.68-5.2 2.98 0 5.3 2.12 5.3 4.96 0 2.96-1.87 5.34-4.46 5.34-.87 0-1.69-.45-1.97-.98l-.54 2.05c-.19.75-.72 1.68-1.07 2.25A12 12 0 1 0 12 0z" />
            </Svg>
          </View>
        );

      case 'snapchat':
        return (
          <View style={{ width: size, height: size, backgroundColor: '#FFFC00', borderRadius: size * 0.24, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="#000000">
              <Path d="M12.003 2c-3.1 0-5.25 2.15-5.25 4.7 0 .6.1 1.25.3 1.8-.75.35-1.5 1-1.5 1.8 0 .55.35 1.05.9 1.35-.1.35-.35 1.15-.35 1.75 0 1.25 1.15 2 2.5 2.1.25.75 1.15 1.3 2.1 1.3.6 0 1.15-.2 1.3-.2.15 0 .7.2 1.3.2.95 0 1.85-.55 2.1-1.3 1.35-.1 2.5-.85 2.5-2.1 0-.6-.25-1.4-.35-1.75.55-.3.9-.8.9-1.35 0-.8-.75-1.45-1.5-1.8.2-.55.3-1.2.3-1.8 0-2.55-2.15-4.7-5.25-4.7z" />
            </Svg>
          </View>
        );

      case 'facebook':
        return (
          <View style={{ width: size, height: size, backgroundColor: '#1877F2', borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="#FFFFFF">
              <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </Svg>
          </View>
        );

      default:
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="#171420">
            <Circle cx="12" cy="12" r="9" stroke="#171420" strokeWidth="2" />
          </Svg>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* ============================================================ */}
        {/* TOP HEADER BAR                                               */}
        {/* ============================================================ */}
        <View style={styles.headerBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
                <Path d="M15 18L9 12L15 6" stroke="#171420" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
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

            {/* Mode Switcher */}
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
                <Text style={styles.proHeaderBadgeText}>👑 PRO</Text>
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
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => showToast('No new notifications')}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="#171420"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

            {/* Profile Avatar */}
            <Pressable
              onPress={() => setShowProfileModal(true)}
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

        {/* ============================================================ */}
        {/* MAIN SCROLLABLE CONTENT                                      */}
        {/* ============================================================ */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* TOP TAGS & TITLE */}
          <View style={styles.topTitlesSection}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <View style={styles.createPostTagBox}>
                <Text style={styles.createPostTagText}>✨ CREATE POST — PRO</Text>
              </View>
              <View style={styles.draftPill}>
                <Text style={styles.draftPillText}>AUTOPILOT READY</Text>
              </View>
            </View>

            <Text style={styles.mainTitleText}>Shape your next post.</Text>
            <Text style={styles.mainSubText}>
              Write your caption, choose platforms, add media and schedule your content.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* CARD 1: POST IDEA CARD                                       */}
          {/* ============================================================ */}
          <View style={styles.postIdeaCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.postIdeaTag}>Post Idea</Text>
              <Pressable
                onPress={() => setShowChangeIdeaModal(true)}
                hitSlop={8}
              >
                <Text style={styles.changeIdeaLink}>CHANGE IDEA ➔</Text>
              </Pressable>
            </View>

            <Text style={styles.postIdeaMainTitle}>&ldquo;{currentIdea}&rdquo;</Text>
            <Text style={styles.postIdeaSub}>
              Turn this idea into a short-form post for your selected platforms.
            </Text>

            {/* Chips */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {['Personal Lesson', 'Creator Advice', 'Streak Saver', 'Viral Reel'].map((chip) => (
                <Pressable
                  key={chip}
                  style={[
                    styles.ideaChipPill,
                    selectedCategoryChip === chip && styles.ideaChipPillActive,
                  ]}
                  onPress={() => setSelectedCategoryChip(chip)}
                >
                  <Text
                    style={[
                      styles.ideaChipPillText,
                      selectedCategoryChip === chip && styles.ideaChipPillTextActive,
                    ]}
                  >
                    {chip}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 2: CHOOSE PLATFORMS                                     */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRowWithBtn}>
            <Text style={styles.sectionHeaderTitle}>CHOOSE PLATFORMS</Text>
            <Pressable
              style={styles.morePlatformsBtn}
              onPress={() => setShowAllPlatformsModal(true)}
            >
              <Text style={styles.morePlatformsBtnText}>+ More Platforms</Text>
            </Pressable>
          </View>

          <View style={styles.platformsGridRow}>
            {PRO_PLATFORMS.slice(0, 3).map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <Pressable
                  key={platform.id}
                  style={[
                    styles.platformCard,
                    isSelected && styles.platformCardSelected,
                  ]}
                  onPress={() => togglePlatform(platform.id)}
                >
                  <View style={styles.platformIconWrapper}>
                    {renderPlatformIcon(platform.iconType)}
                  </View>
                  <Text style={styles.platformCardName}>{platform.name}</Text>
                  <View style={[styles.platformCheckCircle, isSelected && styles.platformCheckCircleActive]}>
                    {isSelected && (
                      <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
                        <Path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                      </Svg>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.platformDisclaimerText}>
            👑 Pro Multi-Sync active. Your content is automatically tailored to each platform&apos;s optimal algorithm format.
          </Text>

          {/* ============================================================ */}
          {/* CARD 3: MEDIA UPLOAD & ASSET STUDIO                          */}
          {/* ============================================================ */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: 18, marginBottom: 8 }]}>MEDIA</Text>
          <View style={styles.mediaStudioCard}>
            <View style={styles.mediaDashedBox}>
              <View style={styles.mediaPlaceholderIconCircle}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Rect x="3" y="3" width="18" height="18" rx="4" stroke="#582CDB" strokeWidth="2" />
                  <Circle cx="8.5" cy="8.5" r="1.5" fill="#582CDB" />
                  <Path d="M21 15L16 10L5 21" stroke="#582CDB" strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </View>

              <Text style={styles.mediaMainHeading}>Add video, image or thumbnail</Text>
              <Text style={styles.mediaSubHeading}>Video • Image • Carousel • 4K 60FPS</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                style={styles.mediaActionBtn}
                onPress={() => showToast('4K Media Picker opened')}
              >
                <Text style={styles.mediaActionBtnText}>⬆ Upload Media</Text>
              </Pressable>
              <Pressable
                style={styles.mediaActionBtn}
                onPress={() => showToast('High-CTR Thumbnail generator opened')}
              >
                <Text style={styles.mediaActionBtnText}>🖼 Add Thumbnail</Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 4: CAPTION WRITING & VIRAL HOOK                         */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRowWithBtn}>
            <Text style={[styles.sectionHeaderTitle, { marginTop: 18 }]}>CAPTION WRITING</Text>
            <Pressable
              onPress={() => showToast('Jarvis AI generated new high-retention caption')}
              hitSlop={8}
            >
              <Text style={styles.polishLink}>🪄 Polish with Jarvis</Text>
            </Pressable>
          </View>

          <View style={styles.captionCard}>
            <TextInput
              style={styles.captionInput}
              multiline={true}
              numberOfLines={6}
              value={captionText}
              onChangeText={setCaptionText}
              placeholder="Write your high-impact caption here..."
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.captionFooterRow}>
              <Text style={styles.captionCharCount}>{captionText.length} / 2,200 chars</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  style={styles.captionQuickTag}
                  onPress={() => setCaptionText(prev => prev + ' #ViralTips')}
                >
                  <Text style={styles.captionQuickTagText}>+ #ViralTips</Text>
                </Pressable>
                <Pressable
                  style={styles.captionQuickTag}
                  onPress={() => setCaptionText(prev => prev + ' #StreakGuard')}
                >
                  <Text style={styles.captionQuickTagText}>+ #StreakGuard</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 5: TIMING & PEAK WINDOW SELECTOR                        */}
          {/* ============================================================ */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: 18, marginBottom: 8 }]}>PEAK TIMING</Text>
          <View style={styles.timingCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.timingCardTitle}>Optimal Posting Window</Text>
              <View style={styles.peakScoreBadge}>
                <Text style={styles.peakScoreBadgeText}>🔥 96% Match</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['7:30 PM (Peak)', '12:00 PM (Mid)', '8:00 AM (Morning)'].map((slot) => (
                <Pressable
                  key={slot}
                  style={[
                    styles.timeSlotPill,
                    selectedTimeSlot.startsWith(slot.slice(0, 7)) && styles.timeSlotPillActive,
                  ]}
                  onPress={() => setSelectedTimeSlot(slot)}
                >
                  <Text
                    style={[
                      styles.timeSlotPillText,
                      selectedTimeSlot.startsWith(slot.slice(0, 7)) && styles.timeSlotPillTextActive,
                    ]}
                  >
                    {slot}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ============================================================ */}
          {/* PRIMARY ACTION BUTTONS                                       */}
          {/* ============================================================ */}
          <View style={{ gap: 10, marginTop: 24, marginBottom: 140 }}>
            {/* Publish Now */}
            <Pressable
              style={({ pressed }) => [styles.publishNowBtn, pressed && styles.btnPressed]}
              onPress={handlePublishNow}
            >
              <Text style={styles.publishNowBtnText}>🚀 Publish to {selectedPlatforms.length} Platforms Now (+50 XP) ➔</Text>
            </Pressable>

            {/* Schedule on Autopilot */}
            <Pressable
              style={({ pressed }) => [styles.scheduleAutopilotBtnWrapper, pressed && styles.btnPressed]}
              onPress={handleScheduleAutopilot}
            >
              <LinearGradient
                colors={['#FDE68A', '#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.scheduleAutopilotBtnGradient}
              >
                <Text style={styles.scheduleAutopilotBtnText}>
                  ✨ Autopilot Schedule for {selectedTimeSlot.slice(0, 7)} (+75 XP) ➔
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>

        {/* FLOATING TAB BAR */}
        <FloatingTabBar
          activeTab={activeTab}
          onTabPress={(tab) => {
            setActiveTab(tab);
            if (onNavigateTab) onNavigateTab(tab);
          }}
        />

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

        {/* CHANGE IDEA MODAL (WITH CUSTOM IDEA & GHOST ANIMATION) */}
        <Modal
          visible={showChangeIdeaModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowChangeIdeaModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '90%' }]}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={styles.modalGoldTagBadge}>
                    <Text style={styles.modalGoldTagBadgeText}>👑 PRO IDEA GENERATOR</Text>
                  </View>
                  <Pressable onPress={() => setShowChangeIdeaModal(false)} hitSlop={8}>
                    <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '900' }}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalHeaderTitle}>Select or Create Idea</Text>
                <Text style={styles.modalHeaderSub}>
                  Type your custom topic or pick an AI-recommended high retention hook.
                </Text>

                {/* 1. CUSTOM IDEA INPUT SECTION */}
                <View style={styles.customIdeaContainer}>
                  <Text style={styles.customIdeaSectionLabel}>✍️ ENTER CUSTOM IDEA</Text>
                  <TextInput
                    style={styles.customIdeaTextInput}
                    placeholder="Type your own topic, lesson, or viral angle..."
                    placeholderTextColor="#94A3B8"
                    value={customIdeaInput}
                    onChangeText={setCustomIdeaInput}
                    multiline={true}
                    numberOfLines={3}
                  />

                  {/* Quick Angle Chips */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 }}>
                    {[
                      '💡 "Why 90% fail at..."',
                      '🚀 "The 1 tool every..."',
                      '🔥 "Stop doing this..."',
                      '📈 "How I scaled to..."',
                    ].map((hook, hIdx) => (
                      <Pressable
                        key={hIdx}
                        style={styles.customHookChip}
                        onPress={() => setCustomIdeaInput(hook.replace(/^[^\w"]+/, '').replace(/"/g, ''))}
                      >
                        <Text style={styles.customHookChipText}>{hook}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Apply Custom Idea Button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.applyCustomIdeaBtnWrapper,
                      (!customIdeaInput.trim()) && { opacity: 0.5 },
                      pressed && styles.btnPressed,
                    ]}
                    disabled={!customIdeaInput.trim()}
                    onPress={() => {
                      if (!customIdeaInput.trim()) return;
                      const newIdea = customIdeaInput.trim();
                      setCurrentIdea(newIdea);
                      setCaptionText(`${newIdea}:\n\nShare your key takeaway or breakdown here.\n\nSave this for when you need it! 🚀\n\n#CreatorTips #GrowthStrategy`);
                      setShowChangeIdeaModal(false);
                      setCustomIdeaInput('');

                      if (Platform.OS !== 'web') {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }
                      setCompletionData({
                        title: 'Custom Angle Loaded!',
                        subtitle: `"${newIdea}" is now active in your Pro Composer.`,
                        badgeText: '👑 CUSTOM PRO HOOK',
                        xpEarned: 25,
                        speechBubble: "Fire idea! Let's craft high-retention content.",
                      });
                      setTimeout(() => {
                        setShowCompletionModal(true);
                      }, 200);
                    }}
                  >
                    <LinearGradient
                      colors={['#FDE68A', '#F59E0B', '#D97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.applyCustomIdeaBtnGradient}
                    >
                      <Text style={styles.applyCustomIdeaBtnText}>
                        ✨ Apply Custom Idea (+25 XP) ➔
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>

                {/* 2. AI-RECOMMENDED HOOKS */}
                <Text style={[styles.customIdeaSectionLabel, { marginTop: 14, marginBottom: 8 }]}>
                  💡 OR PICK AI VIRAL HOOK
                </Text>
                <View style={{ gap: 8 }}>
                  {SAMPLE_IDEAS.map((idea, idx) => (
                    <Pressable
                      key={idx}
                      style={({ pressed }) => [styles.ideaOptionRow, pressed && styles.btnPressed]}
                      onPress={() => {
                        setCurrentIdea(idea);
                        setCaptionText(`${idea}:\n\nStop waiting for the "perfect" idea. Consistency and honest lessons outperform polished perfection every single time.\n\nSave this for when you feel stuck. 🚀\n\n#CreatorTips #ContentStrategy #GrowthHacks`);
                        setShowChangeIdeaModal(false);

                        if (Platform.OS !== 'web') {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                        setCompletionData({
                          title: 'Viral Idea Selected!',
                          subtitle: `"${idea}" is now active in your Pro Composer.`,
                          badgeText: '✨ AI HOOK LOADED',
                          xpEarned: 25,
                          speechBubble: "High retention score! Let's craft the post.",
                        });
                        setTimeout(() => {
                          setShowCompletionModal(true);
                        }, 200);
                      }}
                    >
                      <Text style={styles.ideaOptionNumber}>{idx + 1}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ideaOptionText}>{idea}</Text>
                        <Text style={styles.ideaOptionMatchText}>⚡ 94% Retention Probability</Text>
                      </View>
                      <Text style={{ fontSize: 16, color: '#582CDB', fontWeight: '900' }}>➔</Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  style={[styles.modalCancelBtn, { marginTop: 14 }]}
                  onPress={() => setShowChangeIdeaModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Dismiss</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ALL PLATFORMS MODAL (WITH REAL SOCIAL ICONS & GHOST CELEBRATION) */}
        <Modal
          visible={showAllPlatformsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAllPlatformsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '88%' }]}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={styles.modalGoldTagBadge}>
                  <Text style={styles.modalGoldTagBadgeText}>👑 PRO MULTI-SYNC</Text>
                </View>
                <Pressable onPress={() => setShowAllPlatformsModal(false)} hitSlop={8}>
                  <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '900' }}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalHeaderTitle}>Connected Social Platforms</Text>
              <Text style={styles.modalHeaderSub}>
                Select all destinations for auto-formatted multi-sync distribution.
              </Text>

              <ScrollView style={{ maxHeight: 360, marginVertical: 12 }} showsVerticalScrollIndicator={false}>
                {PRO_PLATFORMS.map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform.id);
                  return (
                    <Pressable
                      key={platform.id}
                      style={[
                        styles.platformRowItem,
                        isSelected && styles.platformRowItemSelected,
                      ]}
                      onPress={() => togglePlatform(platform.id)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        {renderPlatformIcon(platform.iconType, 28)}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.platformRowItemName}>{platform.name}</Text>
                          <Text style={styles.platformRowItemSub}>
                            {platform.format} • <Text style={{ color: '#059669', fontWeight: '800' }}>{platform.multiplier}</Text>
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.platformCheckCircle, isSelected && styles.platformCheckCircleActive]}>
                        {isSelected && (
                          <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
                            <Path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                          </Svg>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Done Selecting with Gold Gradient & Ghost Animation */}
              <Pressable
                style={({ pressed }) => [styles.applyCustomIdeaBtnWrapper, pressed && styles.btnPressed]}
                onPress={() => {
                  setShowAllPlatformsModal(false);

                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  setCompletionData({
                    title: 'Multi-Platform Sync Configured!',
                    subtitle: `Active on ${selectedPlatforms.map(p => p.toUpperCase()).join(', ')}. Optimal algorithm formatting applied.`,
                    badgeText: '👑 MULTI-SYNC ACTIVE',
                    xpEarned: 25,
                    speechBubble: 'All platform reach engines synchronized!',
                  });
                  setTimeout(() => {
                    setShowCompletionModal(true);
                  }, 200);
                }}
              >
                <LinearGradient
                  colors={['#FDE68A', '#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.applyCustomIdeaBtnGradient}
                >
                  <Text style={styles.applyCustomIdeaBtnText}>
                    ✨ Confirm {selectedPlatforms.length} Platforms (+25 XP) ➔
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* GHOST CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCompletionModal}
          title={completionData.title}
          subtitle={completionData.subtitle}
          badgeText={completionData.badgeText}
          xpEarned={completionData.xpEarned}
          streakCount={52}
          speechBubble={completionData.speechBubble}
          actionText="Awesome ➔"
          onDismiss={() => {
            setShowCompletionModal(false);
            if (completionData.badgeText.includes('PUBLISHED') || completionData.badgeText.includes('AUTOPILOT')) {
              if (onOpenSchedule) onOpenSchedule();
              else onBack();
            }
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
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 34,
    height: 34,
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
    color: '#171420',
    letterSpacing: 0.3,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarWrapper: {
    position: 'relative',
  },
  headerUserAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  avatarTinyGoldCheckPos: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },

  // TITLES
  topTitlesSection: {
    marginBottom: 16,
  },
  createPostTagBox: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  createPostTagText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  draftPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  draftPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
  },
  mainTitleText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  mainSubText: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },

  // POST IDEA CARD
  postIdeaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 20,
  },
  postIdeaTag: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
  },
  changeIdeaLink: {
    fontSize: 11,
    fontWeight: '900',
    color: '#582CDB',
  },
  postIdeaMainTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#171420',
    marginVertical: 4,
  },
  postIdeaSub: {
    fontSize: 12,
    color: '#64748B',
  },
  ideaChipPill: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ideaChipPillActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#C4B5FD',
  },
  ideaChipPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  ideaChipPillTextActive: {
    color: '#582CDB',
  },

  // PLATFORMS
  sectionHeaderRowWithBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  morePlatformsBtn: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  morePlatformsBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  platformsGridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  platformCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  platformCardSelected: {
    borderColor: '#582CDB',
    backgroundColor: '#FBF9FF',
  },
  platformIconWrapper: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  platformCardName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 8,
  },
  platformCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformCheckCircleActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  platformDisclaimerText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
    lineHeight: 16,
  },

  // MEDIA STUDIO
  mediaStudioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  mediaDashedBox: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  mediaPlaceholderIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaMainHeading: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#171420',
    marginBottom: 2,
  },
  mediaSubHeading: {
    fontSize: 11,
    color: '#64748B',
  },
  mediaActionBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  mediaActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
  },

  // CAPTION
  polishLink: {
    fontSize: 11,
    fontWeight: '900',
    color: '#582CDB',
  },
  captionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  captionInput: {
    fontSize: 13,
    color: '#171420',
    lineHeight: 20,
    textAlignVertical: 'top',
    minHeight: 110,
  },
  captionFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1EFE9',
    marginTop: 6,
  },
  captionCharCount: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '700',
  },
  captionQuickTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  captionQuickTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
  },

  // TIMING
  timingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  timingCardTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#171420',
  },
  peakScoreBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  peakScoreBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#92400E',
  },
  timeSlotPill: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  timeSlotPillActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#C4B5FD',
  },
  timeSlotPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  timeSlotPillTextActive: {
    color: '#582CDB',
  },

  // PRIMARY ACTIONS
  publishNowBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  publishNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
  },
  scheduleAutopilotBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  scheduleAutopilotBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 14,
  },
  scheduleAutopilotBtnText: {
    color: '#0C0A12',
    fontSize: 13.5,
    fontWeight: '900',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#171420',
  },
  modalHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  ideaOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EFE9',
  },
  ideaOptionNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EDE9FE',
    color: '#582CDB',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 22,
  },
  ideaOptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  platformRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  platformRowItemSelected: {
    borderColor: '#582CDB',
    backgroundColor: '#FBF9FF',
  },
  platformRowItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  platformRowItemSub: {
    fontSize: 10.5,
    color: '#64748B',
  },
  modalCancelBtn: {
    backgroundColor: '#FAF8F5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  modalCancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
  },
  modalPrimaryBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  // CUSTOM IDEA SECTION
  modalGoldTagBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  modalGoldTagBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  customIdeaContainer: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 12,
  },
  customIdeaSectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  customIdeaTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#171420',
    minHeight: 65,
    textAlignVertical: 'top',
  },
  customHookChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  customHookChipText: {
    fontSize: 10.5,
    color: '#582CDB',
    fontWeight: '700',
  },
  applyCustomIdeaBtnWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  applyCustomIdeaBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
  },
  applyCustomIdeaBtnText: {
    color: '#0C0A12',
    fontSize: 13,
    fontWeight: '900',
  },
  ideaOptionMatchText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 2,
  },

  // COMMON
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
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
