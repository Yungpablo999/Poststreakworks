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
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

interface ScriptScreenProps {
  ideaTitle?: string;
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onUseAsPost?: (scriptData: { hook: string; body: string; takeaway: string; cta: string }) => void;
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
    body: "Convert today's idea into a post to keep your 47-day streak.",
    time: '2h ago',
    unread: true,
    iconEmoji: '🔥',
    badgeBg: '#FEF3C7',
    badgeBorder: '#FDE68A',
  },
];

const ALTERNATIVE_HOOKS = [
  'Stop making this mistake if you want to stay consistent as a creator.',
  "If you're struggling to post daily, read this.",
  'The truth about consistency that nobody tells you.',
  'Why 90% of creators quit before month 2 (and how to avoid it).',
];

const CTA_OPTIONS = [
  'What is one creator habit that helped you stay consistent?',
  'Comment "GROWTH" and I will send you my daily batch-filming checklist!',
  'Which of these 3 tips are you trying first this week?',
  'Save this post so you have it ready for your next filming session.',
];

export const ScriptScreen: React.FC<ScriptScreenProps> = ({
  ideaTitle = 'One thing I wish I knew before I started creating',
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
  onUseAsPost,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [selectedPhaseTab, setSelectedPhaseTab] = useState<'hook' | 'body' | 'lesson' | 'cta'>('hook');

  // Script Components State
  const [selectedHook, setSelectedHook] = useState(ALTERNATIVE_HOOKS[0]);
  const [generationsLeft, setGenerationsLeft] = useState(2);
  const [bodyText, setBodyText] = useState(
    'We always think we need a massive content plan to start. But in reality, all you need is a lesson you learned yesterday. Most creators overthink the \'Big Idea\' and miss the daily progress...'
  );
  const [bodyFilter, setBodyFilter] = useState<'shorter' | 'personal' | 'energetic' | null>(null);
  const [takeawayText, setTakeawayText] = useState(
    'Consistency gets easier when you stop waiting for perfect ideas and start sharing useful lessons.'
  );
  const [ctaIndex, setCtaIndex] = useState(0);
  const [isCtaSelected, setIsCtaSelected] = useState(true);

  // Modals & Celebrations
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Script Ready!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('Your full video script is formatted and ready for filming.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('47-day streak protected! +40 XP earned.');
  const [celebrationBadge, setCelebrationBadge] = useState('SCRIPT CRAFTED');

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

  const handleSelectHook = (hook: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedHook(hook);
  };

  const handleBodyFilter = (filter: 'shorter' | 'personal' | 'energetic') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setBodyFilter(bodyFilter === filter ? null : filter);

    if (filter === 'shorter') {
      setBodyText(
        'Stop overthinking massive content plans. All you need is one small lesson you learned yesterday. Consistency comes from daily sharing, not perfect ideas.'
      );
    } else if (filter === 'personal') {
      setBodyText(
        'When I first started, I used to wait days for the \'perfect idea\'. That held me back for months. Once I switched to sharing raw lessons from my daily work, everything unlocked.'
      );
    } else if (filter === 'energetic') {
      setBodyText(
        'Here is the secret top creators do not tell you: massive content plans are a trap! Share the real lesson you figured out yesterday. Speed beats perfection every single time!'
      );
    }
  };

  const handleShuffleCta = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setCtaIndex((prev) => (prev + 1) % CTA_OPTIONS.length);
  };

  const handleCopyFullScript = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const fullScript = `HOOK:
${selectedHook}

BODY:
${bodyText}

TAKEAWAY:
${takeawayText}

CTA:
${CTA_OPTIONS[ctaIndex]}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(fullScript);
      }
    } catch (_e) {
      // Graceful fallback
    }

    setCelebrationTitle('Script Copied!');
    setCelebrationSubtitle('Full script copied to clipboard and ready for your teleprompter or notes.');
    setCelebrationSpeech('47-day streak protected! +40 XP added.');
    setCelebrationBadge('COPIED TO CLIPBOARD');
    setShowCelebrationModal(true);
  };

  const handleUseAsPost = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (onUseAsPost) {
      onUseAsPost({
        hook: selectedHook,
        body: bodyText,
        takeaway: takeawayText,
        cta: CTA_OPTIONS[ctaIndex],
      });
    }
  };

  const handleSaveDraft = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCelebrationTitle('Draft Saved!');
    setCelebrationSubtitle('Your video script has been preserved in your creator drafts.');
    setCelebrationSpeech('Momentum protected! Ready whenever you film.');
    setCelebrationBadge('DRAFT SAVED');
    setShowCelebrationModal(true);
  };

  const unreadNotifCount = notificationsList.filter((n) => n.unread).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
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
                triggerModalAnim();
                setShowChatModal(true);
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
          {/* Top Pill Badge */}
          <View style={styles.topBadgesRow}>
            <View style={styles.freeScriptPill}>
              <Text style={styles.freeScriptPillText}>Free Script Tool</Text>
            </View>
          </View>

          {/* Main Title */}
          <Text style={styles.mainTitle}>Turn your idea into a script.</Text>

          {/* 1. SELECTED IDEA CARD */}
          <View style={styles.selectedIdeaCard}>
            <View style={styles.selectedIdeaHeaderRow}>
              <Text style={styles.selectedIdeaLabel}>SELECTED IDEA</Text>
              <Text style={styles.selectedIdeaDuration}>30-45 sec</Text>
            </View>

            <Text style={styles.selectedIdeaTitle}>&ldquo;{ideaTitle}&rdquo;</Text>

            <View style={styles.selectedIdeaTagsRow}>
              <View style={styles.ideaTagPill}>
                <Text style={styles.ideaTagPillText}>Personal Lesson</Text>
              </View>
              <View style={styles.ideaTagPill}>
                <Text style={styles.ideaTagPillText}>Creator Advice</Text>
              </View>
              <View style={styles.streakSaverPill}>
                <Text style={styles.streakSaverPillText}>Streak Saver</Text>
              </View>
            </View>
          </View>

          {/* 2. SCRIPT PHASE TABS (4 TABS) */}
          <View style={styles.phaseTabsRow}>
            {[
              { id: 'hook', label: '⚓ HOOK' },
              { id: 'body', label: '📑 BODY' },
              { id: 'lesson', label: '💡 LESSON' },
              { id: 'cta', label: '📢 CTA' },
            ].map((tab) => {
              const isActive = selectedPhaseTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedPhaseTab(tab.id as 'hook' | 'body' | 'lesson' | 'cta');
                  }}
                  style={[
                    styles.phaseTabBtn,
                    isActive && styles.phaseTabBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.phaseTabBtnText,
                      isActive && styles.phaseTabBtnTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 3. HOOK CARD */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <Text style={styles.sectionIcon}>⚓</Text>
                <Text style={styles.sectionTitle}>Hook</Text>
              </View>
              <View style={styles.generationsBadge}>
                <Text style={styles.generationsBadgeText}>{generationsLeft} generations left</Text>
              </View>
            </View>

            {/* Active Selected Hook Box */}
            <View style={styles.activeHookBox}>
              <Text style={styles.activeHookText}>&ldquo;{selectedHook}&rdquo;</Text>
            </View>

            <Text style={styles.alternativeHooksLabel}>ALTERNATIVE HOOKS</Text>

            {/* Alternative Hooks List */}
            {ALTERNATIVE_HOOKS.filter((h) => h !== selectedHook).slice(0, 2).map((hook, i) => (
              <Pressable
                key={i}
                onPress={() => handleSelectHook(hook)}
                style={styles.altHookBox}
              >
                <Text style={styles.altHookText}>&ldquo;{hook}&rdquo;</Text>
              </Pressable>
            ))}
          </View>

          {/* 4. BODY CARD */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <Text style={styles.sectionIcon}>📑</Text>
                <Text style={styles.sectionTitle}>Body</Text>
              </View>
            </View>

            {/* Body Content Box */}
            <View style={styles.bodyContentBox}>
              <Text style={styles.bodyContentText}>{bodyText}</Text>
            </View>

            {/* Body Refinement Chips */}
            <View style={styles.bodyChipsRow}>
              {[
                { id: 'shorter', label: 'Make Shorter' },
                { id: 'personal', label: 'More Personal' },
                { id: 'energetic', label: 'More Energetic' },
              ].map((chip) => {
                const isActive = bodyFilter === chip.id;
                return (
                  <Pressable
                    key={chip.id}
                    onPress={() => handleBodyFilter(chip.id as 'shorter' | 'personal' | 'energetic')}
                    style={[
                      styles.bodyFilterChip,
                      isActive && styles.bodyFilterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bodyFilterChipText,
                        isActive && styles.bodyFilterChipTextActive,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 5. JARVIS CREATIVE ASSISTANT BANNER */}
          <LinearGradient
            colors={['#582CDB', '#431FA8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.jarvisBannerCard}
          >
            <View style={styles.jarvisBannerHeaderRow}>
              <View style={styles.jarvisBannerFlameRing}>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={styles.jarvisBannerFlame}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.jarvisBannerText}>
                Keep your script focused on one clear lesson so it\'s easier for viewers to remember and save.
              </Text>
            </View>

            <View style={styles.jarvisBannerChipsRow}>
              <Pressable
                style={styles.jarvisBannerChip}
                onPress={() => handleBodyFilter('energetic')}
              >
                <Text style={styles.jarvisBannerChipText}>Improve Hook</Text>
              </Pressable>
              <Pressable
                style={styles.jarvisBannerChip}
                onPress={() => handleBodyFilter('personal')}
              >
                <Text style={styles.jarvisBannerChipText}>Make More Personal</Text>
              </Pressable>
            </View>
          </LinearGradient>

          {/* 6. TAKEAWAY CARD */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <Text style={styles.sectionIcon}>💡</Text>
                <Text style={styles.sectionTitle}>Takeaway</Text>
              </View>
            </View>

            <Text style={styles.takeawayBodyText}>&ldquo;{takeawayText}&rdquo;</Text>

            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setTakeawayText(
                  'Consistency creates momentum. Focus on sharing 1 useful lesson every day.'
                );
              }}
              hitSlop={8}
            >
              <Text style={styles.improveTakeawayLink}>IMPROVE TAKEAWAY ➔</Text>
            </Pressable>
          </View>

          {/* 7. CALL TO ACTION CARD */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <Text style={styles.sectionIcon}>📢</Text>
                <Text style={styles.sectionTitle}>Call to Action</Text>
              </View>
            </View>

            <View style={styles.ctaContentBox}>
              <Text style={styles.ctaContentText}>&ldquo;{CTA_OPTIONS[ctaIndex]}&rdquo;</Text>
            </View>

            <View style={styles.ctaActionRow}>
              <Pressable
                style={({ pressed }) => [styles.useCtaBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setIsCtaSelected(!isCtaSelected);
                }}
              >
                <Text style={styles.useCtaBtnText}>USE CTA</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.shuffleCtaBtn, pressed && styles.btnPressed]}
                onPress={handleShuffleCta}
                hitSlop={8}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8M22 12.5a10 10 0 0 1-18.8 4.2L2.5 16"
                    stroke="#582CDB"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Pressable>
            </View>
          </View>

          {/* 8. STREAK IMPACT CARD */}
          <View style={styles.streakImpactCard}>
            <View style={styles.streakImpactHeaderRow}>
              <View>
                <Text style={styles.streakImpactLabel}>STREAK IMPACT</Text>
                <Text style={styles.streakImpactSub}>Helps protect 47-day streak</Text>
              </View>
              <Text style={styles.streakImpactXp}>+40 XP</Text>
            </View>

            <View style={styles.streakProgressBarTrack}>
              <View style={styles.streakProgressBarFill} />
            </View>
          </View>

          {/* 9. SCRIPT PREVIEW CONTAINER */}
          <View style={styles.scriptPreviewCard}>
            <View style={styles.scriptPreviewHeaderRow}>
              <Text style={styles.scriptPreviewLabel}>SCRIPT PREVIEW</Text>
              <View style={styles.scriptPreviewPillsRow}>
                <Text style={styles.scriptPreviewPillText}>⏱ Short-form</Text>
                <Text style={styles.scriptPreviewPillText}>💡 Helpful</Text>
              </View>
            </View>

            {/* Inner Preview Box */}
            <View style={styles.scriptPreviewInnerBox}>
              <Text style={styles.previewLineText}>
                <Text style={styles.previewLineBold}>Hook: </Text>
                {selectedHook}
              </Text>
              <Text style={[styles.previewLineText, { marginTop: 8 }]}>
                <Text style={styles.previewLineBold}>Body: </Text>
                {bodyText}
              </Text>
            </View>

            {/* Dashed Copy Full Script Button */}
            <Pressable
              style={({ pressed }) => [styles.copyScriptBtn, pressed && styles.btnPressed]}
              onPress={handleCopyFullScript}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Rect x="9" y="9" width="13" height="13" rx="2" stroke="#582CDB" strokeWidth="2.2" />
                <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="#582CDB" strokeWidth="2.2" />
              </Svg>
              <Text style={styles.copyScriptBtnText}>COPY FULL SCRIPT</Text>
            </Pressable>
          </View>

          {/* 10. PRIMARY BOTTOM ACTIONS */}
          <Pressable
            style={({ pressed }) => [styles.useAsPostBtn, pressed && styles.btnPressed]}
            onPress={handleUseAsPost}
          >
            <LinearGradient
              colors={['#7C3AED', '#582CDB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.useAsPostGradient}
            >
              <Text style={styles.useAsPostBtnText}>USE AS POST</Text>
            </LinearGradient>
          </Pressable>

          <View style={styles.secondaryActionsRow}>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                handleBodyFilter('energetic');
              }}
            >
              <Text style={styles.secondaryBtnText}>IMPROVE SCRIPT</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
              onPress={handleSaveDraft}
            >
              <Text style={styles.secondaryBtnText}>SAVE DRAFT</Text>
            </Pressable>
          </View>

          {/* Bottom spacing to clear floating tab bar */}
          <View style={{ height: 110 }} />
        </ScrollView>

        {/* UNIFIED SIGNATURE FLOATING TAB BAR */}
        <FloatingTabBar
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />

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
        <Modal
          visible={showProfileModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowProfileModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Creator Passport</Text>
                  <Text style={styles.modalSubtitle}>Your verified consistency record</Text>
                </View>
                <Pressable
                  onPress={() => setShowProfileModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.profileModalCardInner}>
                <View style={styles.profileModalIconRing}>
                  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                      stroke="#582CDB"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Circle cx="12" cy="7" r="4" stroke="#582CDB" strokeWidth="2.2" />
                  </Svg>
                </View>
                <Text style={styles.profileModalName}>Amara Okafor</Text>
                <Text style={styles.profileModalNiche}>Lifestyle &amp; Tech Creator</Text>
                <View style={styles.profileModalLevelPill}>
                  <Text style={styles.profileModalLevelText}>⚡ Level 4 Storyteller • 47-Day Streak</Text>
                </View>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Done</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

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
                  I optimized this 30-second script for TikTok &amp; Reels retention! The first 3 seconds hook audience attention.
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
          xpEarned={40}
          streakCount={47}
          actionText="Keep Editing ➔"
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
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  btnPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
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
  freeScriptPill: {
    backgroundColor: '#FAF8FC',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 4.5,
    paddingHorizontal: 11,
    borderRadius: 100,
  },
  freeScriptPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.4,
  },

  mainTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 14,
    marginTop: 4,
  },

  // Selected Idea Card
  selectedIdeaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedIdeaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedIdeaLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#6D28D9',
    letterSpacing: 0.6,
  },
  selectedIdeaDuration: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  selectedIdeaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 22,
    marginBottom: 12,
  },
  selectedIdeaTagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  ideaTagPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  ideaTagPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  streakSaverPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  streakSaverPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },

  // 2. Phase Tabs Row (4 Tabs)
  phaseTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  phaseTabBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseTabBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  phaseTabBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  phaseTabBtnTextActive: {
    color: '#FFFFFF',
  },

  // Section Cards
  sectionCard: {
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
  },
  generationsBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  generationsBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B45309',
  },

  // Hook Boxes
  activeHookBox: {
    backgroundColor: '#FAF8FE',
    borderLeftWidth: 3.5,
    borderLeftColor: '#582CDB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    padding: 14,
    marginBottom: 12,
  },
  activeHookText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 20,
  },
  alternativeHooksLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  altHookBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8,
  },
  altHookText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },

  // Body Content
  bodyContentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  bodyContentText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  bodyChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  bodyFilterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 100,
  },
  bodyFilterChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#582CDB',
  },
  bodyFilterChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },
  bodyFilterChipTextActive: {
    color: '#582CDB',
  },

  // Jarvis Creative Assistant Banner
  jarvisBannerCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  jarvisBannerHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  jarvisBannerFlameRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisBannerFlame: {
    width: 20,
    height: 20,
  },
  jarvisBannerText: {
    flex: 1,
    fontSize: 12.5,
    color: '#FFFFFF',
    lineHeight: 18,
    fontWeight: '600',
  },
  jarvisBannerChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  jarvisBannerChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  jarvisBannerChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Takeaway Card
  takeawayBodyText: {
    fontSize: 13.5,
    color: '#171420',
    lineHeight: 19,
    marginBottom: 10,
  },
  improveTakeawayLink: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.4,
  },

  // Call to Action Card
  ctaContentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  ctaContentText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  ctaActionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  useCtaBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  useCtaBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  shuffleCtaBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Streak Impact Card
  streakImpactCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    marginBottom: 14,
  },
  streakImpactHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakImpactLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.6,
  },
  streakImpactSub: {
    fontSize: 12.5,
    color: '#92400E',
    fontWeight: '600',
    marginTop: 2,
  },
  streakImpactXp: {
    fontSize: 16,
    fontWeight: '900',
    color: '#D97706',
  },
  streakProgressBarTrack: {
    height: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  streakProgressBarFill: {
    width: '75%',
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },

  // Script Preview Container
  scriptPreviewCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  scriptPreviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scriptPreviewLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  scriptPreviewPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  scriptPreviewPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  scriptPreviewInnerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  previewLineText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  previewLineBold: {
    fontWeight: '800',
    color: '#171420',
  },
  copyScriptBtn: {
    flexDirection: 'row',
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#582CDB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  copyScriptBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.5,
  },

  // Primary Bottom Actions
  useAsPostBtn: {
    height: 50,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
    marginBottom: 10,
  },
  useAsPostGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useAsPostBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
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
    shadowOpacity: 0.2,
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
    fontSize: 11.5,
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
    borderColor: '#F1F5F9',
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
    fontSize: 9.5,
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
    fontSize: 13.5,
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
    fontSize: 10.5,
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
    fontWeight: '900',
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
