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
} from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

interface ChallengeDetailScreenProps {
  onBackToDashboard?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onLogout?: () => void;
  onOpenMessages?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface QuestRequirement {
  id: string;
  title: string;
  iconType: 'document' | 'lightbulb' | 'clock' | 'checkmark';
  status: 'not_started' | 'in_progress' | 'completed' | 'locked';
  statusLabel: string;
}

const INITIAL_REQUIREMENTS: QuestRequirement[] = [
  {
    id: 'req_1',
    title: 'Create one personal story post',
    iconType: 'document',
    status: 'in_progress',
    statusLabel: 'In progress',
  },
  {
    id: 'req_2',
    title: 'Add a clear lesson or takeaway',
    iconType: 'lightbulb',
    status: 'not_started',
    statusLabel: 'Not started',
  },
  {
    id: 'req_3',
    title: 'Publish before deadline',
    iconType: 'clock',
    status: 'not_started',
    statusLabel: 'Not started',
  },
  {
    id: 'req_4',
    title: 'Mark quest as completed',
    iconType: 'checkmark',
    status: 'locked',
    statusLabel: 'Locked',
  },
];

const AI_GENERATED_SCRIPTS = [
  {
    title: 'One thing I wish I knew before I started creating',
    hook: 'The biggest lie beginner creators believe is that you need high-end gear to start.',
    story: 'When I began, I delayed posting for 6 months waiting for a camera. When I finally posted on my phone, my 3rd video hit 50k views.',
    lesson: 'Consistency and clear storytelling beat production value every single time.',
    cta: 'What is one lesson you learned the hard way? Drop it below 👇',
  },
  {
    title: 'The #1 mistake that held back my growth',
    hook: 'I wasted 90 days trying to please everyone instead of talking to one specific person.',
    story: 'Once I defined my exact creator niche, my engagement rate tripled in 3 weeks.',
    lesson: 'Niche down until it hurts, then expand once you have momentum.',
    cta: 'Save this post if you are refining your creator focus today.',
  },
];

export const ChallengeDetailScreen: React.FC<ChallengeDetailScreenProps> = ({
  onBackToDashboard,
  onNavigateTab,
  onLogout,
  onOpenMessages,
  userProfile,
  onSaveProfile,
}) => {
  const isDark = userProfile?.isDarkMode ?? false;
  const [activeTab, setActiveTab] = useState<TabType>('quests');
  const [requirements, setRequirements] = useState<QuestRequirement[]>(INITIAL_REQUIREMENTS);
  const [isQuestFinished, setIsQuestFinished] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showAiDraftModal, setShowAiDraftModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Create Post Form State
  const [postTitle, setPostTitle] = useState('One thing I wish I knew before I started creating');
  const [postPlatform, setPostPlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok');
  const [postTime, setPostTime] = useState('7:30 PM');

  // Animations
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(1)).current;
  const celebrationScale = useRef(new Animated.Value(0.85)).current;
  const modalPopScale = useRef(new Animated.Value(0.85)).current;

  const triggerModalPop = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    modalPopScale.setValue(0.85);
    Animated.spring(modalPopScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 11,
    }).start();
  };

  // Calculate completed steps & progress
  const completedCount = requirements.filter((r) => r.status === 'completed').length;
  const progressPercent = isQuestFinished
    ? 100
    : Math.max(33, Math.round((completedCount / 3) * 100));

  useEffect(() => {
    const ghostLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ghostFloatY, {
            toValue: -4,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(ghostScale, {
            toValue: 1.05,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ghostFloatY, {
            toValue: 3,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(ghostScale, {
            toValue: 0.96,
            duration: 1300,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    ghostLoop.start();
    return () => ghostLoop.stop();
  }, [ghostFloatY, ghostScale]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleTabPress = (tab: TabType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
    if (tab === 'home') {
      if (onBackToDashboard) onBackToDashboard();
    } else if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const handleToggleRequirement = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setRequirements((prev) => {
      const updated = prev.map((req) => {
        if (req.id === id) {
          if (req.status === 'completed') {
            return { ...req, status: 'in_progress' as const, statusLabel: 'In progress' };
          } else {
            return { ...req, status: 'completed' as const, statusLabel: 'Done ✓' };
          }
        }
        return req;
      });

      // Check if steps 1-3 are completed to unlock step 4
      const first3Done = updated.slice(0, 3).every((r) => r.status === 'completed');
      if (first3Done) {
        updated[3] = {
          ...updated[3],
          status: updated[3].status === 'completed' ? 'completed' : 'not_started',
          statusLabel: updated[3].status === 'completed' ? 'Done ✓' : 'Ready to Complete',
        };
      } else {
        updated[3] = {
          ...updated[3],
          status: 'locked',
          statusLabel: 'Locked',
        };
      }

      return updated;
    });

    showToast('⚡ Quest requirement updated!');
  };

  const handleCompleteQuest = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsQuestFinished(true);
    setRequirements((prev) =>
      prev.map((r) => ({ ...r, status: 'completed', statusLabel: 'Done ✓' }))
    );

    setShowCelebrationModal(true);
    Animated.spring(celebrationScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 10,
    }).start();
  };

  const handleSchedulePost = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowCreatePostModal(false);

    // Mark step 1 & 2 as completed
    setRequirements((prev) =>
      prev.map((r) => {
        if (r.id === 'req_1' || r.id === 'req_2') {
          return { ...r, status: 'completed', statusLabel: 'Done ✓' };
        }
        return r;
      })
    );

    showToast(`✓ Post scheduled for ${postTime}! +50 XP awarded.`);
  };

  const handleUseIdea = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    triggerModalPop();
    setShowCreatePostModal(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0C0A12" : "#FAF8F5"} />
      <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
        {/* 1. TOP AIRY HEADER BAR */}
        <View style={styles.headerBar}>
          {/* Top-Left: Ghost Logo Mascot (Tap to go Home) */}
          <Pressable onPress={onBackToDashboard} hitSlop={8}>
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
          </Pressable>

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
                  showToast('💬 Creator Chat: 2 unread collab messages');
                }
              }}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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
                setShowNotificationsModal(true);
              }}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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

            {/* Top-Right: User Profile Person Icon */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                triggerModalPop();
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
                <Circle
                  cx="12"
                  cy="7"
                  r="4"
                  stroke="#171420"
                  strokeWidth="2.2"
                />
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


          {/* PAGE TITLE & BADGES */}
          <View style={styles.tagRow}>
            <View style={styles.activeQuestTag}>
              <Text style={styles.activeQuestTagText}>ACTIVE QUEST</Text>
            </View>
            <View style={styles.freeQuestTag}>
              <Text style={styles.freeQuestTagText}>FREE QUEST</Text>
            </View>
          </View>

          <Text style={styles.pageTitle}>Storyteller Challenge</Text>
          <Text style={styles.pageSubtitle}>
            Share one personal creator lesson to build your storytelling habit and protect your streak.
          </Text>

          {/* SECTION 1: HERO QUEST CARD */}
          <View style={styles.heroQuestCard}>
            <View style={styles.heroTopStatusRow}>
              <View style={styles.inProgressPill}>
                <Text style={styles.inProgressPillText}>IN PROGRESS</Text>
              </View>
              <Text style={styles.endsTomorrowText}>ENDS TOMORROW • 11:30 PM</Text>
            </View>

            <Text style={styles.heroQuestTitle}>Storyteller Challenge</Text>
            <Text style={styles.heroQuestDesc}>
              Create a short post about one lesson you learned as a creator. Make it useful, honest and easy for your audience to relate to.
            </Text>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressStepLabel}>
                  {isQuestFinished ? '3 / 3 steps completed' : `${completedCount || 1} / 3 steps completed`}
                </Text>
                <Text style={styles.progressPercentLabel}>{progressPercent}%</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>
            </View>

            {/* Reward Badges Row */}
            <View style={styles.rewardsTagRow}>
              <View style={styles.xpRewardPill}>
                <Text style={styles.xpRewardPillText}>+150 XP</Text>
              </View>
              <View style={styles.badgeRewardPill}>
                <Text style={styles.badgeRewardPillText}>🏆 Storyteller Badge</Text>
              </View>
              <View style={styles.passportRewardPill}>
                <Text style={styles.passportRewardPillText}>Passport Activity</Text>
              </View>
            </View>

            {/* Dual Action Buttons */}
            <View style={styles.heroActionBtnCol}>
              <Pressable
                style={({ pressed }) => [styles.continueQuestBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (progressPercent >= 100) {
                    handleCompleteQuest();
                  } else {
                    triggerModalPop();
    setShowCreatePostModal(true);
                  }
                }}
              >
                <LinearGradient
                  colors={['#784DF0', '#582CDB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.continueQuestGradient}
                >
                  <Text style={styles.continueQuestBtnText}>
                    {isQuestFinished ? '✓ Quest Completed' : 'Continue Quest'}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.createPostOutlineBtn, pressed && styles.btnPressed]}
                onPress={() => setShowCreatePostModal(true)}
              >
                <Text style={styles.createPostOutlineBtnText}>Create Post</Text>
              </Pressable>
            </View>
          </View>

          {/* SECTION 2: QUEST REQUIREMENTS */}
          <Text style={styles.sectionHeading}>Quest Requirements</Text>
          <View style={styles.requirementsList}>
            {requirements.map((req) => (
              <Pressable
                key={req.id}
                style={({ pressed }) => [
                  styles.requirementCard,
                  req.status === 'completed' && styles.requirementCardCompleted,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => {
                  if (req.id === 'req_4' && req.status !== 'locked') {
                    handleCompleteQuest();
                  } else if (req.id !== 'req_4') {
                    handleToggleRequirement(req.id);
                  } else {
                    showToast('🔒 Complete steps 1-3 first to unlock!');
                  }
                }}
              >
                <View style={styles.requirementLeft}>
                  <View
                    style={[
                      styles.reqIconCircle,
                      req.status === 'completed' && styles.reqIconCircleCompleted,
                    ]}
                  >
                    {req.iconType === 'document' && (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                          stroke={req.status === 'completed' ? '#582CDB' : '#524C62'}
                          strokeWidth="2"
                        />
                        <Path
                          d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                          stroke={req.status === 'completed' ? '#582CDB' : '#524C62'}
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </Svg>
                    )}
                    {req.iconType === 'lightbulb' && (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M9 18h6M10 22h4M12 2a7 7 0 0 0-7 7c0 2.6 1.4 4.8 3.5 6h7c2.1-1.2 3.5-3.4 3.5-6a7 7 0 0 0-7-7z"
                          stroke={req.status === 'completed' ? '#582CDB' : '#524C62'}
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </Svg>
                    )}
                    {req.iconType === 'clock' && (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke={req.status === 'completed' ? '#582CDB' : '#524C62'}
                          strokeWidth="2"
                        />
                        <Path
                          d="M12 6v6l4 2"
                          stroke={req.status === 'completed' ? '#582CDB' : '#524C62'}
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </Svg>
                    )}
                    {req.iconType === 'checkmark' && (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke={req.status === 'completed' ? '#582CDB' : '#524C62'}
                          strokeWidth="2"
                        />
                        <Path
                          d="M9 12l2 2 4-4"
                          stroke={req.status === 'completed' ? '#582CDB' : '#524C62'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                  </View>
                  <Text style={styles.requirementTitle}>{req.title}</Text>
                </View>

                <View
                  style={[
                    styles.reqStatusPill,
                    req.status === 'completed' && styles.reqStatusPillDone,
                    req.status === 'in_progress' && styles.reqStatusPillProgress,
                    req.status === 'locked' && styles.reqStatusPillLocked,
                  ]}
                >
                  <Text
                    style={[
                      styles.reqStatusPillText,
                      req.status === 'completed' && styles.reqStatusPillTextDone,
                      req.status === 'in_progress' && styles.reqStatusPillTextProgress,
                    ]}
                  >
                    {req.status === 'locked' ? '🔒 Locked' : req.statusLabel}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* SECTION 3: SUGGESTED ANGLE (Royal Purple Card) */}
          <View style={styles.suggestedAngleCard}>
            <LinearGradient
              colors={['#6438E8', '#4F23D0', '#3E16B8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.suggestedAngleGradient}
            >
              <View style={styles.suggestedAngleTag}>
                <Text style={styles.suggestedAngleTagText}>SUGGESTED ANGLE</Text>
              </View>

              <Text style={styles.suggestedAngleQuote}>
                &ldquo;One thing I wish I knew before I started creating&rdquo;
              </Text>

              {/* Formula Capsule */}
              <View style={styles.formulaCapsule}>
                <Text style={styles.formulaCapsuleText}>Hook ➔ Story ➔ Lesson ➔ CTA</Text>
              </View>

              {/* Platform Chips */}
              <View style={styles.platformChipsRow}>
                <View style={styles.platformTranslucentChip}>
                  <Text style={styles.platformTranslucentChipText}>TikTok</Text>
                </View>
                <View style={styles.platformTranslucentChip}>
                  <Text style={styles.platformTranslucentChipText}>Instagram Reel</Text>
                </View>
                <View style={styles.platformTranslucentChip}>
                  <Text style={styles.platformTranslucentChipText}>YouTube Shorts</Text>
                </View>
              </View>

              {/* White Action Button */}
              <Pressable
                style={({ pressed }) => [styles.useIdeaWhiteBtn, pressed && styles.btnPressed]}
                onPress={handleUseIdea}
              >
                <Text style={styles.useIdeaWhiteBtnText}>Use This Idea</Text>
              </Pressable>
            </LinearGradient>
          </View>

          {/* SECTION 4: YOUR QUEST PROGRESS (Circular Gauge) */}
          <View style={styles.progressGaugeCard}>
            {/* SVG Circular Progress Ring */}
            <View style={styles.gaugeCenterBox}>
              <Svg width={110} height={110} viewBox="0 0 110 110">
                <Circle
                  cx="55"
                  cy="55"
                  r="45"
                  stroke="#EAE5F8"
                  strokeWidth="9"
                  fill="none"
                />
                <Circle
                  cx="55"
                  cy="55"
                  r="45"
                  stroke="#582CDB"
                  strokeWidth="9"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercent / 100)}`}
                  strokeLinecap="round"
                  fill="none"
                  transform="rotate(-90 55 55)"
                />
              </Svg>
              <View style={styles.gaugeTextOverlay}>
                <Text style={styles.gaugePercentText}>{progressPercent}%</Text>
              </View>
            </View>

            <Text style={styles.gaugeHeading}>Your Quest Progress</Text>
            <View style={styles.gaugeBulletList}>
              <Text style={styles.gaugeBulletText}>
                • Steps completed: {completedCount || 1} of 3
              </Text>
              <Text style={styles.gaugeBulletText}>• Time remaining: 1 day</Text>
              <Text style={styles.gaugeBulletText}>• Streak impact: protect momentum</Text>
            </View>
          </View>

          {/* SECTION 5: WHY THIS QUEST MATTERS */}
          <Text style={styles.sectionHeading}>Why this quest matters</Text>
          <View style={styles.whyMattersCard}>
            <Text style={styles.whyMattersText}>
              Storytelling helps your audience trust you. Completing this quest improves your Creator Passport and strengthens your consistency record.
            </Text>

            <View style={styles.whyMattersPillRow}>
              <View style={styles.whyMattersPill}>
                <Text style={styles.whyMattersPillText}>Trust</Text>
              </View>
              <View style={styles.whyMattersPill}>
                <Text style={styles.whyMattersPillText}>Consistency</Text>
              </View>
              <View style={styles.whyMattersPill}>
                <Text style={styles.whyMattersPillText}>Creator Passport</Text>
              </View>
            </View>
          </View>

          {/* SECTION 6: REPUTATION EFFECT (2x2 Grid) */}
          <Text style={styles.sectionHeading}>Reputation Effect</Text>
          <View style={styles.reputationGrid}>
            <View style={styles.reputationTile}>
              <Text style={styles.reputationTileLabel}>Consistency</Text>
              <Text style={styles.reputationTileValuePurple}>+4%</Text>
            </View>
            <View style={styles.reputationTile}>
              <Text style={styles.reputationTileLabel}>Passport</Text>
              <Text style={styles.reputationTileValuePurple}>+6%</Text>
            </View>
            <View style={styles.reputationTile}>
              <Text style={styles.reputationTileLabel}>Quests</Text>
              <Text style={styles.reputationTileValueDark}>+1</Text>
            </View>
            <View style={styles.reputationTile}>
              <Text style={styles.reputationTileLabel}>Status</Text>
              <Text style={styles.reputationTileValueGold}>Ready</Text>
            </View>
          </View>

          {/* Reputation Callout Note */}
          <View style={styles.reputationCalloutRow}>
            <Text style={styles.reputationCalloutEmoji}>🛡️</Text>
            <Text style={styles.reputationCalloutText}>
              Brands are more likely to trust creators with consistent weekly activity.
            </Text>
          </View>

          {/* SECTION 7: JARVIS INSIGHT */}
          <View style={styles.jarvisInsightCard}>
            <View style={styles.jarvisHeaderRow}>
              <View style={styles.jarvisFlameIconBox}>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={styles.jarvisFlameIconImg}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.jarvisTitleCol}>
                <Text style={styles.jarvisInsightTitle}>Jarvis Insight</Text>
                <Text style={styles.jarvisInsightSub}>CREATOR CORE AI</Text>
              </View>
            </View>

            <Text style={styles.jarvisInsightQuoteText}>
              Your audience responds well to practical creator lessons. Keep this post honest, specific and easy to save.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.generateDraftBtn, pressed && styles.btnPressed]}
              onPress={() => setShowAiDraftModal(true)}
            >
              <Text style={styles.generateDraftBtnText}>Generate Quest Draft ➔</Text>
            </Pressable>
          </View>

          {/* SECTION 8: REWARD PREVIEW */}
          <Text style={styles.sectionHeading}>Reward Preview</Text>
          <View style={styles.rewardPreviewCard}>
            <View style={styles.rewardPreviewRow}>
              <Text style={styles.rewardPreviewLabel}>Creator XP Reward</Text>
              <Text style={styles.rewardPreviewValuePurple}>+150 XP</Text>
            </View>
            <View style={styles.rewardPreviewRow}>
              <Text style={styles.rewardPreviewLabel}>Badge Progression</Text>
              <Text style={styles.rewardPreviewValuePurple}>Storyteller</Text>
            </View>
            <View style={[styles.rewardPreviewRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.rewardPreviewLabel}>Passport Update</Text>
              <Text style={styles.rewardPreviewValueDark}>Active</Text>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 110 }} />
        </ScrollView>

        {/* 3. LIQUID GLASS FLOATING TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} isDarkMode={isDark} />

        {/* MODAL 1: CREATE POST & SCHEDULE */}
        <Modal
          visible={showCreatePostModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCreatePostModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <Text style={styles.modalTitle}>Plan Quest Post</Text>
              <Text style={styles.modalSubtitle}>
                Lock this storyteller post into your timeline to protect your streak.
              </Text>

              <Text style={styles.modalInputLabel}>CHOOSE PLATFORM</Text>
              <View style={styles.platformSelectRow}>
                {(['tiktok', 'instagram', 'youtube'] as const).map((plat) => (
                  <Pressable
                    key={plat}
                    onPress={() => setPostPlatform(plat)}
                    style={[
                      styles.platformSelectBtn,
                      postPlatform === plat && styles.platformSelectBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.platformSelectBtnText,
                        postPlatform === plat && styles.platformSelectBtnTextActive,
                      ]}
                    >
                      {plat === 'tiktok'
                        ? 'TikTok'
                        : plat === 'instagram'
                        ? 'Instagram Reel'
                        : 'YouTube Shorts'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.modalInputLabel}>STORY HOOK / TOPIC</Text>
              <TextInput
                style={styles.modalTextInput}
                value={postTitle}
                onChangeText={setPostTitle}
                placeholder="Enter your hook..."
                placeholderTextColor="#A39CB5"
              />

              <Text style={styles.modalInputLabel}>SCHEDULE TIME</Text>
              <TextInput
                style={styles.modalTextInput}
                value={postTime}
                onChangeText={setPostTime}
                placeholder="e.g. 7:30 PM"
                placeholderTextColor="#A39CB5"
              />

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalSecondaryBtn}
                  onPress={() => setShowCreatePostModal(false)}
                >
                  <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
                </Pressable>

                <Pressable style={styles.modalPrimaryBtn} onPress={handleSchedulePost}>
                  <LinearGradient
                    colors={['#784DF0', '#582CDB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalPrimaryGradient}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Schedule & Earn +50 XP</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 2: AI SCRIPT GENERATOR */}
        <Modal
          visible={showAiDraftModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAiDraftModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Jarvis Quest Draft</Text>
                <Pressable onPress={() => setShowAiDraftModal(false)}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>
                AI crafted story structure based on your creator style:
              </Text>

              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                {AI_GENERATED_SCRIPTS.map((script, idx) => (
                  <View key={idx} style={styles.scriptBlueprintBox}>
                    <Text style={styles.scriptBlueprintTitle}>{script.title}</Text>
                    <Text style={styles.scriptSectionLabel}>🎣 HOOK:</Text>
                    <Text style={styles.scriptSectionText}>&ldquo;{script.hook}&rdquo;</Text>

                    <Text style={styles.scriptSectionLabel}>📖 STORY:</Text>
                    <Text style={styles.scriptSectionText}>{script.story}</Text>

                    <Text style={styles.scriptSectionLabel}>💡 LESSON:</Text>
                    <Text style={styles.scriptSectionText}>{script.lesson}</Text>

                    <Pressable
                      style={styles.useDraftBtn}
                      onPress={() => {
                        setPostTitle(script.title);
                        setShowAiDraftModal(false);
                        triggerModalPop();
    setShowCreatePostModal(true);
                      }}
                    >
                      <Text style={styles.useDraftBtnText}>Use This Draft in Studio</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 3: NOTIFICATIONS */}
        <Modal
          visible={showNotificationsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <Text style={styles.modalSubtitle}>Recent alerts and mission updates</Text>

              <View style={styles.notificationItem}>
                <Text style={styles.notifItemTitle}>⚡ Storyteller Challenge Live</Text>
                <Text style={styles.notifItemTime}>Ends tomorrow at 11:30 PM</Text>
              </View>

              <View style={styles.notificationItem}>
                <Text style={styles.notifItemTitle}>🔥 47-Day Streak Active</Text>
                <Text style={styles.notifItemTime}>Posting today locks in Day 48</Text>
              </View>

              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowNotificationsModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL 4: PROFILE */}
        {/* UNIVERSAL CREATOR PASSPORT & PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />

        {/* 4. ANIMATED COMPLETION CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCelebrationModal}
          title="Storyteller Quest Completed!"
          subtitle="You earned +150 XP, unlocked the Storyteller Badge, and protected Day 48 of your streak!"
          badgeText="QUEST COMPLETE"
          xpEarned={150}
          streakCount={48}
          actionText="Back to Dashboard 🚀"
          onDismiss={() => {
            setShowCelebrationModal(false);
            if (onBackToDashboard) onBackToDashboard();
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

  // 1. TOP HEADER BAR
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FAF8F5',
  },
  headerLogoWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  headerGhostLogo: {
    width: 36,
    height: 36,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
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
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },
  profilePhotoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#582CDB',
    overflow: 'hidden',
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
  },
  btnPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },

  // 2. SCROLL CONTENT
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  toastBanner: {
    backgroundColor: '#171420',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  toastBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // BADGES & HEADLINE
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeQuestTag: {
    backgroundColor: '#582CDB',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  activeQuestTagText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  freeQuestTag: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  freeQuestTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 13.5,
    color: '#6B637B',
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500',
  },

  // HERO QUEST CARD
  heroQuestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 20,
    marginBottom: 26,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTopStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  inProgressPill: {
    backgroundColor: '#ECE8F9',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  inProgressPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  endsTomorrowText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  heroQuestTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  heroQuestDesc: {
    fontSize: 13.5,
    color: '#524C62',
    lineHeight: 20,
    marginBottom: 16,
  },

  // PROGRESS SECTION
  progressSection: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressStepLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#171420',
  },
  progressPercentLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#582CDB',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EAE5F8',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 4,
  },

  // REWARDS PILLS
  rewardsTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  xpRewardPill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  xpRewardPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#B45309',
  },
  badgeRewardPill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeRewardPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  passportRewardPill: {
    backgroundColor: '#F3E8FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  passportRewardPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E22CE',
  },

  // DUAL BUTTONS
  heroActionBtnCol: {
    gap: 10,
  },
  continueQuestBtn: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  continueQuestGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueQuestBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  createPostOutlineBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5DEFF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPostOutlineBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#171420',
  },

  // SECTION HEADINGS
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 14,
  },

  // REQUIREMENTS LIST
  requirementsList: {
    gap: 10,
    marginBottom: 26,
  },
  requirementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  requirementCardCompleted: {
    borderColor: '#D8B4FE',
    backgroundColor: '#FAF5FF',
  },
  requirementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  reqIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F7F5FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reqIconCircleCompleted: {
    backgroundColor: '#ECE8F9',
  },
  requirementTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#171420',
    flex: 1,
  },
  reqStatusPill: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  reqStatusPillProgress: {
    backgroundColor: '#ECE8F9',
  },
  reqStatusPillDone: {
    backgroundColor: '#DCFCE7',
  },
  reqStatusPillLocked: {
    backgroundColor: '#F3F4F6',
  },
  reqStatusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  reqStatusPillTextProgress: {
    color: '#582CDB',
  },
  reqStatusPillTextDone: {
    color: '#16A34A',
  },

  // SUGGESTED ANGLE (Royal Purple Card)
  suggestedAngleCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 26,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 4,
  },
  suggestedAngleGradient: {
    padding: 22,
  },
  suggestedAngleTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 100,
    marginBottom: 12,
  },
  suggestedAngleTagText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  suggestedAngleQuote: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight: 26,
    marginBottom: 14,
  },
  formulaCapsule: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  formulaCapsuleText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
  },
  platformChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  platformTranslucentChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  platformTranslucentChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  useIdeaWhiteBtn: {
    backgroundColor: '#FFFFFF',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  useIdeaWhiteBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: -0.2,
  },

  // CIRCULAR PROGRESS GAUGE CARD
  progressGaugeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 22,
    alignItems: 'center',
    marginBottom: 26,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  gaugeCenterBox: {
    position: 'relative',
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  gaugeTextOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugePercentText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#171420',
  },
  gaugeHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 8,
  },
  gaugeBulletList: {
    gap: 4,
    alignItems: 'center',
  },
  gaugeBulletText: {
    fontSize: 13,
    color: '#524C62',
    fontWeight: '500',
  },

  // WHY MATTERS CARD
  whyMattersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 18,
    marginBottom: 26,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  whyMattersText: {
    fontSize: 13.5,
    color: '#524C62',
    lineHeight: 20,
    marginBottom: 14,
  },
  whyMattersPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  whyMattersPill: {
    backgroundColor: '#F4F2FA',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  whyMattersPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#582CDB',
  },

  // REPUTATION GRID (2x2)
  reputationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  reputationTile: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  reputationTileLabel: {
    fontSize: 11.5,
    color: '#6B637B',
    fontWeight: '600',
    marginBottom: 6,
  },
  reputationTileValuePurple: {
    fontSize: 22,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: -0.5,
  },
  reputationTileValueDark: {
    fontSize: 22,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.5,
  },
  reputationTileValueGold: {
    fontSize: 20,
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: -0.5,
  },
  reputationCalloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 26,
  },
  reputationCalloutEmoji: {
    fontSize: 14,
  },
  reputationCalloutText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
  },

  // JARVIS INSIGHT CARD
  jarvisInsightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    marginBottom: 26,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  jarvisHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  jarvisFlameIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisFlameIconImg: {
    width: 26,
    height: 26,
  },
  jarvisTitleCol: {
    flex: 1,
  },
  jarvisInsightTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
  },
  jarvisInsightSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.6,
  },
  jarvisInsightQuoteText: {
    fontSize: 13.5,
    color: '#524C62',
    lineHeight: 20,
    marginBottom: 16,
  },
  generateDraftBtn: {
    alignSelf: 'flex-start',
  },
  generateDraftBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#582CDB',
  },

  // REWARD PREVIEW
  rewardPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginBottom: 20,
  },
  rewardPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F2FA',
  },
  rewardPreviewLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#524C62',
  },
  rewardPreviewValuePurple: {
    fontSize: 14,
    fontWeight: '800',
    color: '#582CDB',
  },
  rewardPreviewValueDark: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
  },

  // MODAL OVERLAYS & CARDS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FAF8F5',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalCloseIcon: {
    fontSize: 18,
    color: '#6B637B',
    fontWeight: '700',
    padding: 4,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B637B',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  platformSelectRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  platformSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    alignItems: 'center',
  },
  platformSelectBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  platformSelectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#524C62',
  },
  platformSelectBtnTextActive: {
    color: '#FFFFFF',
  },
  modalTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#171420',
    marginBottom: 14,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#524C62',
  },
  modalPrimaryBtn: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalPrimaryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // SCRIPT BLUEPRINT BOX
  scriptBlueprintBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 16,
    marginBottom: 14,
  },
  scriptBlueprintTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 8,
  },
  scriptSectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
    marginTop: 6,
    marginBottom: 2,
  },
  scriptSectionText: {
    fontSize: 12.5,
    color: '#524C62',
    lineHeight: 18,
  },
  useDraftBtn: {
    marginTop: 12,
    backgroundColor: '#582CDB',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  useDraftBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // NOTIFICATION & PROFILE MODALS
  notificationItem: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  notifItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  notifItemTime: {
    fontSize: 11,
    color: '#6B637B',
    marginTop: 2,
  },
  modalCloseBtn: {
    backgroundColor: '#582CDB',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  modalCloseBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalProfileImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignSelf: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#582CDB',
  },
  modalProfileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
    textAlign: 'center',
  },
  modalProfileHandle: {
    fontSize: 12,
    color: '#6B637B',
    textAlign: 'center',
    marginBottom: 16,
  },
  profileStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  profileStatBox: {
    alignItems: 'center',
  },
  profileStatVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
  },
  profileStatLabel: {
    fontSize: 11,
    color: '#6B637B',
    marginTop: 2,
  },
});
