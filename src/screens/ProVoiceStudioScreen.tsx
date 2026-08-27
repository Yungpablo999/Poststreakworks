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
  TextInput,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { sFont, isNarrowScreen } from '../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProVoiceStudioScreenProps {
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenMessages?: (threadId?: string) => void;
  onOpenSchedule?: () => void;
  onOpenPostComposer?: (prefillTitle?: string) => void;
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  onLogout?: () => void;
}

interface VoiceStyleItem {
  id: string;
  name: string;
  tone: string;
  pace: string;
  desc: string;
  sampleDuration: string;
  tag: string;
}

const VOICE_STYLES: VoiceStyleItem[] = [
  {
    id: 'energetic',
    name: 'Energetic Storyteller',
    tone: 'Confident & Crisp',
    pace: 'Medium-fast (1.1x)',
    desc: 'Warm, clear and confident — designed for viral TikToks and high-retention Reels.',
    sampleDuration: '0:42',
    tag: '👑 MOST POPULAR',
  },
  {
    id: 'deep',
    name: 'Deep Narrator',
    tone: 'Authoritative & Rich',
    pace: 'Steady (1.0x)',
    desc: 'Resonant and cinematic — perfect for long-form video essays, documentaries & tutorials.',
    sampleDuration: '0:55',
    tag: 'CINEMATIC',
  },
  {
    id: 'casual',
    name: 'Casual Vlogger',
    tone: 'Conversational & Chill',
    pace: 'Dynamic (1.05x)',
    desc: 'Upbeat and relatable — optimal for behind-the-scenes, day-in-the-life & lifestyle vlogs.',
    sampleDuration: '0:38',
    tag: 'LIFESTYLE',
  },
  {
    id: 'tech',
    name: 'Tech Explainer',
    tone: 'Analytical & Precise',
    pace: 'Snappy (1.15x)',
    desc: 'Crisp and articulate — engineered for SaaS walkthroughs, product reviews & teardowns.',
    sampleDuration: '0:45',
    tag: 'SAAS & TECH',
  },
  {
    id: 'bold',
    name: 'Bold Motivator',
    tone: 'Inspiring & Punchy',
    pace: 'High Energy (1.2x)',
    desc: 'Passionate and commanding — ideal for gym motivation, founder discipline & mindsets.',
    sampleDuration: '0:32',
    tag: 'MOTIVATION',
  },
];

const PRESET_SCRIPTS = [
  {
    id: 'hook',
    label: '🔥 3-Sec Viral Hook',
    text: "Stop making this mistake if you want to stay consistent as a creator. Consistency isn't about working 24/7—it's about building a system that works even when you're not in the mood. Let me show you my 3-step 'Streak Engine' that has kept me posting for 42 days straight without burn out.",
    title: 'Creator Mistake Reel Voiceover',
  },
  {
    id: 'story',
    label: '💡 Story Breakdown',
    text: "6 months ago I was stuck at 2,000 followers posting randomly into the void. Then I implemented one single shift: treating content like an athlete treats practice. Here are the 3 daily reps that changed everything.",
    title: 'From 2K to 50K Journey',
  },
  {
    id: 'motivation',
    label: '⚡ Motivation Sprint',
    text: "You don't need motivation. You need friction-free habits. The top 1% of creators never rely on feeling inspired; they show up because their environment is optimized for execution. Start today.",
    title: 'Friction-Free Creator Habit',
  },
  {
    id: 'myth',
    label: '🎯 Mythbuster',
    text: "Everyone tells you to post 3 times a day. That is the fastest route to creator burnout. What actually builds loyal fans is 1 high-signal post paired with genuine 1-on-1 engagement in your comments.",
    title: 'The Posting Frequency Myth',
  },
];

