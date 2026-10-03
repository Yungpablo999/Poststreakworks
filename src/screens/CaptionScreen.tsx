import React, { useState, useRef, useEffect } from 'react';
import { useMascotThinking } from '../mascot/mascot';
import { useBreakpoint } from '../hooks/useBreakpoint';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Animated,
  Modal,
  Image,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { Text, TextInput } from '../components/ui/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { sFont, sPadding, isNarrowScreen } from '../utils/responsive';
import Reanimated, { Easing, FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { FitLines } from '../components/ui/FitLines';
import { AppButton } from '../components/ui/AppButton';
import { AutoGrowInput } from '../components/ui/AutoGrowInput';
import { JarvisOrb } from '../components/JarvisOrb';
import { ChipRow, SaveButton } from '../components/ideas/IdeasBlocks';
import { PlatformFitCard } from '../components/caption/PlatformFitCard';
import { CaptionOptionCard } from '../components/caption/CaptionBlocks';
import { ComposerToast } from '../components/composer/ComposerBlocks';
import { getCaptionOptions, describeCaptionShape, saveDraft, removeDraft, IDEA_GOALS, CAPTION_TONES, type IdeaGoal } from '../data';
import { ds } from '../theme/colors';

interface CaptionScreenProps {
  ideaTitle?: string;
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onAddToPost?: (captionText: string, hashtags: string, topic?: string) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  /** Pro members: the caption reshaped for each platform. */
  tier?: 'free' | 'pro';
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
    body: "Convert today's idea into a post to kick off your creator streak.",
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
    cta: 'What creator habit has helped you stay consistent?',
    hashtags: '#CreatorTips #Growth #Consistency #ContentStrategy',
    tags: ['Helpful', 'Personal', 'Strong CTA'],
  },
  {
    id: 'fast_streak',
    icon: '⚡',
    title: 'Post fast & protect my streak',
    caption: 'Done and posted beats perfect and unpublished every single day. 15 minutes of sharing your daily progress is all it takes to keep your streak alive.',
    cta: 'Double-tap if you are keeping your posting streak alive today! 🔥',
    hashtags: '#ContentCreation #Consistency #CreatorMindset',
    tags: ['Fast Post', 'Streak Saver', 'High Energy'],
  },
  {
    id: 'traffic_leads',
    icon: '📈',
    title: 'Drive traffic & DM leads',
    caption: 'Want to know the exact workflow I use to batch-create content and turn daily viewers into warm inbound leads without burning out?',
    cta: 'Comment "GROWTH" below and I will send you my daily creation template for free!',
    hashtags: '#InboundLeads #CreatorBusiness #AudienceGrowth',
    tags: ['Lead Magnet', 'Inbound', 'High Conversion'],
  },
  {
    id: 'viral_reach',
    icon: '🔥',
    title: 'Viral shares & reach',
    caption: 'Why do 90% of creators stop posting in month 2? Because they overthink the Big Idea. Shift your mindset from inventing to documenting and watch your reach explode.',
    cta: 'Share this post with a creator who needed to hear this today!',
    hashtags: '#ViralHooks #GrowthHacks #Storytelling #PostDaily',
    tags: ['Viral Reach', 'High Shares', 'Algorithm Rank'],
  },
];

const TONE_OPTIONS = ['Helpful', 'Honest', 'Motivational', 'Funny', 'Professional'];

