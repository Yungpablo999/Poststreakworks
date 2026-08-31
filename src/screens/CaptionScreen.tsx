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
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { sFont, sPadding, isNarrowScreen } from '../utils/responsive';

interface CaptionScreenProps {
  ideaTitle?: string;
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onAddToPost?: (captionText: string, hashtags: string) => void;
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
    body: "Convert today's idea into a post to keep your 1-day streak.",
    time: '2h ago',
    unread: true,
    iconEmoji: '🔥',
    badgeBg: '#FEF3C7',
    badgeBorder: '#FDE68A',
  },
];

const GOAL_OPTIONS = [
  {
    id: 'saves_comments',
    icon: '💬',
    title: 'Get saves & comments',
    caption: 'I used to wait until every idea felt perfect before posting. But the truth is, perfection is the enemy of progress. Once I started sharing small lessons instead of waiting for the perfect idea, creating became easier.',
    cta: 'What is one creator habit that helped you stay consistent?',
    hashtags: '#CreatorTips #Growth #Strategy #DailyPosting',
    tags: ['Helpful', 'Personal', 'Strong CTA'],
  },
  {
    id: 'fast_streak',
    icon: '⚡',
    title: 'Post fast & protect my streak',
    caption: 'Done and posted beats perfect and unpublished every single day. 15 minutes of sharing your daily progress is all it takes to keep your streak alive.',
    cta: 'Double-tap if you are keeping your posting streak alive today! 🔥',
    hashtags: '#PostStreak #CreatorConsistency #DailyPosting #NoExcuses',
    tags: ['Fast Post', 'Streak Saver', 'High Energy'],
  },
  {
    id: 'traffic_leads',
    icon: '📈',
    title: 'Drive traffic & DM leads',
    caption: 'Want to know the exact workflow I use to batch-create content and turn daily viewers into warm inbound leads without burning out?',
    cta: 'Comment "GROWTH" below and I will send you my daily creation template for free!',
    hashtags: '#InboundLeads #CreatorBusiness #AudienceGrowth #ContentStrategy',
    tags: ['Lead Magnet', 'Inbound', 'High Conversion'],
  },
  {
    id: 'viral_reach',
    icon: '🔥',
    title: 'Viral shares & reach',
    caption: 'Why do 90% of creators stop posting in month 2? Because they overthink the Big Idea. Shift your mindset from inventing to documenting and watch your reach explode.',
    cta: 'Share this post with a creator who needed to hear this today!',
    hashtags: '#ViralHooks #SocialMediaGrowth #Storytelling #PostDaily',
    tags: ['Viral Reach', 'High Shares', 'Algorithm Rank'],
  },
];

const TONE_OPTIONS = ['Helpful', 'Honest', 'Motivational', 'Funny', 'Professional'];

const SUGGESTED_CAPTIONS_CATALOG = [
  {
    id: 'cap_1',
    text: 'I used to wait until every idea felt perfect before posting. But the truth is, perfection is the enemy of progress. Once I started sharing small lessons instead of waiting for the perfect idea, creating became easier.',
    cta: 'What is one creator habit that helped you?',
    hashtags: '#CreatorTips #Growth #Strategy #DailyPosting',
    tags: ['Helpful', 'Personal', 'Strong CTA'],
  },
  {
    id: 'cap_2',
    text: 'Here is the real secret behind keeping a daily streak: you do not need 10 hours to film. You just need 15 minutes and one clear lesson you learned yesterday.',
    cta: 'Save this post so you have it ready for your next filming session!',
    hashtags: '#ContentCreation #Consistency #CreatorMindset #GrowthHacks',
    tags: ['Honest', 'Actionable', 'High Saves'],
  },
  {
    id: 'cap_3',
    text: 'Why do 90% of creators stop posting in month 2? Because they overthink the Big Idea. Shift your mindset from inventing to documenting.',
    cta: 'Drop a "🔥" if you needed to hear this today!',
    hashtags: '#ViralHooks #SocialMediaGrowth #Storytelling #PostDaily',
    tags: ['Motivational', 'High Energy', 'Conversation'],
  },
];

