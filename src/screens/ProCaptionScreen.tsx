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
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { BrandToast } from '../components/BrandToast';
import { TinyGoldCheck } from '../components/CreatorStoryModal';
import { SocialBrandIcon } from '../components/SocialBrandIcon';
import { sFont } from '../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProCaptionScreenProps {
  ideaTitle?: string;
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenMessages?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onAddToPost?: (captionText: string, hashtags: string) => void;
  onOpenIdeaAngle?: () => void;
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

export const ProCaptionScreen: React.FC<ProCaptionScreenProps> = ({
  ideaTitle,
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenMessages,
  onOpenJarvisPro,
  onNavigateTab,
  onAddToPost,
  onOpenIdeaAngle,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showHashtagModal, setShowHashtagModal] = useState(false);
  const [newHashtagInput, setNewHashtagInput] = useState('');
  const [hashtagList, setHashtagList] = useState<string[]>([
    'creatorhabits',
    'contentstrategy',
    'growthhack',
    'shortformcreator',
    'socialmediamarketing',
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Caption State
  const [currentIdeaTitle, setCurrentIdeaTitle] = useState(
    ideaTitle || '3 mistakes that slow down new creators'
  );

  const [selectedTones, setSelectedTones] = useState<string[]>([
    'Helpful',
    'Direct',
    'Confident',
  ]);

  const [activePlatformCaptionIndex, setActivePlatformCaptionIndex] = useState(0);
  const [activeEditingPlatform, setActiveEditingPlatform] = useState('Instagram Reel');
  const scrollViewRef = useRef<ScrollView>(null);
  const captionInputRef = useRef<TextInput>(null);

  const [mainCaption, setMainCaption] = useState(
    '3 mistakes that slow down new creators: waiting for perfect ideas, posting too late, and ignoring what your audience already responds to. Start small, stay consistent, and improve as you go.'
  );

  const [selectedCTA, setSelectedCTA] = useState<string | null>(
    'Which mistake slows you down the most?'
  );

  const [hashtags, setHashtags] = useState(
    '#creatorhabits #contentstrategy #growthhack #shortformcreator #socialmediamarketing'
  );

  const [completionData, setCompletionData] = useState({
    title: 'Caption Ready & Saved!',
    subtitle: `Platform captions and CTA strategy locked in for "${currentIdeaTitle}".`,
    badgeText: '✨ CAPTION READY (+120 XP)',
    xpEarned: 120,
    speechBubble: 'Captions formatted and engagement-tested, Pablo! Ready to publish! 🚀',
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

  const handleEditPlatformCaption = (platformName: string, captionText: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setMainCaption(captionText);
    setActiveEditingPlatform(platformName);
    scrollViewRef.current?.scrollTo({ y: 360, animated: true });
    setTimeout(() => {
      captionInputRef.current?.focus();
    }, 280);
    showToast(`✏️ Editing ${platformName} caption in editor above`);
  };

  const handleAddHashtag = (tagToAdd?: string) => {
    const raw = (tagToAdd || newHashtagInput).trim().replace(/^#/, '');
    if (!raw) return;
    if (hashtagList.includes(raw)) {
      showToast('Hashtag already in list');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updated = [...hashtagList, raw];
    setHashtagList(updated);
    setHashtags(updated.map((t) => `#${t}`).join(' '));
    setNewHashtagInput('');
    showToast(`✓ Added #${raw}`);
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updated = hashtagList.filter((t) => t !== tagToRemove);
    setHashtagList(updated);
    setHashtags(updated.map((t) => `#${t}`).join(' '));
    showToast(`Removed #${tagToRemove}`);
  };

  const handleResetDefaultHashtags = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const defaults = ['creatorhabits', 'contentstrategy', 'growthhack', 'shortformcreator', 'socialmediamarketing'];
    setHashtagList(defaults);
    setHashtags(defaults.map((t) => `#${t}`).join(' '));
    showToast('✓ Reset to default hashtag set');
  };

  const handleToggleTone = (tone: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedTones.includes(tone)) {
      if (selectedTones.length > 1) {
        setSelectedTones(selectedTones.filter((t) => t !== tone));
      } else {
        showToast('At least 1 tone must remain selected');
      }
    } else {
      setSelectedTones([...selectedTones, tone]);
      showToast(`✓ Added ${tone} tone`);
    }
  };

  const handleApplyModifier = (modifier: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (modifier === 'Shorten' || modifier === 'Make Shorter') {
      setMainCaption(
        '3 creator mistakes: waiting for perfection, late posting, ignoring data. Start small, stay consistent, iterate.'
      );
      showToast('✂️ Trimmed caption to 110 characters');
    } else if (modifier === 'Personalize' || modifier === 'Make More Personal') {
      setMainCaption(
        'I spent my first 6 months making 3 big mistakes: waiting for "perfect" ideas, posting at random times, and ignoring the comments. Everything changed when I built a simple system.'
      );
      showToast('👤 Injected personal creator story');
    } else if (modifier === 'Strong CTA' || modifier === 'Add Stronger CTA') {
      setMainCaption(
        `${mainCaption}\n\n👉 Which of these 3 is your biggest roadblock today? Drop 1, 2, or 3 below.`
      );
      showToast('💬 Added high-converting comment CTA');
    } else if (modifier === 'Platform Sync' || modifier === 'Platform-Specific') {
      showToast('📱 Optimized formatting for 9:16 Reels');
    } else if (modifier === 'Improve Hook' || modifier === 'Improve First Line') {
      setMainCaption(
        'Stop waiting for perfect ideas—it is costing you 10,000 views. Here are the 3 mistakes slowing you down and how to fix them today.'
      );
      showToast('✨ Boosted hook strength to 94%');
    } else if (modifier === 'Viral Spark') {
      setMainCaption(
        'Most creators fail for one reason: they rely on motivation instead of discipline. Here are the 3 non-negotiables that changed everything.'
      );
      showToast('🔥 Injected viral creator energy');
    }
  };

  const handleToggleCTA = (ctaText: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedCTA === ctaText) {
      setSelectedCTA(null);
      showToast('Unselected CTA');
    } else {
      setSelectedCTA(ctaText);
      showToast(`✓ Applied CTA: "${ctaText.slice(0, 28)}..."`);
    }
  };

  const handleApplyJarvisRecommendation = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setMainCaption(
      'Stop making these 3 mistakes if you want to grow as a creator:\n\n1. Waiting for the "perfect" idea\n2. Over-editing for 6 hours\n3. Zero repeatable workflow\n\nWhich one is slowing you down the most? Let me know below.'
    );
    setCompletionData({
      title: 'Jarvis Recommendation Applied!',
      subtitle: `Caption hook, high-converting CTA & structure calibrated for 94% retention.`,
      badgeText: '✨ JARVIS AI OPTIMIZED (+50 XP)',
      xpEarned: 50,
      speechBubble: 'AI calibration complete, Pablo! First 80 characters fit above the fold perfectly! 🚀',
    });
    setShowCompletionModal(true);
  };

  const handleApplyJarvisChip = (chipType: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (chipType === 'DIRECT HOOK') {
      setMainCaption(
        'Stop waiting for perfect ideas—it is costing you 10,000 views. Here are the 3 mistakes slowing you down and how to fix them today.'
      );
      showToast('⚡ Injected Direct Problem Hook');
    } else if (chipType === 'COMMENT CTA') {
      setMainCaption(
        `${mainCaption}\n\n👉 Which of these 3 is your biggest roadblock today? Drop 1, 2, or 3 below.`
      );
      showToast('💬 Injected High-Conversion Comment CTA');
    } else if (chipType === 'SAVEABLE BULLETS') {
      setMainCaption(
        '3 creator mistakes to avoid:\n\n• Waiting for the "perfect" idea\n• Over-editing for 6 hours\n• Zero repeatable workflow\n\nSave this for your next filming day.'
      );
      showToast('📌 Injected Saveable Bullet Structure');
    }
  };

  const handleAddToPost = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (onAddToPost) {
      onAddToPost(mainCaption, hashtags);
    } else {
      showToast('✨ Added Caption to Post Composer');
    }
  };

  const handleSaveDraft = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCompletionData({
      title: 'Caption Saved to Drafts!',
      subtitle: `"${currentIdeaTitle}" captions and hashtags secured.`,
      badgeText: '✨ CAPTION SECURED (+120 XP)',
      xpEarned: 120,
      speechBubble: 'Captions stored in your creator vault, Pablo! Ready whenever you are! 📝',
    });
    setShowCompletionModal(true);
  };

  const handleRegenerate = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setMainCaption(
      'The #1 thing that keeps new creators stuck is not the algorithm—it is perfectionism. 3 mistakes to stop making today:\n\n1. Over-polishing drafts\n2. Waiting days to post\n3. Not studying retention drops\n\nSave this for your next filming day.'
    );
    showToast('🔄 Regenerated platform captions with Jarvis');
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

            {/* Pro Badge Pill */}
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
                colors={['#F59E0B', '#F59E0B', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
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

            {/* Profile Avatar */}
            <Pressable
              onPress={() => {
                triggerModalPop();
                setShowProfileModal(true);
              }}
              style={styles.profileAvatarWrapper}
              hitSlop={8}
            >
              {userProfile?.customAvatarUri ? (
                <Image
                  source={{ uri: userProfile.customAvatarUri }}
                  style={styles.headerUserAvatar}
                  resizeMode="cover"
                />
              ) : (userProfile?.avatarSource && userProfile.avatarId && userProfile.avatarId !== 'ghost') ? (
                <Image
                  source={userProfile.avatarSource}
                  style={styles.headerUserAvatar}
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
              <View style={styles.avatarTinyGoldCheckPos}>
                <TinyGoldCheck size={14} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* 2. SCROLLABLE CONTENT */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* HERO TITLES & BADGES */}
          <View style={styles.topTitlesSection}>
            <View style={styles.goldScriptBadge}>
              <Text style={styles.goldScriptBadgeText}>PRO CAPTION WRITER</Text>
            </View>

            <Text style={styles.mainTitleText}>Write captions for every platform.</Text>
            <Text style={styles.mainSubText}>
              Create platform-specific captions, CTAs and hashtag sets designed for engagement.
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <View style={styles.purplePill}>
                <Text style={styles.purplePillText}>Pro Writing Tool</Text>
              </View>
              <View style={styles.goldPill}>
                <Text style={styles.goldPillText}>Platform Aware</Text>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 1: CAPTION SOURCE                                       */}
          {/* ============================================================ */}
          <View style={styles.captionSourceCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 13 }}>📑</Text>
                <Text style={styles.sourceCardLabel}>Caption Source</Text>
              </View>
              <Pressable
                onPress={() => {
                  if (onOpenIdeaAngle) onOpenIdeaAngle();
                  else showToast('Opening Idea Strategy...');
                }}
                hitSlop={8}
              >
                <Text style={styles.changeIdeaLink}>Change Idea</Text>
              </Pressable>
            </View>

            <Text style={styles.sourceIdeaHeadline}>
              Selected Idea: &ldquo;{currentIdeaTitle}&rdquo;
            </Text>
            <Text style={styles.sourceIdeaDesc}>
              Context: short-form creator advice post about consistency and system building for long-term growth.
            </Text>
          </View>

          {/* ============================================================ */}
          {/* CARD 2: CAPTION TONE STUDIO (Interactive Multi-Select)       */}
          {/* ============================================================ */}
          <View style={styles.toneSectionCard}>
            <View style={styles.toneCardHeaderRow}>
              <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14 }}>🎭</Text>
                  <Text style={styles.sectionHeaderTitle} numberOfLines={1}>Caption Tone</Text>
                </View>
                <Text style={styles.toneSubHint} numberOfLines={1}>Select voice style for AI phrasing</Text>
              </View>
              <View style={styles.toneActiveCounterBadge}>
                <Text style={styles.toneActiveCounterText} numberOfLines={1}>{selectedTones.length} SELECTED</Text>
              </View>
            </View>

            <View style={{ gap: 6 }}>
              {[
                [
                  { name: 'Helpful', emoji: '🤝' },
                  { name: 'Direct', emoji: '🎯' },
                  { name: 'Confident', emoji: '⚡' },
                ],
                [
                  { name: 'Honest', emoji: '💡' },
                  { name: 'Inspiring', emoji: '🔥' },
                  { name: 'Expert', emoji: '💼' },
                ],
                [
                  { name: 'Bold', emoji: '💥' },
                  { name: 'Casual', emoji: '☕' },
                  { name: 'Story', emoji: '📖' },
                ],
              ].map((row, rIdx) => (
                <View key={rIdx} style={{ flexDirection: 'row', gap: 6 }}>
                  {row.map((toneObj) => {
                    const isSelected = selectedTones.includes(toneObj.name);
                    return (
                      <Pressable
                        key={toneObj.name}
                        style={({ pressed }) => [
                          styles.toneChipPill,
                          isSelected && styles.toneChipPillActive,
                          pressed && styles.btnPressed,
                        ]}
                        onPress={() => handleToggleTone(toneObj.name)}
                      >
                        <Text style={{ fontSize: 12 }}>{toneObj.emoji}</Text>
                        <Text
                          style={[
                            styles.toneChipText,
                            isSelected && styles.toneChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {toneObj.name}
                        </Text>
                        {isSelected && (
                          <View style={styles.toneCheckMarkDot}>
                            <Svg width={6} height={6} viewBox="0 0 12 12" fill="none">
                              <Path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
                            </Svg>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 3: SELECTED CAPTION (Instagram Reel)                    */}
          {/* ============================================================ */}
          <View style={{ marginTop: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Text style={{ fontSize: 13 }}>📝</Text>
              <Text style={styles.sectionHeaderTitle}>Selected Caption ({activeEditingPlatform})</Text>
            </View>

            <View style={styles.selectedCaptionEditorCard}>
              <View style={styles.captionInputContainer}>
                <TextInput
                  ref={captionInputRef}
                  style={styles.captionTextInput}
                  multiline
                  value={mainCaption}
                  onChangeText={setMainCaption}
                  placeholder="Your caption text..."
                  placeholderTextColor="#94A3B8"
                />
                <View style={styles.captionInputFooterRow}>
                  <Text style={styles.captionInputFooterHint}>AI Generated • Tap to edit</Text>
                  <View style={styles.charsCounterPill}>
                    <Text style={styles.charsCounterText}>{mainCaption.length} chars</Text>
                  </View>
                </View>
              </View>

              {/* Tri-Metrics Container */}
              <View style={styles.captionMetricsRow}>
                <View style={styles.captionMetricBox}>
                  <Text style={styles.captionMetricHeader}>TONE</Text>
                  <Text style={styles.captionMetricVal} numberOfLines={1}>
                    {selectedTones.slice(0, 2).join(', ')}
                  </Text>
                </View>

                <View style={styles.captionMetricBox}>
                  <Text style={styles.captionMetricHeader}>SAVE POTENTIAL</Text>
                  <Text style={[styles.captionMetricVal, { color: '#15803D' }]}>High</Text>
                </View>

                <View style={styles.captionMetricBox}>
                  <Text style={styles.captionMetricHeader}>FIRST 80 CHAR FIT</Text>
                  <Text style={styles.captionMetricVal}>91%</Text>
                </View>
              </View>

              {/* Action Modifiers Grid - 2 Rows x 3 Columns */}
              <View style={styles.captionModifiersSection}>
                <Text style={styles.captionModifiersLabel}>QUICK AI MODIFIERS</Text>
                <View style={{ gap: 6, marginTop: 6 }}>
                  {[
                    [
                      { id: 'Shorten', label: 'Shorten', emoji: '✂️' },
                      { id: 'Personalize', label: 'Personalize', emoji: '👤' },
                      { id: 'Strong CTA', label: 'Strong CTA', emoji: '💬' },
                    ],
                    [
                      { id: 'Platform Sync', label: 'Platform Sync', emoji: '📱' },
                      { id: 'Improve Hook', label: 'Improve Hook', emoji: '✨' },
                      { id: 'Viral Spark', label: 'Viral Spark', emoji: '🔥' },
                    ],
                  ].map((row, rIdx) => (
                    <View key={rIdx} style={{ flexDirection: 'row', gap: 6 }}>
                      {row.map((mod) => (
                        <Pressable
                          key={mod.id}
                          style={({ pressed }) => [
                            styles.captionModifierChip,
                            pressed && styles.btnPressed,
                          ]}
                          onPress={() => handleApplyModifier(mod.id)}
                        >
                          <Text style={{ fontSize: 11 }}>{mod.emoji}</Text>
                          <Text style={styles.captionModifierChipText} numberOfLines={1}>
                            {mod.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 4: PLATFORM CAPTIONS CAROUSEL                           */}
          {/* ============================================================ */}
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionHeaderTitle}>Platform Captions</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, marginTop: 10 }}
            >
              {/* TikTok Card */}
              <View style={styles.platformCaptionDeckCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <SocialBrandIcon platform="tiktok" size={18} />
                    <Text style={styles.platDeckTitle}>TikTok</Text>
                  </View>
                  <View style={styles.platDeckBadge}>
                    <Text style={styles.platDeckBadgeText}>SHORT, DIRECT</Text>
                  </View>
                </View>

                <Text style={styles.platDeckBodyText}>
                  3 creator mistakes slowing you down. System &gt; Ideas. Which one is yours? 👇
                </Text>

                <View style={styles.platDeckBtnRow}>
                  <Pressable
                    style={({ pressed }) => [styles.platDeckEditBtn, pressed && styles.btnPressed]}
                    onPress={() => handleEditPlatformCaption('TikTok', '3 creator mistakes slowing you down. System > Ideas. Which one is yours? 👇')}
                  >
                    <Text style={styles.platDeckEditBtnText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.platDeckUseBtn}
                    onPress={() => {
                      setMainCaption('3 creator mistakes slowing you down. System > Ideas. Which one is yours? 👇');
                      showToast('✓ Loaded TikTok Caption');
                    }}
                  >
                    <Text style={styles.platDeckUseBtnText}>Use</Text>
                  </Pressable>
                </View>
              </View>

              {/* Instagram Card */}
              <View style={styles.platformCaptionDeckCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <SocialBrandIcon platform="instagram" size={18} />
                    <Text style={styles.platDeckTitle}>Instagram</Text>
                  </View>
                  <View style={styles.platDeckBadge}>
                    <Text style={styles.platDeckBadgeText}>REELS &amp; CAROUSEL</Text>
                  </View>
                </View>

                <Text style={styles.platDeckBodyText}>
                  3 mistakes that stop creators from scaling. Save this for when you need a reminder to keep posting.
                </Text>

                <View style={styles.platDeckBtnRow}>
                  <Pressable
                    style={({ pressed }) => [styles.platDeckEditBtn, pressed && styles.btnPressed]}
                    onPress={() => handleEditPlatformCaption('Instagram Reel', '3 mistakes that stop creators from scaling. Save this for when you need a reminder to keep posting.')}
                  >
                    <Text style={styles.platDeckEditBtnText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.platDeckUseBtn}
                    onPress={() => {
                      setMainCaption('3 mistakes that stop creators from scaling. Save this for when you need a reminder to keep posting.');
                      showToast('✓ Loaded Instagram Caption');
                    }}
                  >
                    <Text style={styles.platDeckUseBtnText}>Use</Text>
                  </Pressable>
                </View>
              </View>

              {/* YouTube Shorts Card */}
              <View style={styles.platformCaptionDeckCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <SocialBrandIcon platform="youtube" size={18} />
                    <Text style={styles.platDeckTitle}>YouTube</Text>
                  </View>
                  <View style={styles.platDeckBadge}>
                    <Text style={styles.platDeckBadgeText}>SHORTS &amp; SEO</Text>
                  </View>
                </View>

                <Text style={styles.platDeckBodyText}>
                  Why 90% of creators stay stuck (and the 3 habits that fix it). Full breakdown in comments.
                </Text>

                <View style={styles.platDeckBtnRow}>
                  <Pressable
                    style={({ pressed }) => [styles.platDeckEditBtn, pressed && styles.btnPressed]}
                    onPress={() => handleEditPlatformCaption('YouTube Shorts', 'Why 90% of creators stay stuck (and the 3 habits that fix it). Full breakdown in comments.')}
                  >
                    <Text style={styles.platDeckEditBtnText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.platDeckUseBtn}
                    onPress={() => {
                      setMainCaption('Why 90% of creators stay stuck (and the 3 habits that fix it). Full breakdown in comments.');
                      showToast('✓ Loaded YouTube Caption');
                    }}
                  >
                    <Text style={styles.platDeckUseBtnText}>Use</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* ============================================================ */}
          {/* CARD 5: ENGAGEMENT SCORE                                     */}
          {/* ============================================================ */}
          <View style={styles.engagementScoreCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={styles.engagementCardTitle}>Engagement Score</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text style={styles.engagementBigNum}>87</Text>
                <Text style={styles.engagementDenom}>/ 100</Text>
              </View>
            </View>
            <Text style={styles.strongCaptionTag}>STRONG CAPTION</Text>

            {/* Score Progress Bars */}
            <View style={{ gap: 10, marginTop: 14 }}>
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={styles.scoreBarLabel}>First Line Strength</Text>
                  <Text style={styles.scoreBarVal}>88%</Text>
                </View>
                <View style={styles.meterTrack}>
                  <View style={[styles.meterFill, { width: '88%', backgroundColor: '#582CDB' }]} />
                </View>
              </View>

              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={styles.scoreBarLabel}>Clarity</Text>
                  <Text style={styles.scoreBarVal}>92%</Text>
                </View>
                <View style={styles.meterTrack}>
                  <View style={[styles.meterFill, { width: '92%', backgroundColor: '#582CDB' }]} />
                </View>
              </View>

              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={styles.scoreBarLabel}>CTA Strength</Text>
                  <Text style={styles.scoreBarVal}>81%</Text>
                </View>
                <View style={styles.meterTrack}>
                  <View style={[styles.meterFill, { width: '81%', backgroundColor: '#F59E0B' }]} />
                </View>
              </View>
            </View>

            {/* Insight Callout Box */}
            <View style={styles.insightCalloutBox}>
              <Text style={{ fontSize: 13, marginRight: 6 }}>💡</Text>
              <Text style={styles.insightCalloutText}>
                The caption is clear and saveable, but the CTA can be slightly sharper for comments.
              </Text>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 6: CTA STRATEGY (Select & Unselect Support)              */}
          {/* ============================================================ */}
          <View style={{ marginTop: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.sectionHeaderTitle}>CTA Strategy</Text>
              <Text style={styles.ctaHeaderSubHint}>Tap to select or unselect</Text>
            </View>

            <View style={{ gap: 8 }}>
              {[
                {
                  id: 'recommended',
                  type: 'COMMENT SPIKE',
                  text: 'Which mistake slows you down the most?',
                  desc: 'Best for comment volume & algorithm conversation spikes.',
                  isRecommended: true,
                },
                {
                  id: 'save',
                  type: 'SAVE',
                  text: 'Save this for your next planning session.',
                  desc: 'Drives bookmarks for long-term algorithmic recall.',
                  isRecommended: false,
                },
                {
                  id: 'share',
                  type: 'SHARE',
                  text: 'Send this to a creator starting out.',
                  desc: 'Boosts DM shares & viral loop expansion.',
                  isRecommended: false,
                },
                {
                  id: 'follow',
                  type: 'FOLLOW',
                  text: 'Follow for daily creator systems & growth breakdowns.',
                  desc: 'Direct acquisition hook for new followers.',
                  isRecommended: false,
                },
              ].map((cta) => {
                const isSelected = selectedCTA === cta.text;
                return (
                  <Pressable
                    key={cta.id}
                    style={({ pressed }) => [
                      styles.ctaCard,
                      isSelected && styles.ctaCardActive,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={() => handleToggleCTA(cta.text)}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {cta.isRecommended ? (
                          <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
                          </View>
                        ) : (
                          <Text style={styles.ctaAltType}>{cta.type}</Text>
                        )}
                        {cta.isRecommended && <Text style={{ fontSize: 13 }}>⭐</Text>}
                      </View>

                      {/* Interactive Selection Checkbox Circle */}
                      <View style={[styles.ctaCheckCircle, isSelected && styles.ctaCheckCircleActive]}>
                        {isSelected && (
                          <Svg width={8} height={8} viewBox="0 0 12 12" fill="none">
                            <Path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
                          </Svg>
                        )}
                      </View>
                    </View>

                    <Text style={[styles.ctaCardTitle, isSelected && styles.ctaCardTitleActive]}>
                      &ldquo;{cta.text}&rdquo;
                    </Text>
                    <Text style={styles.ctaCardSub}>{cta.desc}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 7: HASHTAG SETS (Tap to Edit & Manage Modal)            */}
          {/* ============================================================ */}
          <View style={{ marginTop: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.sectionHeaderTitle}>Hashtag Sets</Text>
              <Pressable
                onPress={() => {
                  triggerModalPop();
                  setShowHashtagModal(true);
                }}
                hitSlop={8}
              >
                <Text style={styles.editHashtagsLink}>✏️ Edit Hashtags</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.hashtagsCard, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowHashtagModal(true);
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={styles.hashtagCategoryBadge}>
                  <Text style={styles.hashtagCategoryBadgeText}>CREATOR GROWTH</Text>
                </View>
                <Text style={styles.hashtagsCountBadge}>{hashtagList.length} TAGS</Text>
              </View>

              {/* Hashtag Chips Grid Preview */}
              <View style={styles.hashtagPreviewGrid}>
                {hashtagList.map((tag) => (
                  <View key={tag} style={styles.hashtagChipPreview}>
                    <Text style={styles.hashtagChipPreviewText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* CARD 8: STATUS & STREAK                                      */}
          {/* ============================================================ */}
          <View style={styles.statusStreakCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.statusLabel}>STATUS</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#16A34A' }} />
                  <Text style={styles.statusVal}>Ready</Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.xpLabel}>XP</Text>
                <Text style={styles.xpVal}>+120</Text>
              </View>
            </View>

            <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1EFE9' }}>
              <Text style={styles.streakLabel}>STREAK</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <Text style={styles.streakVal}>47 Days 🔥</Text>
                <View style={styles.streakProtectedBadge}>
                  <Text style={styles.streakProtectedBadgeText}>Always Protected</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 9: JARVIS INSIGHT (Hero Deep Royal Violet Studio)       */}
          {/* ============================================================ */}
          <LinearGradient
            colors={['#2A1454', '#1E0C3E', '#14072C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.jarvisInsightHeroCard}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.jarvisHeroIconBox}>
                  <Image
                    source={require('../../assets/images/jarvis-core-flame.png')}
                    style={{ width: 26, height: 26 }}
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text style={styles.jarvisHeroTitle}>Jarvis Insight</Text>
                  <Text style={styles.jarvisHeroSub}>PRO AI COACH</Text>
                </View>
              </View>
              <View style={styles.jarvisActiveEnginePill}>
                <Text style={styles.jarvisActiveEnginePillText}>⚡ ACTIVE</Text>
              </View>
            </View>

            <View style={styles.jarvisQuoteGlassBox}>
              <Text style={styles.jarvisHeroQuote}>
                &ldquo;This caption is strongest when the first line directly names the mistake. Keep the CTA simple so people can reply quickly.&rdquo;
              </Text>
            </View>

            {/* Quick Strategy Pills */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {['DIRECT HOOK', 'COMMENT CTA', 'SAVEABLE BULLETS'].map((chip) => (
                <Pressable
                  key={chip}
                  style={({ pressed }) => [styles.jarvisStrategyChip, pressed && styles.btnPressed]}
                  onPress={() => handleApplyJarvisChip(chip)}
                >
                  <Text style={styles.jarvisStrategyChipText}>{chip}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [styles.applyJarvisHeroBtn, pressed && styles.btnPressed]}
              onPress={handleApplyJarvisRecommendation}
            >
              <Text style={styles.applyJarvisHeroBtnText}>✨ Apply Recommendation</Text>
            </Pressable>
          </LinearGradient>

          {/* ============================================================ */}
          {/* BOTTOM ACTION BUTTONS                                        */}
          {/* ============================================================ */}
          <View style={{ gap: 10, marginTop: 20 }}>
            {/* Primary: ADD TO POST & REGENERATE */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                style={({ pressed }) => [styles.addToPostBtn, pressed && styles.btnPressed]}
                onPress={handleAddToPost}
              >
                <Text style={styles.addToPostBtnText}>Add to Post</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.regenerateBtn, pressed && styles.btnPressed]}
                onPress={handleRegenerate}
              >
                <Text style={styles.regenerateBtnText}>Regenerate</Text>
              </Pressable>
            </View>

            {/* Redesigned Luxury Save Draft Button */}
            <Pressable
              style={({ pressed }) => [styles.saveDraftFullBtn, pressed && styles.btnPressed]}
              onPress={handleSaveDraft}
            >
              <Text style={{ fontSize: 13, marginRight: 6 }}>💾</Text>
              <Text style={styles.saveDraftFullBtnText}>Save Draft</Text>
              <View style={styles.saveDraftXpPill}>
                <Text style={styles.saveDraftXpPillText}>+120 XP</Text>
              </View>
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
                <Text style={styles.modalTitle}>Caption Alerts</Text>
                <Pressable onPress={() => setShowNotificationModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>
              <View style={{ gap: 8, marginVertical: 12 }}>
                <View style={styles.modalAlertItem}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#171420' }}>
                    ⚡ 91% First-80-Char Retention
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    Your caption hook is formatted above the Instagram '...more' fold.
                  </Text>
                </View>
              </View>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

                {/* HASHTAG MANAGER MODAL */}
        <Modal
          visible={showHashtagModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowHashtagModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderBetween}>
                <View>
                  <Text style={styles.modalTitle}>Hashtag Manager</Text>
                  <Text style={styles.modalSubTitle}>Add, remove, or customize hashtags</Text>
                </View>
                <Pressable onPress={() => setShowHashtagModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              {/* Add New Hashtag Input Bar */}
              <View style={styles.addHashtagBarRow}>
                <TextInput
                  style={styles.addHashtagInput}
                  value={newHashtagInput}
                  onChangeText={setNewHashtagInput}
                  placeholder="Type hashtag (e.g. dailyreels)..."
                  placeholderTextColor="#94A3B8"
                  onSubmitEditing={() => handleAddHashtag()}
                  returnKeyType="done"
                />
                <Pressable
                  style={({ pressed }) => [styles.addHashtagBtn, pressed && styles.btnPressed]}
                  onPress={() => handleAddHashtag()}
                >
                  <Text style={styles.addHashtagBtnText}>Add +</Text>
                </Pressable>
              </View>

              {/* Active Removable Hashtags */}
              <Text style={styles.modalSectionSubHeader}>ACTIVE HASHTAGS ({hashtagList.length})</Text>
              <ScrollView style={{ maxHeight: 150 }} contentContainerStyle={styles.removableHashtagsGrid}>
                {hashtagList.map((tag) => (
                  <Pressable
                    key={tag}
                    style={styles.removableHashtagChip}
                    onPress={() => handleRemoveHashtag(tag)}
                  >
                    <Text style={styles.removableHashtagText}>#{tag}</Text>
                    <View style={styles.removeTagCrossCircle}>
                      <Text style={styles.removeTagCrossText}>✕</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Quick Suggestions Row */}
              <Text style={[styles.modalSectionSubHeader, { marginTop: 14 }]}>TRENDING SUGGESTIONS</Text>
              <View style={styles.quickSuggestionsRow}>
                {['creatoreconomy', 'growontiktok', 'reeltips', 'dailycontent', 'viralpost'].map((sug) => (
                  <Pressable
                    key={sug}
                    style={styles.suggestionPill}
                    onPress={() => handleAddHashtag(sug)}
                  >
                    <Text style={styles.suggestionPillText}>+ #{sug}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Modal Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <Pressable
                  style={styles.resetHashtagsBtn}
                  onPress={handleResetDefaultHashtags}
                >
                  <Text style={styles.resetHashtagsBtnText}>Reset</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.saveHashtagsBtn, pressed && styles.btnPressed]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                    setShowHashtagModal(false);
                    setCompletionData({
                      title: 'Hashtags Optimized!',
                      subtitle: `${hashtagList.length} creator tags calibrated for peak reach & discoverability.`,
                      badgeText: '✨ HASHTAGS LOCKED IN (+25 XP)',
                      xpEarned: 25,
                      speechBubble: 'Hashtag cluster is optimized for algorithm discoverability, Pablo! 🔥',
                    });
                    setTimeout(() => {
                      setShowCompletionModal(true);
                    }, 200);
                  }}
                >
                  <Text style={styles.saveHashtagsBtnText}>Done</Text>
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proHeaderBadgeText: {
    fontSize: sFont(10),
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.4,
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
  goldScriptBadge: {
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
    marginBottom: 8,
  },
  goldScriptBadgeText: {
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

  // CARD 1: CAPTION SOURCE
  captionSourceCard: {
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
  sourceCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  changeIdeaLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  sourceIdeaHeadline: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
    marginTop: 10,
    marginBottom: 4,
  },
  sourceIdeaDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },

  // CARD 2: TONE SECTION
  toneSectionCard: {
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
  toneCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: sFont(13),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: 0.2,
  },
  toneSubHint: {
    fontSize: sFont(10.5),
    color: '#64748B',
    marginTop: 2,
  },
  toneActiveCounterBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  toneActiveCounterText: {
    fontSize: sFont(8.5),
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  toneChipPill: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    paddingHorizontal: 4,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 4,
  },
  toneChipPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  toneChipText: {
    fontSize: sFont(11),
    fontWeight: '700',
    color: '#475569',
  },
  toneChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  toneCheckMarkDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // CARD 3: SELECTED CAPTION EDITOR
  selectedCaptionEditorCard: {
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
  captionInputContainer: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  captionTextInput: {
    fontSize: sFont(12.5),
    lineHeight: 19,
    color: '#171420',
    minHeight: 90,
    textAlignVertical: 'top',
    padding: 0,
  },
  captionInputFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  captionInputFooterHint: {
    fontSize: sFont(9.5),
    fontWeight: '700',
    color: '#94A3B8',
  },
  charsCounterPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  charsCounterText: {
    fontSize: sFont(9),
    fontWeight: '800',
    color: '#64748B',
  },
  captionMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  captionMetricBox: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  captionMetricHeader: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  captionMetricVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171420',
    marginTop: 2,
  },
  captionModifiersSection: {
    paddingTop: 10,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: '#F1EFE9',
  },
  captionModifiersLabel: {
    fontSize: sFont(8.5),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  captionModifierChip: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 4,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  captionModifierChipText: {
    fontSize: sFont(10),
    fontWeight: '700',
    color: '#475569',
  },

  // CARD 4: PLATFORM CAPTIONS
  platformCaptionDeckCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'space-between',
  },
  platDeckTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  platDeckBadge: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  platDeckBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
  },
  platDeckBodyText: {
    fontSize: 11,
    color: '#171420',
    lineHeight: 16,
    marginVertical: 10,
  },
  platDeckBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  platDeckEditBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  platDeckEditBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171420',
  },
  platDeckUseBtn: {
    flex: 1,
    backgroundColor: '#582CDB',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  platDeckUseBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // CARD 5: ENGAGEMENT SCORE
  engagementScoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#582CDB',
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 22,
  },
  engagementCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
  },
  engagementBigNum: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171420',
  },
  engagementDenom: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  strongCaptionTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.4,
  },
  scoreBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  scoreBarVal: {
    fontSize: 10,
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
  },

  // CARD 6: CTA STRATEGY
  ctaHeaderSubHint: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '800',
  },
  ctaCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  ctaCardActive: {
    borderColor: '#582CDB',
    backgroundColor: '#F5F3FF',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  recommendedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  recommendedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  ctaCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    marginTop: 8,
    marginBottom: 3,
    lineHeight: 18,
  },
  ctaCardTitleActive: {
    fontWeight: '700',
    color: '#171420',
  },
  ctaCardSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  ctaAltType: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.3,
  },
  ctaCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaCheckCircleActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },

  // CARD 7: HASHTAG SETS
  editHashtagsLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  hashtagsCard: {
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
  hashtagCategoryBadge: {
    backgroundColor: '#EDE9FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hashtagCategoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  hashtagsCountBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  hashtagPreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  hashtagChipPreview: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hashtagChipPreviewText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },

  // HASHTAG MANAGER MODAL
  modalSubTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  addHashtagBarRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  addHashtagInput: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#EFECE6',
    fontSize: 12.5,
    color: '#171420',
  },
  addHashtagBtn: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHashtagBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalSectionSubHeader: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  removableHashtagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  removableHashtagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
  },
  removableHashtagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
  },
  removeTagCrossCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeTagCrossText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  quickSuggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionPill: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  suggestionPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
  },
  resetHashtagsBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetHashtagsBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  saveHashtagsBtn: {
    flex: 2,
    backgroundColor: '#582CDB',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveHashtagsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // CARD 8: STATUS & STREAK
  statusStreakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 16,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  statusVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  xpLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  xpVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#582CDB',
  },
  streakLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  streakVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
  },
  streakProtectedBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  streakProtectedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
  },

  // CARD 9: JARVIS INSIGHT
  jarvisInsightHeroCard: {
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
  jarvisHeroIconBox: {
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
  jarvisActiveEnginePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  jarvisActiveEnginePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#34D399',
    letterSpacing: 0.3,
  },
  jarvisQuoteGlassBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  jarvisHeroQuote: {
    fontSize: 12,
    color: '#F1F5F9',
    lineHeight: 18,
    fontWeight: '600',
  },
  jarvisStrategyChip: {
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
  jarvisStrategyChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  applyJarvisHeroBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  applyJarvisHeroBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // BOTTOM ACTION BUTTONS
  addToPostBtn: {
    flex: 1,
    backgroundColor: '#582CDB',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  addToPostBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  regenerateBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  regenerateBtnText: {
    color: '#171420',
    fontSize: 13,
    fontWeight: '700',
  },
  saveDraftFullBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  saveDraftFullBtnText: {
    color: '#171420',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  saveDraftXpPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginLeft: 8,
  },
  saveDraftXpPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
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
  modalAlertItem: {
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
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