const SUGGESTED_CAPTIONS_CATALOG = [
  {
    id: 'cap_1',
    text: 'I used to wait until every idea felt perfect before posting. But the truth is, perfection is the enemy of progress. Once I started sharing small lessons instead of waiting for the perfect idea, creating became easier.',
    cta: 'What creator habit has helped you stay consistent?',
    hashtags: '#CreatorTips #Growth #Consistency #ContentStrategy',
    tags: ['Helpful', 'Personal', 'Strong CTA'],
  },
  {
    id: 'cap_2',
    text: 'Here is the real secret behind keeping a daily streak: you do not need 10 hours to film. You just need 15 minutes and one clear lesson you learned yesterday.',
    cta: 'Save this post so you have it ready for your next filming session!',
    hashtags: '#ContentCreation #Consistency #CreatorMindset',
    tags: ['Honest', 'Actionable', 'High Saves'],
  },
  {
    id: 'cap_3',
    text: 'Why do 90% of creators stop posting in month 2? Because they overthink the Big Idea. Shift your mindset from inventing to documenting.',
    cta: 'Drop a "🔥" if you needed to hear this today!',
    hashtags: '#ViralHooks #GrowthHacks #Storytelling #PostDaily',
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
  userProfile,
  onSaveProfile,
  tier = 'free',
}) => {
  const onDesktop = useBreakpoint() === 'desktop';
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('create');

  // Live-Editable Screen State
  const [postTopic, setPostTopic] = useState(ideaTitle);
  const [selectedGoal, setSelectedGoal] = useState('Get saves & comments');
  const [selectedTones, setSelectedTones] = useState<string[]>(['Helpful', 'Honest']);
  const [isTopicFocused, setIsTopicFocused] = useState(false);
  const topicInputRef = useRef<TextInput>(null);

  const [isQuickCtaFocused, setIsQuickCtaFocused] = useState(false);
  const quickCtaInputRef = useRef<TextInput>(null);

  const [isHashtagsFocused, setIsHashtagsFocused] = useState(false);
  const hashtagsInputRef = useRef<TextInput>(null);

  // Suggested Captions
  const [suggestedIndex, setSuggestedIndex] = useState(0);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
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
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Caption Ready!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Your viral caption and hashtags are primed for your post.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('Day 1 post ready! +35 XP earned.');
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
    setIsCaptionExpanded(false);
    const nextItem = SUGGESTED_CAPTIONS_CATALOG[nextIdx];
    setDraftText(nextItem.text);
    setQuickCta(nextItem.cta);
    setHashtagsText(nextItem.hashtags);
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

  const handleImproveOpening = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDraftText(
      'Stop making this mistake if you want to stay consistent as a creator: waiting for the perfect idea before you post.'
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
      setCelebrationSpeech('Day 1 post ready! Ready anytime.');
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

  // ── Caption writer ────────────────────────────────────────────────────────
  const [goal, setGoal] = useState<IdeaGoal>('comments');
  const [tones, setTones] = useState<string[]>(['Helpful', 'Honest']);
  const [round, setRound] = useState(0);
  const [thinking, setThinking] = useState(false);
  const options = React.useMemo(() => getCaptionOptions(postTopic, goal, tones, round), [postTopic, goal, tones, round]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [body, setBody] = useState(options[0].body);
  const [ending, setEnding] = useState(options[0].ending);
  const [tags, setTags] = useState(options[0].hashtags);
  const [bodyFocused, setBodyFocused] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [touching, setTouching] = useState<string | null>(null);
  useMascotThinking(thinking || !!touching);
  const [saved, setSaved] = useState(false);
  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast((t) => (t === m ? null : t)), 2400);
  };
  const spin = useSharedValue(0);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));

  const applyOption = (o: (typeof options)[number]) => {
    setPickedId(o.id);
    setBody(o.body);
    setEnding(o.ending);
    setTags(o.hashtags);
  };
  // New goal / tone: show Jarvis rewriting for a beat, then the reshaped
  // options arrive and the first one fills the editor
  const firstShape = useRef(true);
  useEffect(() => {
    applyOption(options[0]);
    if (firstShape.current) {
      firstShape.current = false;
      return;
    }
    setThinking(true);
    const id = setTimeout(() => setThinking(false), 500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, tones.join('|')]);
  useEffect(() => {
    applyOption(options[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const newOptions = () => {
    if (thinking) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    spin.value = withTiming(spin.value + 1, { duration: 500, easing: Easing.out(Easing.cubic) });
    setThinking(true);
    setTimeout(() => {
      setRound((r) => r + 1);
      setThinking(false);
    }, 650);
  };

  // Quick Jarvis touches on the caption, with a short thinking beat
  const touch = (kind: 'short' | 'personal' | 'opening') => {
    setTouching(kind);
    setTimeout(() => {
      if (kind === 'short') setBody((b) => b.match(/^[^.!?\n]*[.!?]?/)?.[0]?.trim() || b);
      if (kind === 'personal') setBody((b) => `When I started, this was me. ${b}`);
      if (kind === 'opening') setBody((b) => `Stop scrolling if this is you. ${b}`);
      setTouching(null);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 600);
  };

  const fullCaption = [body.trim(), ending.trim()].filter(Boolean).join('\n\n');

  // Save toggles: tap again to take it back out of drafts
  const savedDraftId = useRef<string | null>(null);
  const saveCaption = () => {
    if (saved && savedDraftId.current) {
      removeDraft(savedDraftId.current);
      savedDraftId.current = null;
      setSaved(false);
      showToast('Removed from drafts');
      return;
    }
    const id = `caption-${postTopic}`;
    saveDraft({ id, title: postTopic, kind: 'post', format: 'Caption' });
    savedDraftId.current = id;
    setSaved(true);
    showToast('Saved to drafts. Find it on Create.');
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0C0A12" : "#FAF8F5"} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
          <GlassBackdrop />
          {/* 1. TOP AIRY HEADER BAR */}
          <FreeAppHeader
            backgroundColor="transparent"
            onBack={onBack}
            onOpenJarvisPro={onOpenJarvisPro}
            onOpenProfile={() => {
              triggerModalAnim();
              setShowProfileModal(true);
            }}
            userProfile={userProfile}
            isDark={isDark}
          />

          {/* 2. MAIN SCROLLABLE CONTENT */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* HEADLINE — same two-line structure on every screen size */}
            <Reanimated.View entering={FadeInUp.duration(500)} style={styles.headline}>
              <FitLines
                lines={['Write a caption', <Text key="c" style={styles.headlineAccent}>that fits your post</Text>]}
                textStyle={styles.headlineText}
                maxFontSize={32}
                align="left"
                accessibilityLabel="Write a caption that fits your post"
              />
            </Reanimated.View>

            {/* TOPIC */}
            <Reanimated.View entering={FadeInUp.delay(80).duration(500)}>
              <GlassCard strong radius={24} padding={16}>
                <View style={styles.topicHead}>
                  <JarvisOrb size={24} />
                  <Text style={styles.eyebrow}>WHAT'S THIS POST ABOUT?</Text>
                </View>
                <View style={[styles.field, isTopicFocused && styles.fieldOn]}>
                  <AutoGrowInput
                    value={postTopic}
                    onChangeText={setPostTopic}
                    onFocus={() => setIsTopicFocused(true)}
                    onBlur={() => setIsTopicFocused(false)}
                    placeholder="e.g. My 5-minute morning reset"
                    minHeight={26}
                    accessibilityLabel="What this post is about"
                  />
                </View>
              </GlassCard>
            </Reanimated.View>

            {/* GOAL + TONE */}
            <Reanimated.View entering={FadeInUp.delay(140).duration(500)} style={styles.filters}>
              <ChipRow label="Goal" items={IDEA_GOALS} selected={[goal]} onToggle={(id) => setGoal(id as IdeaGoal)} />
              <ChipRow
                label="Tone"
                items={CAPTION_TONES.map((t) => ({ id: t, label: t }))}
                selected={tones}
                onToggle={(id) => setTones((prev) => (prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id]))}
              />
            </Reanimated.View>

            {/* OPTIONS */}
            <View style={styles.optionsHead}>
              <View style={styles.row}>
                <JarvisOrb size={22} />
                <Text style={styles.sectionLabel}>Jarvis's options</Text>
              </View>
              <Pressable onPress={newOptions} hitSlop={8} accessibilityRole="button" accessibilityLabel="Write new options" style={styles.newBtn}>
                <Reanimated.View style={spinStyle}>
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                    <Path d="M4 12a8 8 0 0113.7-5.7L20 8M20 3v5h-5M20 12a8 8 0 01-13.7 5.7L4 16M4 21v-5h5" stroke={ds.purple} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Reanimated.View>
                <Text style={styles.newBtnText}>New options</Text>
              </Pressable>
            </View>
            <Reanimated.View key={`${goal}-${tones.join('')}`} entering={FadeIn.duration(250)}>
              <Text style={styles.shape}>{describeCaptionShape(goal, tones)}</Text>
            </Reanimated.View>
            {thinking ? (
              <Reanimated.View entering={FadeIn.duration(120)} style={styles.thinking}>
                <JarvisOrb size={22} />
                <Text style={styles.thinkingText}>Jarvis is rewriting for you…</Text>
              </Reanimated.View>
            ) : (
              onDesktop ? (
                // Desktop: the options share the full width, side by side
                <View key={`${round}-${goal}-${tones.join('')}`} style={styles.optionsRow}>
                  {options.map((o, i) => (
                    <CaptionOptionCard key={o.id} fill option={o} index={i} selected={(pickedId ?? options[0].id) === o.id} onPress={() => applyOption(o)} />
                  ))}
                </View>
              ) : (
              <ScrollView key={`${round}-${goal}-${tones.join('')}`} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.options}>
                {options.map((o, i) => (
                  <CaptionOptionCard key={o.id} option={o} index={i} selected={(pickedId ?? options[0].id) === o.id} onPress={() => applyOption(o)} />
                ))}
              </ScrollView>
              )
            )}

            {/* YOUR CAPTION */}
            <Text style={[styles.sectionLabel, { marginTop: 24, marginBottom: 10 }]}>Your caption</Text>
            <GlassCard strong radius={24} padding={16}>
              <View style={[styles.field, bodyFocused && styles.fieldOn]}>
                {touching ? (
                  <Reanimated.View entering={FadeIn.duration(120)} style={styles.thinkingInline}>
                    <JarvisOrb size={20} />
                    <Text style={styles.thinkingText}>Jarvis is editing…</Text>
                  </Reanimated.View>
                ) : (
                  <AutoGrowInput
                    value={body}
                    onChangeText={setBody}
                    onFocus={() => setBodyFocused(true)}
                    onBlur={() => setBodyFocused(false)}
                    minHeight={80}
                    accessibilityLabel="Your caption"
                  />
                )}
              </View>
              <Text style={styles.count}>{fullCaption.length} / 2,200 characters</Text>
              <View style={styles.touches}>
                {(
                  [
                    ['short', 'Shorter'],
                    ['personal', 'More personal'],
                    ['opening', 'Better first line'],
                  ] as const
                ).map(([k, label]) => (
                  <Pressable
                    key={k}
                    onPress={() => touch(k)}
                    disabled={!!touching}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.touch, pressed && { transform: [{ scale: 0.96 }] }]}
                  >
                    <Text style={styles.touchText}>{label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.subLabel}>Ending</Text>
              <View style={styles.field}>
                <AutoGrowInput value={ending} onChangeText={setEnding} minHeight={24} accessibilityLabel="Ending" />
              </View>

              <Text style={styles.subLabel}>Hashtags</Text>
              <View style={styles.field}>
                <AutoGrowInput value={tags} onChangeText={setTags} minHeight={24} style={styles.tagsInput} accessibilityLabel="Hashtags" />
              </View>
            </GlassCard>

            {/* PRO: fit for each platform */}
            {tier === 'pro' && (
              <Reanimated.View entering={FadeInUp.duration(450)} style={styles.platformFit}>
                <PlatformFitCard body={body} ending={ending} tags={tags} onCopied={showToast} />
              </Reanimated.View>
            )}

            {/* ACTIONS */}
            <View style={styles.actions}>
              <View style={styles.flex}>
                <AppButton
                  title="Add to post"
                  size="lg"
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onAddToPost?.(fullCaption, tags, postTopic);
                  }}
                  iconRight={
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  }
                />
              </View>
              <SaveButton saved={saved} onPress={saveCaption} size={56} />
            </View>
          </ScrollView>

          {toast && <ComposerToast message={toast} />}

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
                  <View style={styles.modalTitleCol}>
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
                  <View style={styles.modalTitleCol}>
                    <Text style={styles.modalTitle}>Notifications</Text>
                    <Text style={styles.modalSubtitle}>Streak updates & creator alerts</Text>
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
    backgroundColor: ds.bg,
  },
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  headlineAccent: { color: ds.purple },
  topicHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  field: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 12,
  },
  fieldOn: { borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  filters: { gap: 14, marginTop: 18 },
  optionsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  sectionLabel: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2 },
  shape: { fontSize: 12.5, fontWeight: '700', color: ds.text3, marginTop: -4, marginBottom: 10 },
  platformFit: { marginTop: 16 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 30, paddingHorizontal: 10, borderRadius: 999, backgroundColor: ds.lavender },
  newBtnText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  options: { gap: 10, paddingRight: 20, paddingBottom: 4 },
  optionsRow: { flexDirection: 'row', alignItems: 'stretch', gap: 12 },
  thinking: { height: 160, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  thinkingInline: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 8 },
  thinkingText: { fontSize: 13, fontWeight: '700', color: ds.purple },
  count: { alignSelf: 'flex-end', fontSize: 11.5, fontWeight: '700', color: ds.text3, marginTop: 6 },
  touches: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  touch: { flexGrow: 1, height: 36, paddingHorizontal: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.lavender },
  touchText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  subLabel: { fontSize: 12.5, fontWeight: '800', color: ds.text2, marginTop: 14, marginBottom: 6 },
  tagsInput: { color: ds.purple, fontWeight: '800' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
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
    fontSize: Platform.OS === 'web' ? ('clamp(15px, 3.8vw, 17px)' as any) : sFont(16),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.35,
    lineHeight: 22,
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
    marginBottom: 8,
    fontWeight: '500',
  },
  readMoreBtn: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
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
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 10,
  },
  quickCtaCardFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickCtaInput: {
    fontSize: 13.5,
    color: '#171420',
    fontWeight: '600',
    lineHeight: 19,
    paddingVertical: 4,
    margin: 0,
  },
  hashtagsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
  },
  hashtagsCardFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  hashtagsInput: {
    fontSize: 12.5,
    color: '#6D28D9',
    fontWeight: '600',
    lineHeight: 18,
    paddingVertical: 4,
    margin: 0,
  },
  editSignBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F3EEFB',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
  },
  editSignPencil: {
    fontSize: 9,
    color: '#7C3AED',
    fontWeight: '800',
  },
  editSignText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 0.2,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  draftEditorInput: {
    fontSize: 14,
    color: '#171420',
    lineHeight: 20,
    fontWeight: '500',
    minHeight: 52,
    maxHeight: 240,
    padding: 0,
    margin: 0,
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
    marginBottom: 12,
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
    marginBottom: 0,
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
    overflow: 'hidden',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    width: '100%',
  },
  modalTitleCol: {
    flex: 1,
    marginRight: 10,
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
    lineHeight: 16,
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
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  goalModalOption: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
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
    marginRight: 10,
  },
  goalModalIcon: {
    fontSize: 16,
    flexShrink: 0,
  },
  goalModalOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
    flexShrink: 1,
  },
  goalModalOptionTextActive: {
    color: '#582CDB',
    fontWeight: '800',
  },
  selectedCheckBadge: {
    backgroundColor: '#582CDB',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    flexShrink: 0,
    alignSelf: 'center',
  },
  selectedCheckText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
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
