import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Platform,
  Animated,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { BrandToast } from '../components/BrandToast';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { SocialBrandIcon } from '../components/SocialBrandIcon';
import { TinyGoldCheck } from '../components/CreatorStoryModal';
import { sFont } from '../utils/responsive';

interface ProRepurposeScreenProps {
  userProfile?: UserProfileData;
  onNavigate?: (screen: string) => void;
  onBack?: () => void;
  initialIdeaTitle?: string;
}

const { width } = Dimensions.get('window');

export interface CaptionVariationItem {
  id: string;
  type: string;
  shortLabel: string;
  text: string;
}

const PLATFORM_CAPTION_VARIATIONS: Record<string, CaptionVariationItem[]> = {
  tiktok: [
    {
      id: 'direct',
      type: 'TIKTOK · PUNCHY HOOK',
      shortLabel: 'Direct',
      text: '3 mistakes slowing your growth: 1. Over-editing, 2. No 3-sec hook, 3. Inconsistent schedule. Which one are you fixing first?',
    },
    {
      id: 'story',
      type: 'TIKTOK · STORY LESSON',
      shortLabel: 'Story',
      text: 'I spent 6 months stuck at 0 views until I stopped overthinking video production. Save this for your next batch filming day.',
    },
    {
      id: 'question',
      type: 'TIKTOK · VIRAL CTA',
      shortLabel: 'Conversation',
      text: 'Drop your current streak below — let’s audit your 3-second hook structure together in the comments.',
    },
  ],
  ig_reel: [
    {
      id: 'direct',
      type: 'IG REEL · DIRECT LIST',
      shortLabel: 'Direct',
      text: '3 mistakes slowing you down: 1. Lack of routine, 2. Bad lighting, 3. Long intros. Fixed.',
    },
    {
      id: 'story',
      type: 'IG REEL · SAVE ANGLE',
      shortLabel: 'Story',
      text: 'Save this for when you need a reminder. These 3 lessons transformed my creation journey...',
    },
    {
      id: 'question',
      type: 'IG REEL · CONVERSATION',
      shortLabel: 'Conversation',
      text: 'Which of these 3 creator traps took you the longest to unlearn? Drop your number below.',
    },
  ],
  shorts: [
    {
      id: 'direct',
      type: 'SHORTS · RETENTION HOOK',
      shortLabel: 'Direct',
      text: 'Stop making these 3 video mistakes if you want viewers to stay past the first 3 seconds. Full breakdown in this Short.',
    },
    {
      id: 'story',
      type: 'SHORTS · SYSTEM LESSON',
      shortLabel: 'Story',
      text: 'How to batch 10 Shorts in 2 hours: build an idea vault and record in 1-hour sprints. Subscribe for daily creator systems.',
    },
    {
      id: 'question',
      type: 'SHORTS · ENGAGEMENT LOOP',
      shortLabel: 'Conversation',
      text: 'What is the #1 thing holding your channel back right now? Let’s break it down in the comments.',
    },
  ],
  threads: [
    {
      id: 'direct',
      type: 'THREADS · CONTRARIAN',
      shortLabel: 'Direct',
      text: 'Hot take: You don’t need more ideas. You need a frictionless habit loop that turns 1 thought into 4 reps every week.',
    },
    {
      id: 'story',
      type: 'THREADS · AUTHENTIC LESSON',
      shortLabel: 'Story',
      text: 'The biggest mistake I made starting out was waiting for perfection. 1 honest, raw post daily beats a polished draft sitting on your desktop.',
    },
    {
      id: 'question',
      type: 'THREADS · OPEN THREAD',
      shortLabel: 'Conversation',
      text: 'Creators on Threads: What’s one piece of advice you’d give your Day-1 self? Sharing my top 3 below.',
    },
  ],
};