export const CaptionScreen: React.FC<CaptionScreenProps> = ({
  ideaTitle = 'One thing I wish I knew before I started creating',
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
  onAddToPost,
  onOpenMessages,

  userProfile,
  onSaveProfile,}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('create');

  // Live-Editable Screen State
  const [postTopic, setPostTopic] = useState(ideaTitle);
  const [selectedGoal, setSelectedGoal] = useState('Get saves & comments');
  const [selectedTones, setSelectedTones] = useState<string[]>(['Helpful', 'Honest']);
  const [isTopicFocused, setIsTopicFocused] = useState(false);
  const topicInputRef = useRef<TextInput>(null);

  // Suggested Captions
  const [suggestedIndex, setSuggestedIndex] = useState(0);
  const currentSuggestion = SUGGESTED_CAPTIONS_CATALOG[suggestedIndex];

  // Editable Draft Editor & Fields
  const [draftText, setDraftText] = useState(
    "I used to wait until every idea felt perfect before posting. But the truth is, perfection is the enemy of progress. If you're waiting for the right moment, you're just falling behind."
  );
  const [quickCta, setQuickCta] = useState(currentSuggestion.cta);
  const [hashtagsText, setHashtagsText] = useState(currentSuggestion.hashtags);
  const [isSavedBookmark, setIsSavedBookmark] = useState(false);

  // Modals & Celebrations
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Caption Ready!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Your viral caption and hashtags are primed for your post.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('1-day streak protected! +35 XP earned.');
  const [celebrationBadge, setCelebrationBadge] = useState('CAPTION CRAFTED');

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

  const toggleTone = (tone: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedTones.includes(tone)) {
      setSelectedTones(selectedTones.filter((t) => t !== tone));
    } else {
      setSelectedTones([...selectedTones, tone]);
    }
  };

  const handleRegenerate = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const nextIdx = (suggestedIndex + 1) % SUGGESTED_CAPTIONS_CATALOG.length;
    setSuggestedIndex(nextIdx);
    const nextItem = SUGGESTED_CAPTIONS_CATALOG[nextIdx];
    setDraftText(nextItem.text);
    setQuickCta(nextItem.cta);
    setHashtagsText(nextItem.hashtags);

    setCelebrationTitle('New Caption Generated!');
    setCelebrationSubtitle('Fresh viral angle and hashtags loaded into your editor.');
    setCelebrationSpeech('1-day streak protected! Keep up the momentum.');
    setCelebrationBadge('CAPTION REFRESHED');
    setShowCelebrationModal(true);
  };

  const handleApplyRecommendation = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setDraftText(
      'One realization changed everything for me: I used to wait for the "perfect idea" for days. Once I started posting raw, daily lessons, my reach 10xed in 30 days.'
    );
    setCelebrationTitle('Recommendation Applied!');
    setCelebrationSubtitle('First line strengthened with a specific realization hook.');
    setCelebrationSpeech('Viewer retention probability boosted by +24%!');
    setCelebrationBadge('JARVIS OPTIMIZED');
    setShowCelebrationModal(true);
  };

  const handleMakeShorter = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDraftText(
      'Perfection is the enemy of progress. Stop waiting for the perfect idea and start sharing what helped you yesterday.'
    );
  };

  const handleAddPersonal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDraftText(
      "When I started my creator journey, I almost quit twice because my posts didn't look cinematic. But consistency beats perfection every single time."
    );
  };

  const handleImproveHook = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDraftText(
      'Stop making this mistake if you want to stay consistent as a creator: waiting for the perfect idea.'
    );
  };

  const handleToggleBookmark = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const next = !isSavedBookmark;
    setIsSavedBookmark(next);

    if (next) {
      setCelebrationTitle('Caption Saved!');
      setCelebrationSubtitle('Caption and hashtags saved to your creator drafts.');
      setCelebrationSpeech('1-day streak protected! Ready anytime.');
      setCelebrationBadge('DRAFT SAVED');
      setShowCelebrationModal(true);
    }
  };

  const handleAddToPost = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (onAddToPost) {
      onAddToPost(draftText, hashtagsText);
    }
  };

  const unreadNotifCount = notificationsList.filter((n) => n.unread).length;

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0C0A12" : "#FAF8F5"} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
          {/* 1. TOP AIRY HEADER BAR */}
          <FreeAppHeader
            onBack={onBack}
            onOpenJarvisPro={onOpenJarvisPro}
            onOpenMessages={() => {
              if (onOpenMessages) {
                onOpenMessages();
              } else {
                triggerModalAnim();
                setShowChatModal(true);
              }
            }}
            onOpenNotifications={() => {
              triggerModalAnim();
              setShowNotificationModal(true);
            }}
            onOpenProfile={() => {
              triggerModalAnim();
              setShowProfileModal(true);
            }}
            userProfile={userProfile}
            unreadCount={unreadNotifCount}
            isDark={isDark}
          />

          {/* 2. MAIN SCROLLABLE CONTENT */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Pill Badges */}
            <View style={styles.topBadgesRow}>
              <View style={styles.captionWriterPill}>
                <Text style={styles.captionWriterPillText}>CAPTION WRITER</Text>
              </View>
              <View style={styles.freeCaptionPill}>
                <Text style={styles.freeCaptionPillText}>Free Caption Tool</Text>
              </View>
            </View>

            {/* Main Title & Subtitle */}
            <Text style={styles.mainTitle}>Write a caption that fits your post.</Text>
            <Text style={styles.mainSubtitle}>
              Create captions, CTAs and hashtags that match your content goal and platform.
            </Text>

            {/* 1. "WHAT IS THIS POST ABOUT?" HERO CARD (LIVE-EDITABLE) */}
            <View style={styles.topicHeroCard}>
              <View style={styles.topicHeaderRow}>
                <View style={styles.topicTitleGroup}>
                  <Text style={styles.topicHeaderIcon}>✍️</Text>
                  <Text style={styles.topicHeaderTitle}>What is this post about?</Text>
                </View>
                <Text style={styles.editableHintMicro}>Editable</Text>
              </View>

              {/* Editable Topic Box (Directly Tappable Content Box) */}
              <Pressable
                onPress={() => topicInputRef.current?.focus()}
                style={[styles.topicInnerBox, isTopicFocused && styles.topicInnerBoxFocused]}
              >
                <TextInput
                  ref={topicInputRef}
                  value={postTopic}
                  onChangeText={setPostTopic}
                  placeholder="Type your post topic or idea..."
                  placeholderTextColor="#94A3B8"
                  multiline={true}
                  scrollEnabled={false}
                  onFocus={() => setIsTopicFocused(true)}
                  onBlur={() => setIsTopicFocused(false)}
                  style={styles.topicInput}
                />
              </Pressable>

              {/* Goal Line with Dedicated Change Pill Button */}
              <Pressable
                style={({ pressed }) => [styles.goalRow, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  triggerModalAnim();
                  setShowGoalModal(true);
                }}
                hitSlop={8}
              >
                <View style={styles.goalLeftGroup}>
                  <Text style={styles.goalIcon}>🎯</Text>
                  <Text style={styles.goalLabel}>
                    Goal: <Text style={styles.goalValue}>{selectedGoal}</Text>
                  </Text>
                </View>
                <View style={styles.goalChangePill}>
                  <Text style={styles.goalChangePillText}>Change ➔</Text>
                </View>
              </Pressable>
            </View>

            {/* 2. CHOOSE A TONE SECTION */}
            <Text style={styles.sectionLabel}>Choose A Tone</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tonePillsRow}
            >
              {TONE_OPTIONS.map((tone) => {
                const isSelected = selectedTones.includes(tone);
                return (
                  <Pressable
                    key={tone}
                    onPress={() => toggleTone(tone)}
                    style={[
                      styles.tonePill,
                      isSelected && styles.tonePillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tonePillText,
                        isSelected && styles.tonePillTextActive,
                      ]}
                    >
                      {tone}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* 3. SUGGESTED CAPTIONS SECTION */}
            <View style={styles.suggestedHeaderRow}>
              <Text style={styles.suggestedTitle}>Suggested Captions</Text>
              <Pressable onPress={handleRegenerate} hitSlop={8}>
                <Text style={styles.regenerateLink}>🔄 Regenerate</Text>
              </Pressable>
            </View>

            {/* Recommended Caption Card (Tap to Copy to Draft) */}
            <Pressable
              style={styles.recommendedCard}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setDraftText(currentSuggestion.text);
              }}
            >
              <View style={styles.recommendedBadgeRow}>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedBadgeText}>⭐ RECOMMENDED</Text>
                </View>
              </View>

              <Text style={styles.recommendedCaptionText}>
                {currentSuggestion.text}
              </Text>

              {/* Tags Row */}
              <View style={styles.recommendedTagsRow}>
                {currentSuggestion.tags.map((tag, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.recommendedTagPill,
                      tag === 'Strong CTA' && styles.strongCtaTagPill,
                    ]}
                  >
                    <Text
                      style={[
                        styles.recommendedTagText,
                        tag === 'Strong CTA' && styles.strongCtaTagText,
                      ]}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>

            {/* 4. QUICK CTA CARD (EDITABLE) */}
            <View style={styles.quickCtaCard}>
              <View style={styles.cardHeaderFlex}>
                <Text style={styles.microCapLabel}>QUICK CTA</Text>
                <Text style={styles.editableHintMicro}>Editable</Text>
              </View>
              <TextInput
                value={quickCta}
                onChangeText={setQuickCta}
                placeholder="Type custom CTA..."
                placeholderTextColor="#94A3B8"
                style={styles.quickCtaInput}
              />
            </View>

            {/* 5. HASHTAGS CARD (EDITABLE) */}
            <View style={styles.hashtagsCard}>
              <View style={styles.cardHeaderFlex}>
                <Text style={styles.microCapLabel}>HASHTAGS</Text>
                <Text style={styles.editableHintMicro}>Editable</Text>
              </View>
              <TextInput
                value={hashtagsText}
                onChangeText={setHashtagsText}
                placeholder="Type hashtags..."
                placeholderTextColor="#94A3B8"
                style={styles.hashtagsInput}
              />
            </View>

            {/* 6. DRAFT EDITOR CARD (LIVE-EDITABLE MULTILINE) */}
            <View style={styles.draftEditorCard}>
              <View style={styles.draftEditorHeaderRow}>
                <View style={styles.draftEditorBadge}>
                  <Text style={styles.draftEditorBadgeText}>DRAFT EDITOR</Text>
                </View>
                <Text style={styles.draftEditorTimeLeft}>⏱ 3 WEEKS LEFT</Text>
              </View>

              {/* Live Editable Text Input */}
              <View style={styles.draftInputContainer}>
                <TextInput
                  value={draftText}
                  onChangeText={setDraftText}
                  placeholder="Write or refine your caption..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  style={styles.draftEditorInput}
                />
              </View>

              {/* Status Check & Fit Row */}
              <View style={styles.draftStatusRow}>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillCheck}>✓</Text>
                  <Text style={styles.statusPillText}>CTA OK</Text>
                </View>
                <View style={styles.fitPill}>
                  <Text style={styles.fitPillText}>📑 High Fit</Text>
                </View>
              </View>

              <Text style={styles.charCountText}>{draftText.length} / 2200 CHARS</Text>

              {/* Quick Action Buttons */}
              <View style={styles.draftActionsRow}>
                <Pressable
                  style={({ pressed }) => [styles.draftActionBtn, pressed && styles.btnPressed]}
                  onPress={handleMakeShorter}
                >
                  <Text style={styles.draftActionBtnText}>Make Shorter</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.draftActionBtn, pressed && styles.btnPressed]}
                  onPress={handleAddPersonal}
                >
                  <Text style={styles.draftActionBtnText}>Add Personal</Text>
                </Pressable>
              </View>

              <Pressable
                style={({ pressed }) => [styles.improveHookBtn, pressed && styles.btnPressed]}
                onPress={handleImproveHook}
              >
                <Text style={styles.improveHookBtnText}>Improve Hook</Text>
              </Pressable>
            </View>

            {/* 7. JARVIS INSIGHT CARD */}
            <View style={styles.jarvisCard}>
              <View style={styles.jarvisCardHeaderRow}>
                <View style={styles.jarvisFlameBox}>
                  <Image
                    source={require('../../assets/images/jarvis-core-flame.png')}
                    style={styles.jarvisFlameImg}
                    resizeMode="contain"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.jarvisTitle}>Jarvis Insight</Text>
                </View>

                <View style={styles.aiPoweredBadge}>
                  <Text style={styles.aiPoweredBadgeText}>AI-POWERED</Text>
                </View>
              </View>

              <Text style={styles.jarvisBodyText}>
                This caption works best when the <Text style={{ fontWeight: '800' }}>first line</Text> is specific. Mention one realisation that changed how you create.
              </Text>

              <Pressable
                style={({ pressed }) => [styles.jarvisApplyBtn, pressed && styles.btnPressed]}
                onPress={handleApplyRecommendation}
              >
                <Text style={styles.jarvisApplyBtnText}>Apply Recommendation</Text>
              </Pressable>
            </View>

            {/* 8. PRIMARY BOTTOM ACTION: ADD TO POST + BOOKMARK */}
            <View style={styles.bottomActionRow}>
              <Pressable
                style={({ pressed }) => [styles.addToPostMainBtn, pressed && styles.btnPressed]}
                onPress={handleAddToPost}
              >
                <LinearGradient
                  colors={['#7C3AED', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addToPostGradient}
                >
                  <Text style={styles.addToPostBtnText}>Add to Post</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.bookmarkBtn,
                  isSavedBookmark && styles.bookmarkBtnActive,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleToggleBookmark}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill={isSavedBookmark ? '#FFFFFF' : 'none'}>
                  <Path
                    d="M19 21L12 16L5 21V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21Z"
                    stroke={isSavedBookmark ? '#FFFFFF' : '#582CDB'}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Pressable>
            </View>

            {/* Bottom spacing to clear floating tab bar */}
            <View style={{ height: 110 }} />
          </ScrollView>

          {/* UNIFIED SIGNATURE FLOATING TAB BAR */}
          <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

          {/* MODAL: CHANGE CONTENT GOAL */}
          <Modal
            visible={showGoalModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowGoalModal(false)}
          >
            <View style={styles.modalOverlay}>
              <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.modalTitle}>🎯 Select Content Goal</Text>
                    <Text style={styles.modalSubtitle}>Choose what you want your caption to achieve</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowGoalModal(false)}
                    style={styles.modalCloseCircle}
                    hitSlop={8}
                  >
                    <Text style={styles.modalCloseCross}>✕</Text>
                  </Pressable>
                </View>

                {GOAL_OPTIONS.map((item) => {
                  const isSelected = selectedGoal === item.title;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                        setSelectedGoal(item.title);
                        setDraftText(item.caption);
                        setQuickCta(item.cta);
                        setHashtagsText(item.hashtags);
                        setShowGoalModal(false);
                      }}
                      style={({ pressed }) => [
                        styles.goalModalOption,
                        isSelected && styles.goalModalOptionActive,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <View style={styles.goalModalOptionRow}>
                        <Text style={styles.goalModalIcon}>{item.icon}</Text>
                        <Text style={[styles.goalModalOptionText, isSelected && styles.goalModalOptionTextActive]}>
                          {item.title}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.selectedCheckBadge}>
                          <Text style={styles.selectedCheckText}>✓ SELECTED</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </Animated.View>
            </View>
          </Modal>

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
                    I crafted these captions to maximize saves and comment discussions! The first 2 lines stop the scroll.
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
            badgeText={celebrationBadge}
            xpEarned={35}
            streakCount={userProfile?.streakCount || 1}
            actionText="Keep Editing ➔"
            onDismiss={() => {
              setShowCelebrationModal(false);
            }}
          />
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 2,
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
    gap: 8,
    marginBottom: 6,
    marginTop: 0,
  },
  captionWriterPill: {
    backgroundColor: '#582CDB',
    paddingVertical: 4.5,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  captionWriterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  freeCaptionPill: {
    backgroundColor: '#FAF8FC',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 4.5,
    paddingHorizontal: 11,
    borderRadius: 100,
  },
  freeCaptionPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.4,
  },

  mainTitle: {
    fontSize: Platform.OS === 'web' ? ('clamp(18px, 4.5vw, 22px)' as any) : sFont(20),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.35,
    marginBottom: 4,
    marginTop: 4,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },

  // Topic Hero Card
  topicHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  topicHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  topicTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexShrink: 1,
  },
  topicHeaderIcon: {
    fontSize: 15,
  },
  topicHeaderTitle: {
    fontSize: sFont(13.5),
    fontWeight: '800',
    color: '#171420',
  },
  editableHintMicro: {
    fontSize: 9.5,
    color: '#7F7894',
    fontWeight: '700',
    backgroundColor: '#F3EEFB',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
    overflow: 'hidden',
    flexShrink: 0,
  },
  cardHeaderFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  topicInnerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  topicInnerBoxFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  topicInput: {
    fontSize: 14,
    color: '#171420',
    lineHeight: 20,
    fontWeight: '600',
    minHeight: 40,
    padding: 0,
    margin: 0,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
    gap: 8,
  },
  goalLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 6,
  },
  goalIcon: {
    fontSize: 14,
  },
  goalLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    flexShrink: 1,
  },
  goalValue: {
    color: '#582CDB',
    fontWeight: '800',
  },
  goalChangePill: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingVertical: 3.5,
    paddingHorizontal: 9,
    borderRadius: 7,
    flexShrink: 0,
  },
  goalChangePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.2,
  },

  // Choose a Tone Section
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 8,
  },
  tonePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tonePill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 7,
    paddingHorizontal: 15,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tonePillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  tonePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tonePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Suggested Captions
  suggestedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  suggestedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
  },
  regenerateLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  recommendedCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  recommendedBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  recommendedBadge: {
    backgroundColor: '#F59E0B',
    paddingVertical: 3.5,
    paddingHorizontal: 9,
    borderRadius: 6,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  recommendedCaptionText: {
    fontSize: 14,
    color: '#171420',
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: '500',
  },
  recommendedTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    rowGap: 6,
  },
  recommendedTagPill: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
    flexShrink: 0,
  },
  recommendedTagText: {
    fontSize: sFont(11),
    fontWeight: '700',
    color: '#6D28D9',
  },
  strongCtaTagPill: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
    flexShrink: 0,
  },
  strongCtaTagText: {
    fontSize: sFont(11),
    color: '#B45309',
    fontWeight: '800',
  },

  // Quick CTA & Hashtags Cards
  quickCtaCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 12,
    marginBottom: 10,
  },
  quickCtaInput: {
    fontSize: 13,
    color: '#171420',
    fontWeight: '600',
    paddingVertical: 4,
  },
  hashtagsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 12,
    marginBottom: 14,
  },
  hashtagsInput: {
    fontSize: 12.5,
    color: '#582CDB',
    fontWeight: '700',
    paddingVertical: 4,
  },
  microCapLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },

  // Draft Editor Card
  draftEditorCard: {
    backgroundColor: '#FAF8FE',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  draftEditorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  draftEditorBadge: {
    backgroundColor: '#582CDB',
    paddingVertical: 3.5,
    paddingHorizontal: 9,
    borderRadius: 6,
  },
  draftEditorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  draftEditorTimeLeft: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  draftInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    padding: 12,
    marginBottom: 12,
  },
  draftEditorInput: {
    fontSize: 14,
    color: '#171420',
    lineHeight: 20,
    fontWeight: '500',
    minHeight: 80,
  },
  draftStatusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusPillCheck: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '700',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  fitPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  fitPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
  },
  charCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 12,
    marginTop: 2,
  },
  draftActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  draftActionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  improveHookBtn: {
    height: 40,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  improveHookBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Jarvis Insight Card
  jarvisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#582CDB',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  jarvisCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  jarvisFlameBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisFlameImg: {
    width: 20,
    height: 20,
  },
  jarvisTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
  },
  aiPoweredBadge: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  aiPoweredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  jarvisBodyText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  jarvisApplyBtn: {
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisApplyBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },

  // Bottom Action Row
  bottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  addToPostMainBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  addToPostGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToPostBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  bookmarkBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookmarkBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
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
  goalModalOption: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalModalOptionActive: {
    backgroundColor: '#FAF5FF',
    borderColor: '#582CDB',
    borderWidth: 2,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  goalModalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  goalModalIcon: {
    fontSize: 15,
  },
  goalModalOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  goalModalOptionTextActive: {
    color: '#582CDB',
    fontWeight: '800',
  },
  selectedCheckBadge: {
    backgroundColor: '#582CDB',
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    borderRadius: 6,
    flexShrink: 0,
  },
  selectedCheckText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
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
