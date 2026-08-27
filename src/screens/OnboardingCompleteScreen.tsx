import React, { useRef, useEffect } from 'react';
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
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

interface OnboardingCompleteScreenProps {
  onBack: () => void;
  onStartMission: () => void;
  onGoToDashboard: () => void;
  selectedNiches?: string[];
  connectedPlatforms?: string[];
}

export const OnboardingCompleteScreen: React.FC<OnboardingCompleteScreenProps> = ({
  onBack,
  onStartMission,
  onGoToDashboard,
  selectedNiches = ['lifestyle', 'comedy'],
  connectedPlatforms = ['tiktok', 'instagram', 'youtube'],
}) => {
  // 1. Hero Mascot Living Buoyancy Float Animations
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const ghostStretchY = useRef(new Animated.Value(1)).current;
  const ghostSquishX = useRef(new Animated.Value(1)).current;
  const ghostTilt = useRef(new Animated.Value(0)).current;

  // 2. Pulse for Sync Active Dot
  const syncDotPulse = useRef(new Animated.Value(0.6)).current;

  // 3. Jarvis Flame Crystal Star-Glow (Zero Circles)
  const jarvisStarFloatY = useRef(new Animated.Value(0)).current;
  const jarvisStarScale = useRef(new Animated.Value(1)).current;

  // 4. Perk Pulse
  const perkGlow = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // A. Mascot Living Buoyancy Float Loop
    const ghostLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ghostFloatY, {
            toValue: -7,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(ghostStretchY, {
            toValue: 1.05,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(ghostSquishX, {
            toValue: 0.96,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(ghostTilt, {
            toValue: 1,
            duration: 1300,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ghostFloatY, {
            toValue: 5,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(ghostStretchY, {
            toValue: 0.95,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(ghostSquishX, {
            toValue: 1.04,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(ghostTilt, {
            toValue: -1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // B. Sync Active Green Dot Pulse
    const syncLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(syncDotPulse, {
          toValue: 1.0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(syncDotPulse, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    // C. Jarvis Flame Crystal Star-Glow
    const jarvisStarLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(jarvisStarFloatY, {
            toValue: -6,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(jarvisStarScale, {
            toValue: 1.08,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(jarvisStarFloatY, {
            toValue: 4,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(jarvisStarScale, {
            toValue: 0.96,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // D. Perk Pulse Loop
    const perkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(perkGlow, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(perkGlow, {
          toValue: 1.0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    ghostLoop.start();
    syncLoop.start();
    jarvisStarLoop.start();
    perkLoop.start();

    return () => {
      ghostLoop.stop();
      syncLoop.stop();
      jarvisStarLoop.stop();
      perkLoop.stop();
    };
  }, [ghostFloatY, ghostStretchY, ghostSquishX, ghostTilt, syncDotPulse, jarvisStarFloatY, jarvisStarScale, perkGlow]);

  const handleStartMissionPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onStartMission();
  };

  const handleGoToDashboardPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onGoToDashboard();
  };

  const ghostRotation = ghostTilt.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-4deg', '0deg', '4deg'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* 1. TOP BAR: Back Arrow + 4-Step Progress Indicator (100% Active) */}
          <View style={styles.topBar}>
            <Pressable
              onPress={onBack}
              hitSlop={14}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 12H5M5 12L12 19M5 12L12 5"
                  stroke="#1A1626"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

            {/* 4 Active Purple Progress Pills */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={[styles.progressSegment, styles.progressActive]} />
            </View>

            <View style={styles.topBarRightPlaceholder} />
          </View>

          {/* 2. HERO CELEBRATION SECTION */}
          <View style={styles.heroSection}>
            {/* Mascot Avatar with Sync Active Badge */}
            <View style={styles.mascotAvatarContainer}>
              <View style={styles.mascotCircleFrame}>
                <Animated.View
                  style={{
                    transform: [
                      { translateY: ghostFloatY },
                      { scaleY: ghostStretchY },
                      { scaleX: ghostSquishX },
                      { rotate: ghostRotation },
                    ],
                  }}
                >
                  <Image
                    source={require('../../assets/images/jarvis-ghost-clean.png')}
                    style={styles.ghostImage}
                    resizeMode="contain"
                  />
                </Animated.View>
              </View>

              {/* Sync Active Badge */}
              <View style={styles.syncActiveBadge}>
                <Animated.View
                  style={[styles.syncGreenDot, { opacity: syncDotPulse }]}
                />
                <Text style={styles.syncActiveText}>Sync Active</Text>
              </View>
            </View>

            {/* Main Headline */}
            <Text style={styles.mainTitle}>
              You&apos;re In.{' '}
              <Text style={styles.mainTitlePurple}>Let&apos;s build.</Text>
            </Text>
            <Text style={styles.subHeadline}>Create • Grow • Earn</Text>
            <Text style={styles.subDescription}>
              Your PostStreak account is ready. Your first streak mission is waiting.
            </Text>
          </View>

          {/* 3. SLEEK LEVEL 1 CREATOR SUMMARY CARD */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardHeader}>
              <View style={styles.levelBadgeRow}>
                <View style={styles.levelPill}>
                  <Text style={styles.levelPillText} numberOfLines={1}>Level 1</Text>
                </View>
                <Text
                  style={styles.levelNameText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  Starter Creator
                </Text>
              </View>
              <View style={styles.streakBadge}>
                <Text style={styles.streakBadgeText} numberOfLines={1}>🔥 Day 1 Ready</Text>
              </View>
            </View>

            {/* Configured Tag Chips */}
            <View style={styles.chipsRow}>
              {selectedNiches.slice(0, 3).map((niche, idx) => (
                <View key={`niche_${idx}`} style={styles.chipPill}>
                  <Text style={styles.chipText}>
                    {niche.charAt(0).toUpperCase() + niche.slice(1).replace('_', ' ')}
                  </Text>
                </View>
              ))}

              {connectedPlatforms.slice(0, 3).map((plat, idx) => (
                <View key={`plat_${idx}`} style={[styles.chipPill, styles.chipPlatformPill]}>
                  <Text style={[styles.chipText, styles.chipPlatformText]}>
                    {plat.charAt(0).toUpperCase() + plat.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 4. COMPACT 3-UNLOCKED MILESTONE TILES */}
          <View style={styles.milestonesGrid}>
            {/* Tile 1: Daily Mission */}
            <View style={styles.milestoneTile}>
              <View style={styles.milestoneIconCircle}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 22C16.4183 22 20 18.4183 20 14C20 8 12 2 12 2C12 2 4 8 4 14C4 18.4183 7.58172 22 12 22Z"
                    stroke="#582CDB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M12 18C13.6569 18 15 16.6569 15 15C15 13 12 10 12 10C12 10 9 13 9 15C9 16.6569 10.3431 18 12 18Z"
                    fill="#582CDB"
                  />
                </Svg>
              </View>
              <Text style={styles.tileTitle}>Daily Mission</Text>
              <Text style={styles.tileSubtitle}>Personalised prompt</Text>
            </View>

            {/* Tile 2: Collabs */}
            <View style={styles.milestoneTile}>
              <View style={styles.milestoneIconCircle}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M17 21V19C17 17.9 16.5 16.9 15.7 16.2C14.9 15.5 13.9 15 12.8 15H5.2C4.1 15 3.1 15.5 2.3 16.2C1.5 16.9 1 17.9 1 19V21"
                    stroke="#582CDB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle cx="9" cy="7" r="4" stroke="#582CDB" strokeWidth="2" />
                </Svg>
              </View>
              <Text style={styles.tileTitle}>Collabs</Text>
              <Text style={styles.tileSubtitle}>Curated creators</Text>
            </View>

            {/* Tile 3: Starter Quests */}
            <View style={styles.milestoneTile}>
              <View style={styles.milestoneIconCircle}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
                    stroke="#582CDB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={styles.tileTitle}>Quests</Text>
              <Text style={styles.tileSubtitle}>Brand challenges</Text>
            </View>
          </View>

          {/* 5. SLIM JARVIS CORE GUIDANCE BANNER */}
          <View style={styles.jarvisBanner}>
            <Animated.View
              style={[
                styles.jarvisFlameWrapper,
                {
                  transform: [
                    { translateY: jarvisStarFloatY },
                    { scale: jarvisStarScale },
                  ],
                },
              ]}
            >
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={styles.jarvisFlameImage}
                resizeMode="contain"
              />
            </Animated.View>

            <View style={styles.jarvisTextContainer}>
              <Text style={styles.jarvisTagText}>JARVIS CORE</Text>
              <Text style={styles.jarvisAdviceText}>
                &ldquo;I&apos;ll guide your daily missions, growth plan and streak targets.&rdquo;
              </Text>
            </View>
          </View>

          {/* 6. BEAUTIFUL 7-DAY STREAK LAUNCHPAD & REWARDS CARD (Fills remaining space gracefully) */}
          <View style={styles.launchpadCard}>
            <View style={styles.launchpadHeader}>
              <View style={styles.launchpadTitleRow}>
                <Text
                  style={styles.launchpadBadgeText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  ⚡ 7-DAY STREAK LAUNCHPAD
                </Text>
              </View>
              <Animated.View
                style={[
                  styles.bonusXpPill,
                  { transform: [{ scale: perkGlow }] },
                ]}
              >
                <Text style={styles.bonusXpText} numberOfLines={1}>+100 XP Bonus</Text>
              </Animated.View>
            </View>

            {/* 3-Step Milestone Roadmap Line */}
            <View style={styles.roadmapRow}>
              {/* Step 1 */}
              <View style={styles.roadmapStep}>
                <View style={[styles.roadmapDot, styles.roadmapDotActive]}>
                  <Text style={styles.roadmapDotText}>🔥</Text>
                </View>
                <Text style={styles.roadmapStepDay}>Day 1</Text>
                <Text style={styles.roadmapStepLabel}>Mission 1</Text>
              </View>

              <View style={styles.roadmapLineActive} />

              {/* Step 2 */}
              <View style={styles.roadmapStep}>
                <View style={styles.roadmapDot}>
                  <Text style={styles.roadmapDotText}>👥</Text>
                </View>
                <Text style={styles.roadmapStepDay}>Day 3</Text>
                <Text style={styles.roadmapStepLabel}>AI Collabs</Text>
              </View>

              <View style={styles.roadmapLine} />

              {/* Step 3 */}
              <View style={styles.roadmapStep}>
                <View style={styles.roadmapDot}>
                  <Text style={styles.roadmapDotText}>💎</Text>
                </View>
                <Text style={styles.roadmapStepDay}>Day 7</Text>
                <Text style={styles.roadmapStepLabel}>Monetize</Text>
              </View>
            </View>

            {/* Creator Insight Tip */}
            <View style={styles.insightBox}>
              <Text style={styles.insightEmoji}>💡</Text>
              <Text style={styles.insightText}>
                Posting your first prompt today gives you a <Text style={styles.insightBold}>2x streak boost</Text> for week one!
              </Text>
            </View>
          </View>

          {/* 7. ACTION BUTTONS */}
          <View style={styles.actionsSection}>
            <Pressable
              onPress={handleStartMissionPress}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>🚀 Start First Mission</Text>
            </Pressable>

            <Pressable
              onPress={handleGoToDashboardPress}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Go To Dashboard</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* 8. FIXED BOTTOM STATUS BAR */}
        <View style={styles.bottomStatusBar}>
          <View style={styles.statusLeftGroup}>
            <View style={styles.statusIconBadge}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M16 21V19C16 16.7909 14.2091 15 12 15H5C2.79086 15 1 16.7909 1 19V21"
                  stroke="#582CDB"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx="8.5" cy="7" r="4" stroke="#582CDB" strokeWidth="2.2" />
                <Path
                  d="M20 8V14M17 11H23"
                  stroke="#582CDB"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
            <Text style={styles.statusLabelText}>Completion</Text>
          </View>

          <Text style={styles.statusPercentageText}>100% Complete</Text>
        </View>
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
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 135,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    height: 40,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonPressed: {
    opacity: 0.5,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressSegment: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(234, 229, 248, 0.8)',
  },
  progressActive: {
    width: 48,
    backgroundColor: '#582CDB',
  },
  topBarRightPlaceholder: {
    width: 36,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mascotAvatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mascotCircleFrame: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: 'rgba(243, 238, 251, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(226, 220, 242, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostImage: {
    width: 56,
    height: 56,
  },
  syncActiveBadge: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(226, 220, 242, 0.9)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    gap: 5,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  syncGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  syncActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171420',
  },
  mainTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.7,
    textAlign: 'center',
    marginBottom: 3,
  },
  mainTitlePurple: {
    color: '#582CDB',
  },
  subHeadline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  subDescription: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#7F7894',
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 290,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  levelBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  levelPill: {
    backgroundColor: '#582CDB',
    borderRadius: 6,
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    flexShrink: 0,
  },
  levelPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  levelNameText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    flexShrink: 1,
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 247, 237, 0.9)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 237, 213, 0.9)',
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    flexShrink: 0,
  },
  streakBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#C2410C',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipPill: {
    backgroundColor: 'rgba(243, 238, 251, 0.8)',
    borderRadius: 8,
    paddingVertical: 3.5,
    paddingHorizontal: 9,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  chipPlatformPill: {
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
  },
  chipPlatformText: {
    color: '#3B1F96',
  },
  milestonesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  milestoneTile: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  milestoneIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(237, 232, 252, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  tileTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
    textAlign: 'center',
  },
  tileSubtitle: {
    fontSize: 10,
    fontWeight: '400',
    color: '#7F7894',
    textAlign: 'center',
  },
  jarvisBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 244, 253, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 10,
  },
  jarvisFlameWrapper: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisFlameImage: {
    width: 32,
    height: 32,
  },
  jarvisTextContainer: {
    flex: 1,
  },
  jarvisTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  jarvisAdviceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#524C62',
    lineHeight: 16,
  },
  launchpadCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  launchpadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  launchpadTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  launchpadBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  bonusXpPill: {
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    flexShrink: 0,
  },
  bonusXpText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
  },
  roadmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  roadmapStep: {
    alignItems: 'center',
  },
  roadmapDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(243, 238, 251, 0.8)',
    borderWidth: 1.2,
    borderColor: 'rgba(226, 220, 242, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  roadmapDotActive: {
    backgroundColor: 'rgba(237, 232, 252, 0.95)',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  roadmapDotText: {
    fontSize: 15,
  },
  roadmapStepDay: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7F7894',
  },
  roadmapStepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171420',
  },
  roadmapLineActive: {
    flex: 1,
    height: 2,
    backgroundColor: '#582CDB',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  roadmapLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(234, 229, 248, 0.8)',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.85)',
    gap: 8,
  },
  insightEmoji: {
    fontSize: 14,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    color: '#524C62',
    lineHeight: 16,
  },
  insightBold: {
    fontWeight: '700',
    color: '#582CDB',
  },
  actionsSection: {
    gap: 9,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#582CDB',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(226, 220, 242, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonPressed: {
    backgroundColor: 'rgba(250, 248, 255, 0.9)',
    transform: [{ scale: 0.98 }],
  },
  secondaryButtonText: {
    color: '#171420',
    fontSize: 14.5,
    fontWeight: '700',
  },
  bottomStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(235, 230, 248, 0.9)',
    backgroundColor: '#FAF8F5',
  },
  statusLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  statusPercentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#582CDB',
  },
});