export const ProRepurposeScreen: React.FC<ProRepurposeScreenProps> = ({
  userProfile,
  onNavigate,
  onBack,
  initialIdeaTitle = '3 mistakes that slow down new creators',
}) => {
  // Core State
  const [originalIdea, setOriginalIdea] = useState(initialIdeaTitle);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([
    'tiktok',
    'ig_reel',
    'shorts',
    'threads',
  ]);
  const [selectedCaptionVariation, setSelectedCaptionVariation] = useState('direct');
  const [isGenerating, setIsGenerating] = useState(false);

  // Active platform for tailored captions (defaults to first selected format or 'ig_reel')
  const activeCaptionPlatform = selectedFormats[0] || 'ig_reel';
  const currentCaptions = PLATFORM_CAPTION_VARIATIONS[activeCaptionPlatform] || PLATFORM_CAPTION_VARIATIONS.ig_reel;

  // Toast & Modals
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState(0);

  // Edit Modals
  const [showEditIdeaModal, setShowEditIdeaModal] = useState(false);
  const [showMorePlatformsModal, setShowMorePlatformsModal] = useState(false);
  const [showScoreInfoModal, setShowScoreInfoModal] = useState(false);
  const [showReviewScheduleModal, setShowReviewScheduleModal] = useState(false);
  const [extraPlatforms, setExtraPlatforms] = useState<string[]>(['pinterest', 'facebook']);
  const [editIdeaText, setEditIdeaText] = useState(originalIdea);
  const [editingVersion, setEditingVersion] = useState<{ id: string; title: string; body: string } | null>(null);

  // Generated Versions Data
  const [versions, setVersions] = useState([
    {
      id: 'tiktok',
      platform: 'TikTok Version',
      platformType: 'tiktok',
      badge: 'READY',
      badgeColor: '#DCFCE7',
      badgeTextColor: '#15803D',
      title: 'The Slow-Mo Creator Trap',
      body: 'Stop doing these 3 things if you want to grow past 1,000 followers...',
    },
    {
      id: 'shorts',
      platform: 'YouTube Shorts',
      platformType: 'youtube',
      badge: 'READY',
      badgeColor: '#DCFCE7',
      badgeTextColor: '#15803D',
      title: 'How I Batch-Film 10 Shorts in 2 Hours',
      body: 'Breakdown of workflow systems that help you increase your output without burnout.',
    },
    {
      id: 'threads',
      platform: 'Threads Insight',
      platformType: 'threads',
      badge: 'READY',
      badgeColor: '#DCFCE7',
      badgeTextColor: '#15803D',
      title: 'Stop waiting for the "perfect" idea to start posting.',
      body: 'Consistency and honest lessons outperform polished perfection every single time.',
    },
  ]);

  // Completion / Celebration Modal State
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState({
    title: 'Content Repurposed!',
    subtitle: '1 idea converted into 4 platform-optimized posts (+150 XP)',
    badgeText: '✨ 4-PLATFORM MULTI-REPURPOSE (+150 XP)',
    xpEarned: 150,
    speechBubble: 'All 4 versions are calibrated for peak algorithmic retention, Pablo! 🔥',
  });

  const modalPopScale = useRef(new Animated.Value(0.9)).current;
  const triggerModalPop = () => {
    modalPopScale.setValue(0.9);
    Animated.spring(modalPopScale, {
      toValue: 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  const handleToggleExtraPlatform = (platformId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (extraPlatforms.includes(platformId)) {
      setExtraPlatforms(extraPlatforms.filter((p) => p !== platformId));
    } else {
      setExtraPlatforms([...extraPlatforms, platformId]);
    }
  };

  const handleDoneMorePlatforms = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowMorePlatformsModal(false);
    
    // Add extra platforms to selectedFormats
    const merged = Array.from(new Set([...selectedFormats, ...extraPlatforms]));
    setSelectedFormats(merged);

    // If Threads selected, add to generated versions if not present
    if (extraPlatforms.includes('threads') && !versions.some((v) => v.id === 'threads')) {
      setVersions((prev) => [
        ...prev,
        {
          id: 'threads',
          platform: 'Threads Note',
          platformType: 'threads',
          badge: 'READY',
          badgeColor: '#DCFCE7',
          badgeTextColor: '#15803D',
          title: 'Quick take for creators...',
          body: 'The fastest way to burn out is pretending you need 4 hours per post. Build a 20-min system instead.',
        },
      ]);
    }

    // If Newsletter selected, add to generated versions
    if (extraPlatforms.includes('newsletter') && !versions.some((v) => v.id === 'newsletter')) {
      setVersions((prev) => [
        ...prev,
        {
          id: 'newsletter',
          platform: 'Newsletter Issue',
          platformType: 'email',
          badge: 'OPTIMIZED',
          badgeColor: '#DCFCE7',
          badgeTextColor: '#15803D',
          title: 'Creator Systems Weekly #47',
          body: 'Deep dive into eliminating creation friction, standardizing hooks, and protecting your streak.',
        },
      ]);
    }

    setCompletionData({
      title: 'Platforms Added!',
      subtitle: `${extraPlatforms.length} custom platform engines synchronized for multi-channel reach.`,
      badgeText: '✨ MULTI-PLATFORM SYNC (+50 XP)',
      xpEarned: 50,
      speechBubble: 'Extra platform engines are ready to adapt your idea, Pablo! 🔥',
    });

    setTimeout(() => {
      setShowCompletionModal(true);
    }, 200);
  };

  // Format Selection Toggles
  const handleToggleFormat = (formatId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedFormats.includes(formatId)) {
      if (selectedFormats.length > 1) {
        setSelectedFormats(selectedFormats.filter((f) => f !== formatId));
        showToast(`Deselected ${formatId.toUpperCase()}`);
      } else {
        showToast('At least 1 format must remain selected');
      }
    } else {
      setSelectedFormats([...selectedFormats, formatId]);
      showToast(`✓ Added ${formatId.toUpperCase()}`);
    }
  };

  const handleToggleSelectAll = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const all = ['tiktok', 'ig_reel', 'shorts', 'threads'];
    if (selectedFormats.length === all.length) {
      setSelectedFormats(['tiktok']);
      showToast('Reset to TikTok format');
    } else {
      setSelectedFormats(all);
      showToast('✓ Selected all 4 formats');
    }
  };

  // Generate Action
  const handleGenerateVersions = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsGenerating(true);
    showToast('✨ Adapting idea for all selected platforms...');
    setTimeout(() => {
      setIsGenerating(false);
      setCompletionData({
        title: 'Platform Versions Generated!',
        subtitle: `Created tailored scripts for ${selectedFormats.length} platforms.`,
        badgeText: '✨ MULTI-PLATFORM SYNC (+50 XP)',
        xpEarned: 50,
        speechBubble: 'Hooks, tone & pacing calibrated for TikTok, Reels, Shorts & Threads, Pablo! 🚀',
      });
      setShowCompletionModal(true);
    }, 900);
  };

  // Use Version Handler
  const handleUseVersion = (version: typeof versions[0]) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    showToast(`✓ Loaded "${version.title}" to Post Composer`);
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('composer');
      }
    }, 400);
  };

  // Schedule All Handler
  const handleScheduleAll = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCompletionData({
      title: 'Smart Multi-Post Scheduled!',
      subtitle: 'TikTok queued for 7:30 PM • Instagram Reels queued for 8:00 PM',
      badgeText: '📅 MULTI-CHANNEL QUEUED (+150 XP)',
      xpEarned: 150,
      speechBubble: 'Strategic schedule locked in at peak engagement windows! 🔥',
    });
    setShowCompletionModal(true);
  };

  // Save Edited Idea
  const handleSaveEditedIdea = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setOriginalIdea(editIdeaText);
    setShowEditIdeaModal(false);
    showToast('✓ Original Idea updated');
  };

  // Save Edited Version
  const handleSaveEditedVersion = () => {
    if (!editingVersion) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setVersions(
      versions.map((v) =>
        v.id === editingVersion.id
          ? { ...v, title: editingVersion.title, body: editingVersion.body }
          : v
      )
    );
    setEditingVersion(null);
    showToast('✓ Version updated');
  };

  return (
    <View style={styles.container}>
      {/* BRAND TOAST */}
      <BrandToast message={toastMessage} />

      {/* TOP APP BAR */}
      <View style={styles.topAppBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            style={({ pressed }) => [styles.topGhostLogoBtn, pressed && styles.btnPressed]}
            onPress={() => (onBack ? onBack() : onNavigate ? onNavigate('dashboard') : null)}
            hitSlop={8}
          >
            <Image
              source={require('../../assets/images/jarvis-ghost-clean.png')}
              style={styles.topGhostLogo}
              resizeMode="contain"
            />
          </Pressable>

          {/* Pro Badge Pill */}
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }}
            hitSlop={8}
          >
            <LinearGradient
              colors={['#F59E0B', '#F59E0B', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.proHeaderBadge}
            >
              <Text style={styles.proHeaderBadgeText}>👑 PRO</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.topRightRow}>
          <Pressable
            style={({ pressed }) => [styles.topIconBtn, pressed && styles.btnPressed]}
            onPress={() => onNavigate && onNavigate('messages')}
            hitSlop={8}
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
            style={({ pressed }) => [styles.topIconBtn, pressed && styles.btnPressed]}
            onPress={() => showToast('🔔 2 new platform suggestions')}
            hitSlop={8}
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
            <View style={styles.topNotifBadge} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.topAvatarBox, pressed && styles.btnPressed]}
            onPress={() => onNavigate && onNavigate('creator-passport')}
            hitSlop={8}
          >
            {userProfile?.customAvatarUri ? (
              <Image
                source={{ uri: userProfile.customAvatarUri }}
                style={styles.topAvatarImg}
                resizeMode="cover"
              />
            ) : (userProfile?.avatarSource && userProfile.avatarId && userProfile.avatarId !== 'ghost') ? (
              <Image
                source={userProfile.avatarSource}
                style={styles.topAvatarImg}
                resizeMode="cover"
              />
            ) : (
              <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 21V19C20 17.9 19.5 16.9 18.7 16.2C17.9 15.5 16.9 15 15.8 15H8.2C7.1 15 6.1 15.5 5.3 16.2C4.5 16.9 4 17.9 4 19V21"
                  stroke="#F59E0B"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle
                  cx="12"
                  cy="7"
                  r="4"
                  stroke="#F59E0B"
                  strokeWidth="2.3"
                />
              </Svg>
            )}
            <View style={{ position: 'absolute', bottom: -2, right: -2 }}>
              <TinyGoldCheck size={14} />
            </View>
          </Pressable>
        </View>
      </View>

      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO HEADER SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.repurposeStudioBadge}>
            <Text style={styles.repurposeStudioBadgeText}>REPURPOSE STUDIO</Text>
          </View>

          <Text
            style={styles.heroTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            Turn one idea into platform-ready posts.
          </Text>
          <Text style={styles.heroSubtitle}>
            Turn one content idea into platform-native versions for TikTok, Instagram Reels, YouTube Shorts, and Threads.
          </Text>
        </View>

        {/* ============================================================ */}
        {/* CARD 1: ORIGINAL IDEA                                       */}
        {/* ============================================================ */}
        <View style={styles.cardSectionContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Text style={{ fontSize: 15 }}>💡</Text>
            <Text style={styles.sectionHeaderTitle}>Original Idea</Text>
          </View>

          <View style={styles.originalIdeaCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={styles.originalIdeaTitle}>&ldquo;{originalIdea}&rdquo;</Text>
              <View style={styles.shortVideoBadge}>
                <Text style={styles.shortVideoBadgeText}>SHORT VIDEO</Text>
              </View>
            </View>

            <Text style={styles.originalIdeaGoal}>🎯 Goal: Saves, comments, authority</Text>

            {/* Badges Row */}
            <View style={styles.badgesRow}>
              <View style={styles.retentionBadge}>
                <Text style={styles.retentionBadgeText}>RETENTION READY</Text>
              </View>
              <View style={styles.savePotentialBadge}>
                <Text style={styles.savePotentialBadgeText}>SAVE-FOCUSED</Text>
              </View>
            </View>

            {/* Edit Original Idea Button */}
            <Pressable
              style={({ pressed }) => [styles.editOriginalIdeaBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onNavigate) {
                  onNavigate('idea-detail');
                }
              }}
            >
              <Text style={styles.editOriginalIdeaBtnText}>✏️ Edit in Idea Engine</Text>
            </Pressable>
          </View>
        </View>

        {/* ============================================================ */}
        {/* CARD 2: SELECT FORMATS                                       */}
        {/* ============================================================ */}
        <View style={styles.cardSectionContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={styles.sectionHeaderTitle}>Select Formats</Text>
            <Pressable onPress={handleToggleSelectAll} hitSlop={8}>
              <Text style={styles.selectAllLinkText}>
                {selectedFormats.length === 4 ? 'Deselect All' : 'Select All'}
              </Text>
            </Pressable>
          </View>

          {/* Formats Grid */}
          <View style={styles.formatsGrid}>
            {[
              { id: 'tiktok', name: 'TikTok', platformType: 'tiktok' },
              { id: 'ig_reel', name: 'IG Reel', platformType: 'instagram' },
              { id: 'shorts', name: 'YouTube Shorts', platformType: 'youtube' },
              { id: 'threads', name: 'Threads', platformType: 'threads' },
              { id: 'facebook', name: 'Facebook', platformType: 'facebook' },
              { id: 'more', name: 'More', isMore: true },
            ].map((fmt) => {
              const isSelected = selectedFormats.includes(fmt.id);
              if (fmt.isMore) {
                return (
                  <Pressable
                    key={fmt.id}
                    style={({ pressed }) => [styles.formatMoreCard, pressed && styles.btnPressed]}
                    onPress={() => {
                      triggerModalPop();
                      setShowMorePlatformsModal(true);
                    }}
                  >
                    <Text style={{ fontSize: 18, color: '#64748B', fontWeight: '700' }}>＋</Text>
                    <Text style={styles.formatMoreText}>{fmt.name}</Text>
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={fmt.id}
                  style={({ pressed }) => [
                    styles.formatCard,
                    isSelected && styles.formatCardActive,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => handleToggleFormat(fmt.id)}
                >
                  <View style={{ height: 22, justifyContent: 'center', alignItems: 'center' }}>
                    <SocialBrandIcon platform={fmt.platformType!} size={20} />
                  </View>
                  <Text
                    style={[styles.formatCardName, isSelected && styles.formatCardNameActive]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
                  >
                    {fmt.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.formatCheckDot}>
                      <Text style={{ fontSize: 8, color: '#FFFFFF', fontWeight: '700' }}>✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Generate Versions Action Button */}
          <Pressable
            style={({ pressed }) => [styles.generateVersionsBtn, pressed && styles.btnPressed]}
            onPress={handleGenerateVersions}
          >
            <LinearGradient
              colors={['#582CDB', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateVersionsGradient}
            >
              <Text style={styles.generateVersionsBtnText}>
                {isGenerating ? '⏳ Adapting Across Formats...' : '✨ Generate Versions'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* ============================================================ */}
        {/* CARD 3: GENERATED VERSIONS                                   */}
        {/* ============================================================ */}
        <View style={styles.cardSectionContainer}>
          <Text style={styles.sectionHeaderTitle}>Generated Versions</Text>

          <View style={{ gap: 12, marginTop: 10 }}>
            {versions.map((ver) => (
              <View key={ver.id} style={styles.versionCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <SocialBrandIcon platform={ver.platformType} size={18} />
                    <Text style={styles.versionPlatformText}>{ver.platform}</Text>
                  </View>
                  <View style={[styles.versionBadge, { backgroundColor: ver.badgeColor }]}>
                    <Text style={[styles.versionBadgeText, { color: ver.badgeTextColor }]}>
                      {ver.badge}
                    </Text>
                  </View>
                </View>

                <Text style={styles.versionTitle}>{ver.title}</Text>
                <Text style={styles.versionBodyText}>&ldquo;{ver.body}&rdquo;</Text>

                {/* Edit & Use Buttons */}
                <View style={styles.versionActionsRow}>
                  <Pressable
                    style={({ pressed }) => [styles.versionEditBtn, pressed && styles.btnPressed]}
                    onPress={() => {
                      setEditingVersion({ id: ver.id, title: ver.title, body: ver.body });
                      triggerModalPop();
                    }}
                  >
                    <Text style={styles.versionEditBtnText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.versionUseBtn, pressed && styles.btnPressed]}
                    onPress={() => handleUseVersion(ver)}
                  >
                    <Text style={styles.versionUseBtnText}>Use Version</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ============================================================ */}
        {/* CARD 4: CAPTION VARIATIONS                                   */}
        {/* ============================================================ */}
        <View style={styles.cardSectionContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.sectionHeaderTitle}>
              Caption Variations · {currentCaptions.length}
            </Text>
            <View style={styles.captionPlatformBadge}>
              <Text style={styles.captionPlatformBadgeText}>
                {activeCaptionPlatform === 'tiktok'
                  ? '📱 TikTok Tailored'
                  : activeCaptionPlatform === 'shorts'
                  ? '▶ Shorts Tailored'
                  : activeCaptionPlatform === 'threads'
                  ? '🧵 Threads Tailored'
                  : '📸 IG Reel Tailored'}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.captionVariationsScroll}
          >
            {currentCaptions.map((cap) => {
              const isSelected = selectedCaptionVariation === cap.id;
              return (
                <Pressable
                  key={cap.id}
                  style={({ pressed }) => [
                    styles.captionVarCard,
                    isSelected && styles.captionVarCardActive,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedCaptionVariation(cap.id);
                    showToast(`✓ Applied ${cap.shortLabel} angle`);
                  }}
                >
                  <View style={styles.captionVarTypeBadge}>
                    <Text style={styles.captionVarTypeBadgeText}>{cap.type}</Text>
                  </View>
                  <Text style={styles.captionVarText} numberOfLines={4}>
                    {cap.text}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Carousel Pagination & Indicator Row */}
          <View style={styles.captionIndicatorRow}>
            {currentCaptions.map((cap) => {
              const isSelected = selectedCaptionVariation === cap.id;
              return (
                <Pressable
                  key={cap.id}
                  style={[styles.captionIndicatorPill, isSelected && styles.captionIndicatorPillActive]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedCaptionVariation(cap.id);
                    showToast(`✓ Selected ${cap.shortLabel} angle`);
                  }}
                  hitSlop={6}
                >
                  <View style={[styles.captionIndicatorDot, isSelected && styles.captionIndicatorDotActive]} />
                  <Text style={[styles.captionIndicatorLabel, isSelected && styles.captionIndicatorLabelActive]}>
                    {cap.shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ============================================================ */}
        {/* CARD 5: REPURPOSE SCORE GAUGE                                */}
        {/* ============================================================ */}
        <View style={styles.repurposeScoreCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.repurposeScoreTitle}>Repurpose Score</Text>
                <Pressable
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setShowScoreInfoModal(true);
                  }}
                  hitSlop={8}
                  style={styles.scoreInfoBtn}
                >
                  <Text style={styles.scoreInfoBtnText}>ⓘ</Text>
                </Pressable>
              </View>
              <Text style={styles.repurposeScoreSub}>Strategic readiness factor</Text>
            </View>

            {/* Circular Gauge 88 */}
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowScoreInfoModal(true);
              }}
              hitSlop={6}
              style={styles.gaugeCircle}
            >
              <Text style={styles.gaugeScoreVal}>88</Text>
            </Pressable>
          </View>

          {/* Metric Progress Bars */}
          <View style={{ gap: 10, marginTop: 16 }}>
            {/* Short-form */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.metricBarLabel}>SHORT-FORM</Text>
                <Text style={styles.metricBarVal}>92%</Text>
              </View>
              <View style={styles.metricBarTrack}>
                <View style={[styles.metricBarFill, { width: '92%', backgroundColor: '#582CDB' }]} />
              </View>
            </View>

            {/* Long-form */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.metricBarLabel}>LONG-FORM</Text>
                <Text style={styles.metricBarVal}>84%</Text>
              </View>
              <View style={styles.metricBarTrack}>
                <View style={[styles.metricBarFill, { width: '84%', backgroundColor: '#F59E0B' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================ */}
        {/* CARD 6: JARVIS INSIGHT HERO CARD                             */}
        {/* ============================================================ */}
        <LinearGradient
          colors={['#2A1454', '#1E0C3E', '#14072C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.jarvisHeroCard}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.jarvisIconHaloBox}>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={{ width: 26, height: 26 }}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.jarvisHeroTitle}>Jarvis Insight</Text>
                <Text style={styles.jarvisHeroSub}>PRO AI STRATEGY</Text>
              </View>
            </View>
            <View style={styles.jarvisActivePill}>
              <Text style={styles.jarvisActivePillText}>⚡ ACTIVE</Text>
            </View>
          </View>

          <View style={styles.jarvisQuoteBox}>
            <Text style={styles.jarvisQuoteText}>
              &ldquo;Your strongest repurposed version shows the best retention potential. Recommend scheduling TikTok first.&rdquo;
            </Text>
          </View>

          {/* Strategy 3-Tier Hierarchy */}
          <View style={{ gap: 8, marginTop: 4, marginBottom: 12 }}>
            {/* Tier 1: Jarvis Top Recommendation */}
            <Pressable
              style={({ pressed }) => [styles.jarvisPrimaryStrategyBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                showToast('✓ Prioritized TikTok for first release');
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.jarvisPrimaryStar}>⭐</Text>
                <Text style={styles.jarvisPrimaryStrategyText}>RECOMMENDED: SCHEDULE TIKTOK FIRST</Text>
              </View>
              <Text style={styles.jarvisPrimaryArrow}>➔</Text>
            </Pressable>

            {/* Tier 2: Secondary Alternatives */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                style={({ pressed }) => [styles.jarvisSecondaryStrategyBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  showToast('✓ Applied Cross-Post Reel strategy');
                }}
              >
                <Text style={styles.jarvisSecondaryStrategyText}>CROSS-POST REEL</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.jarvisSecondaryStrategyBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  showToast('✓ Applied Extract Thread strategy');
                }}
              >
                <Text style={styles.jarvisSecondaryStrategyText}>EXTRACT THREAD</Text>
              </Pressable>
            </View>
          </View>

          {/* Tier 3: Automation CTA */}
          <Pressable
            style={({ pressed }) => [styles.jarvisScheduleBtn, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              setShowReviewScheduleModal(true);
            }}
          >
            <Text style={styles.jarvisScheduleBtnText}>✨ Review & Schedule via Jarvis →</Text>
          </Pressable>
        </LinearGradient>

        {/* ============================================================ */}
        {/* CARD 7: STRATEGIC SCHEDULE                                   */}
        {/* ============================================================ */}
        <View style={styles.scheduleCard}>
          <Text style={styles.scheduleHeaderTitle}>Strategic Schedule</Text>

          <View style={{ gap: 8, marginTop: 10 }}>
            <View style={styles.scheduleSlotRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <SocialBrandIcon platform="tiktok" size={18} />
                <Text style={styles.scheduleSlotName}>TikTok</Text>
              </View>
              <View style={styles.scheduleTimePill}>
                <Text style={styles.scheduleTimePillText}>7:30 PM</Text>
              </View>
            </View>

            <View style={styles.scheduleSlotRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <SocialBrandIcon platform="instagram" size={18} />
                <Text style={styles.scheduleSlotName}>Instagram</Text>
              </View>
              <View style={styles.scheduleTimePill}>
                <Text style={styles.scheduleTimePillText}>8:00 PM</Text>
              </View>
            </View>
          </View>

          {/* Schedule All Amber Action Button */}
          <Pressable
            style={({ pressed }) => [styles.amberScheduleAllBtn, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              setShowReviewScheduleModal(true);
            }}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.amberScheduleAllGradient}
            >
              <Text style={styles.amberScheduleAllBtnText}>📅  Review & Schedule All</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* ============================================================ */}
        {/* CARD 8: PROGRESS & SAFETY                                    */}
        {/* ============================================================ */}
        <View style={styles.progressSafetyRow}>
          <View style={styles.metricCardBox}>
            <Text style={styles.metricCardLabel}>PROGRESS</Text>
            <Text style={styles.metricCardValue}>86%</Text>
          </View>

          <View style={styles.metricCardBox}>
            <Text style={styles.metricCardLabel}>SAFETY</Text>
            <Text style={[styles.metricCardValue, { color: '#F59E0B' }]}>47D</Text>
          </View>
        </View>

        {/* ============================================================ */}
        {/* BOTTOM ACTION BUTTON: REGENERATE                             */}
        {/* ============================================================ */}
        <View style={{ marginTop: 20 }}>
          <Pressable
            style={({ pressed }) => [styles.bottomRegenerateFullBtn, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              showToast('🔄 Regenerating all platform versions...');
              handleGenerateVersions();
            }}
          >
            <Text style={styles.bottomRegenerateFullBtnText}>🔄  Regenerate All Formats</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* EDIT ORIGINAL IDEA MODAL */}
      <Modal
        visible={showEditIdeaModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditIdeaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
            <View style={styles.modalHeaderBetween}>
              <Text style={styles.modalTitle}>Edit Original Idea</Text>
              <Pressable onPress={() => setShowEditIdeaModal(false)} hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.modalTextInput}
              value={editIdeaText}
              onChangeText={setEditIdeaText}
              placeholder="Enter original idea..."
              placeholderTextColor="#94A3B8"
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowEditIdeaModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalSaveBtn}
                onPress={handleSaveEditedIdea}
              >
                <Text style={styles.modalSaveBtnText}>Save Idea</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* EDIT VERSION MODAL */}
      <Modal
        visible={editingVersion !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingVersion(null)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
            <View style={styles.modalHeaderBetween}>
              <Text style={styles.modalTitle}>Edit Platform Version</Text>
              <Pressable onPress={() => setEditingVersion(null)} hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.modalInputLabel}>TITLE / HOOK</Text>
            <TextInput
              style={[styles.modalTextInput, { height: 50 }]}
              value={editingVersion?.title}
              onChangeText={(text) =>
                setEditingVersion((prev) => (prev ? { ...prev, title: text } : null))
              }
              placeholder="Version title..."
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.modalInputLabel, { marginTop: 10 }]}>BODY CONTENT</Text>
            <TextInput
              style={[styles.modalTextInput, { height: 90 }]}
              value={editingVersion?.body}
              onChangeText={(text) =>
                setEditingVersion((prev) => (prev ? { ...prev, body: text } : null))
              }
              placeholder="Version body content..."
              placeholderTextColor="#94A3B8"
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setEditingVersion(null)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalSaveBtn}
                onPress={handleSaveEditedVersion}
              >
                <Text style={styles.modalSaveBtnText}>Save Changes</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

            {/* SELECT MORE PLATFORMS & FORMATS MODAL */}
      <Modal
        visible={showMorePlatformsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMorePlatformsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
            <View style={styles.modalHeaderBetween}>
              <View>
                <Text style={styles.modalTitle}>Add More Platforms</Text>
                <Text style={styles.modalSubTitle}>Select custom channels to adapt this idea for</Text>
              </View>
              <Pressable onPress={() => setShowMorePlatformsModal(false)} hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {[
                {
                  id: 'threads',
                  name: 'Threads',
                  platformType: 'threads',
                  desc: 'Conversation notes & viral micro-thoughts',
                },
                {
                  id: 'pinterest',
                  name: 'Pinterest',
                  platformType: 'pinterest',
                  desc: 'Idea pins & visual infographics',
                },
                {
                  id: 'facebook',
                  name: 'Facebook',
                  platformType: 'facebook',
                  desc: 'Creator pages & community groups',
                },
                {
                  id: 'newsletter',
                  name: 'Newsletter / Substack',
                  emoji: '✉️',
                  desc: 'Long-form email breakdown with key takeaways',
                },
                {
                  id: 'podcast',
                  name: 'Podcast Audio Clip',
                  emoji: '🎙️',
                  desc: 'Speaking script & audiogram soundbite',
                },
                {
                  id: 'carousel',
                  name: 'Carousel Deck',
                  emoji: '📊',
                  desc: '5-slide PDF / multi-image swipeable carousel',
                },
                {
                  id: 'article',
                  name: 'Medium / Blog Article',
                  emoji: '📝',
                  desc: 'SEO-ready thought leadership article',
                },
              ].map((item) => {
                const isSelected = extraPlatforms.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.extraPlatformRow,
                      isSelected && styles.extraPlatformRowActive,
                    ]}
                    onPress={() => handleToggleExtraPlatform(item.id)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={styles.extraPlatformIconBox}>
                        {item.platformType ? (
                          <SocialBrandIcon platform={item.platformType} size={20} />
                        ) : (
                          <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.extraPlatformName}>{item.name}</Text>
                        <Text style={styles.extraPlatformDesc}>{item.desc}</Text>
                      </View>
                    </View>

                    <View style={[styles.extraPlatformCheckRing, isSelected && styles.extraPlatformCheckRingActive]}>
                      {isSelected && (
                        <Text style={{ fontSize: 9, color: '#FFFFFF', fontWeight: '700' }}>✓</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowMorePlatformsModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalSaveBtn}
                onPress={handleDoneMorePlatforms}
              >
                <Text style={styles.modalSaveBtnText}>Done</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* REPURPOSE SCORE BREAKDOWN MODAL */}
      <Modal
        visible={showScoreInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScoreInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
            <View style={styles.modalHeaderBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.scoreInfoBadge}>
                  <Text style={styles.scoreInfoBadgeText}>88 / 100</Text>
                </View>
                <Text style={styles.modalTitle}>Repurpose Score</Text>
              </View>
              <Pressable onPress={() => setShowScoreInfoModal(false)} hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.scoreModalExplanation}>
              Measures how ready your idea is to be adapted across formats based on structure, hook strength, platform fit and content depth.
            </Text>

            {/* Factor Breakdown */}
            <View style={{ gap: 9, marginTop: 14 }}>
              {[
                {
                  name: 'Structure & Flow',
                  val: '94%',
                  color: '#10B981',
                  desc: 'Clear narrative arc & logical segment transitions',
                },
                {
                  name: 'Hook Strength',
                  val: '91%',
                  color: '#582CDB',
                  desc: 'High-retention opening framing that stops scrolling',
                },
                {
                  name: 'Platform Versatility',
                  val: '88%',
                  color: '#F59E0B',
                  desc: 'Fits vertical short-form video & text conversations',
                },
                {
                  name: 'Depth & Resonance',
                  val: '82%',
                  color: '#6366F1',
                  desc: 'Practical takeaways encouraging saves & shares',
                },
              ].map((factor) => (
                <View key={factor.name} style={styles.scoreFactorCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={styles.scoreFactorTitle}>{factor.name}</Text>
                    <Text style={[styles.scoreFactorVal, { color: factor.color }]}>{factor.val}</Text>
                  </View>
                  <View style={styles.scoreFactorBarTrack}>
                    <View style={[styles.scoreFactorBarFill, { width: factor.val as any, backgroundColor: factor.color }]} />
                  </View>
                  <Text style={styles.scoreFactorDesc}>{factor.desc}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={[styles.modalSaveBtn, { marginTop: 16, width: '100%', alignItems: 'center' }]}
              onPress={() => setShowScoreInfoModal(false)}
            >
              <Text style={styles.modalSaveBtnText}>Got it</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* REVIEW & SCHEDULE QUEUE CONFIRMATION MODAL */}
      <Modal
        visible={showReviewScheduleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReviewScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
            <View style={styles.modalHeaderBetween}>
              <View>
                <Text style={styles.modalTitle}>Review & Schedule Queue</Text>
                <Text style={styles.modalSubTitle}>Confirm automated multi-platform release</Text>
              </View>
              <Pressable onPress={() => setShowReviewScheduleModal(false)} hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Queue items */}
            <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {[
                {
                  platform: 'TikTok',
                  platformType: 'tiktok',
                  time: '7:30 PM',
                  tag: 'PEAK DISCOVERY',
                  title: 'The Slow-Mo Creator Trap',
                },
                {
                  platform: 'Instagram Reels',
                  platformType: 'instagram',
                  time: '8:00 PM',
                  tag: 'OPTIMAL EXPLORE',
                  title: 'The Slow-Mo Creator Trap',
                },
                {
                  platform: 'Threads',
                  platformType: 'threads',
                  time: '8:30 PM',
                  tag: 'EVENING CONVO',
                  title: 'Stop waiting for the "perfect" idea...',
                },
                {
                  platform: 'YouTube Shorts',
                  platformType: 'youtube',
                  time: '9:00 PM',
                  tag: 'LATE SURGE',
                  title: 'How I Batch-Film 10 Shorts in 2 Hours',
                },
              ].map((item) => (
                <View key={item.platform} style={styles.queueItemRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={styles.queueIconBox}>
                      <SocialBrandIcon platform={item.platformType} size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.queuePlatformName}>{item.platform}</Text>
                        <View style={styles.queueTagBadge}>
                          <Text style={styles.queueTagBadgeText}>{item.tag}</Text>
                        </View>
                      </View>
                      <Text style={styles.queueItemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.queueTimeBox}>
                    <Text style={styles.queueTimeText}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Safety Notice */}
            <View style={styles.queueSafetyNotice}>
              <Text style={styles.queueSafetyNoticeText}>
                🔒 Posts will be queued in your Jarvis schedule. You can edit or cancel any post before publish time.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowReviewScheduleModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalSaveBtn, { flex: 2 }]}
                onPress={() => {
                  setShowReviewScheduleModal(false);
                  handleScheduleAll();
                }}
              >
                <Text style={styles.modalSaveBtnText}>Confirm & Queue All</Text>
              </Pressable>
            </View>
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

      {/* FLOATING TAB BAR */}
      <FloatingTabBar
        activeTab="create"
        onTabPress={(tab: TabType) => {
          if (onNavigate) {
            if (tab === 'home') onNavigate('dashboard');
            else if (tab === 'create') onNavigate('create');
            else if (tab === 'match') onNavigate('match');
            else if (tab === 'quests') onNavigate('quests');
            else if (tab === 'growth') onNavigate('growth');
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F7F5F0',
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  // TOP APP BAR
  topAppBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 20,
    paddingBottom: 14,
    backgroundColor: '#F7F5F0',
  },
  topGhostLogoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  topGhostLogo: {
    width: 26,
    height: 26,
  },
  proHeaderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proHeaderBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.4,
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
    position: 'relative',
  },
  topNotifBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  topAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  topAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  topAvatarGoldBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // SCROLL CONTENT
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 135,
  },

  // HERO SECTION
  heroSection: {
    marginTop: 6,
    marginBottom: 16,
  },
  repurposeStudioBadge: {
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    marginBottom: 8,
  },
  repurposeStudioBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: Platform.OS === 'web' ? ('clamp(16px, 3.8vw, 19px)' as any) : sFont(17.5),
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.35,
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  },

  // SECTION HEADERS
  cardSectionContainer: {
    marginTop: 18,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },

  // CARD 1: ORIGINAL IDEA
  originalIdeaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  originalIdeaTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
    flex: 1,
    lineHeight: 20,
    paddingRight: 8,
  },
  shortVideoBadge: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  shortVideoBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  originalIdeaGoal: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 12,
  },
  retentionBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  retentionBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.3,
  },
  savePotentialBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  savePotentialBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  editOriginalIdeaBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  editOriginalIdeaBtnText: {
    color: '#582CDB',
    fontSize: 12,
    fontWeight: '700',
  },

  // CARD 2: SELECT FORMATS
  selectAllLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  formatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formatCard: {
    width: (width - 40 - 16) / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    position: 'relative',
    gap: 4,
  },
  formatCardActive: {
    borderColor: '#582CDB',
    backgroundColor: '#F5F3FF',
  },
  formatCardName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  formatCardNameActive: {
    fontWeight: '700',
    color: '#171420',
  },
  formatCheckDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formatMoreCard: {
    width: (width - 40 - 16) / 3,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    gap: 4,
  },
  formatMoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  generateVersionsBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  generateVersionsGradient: {
    paddingVertical: 13,
    alignItems: 'center',
  },
  generateVersionsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // CARD 3: GENERATED VERSIONS
  versionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  versionPlatformText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  versionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  versionBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  versionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    marginTop: 8,
    marginBottom: 4,
  },
  versionBodyText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  versionActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  versionEditBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  versionEditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  versionUseBtn: {
    flex: 2,
    backgroundColor: '#582CDB',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  versionUseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // CARD 4: CAPTION VARIATIONS
  captionVariationsScroll: {
    gap: 10,
    marginTop: 10,
    paddingRight: 10,
  },
  captionVarCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  captionVarCardActive: {
    borderColor: '#582CDB',
    backgroundColor: '#F5F3FF',
  },
  captionVarTypeBadge: {
    backgroundColor: '#EDE9FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    marginBottom: 8,
  },
  captionVarTypeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  captionVarText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    fontWeight: '600',
  },
  captionPlatformBadge: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  captionPlatformBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
  },
  captionIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  captionIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  captionIndicatorPillActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#C4B5FD',
  },
  captionIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  captionIndicatorDotActive: {
    backgroundColor: '#582CDB',
  },
  captionIndicatorLabel: {
    fontSize: sFont(10.5),
    fontWeight: '700',
    color: '#64748B',
  },
  captionIndicatorLabelActive: {
    color: '#582CDB',
    fontWeight: '800',
  },

  // CARD 5: REPURPOSE SCORE
  repurposeScoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 18,
  },
  repurposeScoreTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  repurposeScoreSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  gaugeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3.5,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
  },
  gaugeScoreVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  metricBarLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  metricBarVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#171420',
  },
  metricBarTrack: {
    height: 6,
    backgroundColor: '#F1EFE9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // CARD 6: JARVIS HERO CARD
  jarvisHeroCard: {
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.45)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  jarvisIconHaloBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(88, 44, 219, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisHeroTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  jarvisHeroSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  jarvisActivePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  jarvisActivePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#34D399',
    letterSpacing: 0.3,
  },
  jarvisQuoteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  jarvisQuoteText: {
    fontSize: 12,
    color: '#F1F5F9',
    lineHeight: 18,
    fontWeight: '600',
  },
  jarvisGoldStrategyPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  jarvisGoldStrategyPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  jarvisScheduleBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  jarvisScheduleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // CARD 7: STRATEGIC SCHEDULE
  scheduleCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 18,
  },
  scheduleHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  scheduleSlotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  scheduleSlotName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },
  scheduleTimePill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scheduleTimePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  amberScheduleAllBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
  },
  amberScheduleAllGradient: {
    paddingVertical: 13,
    alignItems: 'center',
  },
  amberScheduleAllBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // CARD 8: PROGRESS & SAFETY
  progressSafetyRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  metricCardBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  metricCardLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  metricCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#582CDB',
    marginTop: 4,
  },

  // BOTTOM ACTION BUTTON
  bottomRegenerateFullBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bottomRegenerateFullBtnText: {
    color: '#171420',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // EXTRA PLATFORMS MODAL
  modalSubTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  extraPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  extraPlatformRowActive: {
    borderColor: '#582CDB',
    backgroundColor: '#F5F3FF',
  },
  extraPlatformIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  extraPlatformName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
  },
  extraPlatformDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  extraPlatformCheckRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  extraPlatformCheckRingActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    padding: 4,
  },
  modalInputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  modalTextInput: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    fontSize: 13,
    color: '#171420',
    minHeight: 60,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  modalSaveBtn: {
    flex: 2,
    backgroundColor: '#582CDB',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // SCORE INFO MODAL & BUTTONS
  scoreInfoBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreInfoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    lineHeight: 13,
  },
  scoreInfoBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  scoreInfoBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  scoreModalExplanation: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 4,
  },
  scoreFactorCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  scoreFactorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  scoreFactorVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  scoreFactorBarTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
    overflow: 'hidden',
    marginVertical: 4,
  },
  scoreFactorBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  scoreFactorDesc: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },

  // JARVIS 3-TIER HIERARCHY
  jarvisPrimaryStrategyBtn: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  jarvisPrimaryStar: {
    fontSize: 12,
  },
  jarvisPrimaryStrategyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.4,
  },
  jarvisPrimaryArrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  jarvisSecondaryStrategyBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jarvisSecondaryStrategyText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.3,
  },

  // QUEUE CONFIRMATION MODAL
  queueItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  queueIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  queuePlatformName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  queueTagBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  queueTagBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  queueItemTitle: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  queueTimeBox: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  queueTimeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  queueSafetyNotice: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  queueSafetyNoticeText: {
    fontSize: 10.5,
    color: '#475569',
    lineHeight: 15,
  },
});
