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
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { sFont, sPadding, moderateScale, isNarrowScreen } from '../utils/responsive';

interface MissionDetailScreenProps {
  onBackToDashboard?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenMessages?: () => void;
  onOpenJarvisPro?: () => void;
  onOpenCreateIdea?: () => void;
  onOpenPostComposer?: (prefillTitle?: string, prefillPlatform?: string) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

export const MissionDetailScreen: React.FC<MissionDetailScreenProps> = ({
  onBackToDashboard,
  onLogout,
  onNavigateTab,
  onOpenMessages,
  onOpenJarvisPro,
  onOpenCreateIdea,
  onOpenPostComposer,
  userProfile,
  onSaveProfile,
}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('quests');
  const [isCompleted, setIsCompleted] = useState(false);
  const [step1Done, setStep1Done] = useState(true);
  const [step2Done, setStep2Done] = useState(false);
  const [step3Done, setStep3Done] = useState(false);

  // Modal States
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  // Form State
  const [postTitle, setPostTitle] = useState('One thing I wish I knew before I started creating.');
  const [postPlatform, setPostPlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok');

  // Animations
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const modalPopScale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -3,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 3,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    );
    flameLoop.start();
    return () => flameLoop.stop();
  }, [flameFloatY]);

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

  const handleCompleteMission = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsCompleted(true);
    setStep2Done(true);
    setStep3Done(true);
    setShowCelebrationModal(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0C0A12" : "#FAF8F5"} />
      <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
        {/* 1. TOP AIRY HEADER BAR */}
        <FreeAppHeader
          onOpenJarvisPro={onOpenJarvisPro}
          onOpenMessages={() => {
            if (onOpenMessages) {
              onOpenMessages();
            } else {
              triggerModalPop();
              setShowChatModal(true);
            }
          }}
          onOpenNotifications={() => {
            triggerModalPop();
            setShowNotificationModal(true);
          }}
          onOpenProfile={() => {
            triggerModalPop();
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
        >
          {/* TOP PILL BADGE */}
          <View style={styles.topBadgesRow}>
            <View style={styles.todayMissionPill}>
              <Text style={styles.todayMissionPillText}>TODAY&apos;S MISSION</Text>
            </View>
          </View>

          {/* MAIN HEADLINE & SUBTITLE */}
          <Text style={styles.mainHeading}>Post once before 9 PM.</Text>
          <Text style={styles.mainSubtitle}>
            Protect your <Text style={{ fontWeight: '800', color: '#171420' }}>{userProfile?.streakCount || 47}-day streak</Text> and keep your momentum alive.
          </Text>

          {/* 1. MISSION PROGRESS CARD */}
          <View style={styles.missionProgressCard}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressCardTitle}>Mission Progress</Text>
              <Text style={styles.progressFractionText}>{isCompleted ? '1 / 1' : '0 / 1'}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: isCompleted ? '100%' : '18%' }]} />
            </View>

            {/* 3 Metric Pills Row: +80 XP, Streak, 9:00 PM Deadline */}
            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricValueGold}>+80</Text>
                <Text style={styles.metricLabel}>XP</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricValueStreak}>🔥 {userProfile?.streakCount || 47}</Text>
                <Text style={styles.metricLabel}>DAY STREAK</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricValueGold}>9:00 PM</Text>
                <Text style={styles.metricLabel}>DEADLINE</Text>
              </View>
            </View>

            {/* Dynamic Conditional Warning / Streak Safety Banner */}
            {(() => {
              const currentHour = new Date().getHours();
              const hoursLeft = 21 - currentHour;
              let banner = {
                icon: '🔥',
                text: "Your streak is safe once you complete today’s mission.",
                bg: '#FAF5FF',
                border: '#E9D5FF',
                color: '#7E22CE',
              };

              if (isCompleted) {
                banner = {
                  icon: '✨',
                  text: "Streak safe! Today's mission is locked in.",
                  bg: '#ECFDF5',
                  border: '#A7F3D0',
                  color: '#059669',
                };
              } else if (hoursLeft <= 0 || hoursLeft <= 2) {
                banner = {
                  icon: '🔴',
                  text: 'Post before 9 PM to save your streak.',
                  bg: '#FEF2F2',
                  border: '#FECACA',
                  color: '#DC2626',
                };
              } else if (hoursLeft <= 4) {
                banner = {
                  icon: '⚠️',
                  text: `Only ${hoursLeft} hours left to protect your streak.`,
                  bg: '#FEF3C7',
                  border: '#FDE68A',
                  color: '#B45309',
                };
              }

              return (
                <View style={[styles.warningBanner, { backgroundColor: banner.bg, borderColor: banner.border }]}>
                  <Text style={[styles.warningBannerText, { color: banner.color }]}>
                    {banner.icon} {banner.text}
                  </Text>
                </View>
              );
            })()}
          </View>

          {/* 2. STEP-BY-STEP GUIDE (MISSION CONTROL) */}
          <View style={styles.guideCard}>
            <Text style={styles.guideSectionTitle}>STEP-BY-STEP GUIDE</Text>

            {/* Step 1: Choose your idea */}
            <Pressable
              style={({ pressed }) => [styles.stepRow, pressed && styles.stepRowPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenCreateIdea) {
                  onOpenCreateIdea();
                } else if (onNavigateTab) {
                  onNavigateTab('create');
                } else {
                  triggerModalPop();
                  setShowIdeaModal(true);
                }
              }}
            >
              <View style={[styles.stepCircle, step1Done && styles.stepCircleActive]}>
                <Text style={[styles.stepCircleNumber, step1Done && styles.stepCircleNumberActive]}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepTitle}>Choose your idea</Text>
                  <Text style={styles.stepArrow}>→</Text>
                </View>
                <Text style={styles.stepDescription}>Pick a topic, trend, or use Jarvis’s suggestion.</Text>
              </View>
            </Pressable>

            {/* Step 2: Create your post */}
            <Pressable
              style={({ pressed }) => [styles.stepRow, pressed && styles.stepRowPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenPostComposer) {
                  onOpenPostComposer(postTitle, postPlatform);
                } else {
                  triggerModalPop();
                  setShowCreateModal(true);
                }
              }}
            >
              <View style={[styles.stepCircle, step2Done && styles.stepCircleActive]}>
                <Text style={[styles.stepCircleNumber, step2Done && styles.stepCircleNumberActive]}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepTitle}>Create your post</Text>
                  <Text style={styles.stepArrow}>→</Text>
                </View>
                <Text style={styles.stepDescription}>Write your caption, script, or post content.</Text>
              </View>
            </Pressable>

            {/* Step 3: Publish before 9 PM (Milestone Status Step) */}
            <View style={[styles.stepRow, { marginBottom: 0 }]}>
              <View style={[styles.stepCircle, (step3Done || isCompleted) && styles.stepCircleActive]}>
                {isCompleted ? (
                  <Text style={{ fontSize: 13, color: '#582CDB', fontWeight: '800' }}>✓</Text>
                ) : (
                  <Text style={[styles.stepCircleNumber, step3Done && styles.stepCircleNumberActive]}>3</Text>
                )}
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepTitle}>Publish before 9 PM</Text>
                  {isCompleted ? (
                    <View style={styles.stepStatusBadge}>
                      <Text style={styles.stepStatusBadgeText}>Done ✓</Text>
                    </View>
                  ) : (
                    <Text style={styles.stepStatusQuietText}>Auto-tracks</Text>
                  )}
                </View>
                <Text style={styles.stepDescription}>Make sure your post goes live before the deadline.</Text>
              </View>
            </View>
          </View>

          {/* 3. SUGGESTED IDEA CARD (ROYAL PURPLE) */}
          <View style={styles.suggestedIdeaCard}>
            <View style={styles.suggestedHeaderRow}>
              <Text style={styles.suggestedIdeaTag}>SUGGESTED IDEA</Text>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Rect x="2" y="3" width="20" height="14" rx="2" stroke="#E0E7FF" strokeWidth="2" />
                <Path d="M8 21H16" stroke="#E0E7FF" strokeWidth="2" strokeLinecap="round" />
                <Path d="M12 17V21" stroke="#E0E7FF" strokeWidth="2" strokeLinecap="round" />
              </Svg>
            </View>

            <Text style={styles.suggestedQuote}>
              &ldquo;One thing I wish I knew before I started creating.&rdquo;
            </Text>

            <View style={styles.suggestedFooterRow}>
              <View style={styles.bestTimeRow}>
                <Text style={styles.bestTimeText} numberOfLines={1}>
                  {isNarrowScreen ? '🕒 7:30 PM' : '🕒 Best time: 7:30 PM'}
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.useThisIdeaBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  if (onOpenPostComposer) {
                    onOpenPostComposer('One thing I wish I knew before I started creating', 'tiktok');
                  } else {
                    setPostTitle('One thing I wish I knew before I started creating');
                    triggerModalPop();
                    setShowCreateModal(true);
                  }
                }}
              >
                <Text style={styles.useThisIdeaBtnText} numberOfLines={1}>Use This Idea</Text>
              </Pressable>
            </View>
          </View>

          {/* 4. JARVIS INSIGHT CARD */}
          <View style={styles.jarvisCard}>
            <View style={styles.jarvisHeaderRow}>
              <Animated.View
                style={[
                  styles.jarvisFlameCircle,
                  { transform: [{ translateY: flameFloatY }] },
                ]}
              >
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={styles.jarvisFlameIcon}
                  resizeMode="contain"
                />
              </Animated.View>
              <View style={styles.jarvisTitleCol}>
                <Text style={styles.jarvisTitle}>Jarvis insight</Text>
                <Text style={styles.jarvisTime}>2m ago</Text>
              </View>
            </View>

            <Text style={styles.jarvisBody}>
              Your audience responds well to honest creator lessons. Share a quick mistake or lesson from your journey.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.generateIdeaBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenCreateIdea) {
                  onOpenCreateIdea();
                } else if (onNavigateTab) {
                  onNavigateTab('create');
                } else {
                  triggerModalPop();
                  setShowIdeaModal(true);
                }
              }}
            >
              <Text style={styles.generateIdeaBtnText}>✨ Generate Idea →</Text>
            </Pressable>
          </View>

          {/* 5. WHAT YOU'LL BUILD */}
          <View style={styles.improvesCard}>
            <Text style={styles.improvesSectionTitle}>WHAT YOU&apos;LL BUILD</Text>
            <View style={styles.improvesPillsRow}>
              <View style={styles.improvesPillGray}>
                <Text style={styles.improvesPillGrayText}>Consistency</Text>
              </View>
              <View style={styles.improvesPillPurple}>
                <Text style={styles.improvesPillPurpleText}>XP Boost</Text>
              </View>
              <View style={styles.improvesPillGold}>
                <Text style={styles.improvesPillGoldText}>Growth</Text>
              </View>
              <View style={styles.improvesPillPassport}>
                <Text style={styles.improvesPillPassportText}>Creator Passport</Text>
              </View>
            </View>
          </View>

          {/* 6. XP & REWARD CARD */}
          <View style={styles.rewardCard}>
            <View style={styles.rewardTopRow}>
              <View style={styles.rewardMedalBox}>
                <Text style={{ fontSize: 20 }}>🏅</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardTitle}>+80 XP</Text>
                <Text style={styles.rewardSubtitle}>Earned when you complete today&apos;s mission</Text>
              </View>
            </View>

            <View style={styles.momentumBadgePill}>
              <Text style={styles.momentumBadgeText}>🏅 Momentum Builder · Reward for completing this mission</Text>
            </View>
          </View>

          {/* 7. PRIMARY ACTION BUTTON */}
          <View style={styles.actionButtonsContainer}>
            <Pressable
              style={({ pressed }) => [styles.createPostBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenPostComposer) {
                  onOpenPostComposer(postTitle, postPlatform);
                } else {
                  triggerModalPop();
                  setShowCreateModal(true);
                }
              }}
            >
              <LinearGradient
                colors={['#6366F1', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createPostGradient}
              >
                <Text style={styles.createPostBtnText}>⊕  Create Post</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Bottom Space for Floating Tab Bar */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* FLOATING LIQUID GLASS TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* SIGNATURE ANIMATED GHOST CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCelebrationModal}
          title="Mission Accomplished!"
          subtitle="Your daily post is live & your 47-day streak momentum is 100% protected."
          speechBubble="Ghost says: Consistency is your superpower Amara! +80 XP added to your Passport!"
          badgeText="MISSION COMPLETE"
          xpEarned={80}
          streakCount={47}
          actionText="Continue ➔"
          onDismiss={() => {
            setShowCelebrationModal(false);
            if (onBackToDashboard) onBackToDashboard();
          }}
        />

        {/* CREATE POST MODAL */}
        <Modal
          visible={showCreateModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>Create Mission Post</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>Post before 9 PM to protect your streak.</Text>
                </View>
                <Pressable
                  onPress={() => setShowCreateModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalInputLabel}>CHOOSE PLATFORM</Text>
              <View style={styles.platformSelectRow}>
                {/* TikTok */}
                <Pressable
                  onPress={() => setPostPlatform('tiktok')}
                  style={[
                    styles.platformSelectBtn,
                    postPlatform === 'tiktok' && styles.platformSelectBtnActive,
                  ]}
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24">
                    <Path
                      d="M17.5 4.5a4.5 4.5 0 0 1-3.5-4h-2.5v13.5a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5.05.7.15V8.5a5.5 5.5 0 1 0 4.8 5.4V7.2a7.5 7.5 0 0 0 4.5 1.3V5.5c-.5 0-1-.3-1.5-1z"
                      fill={postPlatform === 'tiktok' ? '#FFFFFF' : '#000000'}
                    />
                  </Svg>
                  <Text
                    style={[
                      styles.platformSelectBtnText,
                      postPlatform === 'tiktok' && styles.platformSelectBtnTextActive,
                    ]}
                  >
                    TikTok
                  </Text>
                </Pressable>

                {/* Instagram */}
                <Pressable
                  onPress={() => setPostPlatform('instagram')}
                  style={[
                    styles.platformSelectBtn,
                    postPlatform === 'instagram' && styles.platformSelectBtnActive,
                  ]}
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Rect x="2" y="2" width="20" height="20" rx="5" stroke={postPlatform === 'instagram' ? '#FFFFFF' : '#E1306C'} strokeWidth="2.2" />
                    <Circle cx="12" cy="12" r="4" stroke={postPlatform === 'instagram' ? '#FFFFFF' : '#E1306C'} strokeWidth="2.2" />
                  </Svg>
                  <Text
                    style={[
                      styles.platformSelectBtnText,
                      postPlatform === 'instagram' && styles.platformSelectBtnTextActive,
                    ]}
                  >
                    Instagram
                  </Text>
                </Pressable>

                {/* YouTube */}
                <Pressable
                  onPress={() => setPostPlatform('youtube')}
                  style={[
                    styles.platformSelectBtn,
                    postPlatform === 'youtube' && styles.platformSelectBtnActive,
                  ]}
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.82.42A2.5 2.5 0 0 0 2.42 7.19C2 8.76 2 12 2 12s0 3.24.42 4.81a2.5 2.5 0 0 0 1.76 1.77C5.74 19 12 19 12 19s6.26 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77C22 15.24 22 12 22 12s0-3.24-.42-4.81z"
                      fill={postPlatform === 'youtube' ? '#FFFFFF' : '#FF0000'}
                    />
                    <Path d="M10 15.5l5.5-3.5L10 8.5v7z" fill={postPlatform === 'youtube' ? '#582CDB' : '#FFFFFF'} />
                  </Svg>
                  <Text
                    style={[
                      styles.platformSelectBtnText,
                      postPlatform === 'youtube' && styles.platformSelectBtnTextActive,
                    ]}
                  >
                    YouTube
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.modalInputLabel}>POST TITLE / HOOK</Text>
              <TextInput
                style={styles.modalTextInput}
                value={postTitle}
                onChangeText={setPostTitle}
                placeholder="e.g. One thing I wish I knew before creating..."
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalSecondaryBtn}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={() => {
                    setShowCreateModal(false);
                    handleCompleteMission();
                  }}
                >
                  <LinearGradient
                    colors={['#6366F1', '#582CDB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalPrimaryGradient}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Publish &amp; Save</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* AI IDEA SPARKS MODAL */}
        <Modal
          visible={showIdeaModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowIdeaModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>AI Hook Sparks</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>Angles tailored for your 47-day streak:</Text>
                </View>
                <Pressable
                  onPress={() => setShowIdeaModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              {[
                'One thing I wish I knew before I started creating.',
                '3 creator tools that saved me 10 hours this week.',
                'Why consistency beats motivation every single time.',
              ].map((spark, idx) => (
                <Pressable
                  key={idx}
                  style={styles.sparkCard}
                  onPress={() => {
                    setPostTitle(spark);
                    setShowIdeaModal(false);
                    setShowCreateModal(true);
                  }}
                >
                  <Text style={styles.sparkText}>&ldquo;{spark}&rdquo;</Text>
                  <Text style={styles.sparkTag}>⚡ 94 Viral Score • High Retention</Text>
                </Pressable>
              ))}

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowIdeaModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Done</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* NOTIFICATION MODAL */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>Mission Notifications</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>Today&apos;s streak updates</Text>
                </View>
                <Pressable
                  onPress={() => setShowNotificationModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.notifCard}>
                <Text style={{ fontSize: 18 }}>🔥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>Post before 9 PM</Text>
                  <Text style={styles.notifBody}>Your 47-day streak requires 1 post today.</Text>
                </View>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowNotificationModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* PROFILE MODAL */}
        {/* UNIVERSAL CREATOR PASSPORT & PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />

        {/* CHAT MODAL */}
        <Modal
          visible={showChatModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowChatModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>Squad Chat</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>Collaborate with your creator squad</Text>
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
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#582CDB', marginBottom: 2 }}>🤖 Jarvis Assistant</Text>
                <Text style={{ fontSize: 13, color: '#334155' }}>Your peak audience reach starts at 7:30 PM today!</Text>
              </View>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => setShowChatModal(false)}
              >
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>
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
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
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
    borderRadius: 20,
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

  scrollContent: {
    paddingHorizontal: sPadding(20),
    paddingTop: 8,
  },

  // TOP PILL BADGES
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  todayMissionPill: {
    backgroundColor: '#784DF0',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  todayMissionPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  freeMissionPill: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  freeMissionPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.4,
  },

  // HEADLINE
  mainHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#524C62',
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500',
  },

  // 1. MISSION PROGRESS CARD
  missionProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
  },
  progressFractionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#582CDB',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValueGold: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#D97706',
    marginBottom: 2,
  },
  metricValueStreak: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  metricEmoji: {
    fontSize: 15,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.4,
  },
  warningBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  warningBannerText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#DC2626',
  },

  // 2. STEP-BY-STEP GUIDE
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  guideSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
  },
  guideHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  guideTapHint: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  stepRowPressed: {
    backgroundColor: '#FAF8F5',
    opacity: 0.85,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 2,
  },
  stepCircleActive: {
    borderColor: '#582CDB',
    backgroundColor: '#F5F3FF',
  },
  stepCircleNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  stepCircleNumberActive: {
    color: '#582CDB',
  },
  stepContent: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#171420',
  },
  stepArrow: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#94A3B8',
    paddingRight: 2,
  },
  stepStatusBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  stepStatusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  stepStatusQuietText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },

  // 3. SUGGESTED IDEA CARD (ROYAL PURPLE)
  suggestedIdeaCard: {
    backgroundColor: '#582CDB',
    borderRadius: 22,
    padding: sPadding(16),
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
    overflow: 'hidden',
  },
  suggestedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestedIdeaTag: {
    fontSize: sFont(10),
    fontWeight: '800',
    color: '#E0E7FF',
    letterSpacing: 0.6,
  },
  suggestedQuote: {
    fontSize: sFont(15.5),
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 16,
  },
  suggestedFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  bestTimeRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestTimeText: {
    fontSize: sFont(11),
    fontWeight: '700',
    color: '#E0E7FF',
  },
  useThisIdeaBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 100,
    flexShrink: 0,
  },
  useThisIdeaBtnText: {
    fontSize: sFont(11.5),
    fontWeight: '800',
    color: '#582CDB',
  },

  // 4. WHAT THIS MISSION IMPROVES
  improvesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  improvesSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  improvesPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  improvesPillGray: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
  },
  improvesPillGrayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  improvesPillPurple: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
  },
  improvesPillPurpleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
  },
  improvesPillGold: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
  },
  improvesPillGoldText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  improvesPillPassport: {
    backgroundColor: '#F3E8FF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  improvesPillPassportText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6D28D9',
  },

  // 5. XP & REWARD CARD
  rewardCard: {
    backgroundColor: '#F5F0E6',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8E1D3',
    padding: 18,
    marginBottom: 18,
  },
  rewardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rewardMedalBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
  },
  rewardSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  momentumBadgePill: {
    backgroundColor: '#EBE4D5',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  momentumBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#785928',
    letterSpacing: 0.6,
  },

  // 6. JARVIS INSIGHT CARD
  jarvisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  jarvisHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  jarvisFlameCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisFlameIcon: {
    width: 22,
    height: 22,
  },
  jarvisTitleCol: {
    flex: 1,
  },
  jarvisTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
  },
  jarvisTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  jarvisBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  generateIdeaBtn: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  generateIdeaBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },

  // 7. DUAL ACTION BUTTONS
  actionButtonsContainer: {
    gap: 10,
    marginBottom: 10,
  },
  createPostBtn: {
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  createPostGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPostBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  publishedBtn: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 24, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sPadding(14),
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: sPadding(16),
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalCloseCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  modalCloseCross: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: sFont(17.5),
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 3,
  },
  modalSubtitle: {
    fontSize: sFont(11.5),
    color: '#6B637B',
    lineHeight: 16,
  },
  modalInputLabel: {
    fontSize: 11,
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
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#171420',
    marginBottom: 14,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#524C62',
  },
  modalPrimaryBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalPrimaryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalFullBtn: {
    backgroundColor: '#582CDB',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  modalFullBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sparkCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 14,
    marginBottom: 10,
  },
  sparkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  sparkTag: {
    fontSize: 11,
    color: '#582CDB',
    fontWeight: '600',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 12,
    color: '#64748B',
  },
  profileRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  chatCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 12,
    marginBottom: 10,
  },
});
