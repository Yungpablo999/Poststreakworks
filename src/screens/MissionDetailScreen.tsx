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
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

interface MissionDetailScreenProps {
  onBackToDashboard: () => void;
  onNavigateTab?: (tab: 'home' | 'create' | 'match' | 'quests' | 'growth') => void;
  onLogout?: () => void;
}

type TabType = 'home' | 'create' | 'match' | 'quests' | 'growth';

// Exact Custom Figma Vector Icons for Bottom Navigation Bar
const HomeNavIcon = ({ color }: { color: string }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill={color}>
    <Path
      d="M12 2.5L2 11.5H5.5V21.5H9.5V14.5C9.5 13.67 10.17 13 11 13H13C13.83 13 14.5 13.67 14.5 14.5V21.5H18.5V11.5H22L12 2.5Z"
      fill={color}
    />
  </Svg>
);

const CreateNavIcon = ({ color }: { color: string }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2.8" />
    <Path d="M12 7.5V16.5M7.5 12H16.5" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
  </Svg>
);

const MatchNavIcon = ({ color }: { color: string }) => (
  <Svg width={28} height={26} viewBox="0 0 28 24" fill={color}>
    <Circle cx="14" cy="5.8" r="3.6" fill={color} />
    <Path
      d="M8.2 18.2C8.2 15 10.8 12.2 14 12.2C17.2 12.2 19.8 15 19.8 18.2V20.5H8.2V18.2Z"
      fill={color}
    />
    <Circle cx="5.2" cy="8.2" r="2.8" fill={color} />
    <Path
      d="M1.2 19.2C1.2 17 3 15 5.2 15C6.1 15 6.9 15.3 7.5 15.7C7.3 16.5 7.2 17.4 7.2 18.2V20.5H1.2V19.2Z"
      fill={color}
    />
    <Circle cx="22.8" cy="8.2" r="2.8" fill={color} />
    <Path
      d="M26.8 19.2C26.8 17 25 15 22.8 15C21.9 15 21.1 15.3 20.5 15.7C20.7 16.5 20.8 17.4 20.8 18.2V20.5H26.8V19.2Z"
      fill={color}
    />
  </Svg>
);

const QuestsNavIcon = ({ color }: { color: string }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path d="M3.5 3.5L5.8 2L13.2 9.4L11.4 11.2L4 3.8V3.5Z" fill={color} />
    <Path d="M3.5 3.5L2 5.8L9.4 13.2L11.2 11.4L3.8 4H3.5Z" fill={color} />
    <Path d="M14.5 9.2L9.8 13.9L11.3 15.4L16 10.7L14.5 9.2Z" fill={color} />
    <Path d="M13.2 15.2L17.5 19.5" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
    <Circle cx="18.5" cy="20.5" r="1.8" fill={color} />

    <Path d="M20.5 3.5L18.2 2L10.8 9.4L12.6 11.2L20 3.8V3.5Z" fill={color} />
    <Path d="M20.5 3.5L22 5.8L14.6 13.2L12.8 11.4L20.2 4H20.5Z" fill={color} />
    <Path d="M9.5 9.2L14.2 13.9L12.7 15.4L8 10.7L9.5 9.2Z" fill={color} />
    <Path d="M10.8 15.2L6.5 19.5" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
    <Circle cx="5.5" cy="20.5" r="1.8" fill={color} />
  </Svg>
);