export const ProVoiceStudioScreen: React.FC<ProVoiceStudioScreenProps> = ({
  onBack,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenMessages,
  onOpenSchedule,
  onOpenPostComposer,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showManageMinutesModal, setShowManageMinutesModal] = useState(false);
  const [showVoiceStyleModal, setShowVoiceStyleModal] = useState(false);
  const [showRefillMinutesModal, setShowRefillMinutesModal] = useState(false);
  const [showHookOptimizerModal, setShowHookOptimizerModal] = useState(false);
  const [showAllProjectsModal, setShowAllProjectsModal] = useState(false);

  // Script & Audio State
  const [scriptTitle, setScriptTitle] = useState('Creator Mistake Reel Voiceover');
  const [scriptText, setScriptText] = useState(PRESET_SCRIPTS[0].text);
  const [selectedVoiceStyle, setSelectedVoiceStyle] = useState(VOICE_STYLES[0]);
  const [selectedSpeed, setSelectedSpeed] = useState<'0.9x' | '1.0x' | '1.1x' | '1.2x'>('1.0x');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(15);
  const [totalAudioDuration, setTotalAudioDuration] = useState(42);

  // Recent Projects
  const [recentProjects, setRecentProjects] = useState([
    { id: 'rp1', name: 'Creator Mistake Reel', duration: '0:42', status: 'Exported', platform: 'Reels / TikTok', text: PRESET_SCRIPTS[0].text },
    { id: 'rp2', name: 'Morning Routine Mini', duration: '0:58', status: 'Saved', platform: 'YouTube Shorts', text: PRESET_SCRIPTS[1].text },
    { id: 'rp3', name: 'Streak Engine Breakdown', duration: '0:35', status: 'Exported', platform: 'Instagram Reel', text: PRESET_SCRIPTS[2].text },
    { id: 'rp4', name: '3 Habits For 50K Followers', duration: '0:48', status: 'Saved', platform: 'TikTok Master', text: "3 daily reps that changed everything: 1 script every morning, batch record on Tuesdays, and ruthlessly trim the fluff." },
    { id: 'rp5', name: 'Batch Filming System', duration: '1:02', status: 'Exported', platform: 'Long-Form Reel', text: "How I shoot 10 reels in 2 hours: write the 3-second hook first, record 2 takes max, and let AI audio handle the voiceover polish." },
    { id: 'rp6', name: 'Viral Hook Framework', duration: '0:28', status: 'Exported', platform: 'YouTube Shorts', text: "Stop opening videos with hello everyone. Start with the tension or the contrarian belief that forces them to keep watching." },
  ]);

  // 3D Ghost Celebration Modal State
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationData, setCelebrationData] = useState({
    title: 'Studio Voiceover Rendered!',
    subtitle: 'Ultra-realistic 4K AI audio synced with your video script draft.',
    badgeText: '🎙️ 4K STUDIO AUDIO READY',
    xpEarned: 50,
    speechBubble: 'Sounds clean and punchy, Pablo! Ready for Reels & TikTok! 🎧',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animations
  const modalPopScale = useRef(new Animated.Value(0.88)).current;
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const waveAnim1 = useRef(new Animated.Value(0.4)).current;
  const waveAnim2 = useRef(new Animated.Value(0.7)).current;
  const waveAnim3 = useRef(new Animated.Value(0.5)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  // Calculate live script statistics
  const wordCount = scriptText.trim().split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.max(8, Math.round(wordCount / 2.6));
  const estimatedMinutesQuota = Math.ceil(estimatedSeconds / 60);

  useEffect(() => {
    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -4,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 4,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );
    flameLoop.start();
    return () => flameLoop.stop();
  }, [flameFloatY]);

  // Audio Playback simulation timer
  useEffect(() => {
    let timer: any;
    if (isPlayingAudio) {
      timer = setInterval(() => {
        setPlaybackSeconds((prev) => {
          if (prev >= totalAudioDuration) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);

      // Waveform dancing animation
      const waveLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(waveAnim1, { toValue: 1, duration: 250, useNativeDriver: false }),
            Animated.timing(waveAnim2, { toValue: 0.3, duration: 250, useNativeDriver: false }),
            Animated.timing(waveAnim3, { toValue: 0.9, duration: 250, useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(waveAnim1, { toValue: 0.3, duration: 250, useNativeDriver: false }),
            Animated.timing(waveAnim2, { toValue: 1, duration: 250, useNativeDriver: false }),
            Animated.timing(waveAnim3, { toValue: 0.4, duration: 250, useNativeDriver: false }),
          ]),
        ])
      );
      waveLoop.start();

      return () => {
        clearInterval(timer);
        waveLoop.stop();
      };
    } else {
      waveAnim1.setValue(0.4);
      waveAnim2.setValue(0.6);
      waveAnim3.setValue(0.5);
    }
  }, [isPlayingAudio, totalAudioDuration, waveAnim1, waveAnim2, waveAnim3]);

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

  const handleGenerateVoice = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsPlayingAudio(true);
      setPlaybackSeconds(0);
      setTotalAudioDuration(estimatedSeconds);
      setCelebrationData({
        title: 'Studio Voiceover Rendered!',
        subtitle: `Rendered with "${selectedVoiceStyle.name}" (${estimatedSeconds}s • ${estimatedMinutesQuota} min quota).`,
        badgeText: '🎙️ 4K STUDIO AUDIO READY',
        xpEarned: 50,
        speechBubble: 'Sounds clean and punchy, Pablo! Ready for Reels & TikTok! 🎧',
      });
      setShowCelebrationModal(true);
    }, 1100);
  };

  const handleLoadPreset = (preset: typeof PRESET_SCRIPTS[0]) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setScriptText(preset.text);
    setScriptTitle(preset.title);
    setTotalAudioDuration(Math.round(preset.text.split(' ').length / 2.6));
    setPlaybackSeconds(0);
    showToast(`✓ Loaded "${preset.label}"`);
  };

  const handleScrubberPress = (percent: number) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    const newSec = Math.round(percent * totalAudioDuration);
    setPlaybackSeconds(newSec);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const scrubberProgress = Math.min(1, Math.max(0, playbackSeconds / (totalAudioDuration || 1)));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* TOAST NOTIFICATION BANNER */}
        <BrandToast message={toastMessage} />

        {/* 1. TOP HEADER BAR */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onBack();
              }}
              hitSlop={8}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 12H5M12 19l-7-7 7-7"
                  stroke="#171420"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

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

            {/* Pro Active Pill Switch */}
            {onSwitchToFree && (
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  onSwitchToFree();
                }}
                style={styles.proPillBadge}
              >
                <Text style={styles.proPillBadgeText}>⚡ PRO ACTIVE</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.headerRight}>
            {/* Message Bubble Icon */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenMessages) {
                  onOpenMessages();
                } else if (onNavigateTab) {
                  onNavigateTab('match');
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

            {/* Notification Bell Icon */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalPop();
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
              <View style={styles.notificationDot} />
            </Pressable>

            {/* User Profile Avatar */}
            <Pressable
              style={({ pressed }) => [styles.headerProfileBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                triggerModalPop();
                setShowProfileModal(true);
              }}
              hitSlop={8}
            >
              <Image
                source={userProfile?.avatarSource || require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerProfileImg}
                resizeMode="cover"
              />
            </Pressable>
          </View>
        </View>

        {/* 2. SCROLLABLE CONTENT */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
        >
          {/* BADGES HEADER ROW */}
          <View style={styles.badgePillRow}>
            <View style={styles.heroPillGold}>
              <Text style={styles.heroPillGoldText}>✨ VOICE STUDIO — PRO</Text>
            </View>
            <View style={styles.heroPillPurple}>
              <View style={styles.livePulseDot} />
              <Text style={styles.heroPillPurpleText}>Pro Voice Active</Text>
            </View>
          </View>

          <Text style={styles.mainTitle}>Turn scripts into voiceovers.</Text>
          <Text style={styles.subTitle}>
            Convert written hooks &amp; storylines into human-grade 4K studio audio in seconds.
          </Text>

          {/* ============================================================ */}
          {/* CARD 1: VOICE MINUTES CARD (ULTRA-LUXURY DESIGN)             */}
          {/* ============================================================ */}
          <View style={styles.minutesLuxuryCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.minutesCardLabel}>Voice Minutes</Text>
                  <View style={styles.ultraHdPill}>
                    <Text style={styles.ultraHdPillText}>48kHz HD</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                  <Text style={styles.minutesBigNumber}>118</Text>
                  <Text style={styles.minutesTotalText}> / 150 min remaining</Text>
                </View>

                <Text style={styles.minutesResetText}>⏳ Resets in 19 days • Monthly Pro Quota</Text>

                <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                  <View style={styles.minuteTagPillPro}>
                    <Text style={styles.minuteTagTextPro}>✓ PRO INCLUDED</Text>
                  </View>
                  <View style={styles.minuteTagPillReady}>
                    <Text style={styles.minuteTagTextReady}>⚡ EXPORT READY</Text>
                  </View>
                </View>
              </View>

              {/* RADIAL / STOPWATCH ICON GAUGE */}
              <View style={styles.stopwatchCircle}>
                <Svg width={46} height={46} viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <Circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="#EDE9FE"
                    strokeWidth="3"
                  />
                  {/* Progress Circle (78.6%) */}
                  <Circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="#582CDB"
                    strokeWidth="3"
                    strokeDasharray="94.2"
                    strokeDashoffset={94.2 * (1 - 118 / 150)}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </Svg>
                <View style={styles.stopwatchCenterIcon}>
                  <Text style={{ fontSize: 15 }}>⏱️</Text>
                </View>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.manageMinutesBtn, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowManageMinutesModal(true);
              }}
            >
              <Text style={styles.manageMinutesBtnText}>Manage Minutes &amp; Quota History</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* SECTION: SCRIPT TO VOICE                                      */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Script to Voice</Text>
            <View style={styles.wordCounterPill}>
              <Text style={styles.wordCounterText}>
                {wordCount} words • ~{estimatedSeconds}s audio
              </Text>
            </View>
          </View>

          {/* PRESET CHIPS ROW */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
          >
            {PRESET_SCRIPTS.map((preset) => {
              const isSelected = scriptTitle === preset.title;
              return (
                <Pressable
                  key={preset.id}
                  style={[
                    styles.presetChip,
                    isSelected && styles.presetChipActive,
                  ]}
                  onPress={() => handleLoadPreset(preset)}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      isSelected && styles.presetChipTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* SCRIPT EDITOR CARD */}
          <View style={styles.scriptEditorCard}>
            <TextInput
              style={styles.scriptTextInput}
              multiline
              value={scriptText}
              onChangeText={(text) => {
                setScriptText(text);
                setTotalAudioDuration(Math.max(8, Math.round(text.split(/\s+/).filter(Boolean).length / 2.6)));
              }}
              placeholder="Paste or type your video script here..."
              placeholderTextColor="#94A3B8"
            />

            {/* Editor Footer Row */}
            <View style={styles.scriptFooterRow}>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexShrink: 1 }}>
                <View>
                  <Text style={styles.metaKeyLabel} numberOfLines={1}>LENGTH</Text>
                  <Text style={styles.metaValText} numberOfLines={1}>{formatTimer(estimatedSeconds)}</Text>
                </View>
                <View>
                  <Text style={styles.metaKeyLabel} numberOfLines={1}>QUOTA</Text>
                  <Text style={styles.metaValText} numberOfLines={1}>{estimatedMinutesQuota} min</Text>
                </View>
                <View>
                  <Text style={styles.metaKeyLabel} numberOfLines={1}>SPEED</Text>
                  <Text style={styles.metaValText} numberOfLines={1}>{selectedSpeed}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                {/* AI Hook Optimizer */}
                <Pressable
                  style={({ pressed }) => [styles.toolIconBtn, pressed && styles.btnPressed]}
                  onPress={() => {
                    triggerModalPop();
                    setShowHookOptimizerModal(true);
                  }}
                  hitSlop={6}
                >
                  <Text style={{ fontSize: 14 }}>🪄</Text>
                </Pressable>

                {/* Voice Style Selector */}
                <Pressable
                  style={({ pressed }) => [styles.toolIconBtn, pressed && styles.btnPressed]}
                  onPress={() => {
                    triggerModalPop();
                    setShowVoiceStyleModal(true);
                  }}
                  hitSlop={6}
                >
                  <Text style={{ fontSize: 14 }}>🎚️</Text>
                </Pressable>

                {/* Copy/Paste Action */}
                <Pressable
                  style={({ pressed }) => [styles.toolIconBtn, pressed && styles.btnPressed]}
                  onPress={() => {
                    showToast('✓ Script copied to clipboard');
                  }}
                  hitSlop={6}
                >
                  <Text style={{ fontSize: 14 }}>📋</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* GENERATE VOICE BUTTON */}
          <Pressable
            style={({ pressed }) => [styles.generateVoiceBtn, pressed && styles.btnPressed]}
            onPress={handleGenerateVoice}
            disabled={isGenerating}
          >
            <LinearGradient
              colors={['#582CDB', '#6D28D9', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.generateVoiceGradient}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 2v20M17 5v14M7 9v6M22 10v4M2 10v4"
                  stroke="#FFFFFF"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </Svg>
              <Text style={styles.generateVoiceBtnText}>
                {isGenerating ? '⚡ Synthesizing 4K Audio...' : 'Generate Voice'}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* ============================================================ */}
          {/* SECTION: VOICE PREVIEW (LIVE INTERACTIVE AUDIO PLAYER)       */}
          {/* ============================================================ */}
          <View style={styles.previewContainerBox}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 18 }}>🎧</Text>
                <Text style={styles.sectionHeaderTitle}>Voice Preview</Text>
              </View>
              <View style={styles.readyBadgePill}>
                <Text style={styles.readyBadgeText}>SYNTHESIZED</Text>
              </View>
            </View>

            <View style={styles.audioPlayerCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.audioTrackTitle}>{scriptTitle}</Text>
                  <Text style={styles.audioTrackVoiceModel}>
                    {selectedVoiceStyle.name} • {selectedSpeed}
                  </Text>
                </View>
                <Text style={styles.audioTrackDuration}>
                  {formatTimer(playbackSeconds)} / {formatTimer(totalAudioDuration)}
                </Text>
              </View>

              {/* Scrubber & Controls Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Pressable
                  style={({ pressed }) => [styles.playPauseCircle, pressed && styles.btnPressed]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    setIsPlayingAudio(!isPlayingAudio);
                  }}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    {isPlayingAudio ? (
                      <Path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="#FFFFFF" />
                    ) : (
                      <Path d="M8 5v14l11-7L8 5z" fill="#FFFFFF" />
                    )}
                  </Svg>
                </Pressable>

                {/* Interactive Scrubber Bar */}
                <Pressable
                  style={styles.scrubberTrackBg}
                  onPress={(e) => {
                    const { locationX } = e.nativeEvent;
                    const barWidth = SCREEN_WIDTH - 110;
                    handleScrubberPress(Math.max(0, Math.min(1, locationX / barWidth)));
                  }}
                >
                  <LinearGradient
                    colors={['#7C3AED', '#582CDB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.scrubberTrackFill, { width: `${scrubberProgress * 100}%` }]}
                  />
                  <View
                    style={[
                      styles.scrubberThumbDot,
                      { left: `${scrubberProgress * 100}%` },
                    ]}
                  />
                </Pressable>
              </View>

              {/* Secondary Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                <Pressable
                  style={({ pressed }) => [styles.audioSecondaryBtn, pressed && styles.btnPressed]}
                  onPress={handleGenerateVoice}
                >
                  <Text style={styles.audioSecondaryBtnText}>🔄 Regenerate</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.audioSecondaryBtn, pressed && styles.btnPressed]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                    setCelebrationData({
                      title: '4K Audio Master Exported!',
                      subtitle: `"${scriptTitle}.wav" (48kHz Ultra-HD) downloaded & ready for your video editor.`,
                      badgeText: '📥 4K AUDIO EXPORTED',
                      xpEarned: 50,
                      speechBubble: '4K audio master ready, Pablo! Time to drop some viral magic! 🔥',
                    });
                    setShowCelebrationModal(true);
                  }}
                >
                  <Text style={styles.audioSecondaryBtnText}>📥 Export (.WAV)</Text>
                </Pressable>
              </View>

              {/* Primary Action Button: Use in Post */}
              <Pressable
                style={({ pressed }) => [styles.useInPostBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (onOpenPostComposer) {
                    onOpenPostComposer(`${scriptTitle} (Voiceover Master Attached)`);
                  }
                }}
              >
                <Text style={styles.useInPostBtnText}>✨ Use in Post Composer ➔</Text>
              </Pressable>

              {/* Save to Library Button */}
              <Pressable
                style={({ pressed }) => [styles.saveLibraryBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  setCelebrationData({
                    title: 'Saved to Studio Vault!',
                    subtitle: `"${scriptTitle}" is now stored in your Pro Voice Vault for instant re-use across campaigns.`,
                    badgeText: '📁 SAVED TO STUDIO VAULT',
                    xpEarned: 25,
                    speechBubble: 'Locked into your vault! Re-use this audio anytime in one tap! 🎙️',
                  });
                  setShowCelebrationModal(true);
                }}
              >
                <Text style={styles.saveLibraryBtnText}>Save to Library</Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION: RECENT VOICE PROJECTS                               */}
          {/* ============================================================ */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 }}>
            <Text style={styles.sectionHeaderTitle}>Recent Voice Projects</Text>
            <Pressable
              onPress={() => {
                triggerModalPop();
                setShowAllProjectsModal(true);
              }}
              hitSlop={8}
            >
              <Text style={styles.viewAllLink}>View All ({recentProjects.length}) ➔</Text>
            </Pressable>
          </View>

          <View style={{ gap: 8 }}>
            {recentProjects.map((proj) => (
              <View key={proj.id} style={styles.projectItemCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <Pressable
                    style={styles.projectPlayBtn}
                    onPress={() => {
                      setScriptTitle(proj.name);
                      setScriptText(proj.text);
                      setTotalAudioDuration(Math.round(proj.text.split(' ').length / 2.6));
                      setPlaybackSeconds(0);
                      setIsPlayingAudio(true);
                      showToast(`▶ Playing ${proj.name}`);
                    }}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path d="M8 5v14l11-7L8 5z" fill="#582CDB" />
                    </Svg>
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.projectNameText}>{proj.name}</Text>
                    <Text style={styles.projectSubText}>
                      {proj.duration} • {proj.status} • {proj.platform}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={styles.projectReuseBtn}
                  onPress={() => {
                    setScriptTitle(proj.name);
                    setScriptText(proj.text);
                    showToast(`✓ Loaded "${proj.name}" into editor`);
                  }}
                >
                  <Text style={styles.projectReuseBtnText}>Reuse</Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* ============================================================ */}
          {/* CARD: SAVED VOICE STYLE (ELEVATED FREQUENCY VISUALIZER)      */}
          {/* ============================================================ */}
          <View style={[styles.dashboardCard, { marginTop: 18 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.savedVoiceHeaderLabel}>SAVED VOICE STYLE</Text>
              <View style={styles.activeStyleTag}>
                <Text style={styles.activeStyleTagText}>ACTIVE PROFILE</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
              <View style={styles.voiceAvatarBox}>
                <Text style={{ fontSize: 22 }}>🎙️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.voiceStyleNameText}>{selectedVoiceStyle.name}</Text>
                <Text style={styles.voiceStyleDescText}>{selectedVoiceStyle.desc}</Text>
              </View>
            </View>

            {/* Tone & Pace Chips */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <View style={styles.toneChipBox}>
                <Text style={styles.toneChipLabel}>TONE</Text>
                <Text style={styles.toneChipValue}>{selectedVoiceStyle.tone}</Text>
              </View>
              <View style={styles.toneChipBox}>
                <Text style={styles.toneChipLabel}>PACE</Text>
                <Text style={styles.toneChipValue}>{selectedVoiceStyle.pace}</Text>
              </View>
            </View>

            {/* HIGH-DENSITY ACOUSTIC WAVELENGTH VISUALIZER */}
            <View style={styles.wavelengthCapsuleCard}>
              <View style={styles.wavelengthHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.wavelengthLiveDot, isPlayingAudio && styles.wavelengthLiveDotActive]} />
                  <Text style={styles.wavelengthLabelText}>
                    {isPlayingAudio ? 'LIVE MASTER AUDIO FREQUENCY' : 'STUDIO ACOUSTIC WAVELENGTH'}
                  </Text>
                </View>
                <Text style={styles.wavelengthHzText}>48.0 kHz • 24-bit Lossless</Text>
              </View>

              <View style={styles.wavelengthDenseBarsRow}>
                {[
                  6, 10, 16, 12, 22, 32, 26, 18, 38, 48, 36, 24, 52, 42, 28, 46,
                  34, 20, 40, 50, 38, 26, 48, 38, 22, 44, 54, 40, 26, 36, 46, 32,
                  20, 38, 48, 34, 22, 32, 24, 16, 26, 18, 12, 16, 10, 6,
                ].map((h, i) => {
                  const isCurrentPlayhead = isPlayingAudio && Math.floor(scrubberProgress * 46) === i;
                  const isPlayed = scrubberProgress * 46 >= i;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.wavelengthDenseBar,
                        {
                          height: isPlayingAudio
                            ? Math.max(6, Math.min(54, h * (0.7 + Math.sin(i * 0.4 + playbackSeconds * 2.5) * 0.35)))
                            : Math.max(6, h * 0.75),
                          backgroundColor: isCurrentPlayhead
                            ? '#D97706'
                            : isPlayed
                            ? (i % 3 === 0 ? '#F59E0B' : '#582CDB')
                            : '#DDD6FE',
                          opacity: isPlayed ? 1 : 0.65,
                        },
                      ]}
                    />
                  );
                })}
              </View>

              <View style={styles.wavelengthBottomMetrics}>
                <Text style={styles.wavelengthMetricItem}>DYNAMIC RANGE: 98dB</Text>
                <Text style={styles.wavelengthMetricItem}>STEREO SYNCED</Text>
                <Text style={styles.wavelengthMetricItem}>NEURAL ENHANCED</Text>
              </View>
            </View>

            {/* Speed Selector Chips */}
            <View style={styles.speedSelectorRow}>
              <Text style={styles.speedLabel}>SPEED:</Text>
              {(['0.9x', '1.0x', '1.1x', '1.2x'] as const).map((spd) => (
                <Pressable
                  key={spd}
                  style={[
                    styles.speedPillBtn,
                    selectedSpeed === spd && styles.speedPillBtnActive,
                  ]}
                  onPress={() => {
                    setSelectedSpeed(spd);
                    showToast(`Speed set to ${spd}`);
                  }}
                >
                  <Text
                    style={[
                      styles.speedPillText,
                      selectedSpeed === spd && styles.speedPillTextActive,
                    ]}
                  >
                    {spd}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                style={({ pressed }) => [styles.voicePreviewBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  setIsPlayingAudio(true);
                  showToast(`Playing sample preview for ${selectedVoiceStyle.name}`);
                }}
              >
                <Text style={styles.voicePreviewBtnText}>▶ Preview Sample</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.voiceChangeBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  triggerModalPop();
                  setShowVoiceStyleModal(true);
                }}
              >
                <Text style={styles.voiceChangeBtnText}>Change Style</Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD: JARVIS INSIGHT (FROSTED GRADIENT CARD)                 */}
          {/* ============================================================ */}
          <LinearGradient
            colors={['#FAF8F5', '#F5F3FF', '#EDE9FE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.jarvisInsightGradientCard}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
              <Text style={styles.jarvisInsightTitle}>Jarvis Strategy Insight</Text>
            </View>
            <Text style={styles.jarvisInsightBody}>
              &ldquo;Keep this voiceover under 45 seconds. Shorter voiceovers with a clear hook tend to score 2.4x higher viewer retention for Instagram Reels and TikTok.&rdquo;
            </Text>

            <Pressable
              style={({ pressed }) => [styles.jarvisAdviceBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (onOpenMessages) {
                  onOpenMessages('conv_jarvis');
                } else if (onOpenJarvisPro) {
                  onOpenJarvisPro();
                }
              }}
            >
              <Text style={styles.jarvisAdviceBtnText}>
                ✨ Ask Jarvis for Pacing Advice ➔
              </Text>
            </Pressable>
          </LinearGradient>

          {/* ============================================================ */}
          {/* CARD: NEED MORE MINUTES (GOLDEN VIP REFILL CARD)             */}
          {/* ============================================================ */}
          <LinearGradient
            colors={['#FEF3C7', '#FEF3C7', '#FDE68A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.needMinutesCard}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.needMinutesTitle}>Need more minutes?</Text>
              <Text style={{ fontSize: 16 }}>👑</Text>
            </View>
            <Text style={styles.needMinutesSub}>
              Buy extra voice minutes when your included Pro minutes run low. Refill anytime with instant allocation.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.buyMoreBtn, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowRefillMinutesModal(true);
              }}
            >
              <Text style={styles.buyMoreBtnText}>⚡ Buy Extra Minute Packs ➔</Text>
            </Pressable>
          </LinearGradient>
        </ScrollView>

        {/* FLOATING BOTTOM TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* ============================================================ */}
        {/* MODAL 1: VOICE STYLE SELECTOR MODAL                          */}
        {/* ============================================================ */}
        <Modal
          visible={showVoiceStyleModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowVoiceStyleModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <View style={styles.modalHeaderBetween}>
                  <View style={styles.heroPillPurple}>
                    <Text style={styles.heroPillPurpleText}>🎙️ PRO VOICE ENGINE</Text>
                  </View>
                  <Pressable onPress={() => setShowVoiceStyleModal(false)} hitSlop={8}>
                    <Text style={styles.modalCloseText}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalTitle}>Select Voice Tone &amp; Style</Text>
                <Text style={styles.modalSub}>
                  Neural vocal models calibrated for high-retention social content.
                </Text>

                <View style={{ gap: 8, marginVertical: 14 }}>
                  {VOICE_STYLES.map((v) => {
                    const isSelected = selectedVoiceStyle.id === v.id;
                    return (
                      <Pressable
                        key={v.id}
                        style={[
                          styles.voiceOptionCard,
                          isSelected && styles.voiceOptionCardSelected,
                        ]}
                        onPress={() => {
                          setSelectedVoiceStyle(v);
                          setShowVoiceStyleModal(false);
                          showToast(`✓ Switched voice to "${v.name}"`);
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.voiceOptionName}>{v.name}</Text>
                            <View style={styles.tagPillMini}>
                              <Text style={styles.tagPillMiniText}>{v.tag}</Text>
                            </View>
                          </View>
                          {isSelected && <Text style={styles.voiceOptionCheck}>✓ ACTIVE</Text>}
                        </View>
                        <Text style={styles.voiceOptionDesc}>{v.desc}</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                          <View style={styles.minuteTagPill}>
                            <Text style={styles.minuteTagText}>{v.tone}</Text>
                          </View>
                          <View style={styles.minuteTagPill}>
                            <Text style={styles.minuteTagText}>{v.pace}</Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowVoiceStyleModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Close</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL 2: MANAGE MINUTES MODAL                                */}
        {/* ============================================================ */}
        <Modal
          visible={showManageMinutesModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowManageMinutesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <View style={styles.modalHeaderBetween}>
                  <View style={styles.heroPillGold}>
                    <Text style={styles.heroPillGoldText}>👑 VOICE QUOTA AUDIT</Text>
                  </View>
                  <Pressable onPress={() => setShowManageMinutesModal(false)} hitSlop={8}>
                    <Text style={styles.modalCloseText}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalTitle}>Voice Minutes Allocation</Text>
                <Text style={styles.modalSub}>
                  118 of 150 Ultra HD minutes remaining for July billing cycle. Resets on Aug 1st.
                </Text>

                {/* Quota Progress Bar */}
                <View style={styles.quotaProgressCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.quotaBarLabel}>Usage: 32 / 150 min (21.3%)</Text>
                    <Text style={styles.quotaBarRemaining}>118m Left</Text>
                  </View>
                  <View style={styles.quotaTrackBg}>
                    <View style={[styles.quotaTrackFill, { width: '21.3%' }]} />
                  </View>
                </View>

                <Text style={[styles.savedVoiceHeaderLabel, { marginTop: 14 }]}>RECENT DEDUCTIONS</Text>
                <View style={{ gap: 8, marginTop: 8 }}>
                  {[
                    { title: 'Creator Mistake Reel', date: 'Jul 18', cost: '-1 min', format: 'Reels' },
                    { title: 'Morning Routine Mini', date: 'Jul 14', cost: '-1 min', format: 'Shorts' },
                    { title: 'Streak Engine Breakdown', date: 'Jul 10', cost: '-1 min', format: 'Reels' },
                  ].map((item, idx) => (
                    <View key={idx} style={styles.transferRow}>
                      <View>
                        <Text style={styles.transferDate}>{item.title}</Text>
                        <Text style={styles.transferStatus}>{item.format} • {item.date}</Text>
                      </View>
                      <Text style={styles.transferAmount}>{item.cost}</Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  style={({ pressed }) => [styles.modalGoldRefillBtn, { marginTop: 14 }, pressed && styles.btnPressed]}
                  onPress={() => {
                    setShowManageMinutesModal(false);
                    triggerModalPop();
                    setShowRefillMinutesModal(true);
                  }}
                >
                  <Text style={styles.modalGoldRefillBtnText}>⚡ Refill Minute Packs</Text>
                </Pressable>

                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowManageMinutesModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Close Quota</Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL 3: REFILL MINUTES PACKS MODAL                          */}
        {/* ============================================================ */}
        <Modal
          visible={showRefillMinutesModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowRefillMinutesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderBetween}>
                <View style={styles.heroPillGold}>
                  <Text style={styles.heroPillGoldText}>⚡ EXTRA MINUTE PACKS</Text>
                </View>
                <Pressable onPress={() => setShowRefillMinutesModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalTitle}>Refill Voice Minutes</Text>
              <Text style={styles.modalSub}>
                Instant credits added directly to your studio balance. Minutes never expire.
              </Text>

              <View style={{ gap: 8, marginVertical: 14 }}>
                {[
                  { name: '+30 Extra Minutes', price: '$9.00', perMin: '$0.30/min', tag: 'STARTER' },
                  { name: '+60 Extra Minutes', price: '$16.00', perMin: '$0.26/min', tag: '👑 BEST VALUE' },
                  { name: '+120 Extra Minutes', price: '$28.00', perMin: '$0.23/min', tag: 'PRO SPRINT' },
                ].map((pack, idx) => (
                  <Pressable
                    key={idx}
                    style={styles.refillPackCard}
                    onPress={() => {
                      setShowRefillMinutesModal(false);
                      showToast(`✓ ${pack.name} credited to your studio!`);
                    }}
                  >
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.refillPackName}>{pack.name}</Text>
                        <View style={styles.tagPillMini}>
                          <Text style={styles.tagPillMiniText}>{pack.tag}</Text>
                        </View>
                      </View>
                      <Text style={styles.refillPackSub}>{pack.perMin}</Text>
                    </View>
                    <Text style={styles.refillPackPrice}>{pack.price}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowRefillMinutesModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL 4: AI HOOK OPTIMIZER MODAL                             */}
        {/* ============================================================ */}
        <Modal
          visible={showHookOptimizerModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowHookOptimizerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderBetween}>
                <View style={styles.heroPillPurple}>
                  <Text style={styles.heroPillPurpleText}>🪄 AI HOOK OPTIMIZER</Text>
                </View>
                <Pressable onPress={() => setShowHookOptimizerModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalTitle}>Choose High-Retention Hook</Text>
              <Text style={styles.modalSub}>
                Jarvis optimized 3 viral opening lines designed to stop the scroll.
              </Text>

              <View style={{ gap: 8, marginVertical: 14 }}>
                {[
                  {
                    type: '🔥 Contrarian Hook',
                    text: "Stop making this mistake if you want to stay consistent as a creator. Consistency isn't about hustle 24/7...",
                  },
                  {
                    type: '⚡ Proof-Driven Hook',
                    text: "Here is the exact 3-step 'Streak Engine' that kept me posting for 42 days straight without burning out...",
                  },
                  {
                    type: '🎯 Direct Question Hook',
                    text: "Why do 90% of creators quit in month 2? Because they rely on mood instead of systems...",
                  },
                ].map((hook, idx) => (
                  <Pressable
                    key={idx}
                    style={styles.hookOptionCard}
                    onPress={() => {
                      setScriptText(hook.text);
                      setShowHookOptimizerModal(false);
                      showToast(`✓ Applied "${hook.type}"`);
                    }}
                  >
                    <Text style={styles.hookOptionType}>{hook.type}</Text>
                    <Text style={styles.hookOptionText}>&ldquo;{hook.text}&rdquo;</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowHookOptimizerModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL 5: EXPANDED VIEW ALL VOICE PROJECTS MODAL              */}
        {/* ============================================================ */}
        <Modal
          visible={showAllProjectsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAllProjectsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <View style={styles.modalHeaderBetween}>
                  <View style={styles.heroPillPurple}>
                    <Text style={styles.heroPillPurpleText}>🗂️ VOICE MASTER VAULT</Text>
                  </View>
                  <Pressable onPress={() => setShowAllProjectsModal(false)} hitSlop={8}>
                    <Text style={styles.modalCloseText}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalTitle}>All Voice Projects ({recentProjects.length})</Text>
                <Text style={styles.modalSub}>
                  Browse, play, export, or reload your previous AI voiceover masters into the editor.
                </Text>

                <View style={{ gap: 10, marginVertical: 14 }}>
                  {recentProjects.map((proj) => (
                    <View key={proj.id} style={styles.expandedProjectCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <Pressable
                            style={styles.projectPlayBtn}
                            onPress={() => {
                              setScriptTitle(proj.name);
                              setScriptText(proj.text);
                              setTotalAudioDuration(Math.round(proj.text.split(' ').length / 2.6));
                              setPlaybackSeconds(0);
                              setIsPlayingAudio(true);
                              setShowAllProjectsModal(false);
                              showToast(`▶ Playing "${proj.name}"`);
                            }}
                          >
                            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                              <Path d="M8 5v14l11-7L8 5z" fill="#582CDB" />
                            </Svg>
                          </Pressable>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.projectNameText}>{proj.name}</Text>
                            <Text style={styles.projectSubText}>
                              {proj.duration} • {proj.platform}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.statusTagPill, proj.status === 'Exported' && styles.statusTagExported]}>
                          <Text style={[styles.statusTagText, proj.status === 'Exported' && styles.statusTagTextExported]}>
                            {proj.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {/* Script Preview Snippet */}
                      <Text style={styles.expandedProjectSnippet} numberOfLines={2}>
                        &ldquo;{proj.text}&rdquo;
                      </Text>

                      {/* Action Row */}
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                        <Pressable
                          style={styles.expandedActionReuseBtn}
                          onPress={() => {
                            setScriptTitle(proj.name);
                            setScriptText(proj.text);
                            setShowAllProjectsModal(false);
                            showToast(`✓ Loaded "${proj.name}" into editor`);
                          }}
                        >
                          <Text style={styles.expandedActionReuseText}>✏️ Load in Editor</Text>
                        </Pressable>

                        <Pressable
                          style={styles.expandedActionExportBtn}
                          onPress={() => {
                            if (Platform.OS !== 'web') {
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            }
                            setShowAllProjectsModal(false);
                            setCelebrationData({
                              title: '4K Audio Master Exported!',
                              subtitle: `"${proj.name}.wav" downloaded to your device storage.`,
                              badgeText: '📥 4K AUDIO EXPORTED',
                              xpEarned: 50,
                              speechBubble: '4K master ready! Time to drop some viral magic! 🔥',
                            });
                            setShowCelebrationModal(true);
                          }}
                        >
                          <Text style={styles.expandedActionExportText}>📥 Export WAV</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>

                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowAllProjectsModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Close Vault</Text>
                </Pressable>
              </ScrollView>
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
                <Text style={styles.modalTitle}>Voice Studio Alerts</Text>
                <Pressable onPress={() => setShowNotificationModal(false)} hitSlop={8}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>
              <View style={{ gap: 8, marginVertical: 12 }}>
                <View style={styles.transferRow}>
                  <Text style={{ fontSize: 20 }}>🎙️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.transferDate}>Pro Voice Minutes Refreshed</Text>
                    <Text style={styles.transferStatus}>150 Ultra HD voice minutes credited for this cycle</Text>
                  </View>
                </View>
              </View>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* 3D GHOST CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCelebrationModal}
          onDismiss={() => setShowCelebrationModal(false)}
          title={celebrationData.title}
          subtitle={celebrationData.subtitle}
          badgeText={celebrationData.badgeText}
          xpEarned={celebrationData.xpEarned}
          speechBubble={celebrationData.speechBubble}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
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
    width: 24,
    height: 24,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proPillBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  proPillBadgeText: {
    fontSize: sFont(8.5),
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  headerIconBtn: {
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
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    overflow: 'hidden',
  },
  headerProfileImg: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  badgePillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  heroPillGold: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  heroPillGoldText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  heroPillPurple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#582CDB',
  },
  heroPillPurpleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  mainTitle: {
    fontSize: 23,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 3,
    marginBottom: 16,
  },

  // MINUTES LUXURY CARD
  minutesLuxuryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 18,
  },
  minutesCardLabel: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#171420',
  },
  ultraHdPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ultraHdPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
  },
  minutesBigNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: -0.5,
  },
  minutesTotalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  minutesResetText: {
    fontSize: 11,
    color: '#D97706',
    marginTop: 2,
    fontWeight: '700',
  },
  minuteTagPillPro: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  minuteTagTextPro: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  minuteTagPillReady: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  minuteTagTextReady: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.3,
  },
  stopwatchCircle: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  stopwatchCenterIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageMinutesBtn: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1.2,
    borderColor: '#EFECE6',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  manageMinutesBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },

  // SCRIPT TO VOICE
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  wordCounterPill: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  wordCounterText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  presetChipActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#8B5CF6',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#582CDB',
    fontWeight: '700',
  },
  scriptEditorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  scriptTextInput: {
    fontSize: 14,
    lineHeight: 21,
    color: '#171420',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  scriptFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1EFE9',
    marginTop: 10,
    gap: 8,
  },
  metaKeyLabel: {
    fontSize: sFont(8.5),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  metaValText: {
    fontSize: sFont(11.5),
    fontWeight: '700',
    color: '#582CDB',
    marginTop: 1,
  },
  toolIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateVoiceBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  generateVoiceGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  generateVoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // PREVIEW CONTAINER
  previewContainerBox: {
    marginTop: 22,
  },
  readyBadgePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  readyBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.3,
  },
  audioPlayerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  audioTrackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  audioTrackVoiceModel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
  },
  audioTrackDuration: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  playPauseCircle: {
    width: 42,
    height: 42,
    borderRadius: 20,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  scrubberTrackBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  scrubberTrackFill: {
    height: '100%',
    borderRadius: 4,
  },
  scrubberThumbDot: {
    position: 'absolute',
    top: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#582CDB',
    marginLeft: -7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  audioSecondaryBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  audioSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  useInPostBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  useInPostBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  saveLibraryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveLibraryBtnText: {
    color: '#171420',
    fontSize: 12,
    fontWeight: '700',
  },

  // RECENT PROJECTS
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  projectItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  projectPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  projectSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  projectReuseBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  projectReuseBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },

  // SAVED VOICE STYLE
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  savedVoiceHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  activeStyleTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  activeStyleTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
  },
  voiceAvatarBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceStyleNameText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
  },
  voiceStyleDescText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    lineHeight: 15,
  },
  toneChipBox: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  toneChipLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  toneChipValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
    marginTop: 2,
  },
  wavelengthCapsuleCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  wavelengthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  wavelengthLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  wavelengthLiveDotActive: {
    backgroundColor: '#15803D',
  },
  wavelengthLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: 0.5,
  },
  wavelengthHzText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  wavelengthDenseBarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    gap: 2,
    paddingHorizontal: 2,
  },
  wavelengthDenseBar: {
    flex: 1,
    maxWidth: 3.8,
    minWidth: 2.2,
    borderRadius: 2,
  },
  wavelengthBottomMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1EFE9',
  },
  wavelengthMetricItem: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  speedSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1EFE9',
  },
  speedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  speedPillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  speedPillBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  speedPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  speedPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  voicePreviewBtn: {
    flex: 1,
    backgroundColor: '#EDE9FE',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  voicePreviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  voiceChangeBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EFECE6',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  voiceChangeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },

  // JARVIS INSIGHT GRADIENT CARD
  jarvisInsightGradientCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 6,
    marginBottom: 16,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  jarvisInsightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  jarvisInsightBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  jarvisAdviceBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  jarvisAdviceBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // NEED MINUTES CARD
  needMinutesCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  needMinutesTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#B45309',
  },
  needMinutesSub: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 3,
    lineHeight: 16,
  },
  buyMoreBtn: {
    backgroundColor: '#171420',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buyMoreBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
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
    marginBottom: 12,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 17,
  },
  voiceOptionCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  voiceOptionCardSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#8B5CF6',
  },
  voiceOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  voiceOptionCheck: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  voiceOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 15,
  },
  tagPillMini: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  tagPillMiniText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#B45309',
  },
  minuteTagPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  minuteTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  quotaProgressCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  quotaBarLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  quotaBarRemaining: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  quotaTrackBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  quotaTrackFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 4,
  },
  transferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  transferDate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171420',
  },
  transferStatus: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 1,
  },
  transferAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#582CDB',
  },
  modalGoldRefillBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalGoldRefillBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  refillPackCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  refillPackName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  refillPackSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  refillPackPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#582CDB',
  },
  hookOptionCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  hookOptionType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
    marginBottom: 4,
  },
  hookOptionText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
    fontStyle: 'italic',
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
    zIndex: 999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  expandedProjectCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  statusTagPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusTagExported: {
    backgroundColor: '#DCFCE7',
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
  },
  statusTagTextExported: {
    color: '#15803D',
  },
  expandedProjectSnippet: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    marginTop: 8,
    fontStyle: 'italic',
  },
  expandedActionReuseBtn: {
    flex: 1,
    backgroundColor: '#EDE9FE',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  expandedActionReuseText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  expandedActionExportBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  expandedActionExportText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171420',
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
