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
import { SocialBrandIcon } from '../components/SocialBrandIcon';

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
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
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


interface ProCreateScreenProps {
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onOpenIdeaDetail?: (ideaTitle?: string) => void;
  onOpenPostComposer?: (prefillTitle?: string, prefillPlatform?: string) => void;
  onOpenIdeaAngle?: () => void;
  onOpenScript?: (ideaTitle?: string) => void;
  onOpenCaption?: (ideaTitle?: string) => void;
  onOpenRepurpose?: (ideaTitle?: string) => void;
  onOpenVoiceStudio?: () => void;
  onOpenMessages?: () => void;
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

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
    type: 'streak',
    title: 'Optimal Post Time Approaching',
    body: '7:30 PM is your peak audience window. Autopilot is ready.',
    time: '25m ago',
    unread: true,
    iconEmoji: '⚡',
  },
  {
    id: 'n2',
    type: 'quest',
    title: 'Repurpose Queue Ready',
    body: 'Draft "3 creator mistakes" converted to 4 multi-platform assets.',
    time: '2h ago',
    unread: true,
    iconEmoji: '🔄',
  },
];

export const ProCreateScreen: React.FC<ProCreateScreenProps> = ({
  onLogout,
  onNavigateTab,
  onOpenSchedule,
  onOpenJarvisPro,
  onOpenIdeaDetail,
  onOpenPostComposer,
  onOpenIdeaAngle,
  onOpenScript,
  onOpenCaption,
  onOpenRepurpose,
  onOpenVoiceStudio,
  onOpenMessages,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showVoiceStudioModal, setShowVoiceStudioModal] = useState(false);
  const [showRepurposeModal, setShowRepurposeModal] = useState(false);
  const [showHookModal, setShowHookModal] = useState(false);
  const [showAllDraftsModal, setShowAllDraftsModal] = useState(false);
  const [draftFilter, setDraftFilter] = useState<'ALL' | 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE'>('ALL');
  const [activeDraftsList, setActiveDraftsList] = useState([
    {
      id: 'd1',
      title: '3 mistakes I stopped making as a creator',
      platform: 'TikTok',
      platformType: 'tiktok',
      typeBadge: 'SCRIPT READY',
      typeColor: '#DCFCE7',
      typeTextColor: '#15803D',
      time: 'Edited 2h ago',
      actionText: 'Continue Script',
      actionTarget: 'script',
    },
    {
      id: 'd2',
      title: 'Behind the scenes tour & studio setup',
      platform: 'Instagram',
      platformType: 'instagram',
      typeBadge: 'VOICE DRAFT',
      typeColor: '#EDE9FE',
      typeTextColor: '#582CDB',
      time: 'Edited 4h ago',
      actionText: 'Open Voice Studio',
      actionTarget: 'voice-studio',
    },
    {
      id: 'd3',
      title: 'How I gained 10k followers in 30 days',
      platform: 'YouTube',
      platformType: 'youtube',
      typeBadge: 'IDEA OUTLINE',
      typeColor: '#FEF3C7',
      typeTextColor: '#D97706',
      time: 'Edited yesterday',
      actionText: 'Open Composer',
      actionTarget: 'composer',
    },
    {
      id: 'd4',
      title: 'Stop waiting for the perfect video idea',
      platform: 'TikTok',
      platformType: 'tiktok',
      typeBadge: 'CAPTION READY',
      typeColor: '#DCFCE7',
      typeTextColor: '#15803D',
      time: 'Edited 2 days ago',
      actionText: 'Open Caption',
      actionTarget: 'caption',
    },
    {
      id: 'd5',
      title: '5 tools that 10x your creator workflow',
      platform: 'Instagram',
      platformType: 'instagram',
      typeBadge: 'REPURPOSE READY',
      typeColor: '#EDE9FE',
      typeTextColor: '#582CDB',
      time: 'Edited 3 days ago',
      actionText: 'Repurpose Now',
      actionTarget: 'repurpose',
    },
    {
      id: 'd6',
      title: 'The algorithm secret nobody talks about',
      platform: 'TikTok',
      platformType: 'tiktok',
      typeBadge: 'HOOK DRAFT',
      typeColor: '#EDE9FE',
      typeTextColor: '#582CDB',
      time: 'Edited 4 days ago',
      actionText: 'Open Script',
      actionTarget: 'script',
    },
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Voice Studio State
  const [selectedVoiceTone, setSelectedVoiceTone] = useState('Energetic Studio Mix');
  const [voiceScriptInput, setVoiceScriptInput] = useState(
    'Here are 3 creator mistakes I stopped making this year that helped me grow 10x faster...'
  );
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isRepurposing, setIsRepurposing] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Animations
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(1)).current;
  const waveformAnim = useRef(new Animated.Value(0.4)).current;
  const modalPopScale = useRef(new Animated.Value(0.92)).current;

  const handleOpenDraftItem = (draft: typeof activeDraftsList[0]) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowAllDraftsModal(false);
    if (draft.actionTarget === 'script' && onOpenScript) {
      onOpenScript(draft.title);
    } else if (draft.actionTarget === 'caption' && onOpenCaption) {
      onOpenCaption(draft.title);
    } else if (draft.actionTarget === 'voice-studio' && onOpenVoiceStudio) {
      onOpenVoiceStudio();
    } else if (draft.actionTarget === 'repurpose' && onOpenRepurpose) {
      onOpenRepurpose(draft.title);
    } else if (draft.actionTarget === 'composer' && onOpenPostComposer) {
      onOpenPostComposer(draft.title, draft.platformType);
    } else {
      showToast(`✓ Opened draft: "${draft.title.slice(0, 24)}..."`);
    }
  };

  const handleDeleteDraftItem = (draftId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setActiveDraftsList((prev) => prev.filter((d) => d.id !== draftId));
    showToast('🗑️ Draft removed from bank');
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

    // Waveform audio pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveformAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(waveformAnim, {
          toValue: 0.35,
          duration: 600,
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
                colors={['#F59E0B', '#F59E0B', '#F59E0B']}
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
                } else if (onNavigateTab) {
                  onNavigateTab('match');
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
                source={userProfile?.avatarSource || require('../../assets/images/jarvis-core-flame.png')}
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
          {/* TOP TAGS ROW: CREATE — PRO & PRO ACCESS */}
          <View style={styles.topTagsRow}>
            <View style={styles.createProPill}>
              <Text style={styles.createProPillText}>CREATE — PRO</Text>
            </View>

            <View style={styles.proAccessPill}>
              <Text style={styles.proAccessPillText}>🔒 PRO ACCESS</Text>
            </View>
          </View>

          {/* MAIN HEADLINE & SUBTITLE */}
          <Text style={styles.mainTitleText}>Build your next post faster.</Text>
          <Text style={styles.mainSubtitleText}>
            From idea to voiceover to schedule, everything starts here.
          </Text>

          {/* ============================================================ */}
          {/* CARD 1: YOUR PRO WORKFLOW                                    */}
          {/* ============================================================ */}
          <View style={styles.workflowCard}>
            <View style={styles.workflowHeaderRow}>
              <Text style={styles.workflowTitle}>Your Pro Workflow</Text>
              <Text style={{ fontSize: 20 }}>✨</Text>
            </View>

            <Text style={styles.workflowSub}>
              Turn one idea into a full content asset in minutes.
            </Text>

            {/* 4-STEP PIPELINE ROW */}
            <View style={styles.pipelineStepsRow}>
              {/* Step 1: Idea */}
              <Pressable
                style={styles.pipelineStepItem}
                onPress={() => {
                  if (onOpenIdeaAngle) onOpenIdeaAngle();
                  else if (onOpenIdeaDetail) onOpenIdeaDetail('3 creator mistakes I stopped making this year');
                }}
              >
                <View style={styles.pipelineIconBox}>
                  <Text style={{ fontSize: 16 }}>💡</Text>
                </View>
                <Text style={styles.pipelineStepLabel}>Idea</Text>
              </Pressable>

              <View style={styles.pipelineConnectorLine} />

              {/* Step 2: Script */}
              <Pressable
                style={styles.pipelineStepItem}
                onPress={() => {
                  if (onOpenScript) onOpenScript('3 creator mistakes I stopped making this year');
                }}
              >
                <View style={styles.pipelineIconBox}>
                  <Text style={{ fontSize: 16 }}>📄</Text>
                </View>
                <Text style={styles.pipelineStepLabel}>Script</Text>
              </Pressable>

              <View style={styles.pipelineConnectorLine} />

              {/* Step 3: Voice */}
              <Pressable
                style={styles.pipelineStepItem}
                onPress={() => {
                  if (onOpenVoiceStudio) {
                    onOpenVoiceStudio();
                  } else {
                    triggerModalPop();
                    setShowVoiceStudioModal(true);
                  }
                }}
              >
                <View style={styles.pipelineIconBox}>
                  <Text style={{ fontSize: 16 }}>🎙️</Text>
                </View>
                <Text style={styles.pipelineStepLabel}>Voice</Text>
              </Pressable>

              <View style={styles.pipelineConnectorLine} />

              {/* Step 4: Done */}
              <Pressable
                style={styles.pipelineStepItem}
                onPress={() => {
                  if (onOpenSchedule) onOpenSchedule();
                }}
              >
                <View style={styles.pipelineIconBox}>
                  <Text style={{ fontSize: 16 }}>🗓️</Text>
                </View>
                <Text style={styles.pipelineStepLabel}>Done</Text>
              </Pressable>
            </View>

            {/* CURRENT PROJECT EMBEDDED BOX */}
            <View style={styles.currentProjectBox}>
              <Text style={styles.currentProjectLabel}>CURRENT PROJECT</Text>
              <Text style={styles.currentProjectTitle}>
                &ldquo;3 creator mistakes I stopped making this year&rdquo;
              </Text>

              <View style={styles.projectTagsRow}>
                <View style={styles.projectTagGray}>
                  <Text style={styles.projectTagGrayText}>TikTok</Text>
                </View>
                <View style={styles.projectTagGray}>
                  <Text style={styles.projectTagGrayText}>IG Reel</Text>
                </View>
                <View style={styles.projectTagGold}>
                  <Text style={styles.projectTagGoldText}>7:30 PM</Text>
                </View>
              </View>
            </View>

            {/* WORKFLOW ACTION BUTTONS */}
            <View style={styles.workflowActionsRow}>
              <Pressable
                style={({ pressed }) => [styles.startCreatingBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  if (onOpenPostComposer) {
                    onOpenPostComposer('3 creator mistakes I stopped making this year', 'Instagram');
                  }
                }}
              >
                <Text style={styles.startCreatingBtnText}>Start Creating</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.resumeDraftBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  if (onOpenScript) {
                    onOpenScript('3 creator mistakes I stopped making this year');
                  }
                }}
              >
                <Text style={styles.resumeDraftBtnText}>Resume Draft</Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 2: PRO TOOLS (2x3 Grid)                              */}
          {/* ============================================================ */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.proToolsMainTitle}>Pro Tools</Text>
            <View style={styles.powerPillBadge}>
              <Text style={styles.powerPillText}>POWER</Text>
            </View>
          </View>

          <View style={styles.proToolsGrid}>
            {/* Tool 1: Idea Engine */}
            <Pressable
              style={({ pressed }) => [styles.toolGridCard, pressed && styles.btnPressed]}
              onPress={() => {
                if (onOpenIdeaAngle) onOpenIdeaAngle();
                else if (onOpenIdeaDetail) onOpenIdeaDetail();
              }}
            >
              <View style={styles.toolIconSquare}>
                <Text style={{ fontSize: 18 }}>💡</Text>
              </View>
              <Text style={styles.toolGridTitle}>Idea Engine</Text>
              <Text style={styles.toolGridSub}>Generate content angles.</Text>
            </Pressable>

            {/* Tool 2: Script Builder */}
            <Pressable
              style={({ pressed }) => [styles.toolGridCard, pressed && styles.btnPressed]}
              onPress={() => {
                if (onOpenScript) onOpenScript();
              }}
            >
              <View style={styles.toolIconSquare}>
                <Text style={{ fontSize: 18 }}>🪄</Text>
              </View>
              <Text style={styles.toolGridTitle}>Script Builder</Text>
              <Text style={styles.toolGridSub}>Write short-form scripts fast.</Text>
            </Pressable>

            {/* Tool 3: Caption Writer */}
            <Pressable
              style={({ pressed }) => [styles.toolGridCard, pressed && styles.btnPressed]}
              onPress={() => {
                if (onOpenCaption) onOpenCaption();
              }}
            >
              <View style={styles.toolIconSquare}>
                <Text style={{ fontSize: 18 }}>📝</Text>
              </View>
              <Text style={styles.toolGridTitle}>Caption Writer</Text>
              <Text style={styles.toolGridSub}>Create high-converting captions.</Text>
            </Pressable>

            {/* Tool 4: Voice Studio (UNLOCKED) */}
            <Pressable
              style={({ pressed }) => [styles.toolGridCard, pressed && styles.btnPressed]}
              onPress={() => {
                if (onOpenVoiceStudio) {
                  onOpenVoiceStudio();
                } else {
                  triggerModalPop();
                  setShowVoiceStudioModal(true);
                }
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={styles.toolIconSquare}>
                  <Text style={{ fontSize: 18 }}>🎙️</Text>
                </View>
                <View style={styles.unlockedPill}>
                  <Text style={styles.unlockedPillText}>UNLOCKED</Text>
                </View>
              </View>
              <Text style={styles.toolGridTitle}>Voice Studio</Text>
              <Text style={styles.toolGridSub}>Turn scripts into narration.</Text>
            </Pressable>

            {/* Tool 5: Repurpose (PRO TOOL) */}
            <Pressable
              style={({ pressed }) => [styles.toolGridCard, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenRepurpose) {
                  onOpenRepurpose('3 mistakes that slow down new creators');
                } else {
                  triggerModalPop();
                  setShowRepurposeModal(true);
                }
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={styles.toolIconSquare}>
                  <Text style={{ fontSize: 18 }}>🔄</Text>
                </View>
                <View style={styles.proToolBadgePill}>
                  <Text style={styles.proToolBadgeText}>PRO TOOL</Text>
                </View>
              </View>
              <Text style={styles.toolGridTitle}>Repurpose</Text>
              <Text style={styles.toolGridSub}>Turn one asset into multiple formats.</Text>
            </Pressable>

            {/* Tool 6: Hook Gen */}
            <Pressable
              style={({ pressed }) => [styles.toolGridCard, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowHookModal(true);
              }}
            >
              <View style={styles.toolIconSquare}>
                <Text style={{ fontSize: 18 }}>⚓</Text>
              </View>
              <Text style={styles.toolGridTitle}>Hook Gen</Text>
              <Text style={styles.toolGridSub}>200+ viral video opening hooks.</Text>
            </Pressable>
          </View>



          {/* ============================================================ */}
          {/* CARD 4: VOICE STUDIO INTERACTIVE CARD                        */}
          {/* ============================================================ */}
          <View style={styles.voiceStudioMainCard}>
            <View style={styles.voiceCardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.voiceStarIconBox}>
                  <Text style={{ fontSize: 18 }}>🎙️</Text>
                </View>
                <View>
                  <Text style={styles.voiceCardTitle}>Voice Studio</Text>
                  <Text style={styles.voiceCardSub}>Create AI voice from your script</Text>
                </View>
              </View>

              <Pressable
                style={styles.voicePresetsPillBtn}
                onPress={() => {
                  triggerModalPop();
                  setShowVoiceStudioModal(true);
                }}
              >
                <Text style={{ fontSize: 11 }}>🎚️</Text>
                <Text style={styles.voicePresetsText}>VOICE PRESETS</Text>
              </Pressable>
            </View>

            {/* WAVEFORM VISUALIZER BOX */}
            <View style={styles.voiceWaveformBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.voiceWaveformWatermark}>Voice Studio</Text>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={{ width: 28, height: 28, opacity: 0.8 }}
                  resizeMode="contain"
                />
              </View>

              {/* HIGH DENSITY CONTINUOUS WAVELENGTH */}
              <View style={styles.wavelengthDenseRowCreate}>
                {[
                  8, 14, 24, 18, 32, 44, 36, 22, 48, 58, 46, 30, 62, 50, 34, 56,
                  42, 26, 48, 60, 46, 32, 52, 42, 28, 46, 56, 44, 30, 42, 50, 36,
                  24, 40, 52, 38, 24, 34, 26, 16, 28, 18, 12, 18, 12, 8,
                ].map((h, i) => (
                  <View
                    key={`vw_${i}`}
                    style={[
                      styles.wavelengthBarDenseCreate,
                      {
                        height: h * 0.85,
                        backgroundColor: i % 3 === 0 ? '#F59E0B' : '#8B5CF6',
                      },
                    ]}
                  />
                ))}
              </View>

              <Pressable
                style={styles.previewVoicePill}
                onPress={() => {
                  showToast('Playing preview audio: "Energetic Studio Mix"...');
                }}
              >
                <Text style={styles.previewVoiceText}>▶ Preview Voice</Text>
              </Pressable>
            </View>

            {/* SPECS ROW */}
            <View style={styles.voiceSpecsRow}>
              <View>
                <Text style={styles.seriesVoiceLabel}>SERIES VOICE</Text>
                <Text style={styles.seriesVoiceVal}>{selectedVoiceTone}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.minsCountVal}>118m</Text>
                <Text style={styles.minsRemainingLabel}>MINS REMAINING</Text>
              </View>
            </View>

            {/* DUAL ACTION BUTTONS */}
            <View style={styles.voiceButtonsRow}>
              <Pressable
                style={({ pressed }) => [styles.generateVoiceBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  if (onOpenVoiceStudio) {
                    onOpenVoiceStudio();
                  } else {
                    triggerModalPop();
                    setShowVoiceStudioModal(true);
                  }
                }}
              >
                <Text style={styles.generateVoiceBtnText}>⚡ Generate Voice</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.openStudioOutlineBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  if (onOpenVoiceStudio) {
                    onOpenVoiceStudio();
                  } else {
                    triggerModalPop();
                    setShowVoiceStudioModal(true);
                  }
                }}
              >
                <Text style={styles.openStudioOutlineBtnText}>Open Studio</Text>
              </Pressable>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SECTION 5: ACTIVE DRAFTS                                     */}
          {/* ============================================================ */}
          <View style={styles.draftsSectionHeaderRow}>
            <Text style={styles.activeDraftsTitle}>Active Drafts</Text>
            <Pressable
              onPress={() => {
                triggerModalPop();
                setShowAllDraftsModal(true);
              }}
              hitSlop={8}
            >
              <Text style={styles.viewAllText}>View all ({activeDraftsList.length}) ➔</Text>
            </Pressable>
          </View>

          <View style={{ gap: 8, marginBottom: 16 }}>
            {/* Draft 1 */}
            <Pressable
              style={({ pressed }) => [styles.draftItemCard, pressed && styles.btnPressed]}
              onPress={() => {
                if (onOpenScript) onOpenScript('3 mistakes I stopped making...');
              }}
            >
              <View style={styles.draftIconSquare}>
                <Text style={{ fontSize: 18 }}>📄</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.draftItemTitle}>3 mistakes I stopped making...</Text>
                <Text style={styles.scriptReadyTag}>SCRIPT READY</Text>
              </View>
              <Text style={styles.draftChevron}>›</Text>
            </Pressable>

            {/* Draft 2 */}
            <Pressable
              style={({ pressed }) => [styles.draftItemCard, pressed && styles.btnPressed]}
              onPress={() => {
                triggerModalPop();
                setShowVoiceStudioModal(true);
              }}
            >
              <View style={styles.draftIconSquare}>
                <Text style={{ fontSize: 18 }}>🎙️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.draftItemTitle}>Behind the scenes tour</Text>
                <Text style={styles.voiceDraftTag}>VOICE DRAFT</Text>
              </View>
              <Text style={styles.draftChevron}>›</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* CARD 6: SMART SCHEDULE                                       */}
          {/* ============================================================ */}
          <View style={styles.smartScheduleCard}>
            <View style={styles.smartScheduleHeaderRow}>
              <View style={styles.smartSchedulePill}>
                <Text style={styles.smartSchedulePillText}>SMART SCHEDULE</Text>
              </View>
              <Text style={{ fontSize: 18 }}>⚡</Text>
            </View>

            <Text style={styles.bestWindowSub}>Best window today</Text>
            <Text style={styles.bestWindowTime}>7:30 <Text style={styles.bestWindowPm}>PM</Text></Text>

            <View style={styles.scheduleDivider} />

            <View style={styles.scheduledStatusRow}>
              <View>
                <Text style={styles.scheduledBigStat}>6</Text>
                <Text style={styles.scheduledStatLabel}>SCHEDULED</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.greenActiveDot} />
                  <Text style={styles.autopilotActiveLabel}>Active</Text>
                </View>
                <Text style={styles.scheduledStatLabel}>AUTOPILOT</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.openScheduleFullBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (onOpenSchedule) onOpenSchedule();
                else if (onNavigateTab) onNavigateTab('growth');
              }}
            >
              <Text style={styles.openScheduleFullBtnText}>Open Schedule</Text>
            </Pressable>
          </View>

          {/* ============================================================ */}
          {/* CARD 7: JARVIS SUGGESTION                                    */}
          {/* ============================================================ */}
          <View style={[styles.jarvisSuggestionCard, { marginBottom: 120 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.jarvisFlameIconBox}>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={{ width: 22, height: 22 }}
                  resizeMode="contain"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.jarvisSuggestionTag}>JARVIS SUGGESTION</Text>
                <Text style={styles.jarvisSuggestionText}>
                  &ldquo;Your Lifestyle Reels perform best with a fast hook in the first 2 seconds.&rdquo;
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* 10. FLOATING LIQUID GLASS BOTTOM NAVIGATION BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* ============================================================ */}
        {/* MODAL: AI VOICE STUDIO PRO                                   */}
        {/* ============================================================ */}
        <Modal
          visible={showVoiceStudioModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowVoiceStudioModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.modalTitle}>AI Voice Studio</Text>
                    <View style={styles.unlockedPill}>
                      <Text style={styles.unlockedPillText}>PRO UNLOCKED</Text>
                    </View>
                  </View>
                  <Text style={styles.modalSubtitle}>Generate studio-grade voiceover from your script</Text>
                </View>
                <Pressable onPress={() => setShowVoiceStudioModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.inputSectionHeader}>SELECT AI VOICE PRESET</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginVertical: 8 }}>
                {['Energetic Studio Mix', 'Deep Storyteller', 'Tech Explainer', 'Casual Vlogger'].map((voice, idx) => {
                  const isSelected = selectedVoiceTone === voice;
                  return (
                    <Pressable
                      key={idx}
                      style={[styles.voiceToneChip, isSelected && styles.voiceToneChipActive]}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setSelectedVoiceTone(voice);
                      }}
                    >
                      <Text style={[styles.voiceToneChipText, isSelected && styles.voiceToneChipTextActive]}>
                        🎙️ {voice}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.inputSectionHeader}>SCRIPT INPUT</Text>
              <TextInput
                style={styles.voiceTextInput}
                multiline
                numberOfLines={4}
                value={voiceScriptInput}
                onChangeText={setVoiceScriptInput}
                placeholder="Paste or type your video script here..."
                placeholderTextColor="#94A3B8"
              />

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setIsGeneratingVoice(true);
                  setTimeout(() => {
                    setIsGeneratingVoice(false);
                    setShowVoiceStudioModal(false);
                    showToast('AI Voice generated & synced with Reel draft!');
                  }, 1200);
                }}
              >
                <Text style={styles.modalFullBtnText}>
                  {isGeneratingVoice ? 'Generating AI Audio...' : 'Generate Studio Voiceover ➔'}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: 1-CLICK REPURPOSING STUDIO                            */}
        {/* ============================================================ */}
        <Modal
          visible={showRepurposeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowRepurposeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <View style={styles.proToolBadgePill}>
                    <Text style={styles.proToolBadgeText}>PRO REPURPOSING</Text>
                  </View>
                  <Text style={[styles.modalTitle, { marginTop: 4 }]}>Repurpose This Idea</Text>
                  <Text style={styles.modalSubtitle}>1 Script ➔ 4 Formats in 1 Tap</Text>
                </View>
                <Pressable onPress={() => setShowRepurposeModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={{ gap: 8, marginVertical: 12 }}>
                <View style={styles.repurposeOptionRow}>
                  <Text style={{ fontSize: 16 }}>🎬</Text>
                  <Text style={styles.repurposeOptionText}>Instagram Reel &amp; TikTok (9:16 Video Script)</Text>
                </View>
                <View style={styles.repurposeOptionRow}>
                  <Text style={{ fontSize: 16 }}>📑</Text>
                  <Text style={styles.repurposeOptionText}>Instagram Carousel (7-Slide Breakdown)</Text>
                </View>
                <View style={styles.repurposeOptionRow}>
                  <Text style={{ fontSize: 16 }}>🐦</Text>
                  <Text style={styles.repurposeOptionText}>X / Twitter Thread (5 Viral Tweets)</Text>
                </View>
                <View style={styles.repurposeOptionRow}>
                  <Text style={{ fontSize: 16 }}>💼</Text>
                  <Text style={styles.repurposeOptionText}>LinkedIn Authority Post with Key Insights</Text>
                </View>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setIsRepurposing(true);
                  setTimeout(() => {
                    setIsRepurposing(false);
                    setShowRepurposeModal(false);
                    showToast('Generated 4 multi-platform assets from this idea!');
                  }, 1200);
                }}
              >
                <Text style={styles.modalFullBtnText}>
                  {isRepurposing ? 'Repurposing Assets...' : 'Repurpose into 4 Assets ➔'}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: 200+ HOOK GENERATOR                                   */}
                {/* ============================================================ */}
        {/* MODAL 4: ACTIVE SAVED DRAFTS MODAL                           */}
        {/* ============================================================ */}
        <Modal
          visible={showAllDraftsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAllDraftsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.modalTitle}>Active Saved Drafts</Text>
                    <View style={styles.draftsCountPill}>
                      <Text style={styles.draftsCountPillText}>{activeDraftsList.length}</Text>
                    </View>
                  </View>
                  <Text style={styles.modalSubtitle}>Tap any draft to continue editing or scheduling</Text>
                </View>
                <Pressable onPress={() => setShowAllDraftsModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              {/* Platform Filter Pills */}
              <View style={{ flexDirection: 'row', gap: 6, marginVertical: 10 }}>
                {(['ALL', 'TIKTOK', 'INSTAGRAM', 'YOUTUBE'] as const).map((filterKey) => {
                  const isActive = draftFilter === filterKey;
                  return (
                    <Pressable
                      key={filterKey}
                      style={[styles.draftFilterPill, isActive && styles.draftFilterPillActive]}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setDraftFilter(filterKey);
                      }}
                    >
                      <Text style={[styles.draftFilterPillText, isActive && styles.draftFilterPillTextActive]}>
                        {filterKey}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Drafts List Scrollable */}
              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                <View style={{ gap: 8 }}>
                  {activeDraftsList
                    .filter((d) => draftFilter === 'ALL' || d.platform.toUpperCase() === draftFilter)
                    .map((draft) => (
                      <Pressable
                        key={draft.id}
                        style={({ pressed }) => [styles.draftModalCard, pressed && styles.btnPressed]}
                        onPress={() => handleOpenDraftItem(draft)}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 6 }}>
                            <SocialBrandIcon platform={draft.platformType} size={18} />
                            <Text style={styles.draftModalTitle} numberOfLines={1}>
                              {draft.title}
                            </Text>
                          </View>
                          <View style={[styles.draftModalBadge, { backgroundColor: draft.typeColor }]}>
                            <Text style={[styles.draftModalBadgeText, { color: draft.typeTextColor }]}>
                              {draft.typeBadge}
                            </Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                          <Text style={styles.draftModalTimeText}>{draft.time} • {draft.platform}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Pressable
                              onPress={() => handleDeleteDraftItem(draft.id)}
                              hitSlop={8}
                            >
                              <Text style={{ fontSize: 13, color: '#94A3B8' }}>🗑️</Text>
                            </Pressable>
                            <Text style={styles.draftModalActionText}>{draft.actionText} ➔</Text>
                          </View>
                        </View>
                      </Pressable>
                    ))}
                </View>
              </ScrollView>

              {/* Modal Actions */}
              <View style={{ marginTop: 14 }}>
                <Pressable
                  style={styles.modalFullBtn}
                  onPress={() => setShowAllDraftsModal(false)}
                >
                  <Text style={styles.modalFullBtnText}>Close</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL 3: VIRAL HOOK LIBRARY MODAL                            */}
        {/* ============================================================ */}
        <Modal
          visible={showHookModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowHookModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Viral Hook Library</Text>
                  <Text style={styles.modalSubtitle}>Top-performing openers for first 2 seconds</Text>
                </View>
                <Pressable onPress={() => setShowHookModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 260, marginVertical: 8 }}>
                {[
                  '“If you create content in 2024, stop scrolling.”',
                  '“Here is the secret nobody tells you about short-form retention.”',
                  '“3 mistakes I stopped making that changed everything.”',
                  '“Watch this before you post your next Reel.”',
                ].map((hook, idx) => (
                  <Pressable
                    key={idx}
                    style={styles.hookItemBox}
                    onPress={() => {
                      setShowHookModal(false);
                      showToast(`Copied hook: ${hook.slice(0, 30)}...`);
                    }}
                  >
                    <Text style={styles.hookItemText}>{hook}</Text>
                    <Text style={styles.hookCopyPill}>USE ➔</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowHookModal(false)}>
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
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
        <BrandToast message={toastMessage} />
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
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
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
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 96,
  },

  // TOP TAGS
  topTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  createProPill: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  createProPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  proAccessPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  proAccessPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  mainTitleText: {
    fontSize: 22,
    fontWeight: '700',
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

  // CARD 1: WORKFLOW
  workflowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  workflowHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workflowTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
  },
  workflowSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  pipelineStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  pipelineStepItem: {
    alignItems: 'center',
  },
  pipelineIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  pipelineStepLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#171420',
  },
  pipelineConnectorLine: {
    height: 1.5,
    backgroundColor: '#E2E8F0',
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 18,
  },
  currentProjectBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  currentProjectLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  currentProjectTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 10,
  },
  projectTagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  projectTagGray: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  projectTagGrayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  projectTagGold: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  projectTagGoldText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  workflowActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  startCreatingBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startCreatingBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  resumeDraftBtn: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  resumeDraftBtnText: {
    color: '#582CDB',
    fontSize: 13,
    fontWeight: '800',
  },

  // SECTION 2: PRO TOOLS
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  proToolsMainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
  },
  powerPillBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  powerPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  proToolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 16,
  },
  toolGridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  toolIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolGridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
  },
  toolGridSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  unlockedPill: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unlockedPillText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#A16207',
  },
  proToolBadgePill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proToolBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6D28D9',
  },

  // CARD 3: REPURPOSE BANNER
  repurposeBannerCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  repurposeIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repurposeBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
  },
  repurposeBannerSub: {
    fontSize: 12,
    color: '#4C1D95',
    lineHeight: 16,
    marginBottom: 6,
  },
  repurposeLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#582CDB',
  },

  // CARD 4: VOICE STUDIO CARD
  voiceStudioMainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 18,
    marginBottom: 20,
  },
  voiceCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  voiceStarIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
  },
  voiceCardSub: {
    fontSize: 11,
    color: '#64748B',
  },
  voicePresetsPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  voicePresetsText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  voiceWaveformBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    position: 'relative',
  },
  voiceWaveformWatermark: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
  },
  wavelengthDenseRowCreate: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 64,
    gap: 2,
    paddingHorizontal: 4,
  },
  wavelengthBarDenseCreate: {
    flex: 1,
    maxWidth: 3.5,
    minWidth: 2,
    borderRadius: 1.8,
  },
  previewVoicePill: {
    alignSelf: 'flex-end',
    backgroundColor: '#171420',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  previewVoiceText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  voiceSpecsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  seriesVoiceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
  },
  seriesVoiceVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    marginTop: 1,
  },
  minsCountVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  minsRemainingLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  voiceButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  generateVoiceBtn: {
    flex: 1,
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateVoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  openStudioOutlineBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openStudioOutlineBtnText: {
    color: '#171420',
    fontSize: 13,
    fontWeight: '800',
  },

  // SECTION 5: ACTIVE DRAFTS
  draftsSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeDraftsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  draftItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 12,
    gap: 12,
  },
  draftIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
  },
  scriptReadyTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 2,
  },
  voiceDraftTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 2,
  },
  draftChevron: {
    fontSize: 20,
    color: '#94A3B8',
  },

  // CARD 6: SMART SCHEDULE
  smartScheduleCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  smartScheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  smartSchedulePill: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  smartSchedulePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bestWindowSub: {
    fontSize: 12,
    color: '#4C1D95',
    fontWeight: '600',
  },
  bestWindowTime: {
    fontSize: 28,
    fontWeight: '700',
    color: '#582CDB',
    marginVertical: 2,
  },
  bestWindowPm: {
    fontSize: 16,
    fontWeight: '800',
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: 'rgba(88, 44, 219, 0.15)',
    marginVertical: 12,
  },
  scheduledStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduledBigStat: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171420',
  },
  scheduledStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 1,
  },
  greenActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  autopilotActiveLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  openScheduleFullBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openScheduleFullBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // CARD 7: JARVIS SUGGESTION
  jarvisSuggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
    padding: 14,
  },
  jarvisFlameIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisSuggestionTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  jarvisSuggestionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#171420',
    lineHeight: 17,
  },

  // ACTIVE SAVED DRAFTS MODAL
  draftsCountPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  draftsCountPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  draftFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  draftFilterPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  draftFilterPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  draftFilterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  draftModalCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  draftModalTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },
  draftModalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  draftModalBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  draftModalTimeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  draftModalActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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

  // MODALS
  btnPressed: {
    opacity: 0.9,
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
  },
  inputSectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  voiceToneChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  voiceToneChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  voiceToneChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  voiceToneChipTextActive: {
    color: '#582CDB',
    fontWeight: '700',
  },
  voiceTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#171420',
    height: 80,
    textAlignVertical: 'top',
  },
  repurposeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAF8F5',
    padding: 10,
    borderRadius: 10,
  },
  repurposeOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
    flex: 1,
  },
  hookItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
  },
  hookItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
    flex: 1,
  },
  hookCopyPill: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
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
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