const GrowthNavIcon = ({ color }: { color: string }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3.5 17L9 11.5L13 15L20.5 7"
      stroke={color}
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.5 7H20.5V13"
      stroke={color}
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SUGGESTED_IDEAS = [
  'One thing I wish I knew before I started creating.',
  'The #1 mistake that held back my growth in 2024.',
  'How I plan 7 days of high-retention content in 1 hour.',
  'Stop doing this if you want more engagement on Reels.',
];

export const MissionDetailScreen: React.FC<MissionDetailScreenProps> = ({
  onBackToDashboard,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('quests');
  const [isCompleted, setIsCompleted] = useState(false);
  const [ideaIndex, setIdeaIndex] = useState(0);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animations
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(1)).current;
  const celebrationScale = useRef(new Animated.Value(0.85)).current;

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

  const handleTabPress = (tab: TabType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
    if (tab === 'home') {
      onBackToDashboard();
    } else if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const handleUseIdea = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setToastMessage('✓ Idea copied to clipboard & script draft!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGenerateIdea = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIdeaIndex((prev) => (prev + 1) % SUGGESTED_IDEAS.length);
    setToastMessage('✨ Jarvis generated a new trending hook!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePublishDone = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsCompleted(true);
    setShowCelebrationModal(true);
    Animated.spring(celebrationScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 10,
    }).start();
  };

  const getTabColor = (tab: TabType) => (activeTab === tab ? '#582CDB' : '#1A1626');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* 1. TOP HEADER BAR */}
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

          {/* Right Icons: Chat, Notification Bell, Profile Photo */}
          <View style={styles.headerRightGroup}>
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
              hitSlop={8}
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

            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.headerIconBtnPressed]}
              hitSlop={8}
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
              <View style={styles.notificationDot} />
            </Pressable>

            {/* Profile Avatar */}
            <Pressable
              style={({ pressed }) => [styles.profilePhotoBtn, pressed && styles.headerIconBtnPressed]}
              hitSlop={8}
            >
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerAvatarThumb}
                resizeMode="cover"
              />
            </Pressable>
          </View>
        </View>

        {/* 2. MAIN SCROLLABLE MISSION BODY */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Toast Notification Banner */}
          {toastMessage && (
            <View style={styles.toastBanner}>
              <Text style={styles.toastBannerText}>{toastMessage}</Text>
            </View>
          )}

          {/* Mission Tag Badges */}
          <View style={styles.tagRow}>
            <View style={styles.todayMissionTag}>
              <Text style={styles.todayMissionTagText}>TODAY&apos;S MISSION</Text>
            </View>

            <View style={styles.freeMissionTag}>
              <Text style={styles.freeMissionTagText}>FREE MISSION</Text>
            </View>
          </View>

          {/* Mission Headline */}
          <Text style={styles.missionHeadline}>Post once before 9 PM.</Text>
          <Text style={styles.missionSubtext}>
            Protect your <Text style={styles.boldDark}>47-day streak</Text> and keep your creator momentum alive.
          </Text>

          {/* CARD 1: MISSION PROGRESS */}
          <View style={styles.missionCard}>
            <View style={styles.cardHeaderFlex}>
              <Text style={styles.cardHeaderTitle}>Mission Progress</Text>
              <Text style={styles.progressCountText}>{isCompleted ? '1 / 1' : '0 / 1'}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: isCompleted ? '100%' : '25%' }]} />
            </View>

            {/* 3 Metric Pills */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricPillBox}>
                <Text style={styles.metricBigValueGold}>+80</Text>
                <Text style={styles.metricSubLabel}>XP</Text>
              </View>

              <View style={styles.metricPillBox}>
                <Text style={styles.metricFireEmoji}>🔥</Text>
                <Text style={styles.metricSubLabel}>STREAK</Text>
              </View>

              <View style={styles.metricPillBox}>
                <Text style={styles.metricBigValueAmber}>9:00 PM</Text>
                <Text style={styles.metricSubLabel}>DEADLINE</Text>
              </View>
            </View>

            {/* Alert Banner */}
            <View style={styles.alertNoticeBox}>
              <Text style={styles.alertNoticeExclamation}>!</Text>
              <Text style={styles.alertNoticeText}>One post today keeps your streak alive.</Text>
            </View>
          </View>

          {/* CARD 2: STEP-BY-STEP GUIDE */}
          <View style={styles.missionCard}>
            <Text style={styles.sectionHeaderCaps}>STEP-BY-STEP GUIDE</Text>

            {/* Step 1 */}
            <View style={styles.stepItemRow}>
              <View style={[styles.stepNumberCircle, styles.stepNumberCircleActive]}>
                <Text style={styles.stepNumberTextActive}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Choose your idea</Text>
                <Text style={styles.stepDescription}>Pick a trending topic or use a suggestion.</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.stepItemRow}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Write your script</Text>
                <Text style={styles.stepDescription}>Keep it concise. Focus on the hook.</Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.stepItemRowLast}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Publish before 9 PM</Text>
                <Text style={styles.stepDescription}>Make sure your post goes live before the deadline.</Text>
              </View>
            </View>
          </View>

          {/* CARD 3: SUGGESTED IDEA (Vibrant Purple Box) */}
          <View style={styles.suggestedIdeaCard}>
            <View style={styles.suggestedIdeaHeader}>
              <Text style={styles.suggestedIdeaLabel}>SUGGESTED IDEA</Text>
              <View style={styles.suggestedMediaIconsRow}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Rect x="2" y="2" width="20" height="20" rx="4" stroke="#FFFFFF" strokeWidth="2.2" />
                  <Path d="M10 8L16 12L10 16V8Z" fill="#FFFFFF" />
                </Svg>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Rect x="3" y="3" width="14" height="18" rx="2" stroke="#FFFFFF" strokeWidth="2" />
                  <Rect x="8" y="3" width="13" height="18" rx="2" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
                </Svg>
              </View>
            </View>

            <Text style={styles.suggestedIdeaQuote}>
              &ldquo;{SUGGESTED_IDEAS[ideaIndex]}&rdquo;
            </Text>

            <View style={styles.suggestedIdeaFooter}>
              <View style={styles.bestTimeRow}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="10" stroke="#FFFFFF" strokeWidth="2" opacity="0.85" />
                  <Path d="M12 6V12L15 15" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
                </Svg>
                <Text style={styles.bestTimeText}>Best time: 7:30 PM</Text>
              </View>

              <Pressable
                onPress={handleUseIdea}
                style={({ pressed }) => [
                  styles.useIdeaButton,
                  pressed && styles.useIdeaButtonPressed,
                ]}
              >
                <Text style={styles.useIdeaButtonText}>Use This Idea</Text>
              </Pressable>
            </View>
          </View>

          {/* CARD 4: WHAT THIS MISSION IMPROVES */}
          <View style={styles.missionCard}>
            <Text style={styles.sectionHeaderCaps}>WHAT THIS MISSION IMPROVES</Text>
            <View style={styles.improvementChipsRow}>
              <View style={styles.grayPill}>
                <Text style={styles.grayPillText}>Consistency</Text>
              </View>
              <View style={styles.purplePill}>
                <Text style={styles.purplePillText}>XP Boost</Text>
              </View>
              <View style={styles.amberPill}>
                <Text style={styles.amberPillText}>Growth</Text>
              </View>
              <View style={styles.grayPill}>
                <Text style={styles.grayPillText}>Passport</Text>
              </View>
            </View>
          </View>

          {/* CARD 5: XP REWARD BADGE */}
          <View style={styles.rewardCard}>
            <View style={styles.rewardTopRow}>
              <View style={styles.medalIconBox}>
                <Text style={styles.medalEmoji}>🎖️</Text>
              </View>
              <View style={styles.rewardTitleGroup}>
                <Text style={styles.rewardMainTitle}>+80 XP Pending</Text>
                <Text style={styles.rewardSubtitle}>Streak Protection</Text>
              </View>
            </View>

            <View style={styles.momentumBadgeBar}>
              <Text style={styles.momentumBadgeText}>MOMENTUM BUILDER BADGE</Text>
            </View>
          </View>

          {/* CARD 6: JARVIS INSIGHT */}
          <View style={styles.missionCard}>
            <View style={styles.jarvisHeaderRow}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={styles.jarvisInsightFlameIcon}
                resizeMode="contain"
              />
              <View style={styles.jarvisTitleGroup}>
                <Text style={styles.jarvisInsightTitle}>Jarvis insight</Text>
                <Text style={styles.jarvisInsightTime}>2m ago</Text>
              </View>
            </View>

            <Text style={styles.jarvisInsightQuote}>
              Your audience responds well to honest creator lessons. Share a quick mistake or lesson from your journey.
            </Text>

            <Pressable onPress={handleGenerateIdea} style={styles.generateIdeaLinkRow} hitSlop={6}>
              <Text style={styles.generateIdeaSparkle}>✨</Text>
              <Text style={styles.generateIdeaText}>GENERATE IDEA</Text>
            </Pressable>
          </View>

          {/* 3. BOTTOM ACTION BUTTONS */}
          <View style={styles.actionButtonsContainer}>
            {/* Primary Button: Create Post */}
            <Pressable
              onPress={handleUseIdea}
              style={({ pressed }) => [
                styles.createPostPrimaryBtn,
                pressed && styles.createPostPrimaryBtnPressed,
              ]}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="9.5" stroke="#FFFFFF" strokeWidth="2.4" />
                <Path d="M12 7.5V16.5M7.5 12H16.5" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
              </Svg>
              <Text style={styles.createPostPrimaryBtnText}>Create Post</Text>
            </Pressable>

            {/* Secondary Button: I Published This */}
            <Pressable
              onPress={handlePublishDone}
              style={({ pressed }) => [
                styles.iPublishedSecondaryBtn,
                isCompleted && styles.iPublishedSecondaryBtnDone,
                pressed && styles.createPostPrimaryBtnPressed,
              ]}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="9.5" stroke={isCompleted ? '#582CDB' : '#1A1626'} strokeWidth="2.2" />
                <Path d="M8 12L11 15L16 9" stroke={isCompleted ? '#582CDB' : '#1A1626'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={[styles.iPublishedSecondaryBtnText, isCompleted && styles.iPublishedSecondaryBtnTextDone]}>
                {isCompleted ? 'Streak Locked in! (Day 48)' : 'I Published This'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* 4. EXACT FIGMA BOTTOM NAVIGATION BAR */}
        <View style={styles.bottomTabBar}>
          {/* Tab 1: HOME */}
          <Pressable
            onPress={() => handleTabPress('home')}
            style={styles.tabItem}
            hitSlop={8}
          >
            <View style={styles.tabIconWrapper}>
              <HomeNavIcon color={getTabColor('home')} />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
              HOME
            </Text>
          </Pressable>

          {/* Tab 2: CREATE */}
          <Pressable
            onPress={() => handleTabPress('create')}
            style={styles.tabItem}
            hitSlop={8}
          >
            <View style={styles.tabIconWrapper}>
              <CreateNavIcon color={getTabColor('create')} />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'create' && styles.tabLabelActive]}>
              CREATE
            </Text>
          </Pressable>

          {/* Tab 3: MATCH */}
          <Pressable
            onPress={() => handleTabPress('match')}
            style={styles.tabItem}
            hitSlop={8}
          >
            <View style={styles.tabIconWrapper}>
              <MatchNavIcon color={getTabColor('match')} />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'match' && styles.tabLabelActive]}>
              MATCH
            </Text>
          </Pressable>

          {/* Tab 4: QUESTS (Active in Mission Detail) */}
          <Pressable
            onPress={() => handleTabPress('quests')}
            style={styles.tabItem}
            hitSlop={8}
          >
            <View style={styles.tabIconWrapper}>
              <QuestsNavIcon color={getTabColor('quests')} />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'quests' && styles.tabLabelActive]}>
              QUESTS
            </Text>
          </Pressable>

          {/* Tab 5: GROWTH */}
          <Pressable
            onPress={() => handleTabPress('growth')}
            style={styles.tabItem}
            hitSlop={8}
          >
            <View style={styles.tabIconWrapper}>
              <GrowthNavIcon color={getTabColor('growth')} />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'growth' && styles.tabLabelActive]}>
              GROWTH
            </Text>
          </Pressable>
        </View>

        {/* 5. CELEBRATION MODAL */}
        <Modal
          visible={showCelebrationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCelebrationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.celebrationCard,
                { transform: [{ scale: celebrationScale }] },
              ]}
            >
              <Text style={styles.celebrationTrophy}>🔥</Text>
              <Text style={styles.celebrationTitle}>Streak Protected!</Text>
              <Text style={styles.celebrationBody}>
                You earned <Text style={styles.boldPurple}>+80 XP</Text> and locked in Day 48 of your creator streak!
              </Text>

              <Pressable
                onPress={() => {
                  setShowCelebrationModal(false);
                  onBackToDashboard();
                }}
                style={({ pressed }) => [styles.celebrationDoneBtn, pressed && styles.createPostPrimaryBtnPressed]}
              >
                <Text style={styles.celebrationDoneBtnText}>Back to Dashboard  🚀</Text>
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
    backgroundColor: '#FAF8F5',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
  },
  headerLogoWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGhostLogo: {
    width: 38,
    height: 38,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE6F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#1A1626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  headerIconBtnPressed: {
    opacity: 0.6,
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  profilePhotoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDE8FC',
    borderWidth: 1.5,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerAvatarThumb: {
    width: 34,
    height: 34,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 32,
  },
  toastBanner: {
    backgroundColor: '#EDE8FC',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  toastBannerText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
    textAlign: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  todayMissionTag: {
    backgroundColor: '#6C47FF',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  todayMissionTagText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  freeMissionTag: {
    backgroundColor: '#E2DDF4',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  freeMissionTagText: {
    color: '#4B435E',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  missionHeadline: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A1626',
    letterSpacing: -0.6,
    lineHeight: 32,
    marginBottom: 6,
  },
  missionSubtext: {
    fontSize: 14,
    color: '#6B627E',
    lineHeight: 20,
    marginBottom: 18,
  },
  boldDark: {
    fontWeight: '800',
    color: '#1A1626',
  },
  missionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#ECE6F6',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeaderFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1A1626',
  },
  progressCountText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#582CDB',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F3EEFB',
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  metricPillBox: {
    flex: 1,
    backgroundColor: '#FAF8FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE8FC',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricBigValueGold: {
    fontSize: 17,
    fontWeight: '900',
    color: '#B45309',
    marginBottom: 2,
  },
  metricFireEmoji: {
    fontSize: 17,
    marginBottom: 2,
  },
  metricBigValueAmber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#B45309',
    marginBottom: 2,
  },
  metricSubLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#8A829C',
    letterSpacing: 0.6,
  },
  alertNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
  },
  alertNoticeExclamation: {
    fontSize: 13,
    fontWeight: '900',
    color: '#EF4444',
  },
  alertNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
    flex: 1,
  },
  sectionHeaderCaps: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#8A829C',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  stepItemRowLast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FAF8FF',
    borderWidth: 1.5,
    borderColor: '#EDE8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberCircleActive: {
    borderColor: '#582CDB',
    backgroundColor: '#EDE8FC',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#736B88',
  },
  stepNumberTextActive: {
    fontSize: 13,
    fontWeight: '900',
    color: '#582CDB',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1A1626',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 12.5,
    color: '#736B88',
    lineHeight: 17,
  },
  suggestedIdeaCard: {
    backgroundColor: '#582CDB',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  suggestedIdeaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestedIdeaLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    opacity: 0.9,
  },
  suggestedMediaIconsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestedIdeaQuote: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    lineHeight: 27,
    marginBottom: 18,
  },
  suggestedIdeaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bestTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bestTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  useIdeaButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  useIdeaButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  useIdeaButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#582CDB',
  },
  improvementChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  grayPill: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  grayPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
  },
  purplePill: {
    backgroundColor: '#EDE8FC',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  purplePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  amberPill: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  amberPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  rewardCard: {
    backgroundColor: '#F1EFEA',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E6E2D8',
  },
  rewardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  medalIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalEmoji: {
    fontSize: 20,
  },
  rewardTitleGroup: {
    flex: 1,
  },
  rewardMainTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A1626',
  },
  rewardSubtitle: {
    fontSize: 12,
    color: '#736B88',
  },
  momentumBadgeBar: {
    backgroundColor: '#E4DFD3',
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8D1C3',
  },
  momentumBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#6B5F48',
    letterSpacing: 0.8,
  },
  jarvisHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  jarvisInsightFlameIcon: {
    width: 28,
    height: 28,
  },
  jarvisTitleGroup: {
    flex: 1,
  },
  jarvisInsightTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1A1626',
  },
  jarvisInsightTime: {
    fontSize: 11,
    color: '#8A829C',
  },
  jarvisInsightQuote: {
    fontSize: 13,
    color: '#4B435E',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 12,
  },
  generateIdeaLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  generateIdeaSparkle: {
    fontSize: 13,
  },
  generateIdeaText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.6,
  },
  actionButtonsContainer: {
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  createPostPrimaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#582CDB',
    height: 52,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createPostPrimaryBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  createPostPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  iPublishedSecondaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#582CDB',
    gap: 8,
  },
  iPublishedSecondaryBtnDone: {
    backgroundColor: '#EDE8FC',
  },
  iPublishedSecondaryBtnText: {
    color: '#1A1626',
    fontSize: 16,
    fontWeight: '900',
  },
  iPublishedSecondaryBtnTextDone: {
    color: '#582CDB',
  },
  bottomTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 14 : 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#ECE6F6',
    backgroundColor: '#FAF8F5',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabIconWrapper: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1A1626',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#582CDB',
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 22, 38, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  celebrationCard: {
    width: '100%',
    maxWidth: 330,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 12,
    borderWidth: 1.5,
    borderColor: '#ECE6F6',
  },
  celebrationTrophy: {
    fontSize: 44,
    marginBottom: 10,
  },
  celebrationTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1626',
    marginBottom: 8,
  },
  celebrationBody: {
    fontSize: 14,
    color: '#4B435E',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  boldPurple: {
    fontWeight: '900',
    color: '#582CDB',
  },
  celebrationDoneBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
