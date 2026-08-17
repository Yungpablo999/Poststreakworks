import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Pressable,
  Animated,
  Modal,
  TextInput,
  Image,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { LiquidGlassBackground } from '../components/LiquidGlassBackground';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MatchScreenProps {
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenMessages?: () => void;
}

export const MatchScreen: React.FC<MatchScreenProps> = ({
  onLogout,
  onNavigateTab,
  onOpenMessages,
}) => {
  const activeTab: TabType = 'match';

  // State
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showCollabPlanModal, setShowCollabPlanModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Form Inputs
  const [collabNote, setCollabNote] = useState(
    "Hey Amara! Loved your Lagos travel stories. I’m thinking we do a '24 Hours Creating in Lagos' split-screen Reel this weekend. Let's build together!"
  );

  // Animations
  const ghostFloatY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(1)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const vennPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Floating ghost animation
    const ghostLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ghostFloatY, {
            toValue: -5,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(ghostScale, {
            toValue: 1.04,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ghostFloatY, {
            toValue: 4,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(ghostScale, {
            toValue: 0.97,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Venn diagram subtle pulse
    const vennLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(vennPulse, {
          toValue: 1.05,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(vennPulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    ghostLoop.start();
    vennLoop.start();

    return () => {
      ghostLoop.stop();
      vennLoop.stop();
    };
  }, [ghostFloatY, ghostScale, vennPulse]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMessage(null));
  };

  const handleTabPress = (tab: TabType) => {
    if (tab !== 'match' && onNavigateTab) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onNavigateTab(tab);
    }
  };

  const handleToggleBookmark = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const next = !isBookmarked;
    setIsBookmarked(next);
    showToast(next ? '🔖 Saved Amara to Collab Wishlist' : 'Removed from Wishlist');
  };

  const handleSendConnect = () => {
    setShowConnectModal(false);
    setIsConnected(true);
    setShowCompletionModal(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      <View style={styles.container}>
        {/* 1. TOP AIRY APP BAR */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeftGroup}>
            <Animated.View
              style={[
                styles.headerLogoWrapper,
                { transform: [{ translateY: ghostFloatY }, { scale: ghostScale }] },
              ]}
            >
              <Image
                source={require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerGhostLogo}
                resizeMode="contain"
              />
            </Animated.View>
            <View>
              <Text style={styles.headerTitle}>Collab Studio</Text>
              <Text style={styles.headerSubTitle}>AI Match Engine</Text>
            </View>
          </View>

          <View style={styles.headerRightGroup}>
            {/* Message / Chat Bubble */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => {
                if (onOpenMessages) onOpenMessages();
                else showToast('💬 Messages');
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

            {/* Notification Bell */}
            <Pressable
              style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}
              hitSlop={8}
              onPress={() => setShowNotificationModal(true)}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="#171420"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="#171420"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View style={styles.unreadBadgeDot} />
            </Pressable>

            {/* User Profile Person Icon */}
            <Pressable
              style={({ pressed }) => [styles.headerProfileBtn, pressed && styles.btnPressed]}
              hitSlop={6}
              onPress={() => setShowProfileModal(true)}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 21V19C20 17.9 19.5 16.9 18.7 16.2C17.9 15.5 16.9 15 15.8 15H8.2C7.1 15 6.1 15.5 5.3 16.2C4.5 16.9 4 17.9 4 19V21"
                  stroke="#582CDB"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx="12" cy="7" r="4" stroke="#582CDB" strokeWidth="2.2" />
              </Svg>
            </Pressable>
          </View>
        </View>

        {/* 2. MAIN SCROLLABLE CONTENT WITH SPACIOUS PADDING */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION A: HERO CREATOR CARD WITH HIGH-RES PORTRAIT */}
          <View style={styles.heroCardContainer}>
            <View style={styles.heroImageWrapper}>
              <Image
                source={require('../../assets/images/amara-portrait.jpg')}
                style={styles.heroCoverImage}
                resizeMode="cover"
              />
              {/* Subtle top/bottom glass overlay */}
              <LinearGradient
                colors={['rgba(0,0,0,0.15)', 'transparent', 'rgba(0,0,0,0.45)']}
                style={StyleSheet.absoluteFill}
              />

              {/* Floating Top Pill */}
              <View style={styles.availabilityPill}>
                <View style={styles.greenLiveDot} />
                <Text style={styles.availabilityText}>Available This Week</Text>
              </View>
            </View>

            {/* Bottom Glass Panel on Card */}
            <View style={styles.heroInfoPanel}>
              <View style={styles.heroStatsRow}>
                <View>
                  <Text style={styles.heroStatValue}>85K</Text>
                  <Text style={styles.heroStatLabel}>Followers</Text>
                </View>
                <View style={styles.statDivider} />
                <View>
                  <Text style={[styles.heroStatValue, { color: '#582CDB' }]}>High (96%)</Text>
                  <Text style={styles.heroStatLabel}>Compatibility</Text>
                </View>
              </View>
            </View>
          </View>

          {/* SECTION B: NICHE CHIPS */}
          <View style={styles.nicheChipsRow}>
            {['Lifestyle', 'Travel', 'Storytelling', 'Short-form Video'].map((tag, idx) => (
              <View key={idx} style={styles.nicheChip}>
                <Text style={styles.nicheChipText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* SECTION C: WHY THIS MATCH FITS (AI ANALYSIS) */}
          <LiquidGlassBackground
            borderRadius={24}
            light={0.92}
            refraction={24}
            tint="light"
            accentColor="#582CDB"
            style={styles.sectionGlassCard}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sparkleIcon}>✦</Text>
              <Text style={styles.cardSectionTitle}>Why This Match Fits</Text>
            </View>
            <Text style={styles.cardBodyText}>
              Amara's audience overlaps significantly with your lifestyle and creator journey
              content. This match could support a high-converting short-form collaboration.
            </Text>

            <View style={styles.pillListRow}>
              <View style={styles.purplePill}>
                <Text style={styles.purplePillText}>Audience Overlap</Text>
              </View>
              <View style={styles.purplePill}>
                <Text style={styles.purplePillText}>Similar Content Style</Text>
              </View>
              <View style={styles.purplePill}>
                <Text style={styles.purplePillText}>Strong Posting Rhythm</Text>
              </View>
            </View>
          </LiquidGlassBackground>

          {/* SECTION D: COLLAB IDEA STUDIO */}
          <LiquidGlassBackground
            borderRadius={24}
            light={0.92}
            refraction={26}
            tint="light"
            accentColor="#582CDB"
            goldAccentColor="#F59E0B"
            style={styles.sectionGlassCard}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.ideaBulbIcon}>💡</Text>
              <Text style={styles.cardSectionTitle}>Collab Idea</Text>
            </View>

            <Text style={styles.collabIdeaTitle}>“24 Hours Creating in Lagos”</Text>

            <View style={styles.collabDetailsList}>
              <View style={styles.collabDetailItem}>
                <Text style={styles.collabDetailKey}>Hook</Text>
                <Text style={styles.collabDetailVal}>Two creators, one city, zero sleep.</Text>
              </View>
              <View style={styles.collabDetailItem}>
                <Text style={styles.collabDetailKey}>BTS</Text>
                <Text style={styles.collabDetailVal}>Phone and natural lighting.</Text>
              </View>
              <View style={styles.collabDetailItem}>
                <Text style={styles.collabDetailKey}>Lesson</Text>
                <Text style={styles.collabDetailVal}>How we both built our streaks today.</Text>
              </View>
            </View>

            <View style={styles.collabMetaRow}>
              <View style={styles.collabMetaTag}>
                <Text style={styles.collabMetaText}>Reel</Text>
              </View>
              <View style={styles.collabMetaTag}>
                <Text style={styles.collabMetaText}>30–45 Sec</Text>
              </View>
              <View style={styles.collabMetaTag}>
                <Text style={styles.collabMetaText}>Sat 2 PM</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.buildPlanBtn, pressed && styles.btnPressed]}
              onPress={() => setShowCollabPlanModal(true)}
            >
              <LinearGradient
                colors={['#7048EC', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buildPlanGradient}
              >
                <Text style={styles.buildPlanBtnText}>Build Collab Plan</Text>
              </LinearGradient>
            </Pressable>
          </LiquidGlassBackground>

          {/* SECTION E: 2-COLUMN KEY STATS */}
          <View style={styles.statsGridRow}>
            {/* AUDIENCE STAT */}
            <View style={styles.statBoxCard}>
              <View style={styles.statBoxHeader}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                    stroke="#582CDB"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle cx="9" cy="7" r="4" stroke="#582CDB" strokeWidth="2.2" />
                </Svg>
                <Text style={styles.statBoxKey}>AUDIENCE</Text>
              </View>
              <Text style={styles.statBoxNumber}>85,000+</Text>
            </View>

            {/* STREAK STAT */}
            <View style={styles.statBoxCard}>
              <View style={styles.statBoxHeader}>
                <Text style={{ fontSize: 16 }}>🔥</Text>
                <Text style={styles.statBoxKey}>STREAK</Text>
              </View>
              <Text style={[styles.statBoxNumber, { color: '#F59E0B' }]}>44 Days</Text>
            </View>
          </View>

          {/* SECTION F: AUDIENCE CORRELATION (VENN DIAGRAM) */}
          <LiquidGlassBackground
            borderRadius={24}
            light={0.92}
            refraction={22}
            tint="light"
            accentColor="#582CDB"
            goldAccentColor="#F59E0B"
            style={styles.sectionGlassCard}
          >
            <Text style={styles.vennSectionTitle}>AUDIENCE CORRELATION</Text>

            {/* Venn Graphic */}
            <View style={styles.vennGraphicContainer}>
              <Animated.View style={[styles.vennCirclesWrapper, { transform: [{ scale: vennPulse }] }]}>
                {/* Left Circle: You */}
                <View style={styles.vennCircleLeft}>
                  <Text style={styles.vennCircleLabel}>YOU</Text>
                </View>

                {/* Right Circle: Amara */}
                <View style={styles.vennCircleRight}>
                  <Text style={styles.vennCircleLabelRight}>AMARA</Text>
                </View>

                {/* Overlap Pill */}
                <View style={styles.vennOverlapCapsule}>
                  <Text style={styles.vennOverlapText}>76%</Text>
                </View>
              </Animated.View>
            </View>

            {/* Affinity Breakdown Row */}
            <View style={styles.affinityRow}>
              <View style={styles.affinityCard}>
                <Text style={styles.affinityLabel}>LIFESTYLE</Text>
                <Text style={styles.affinityValueGreen}>High (88%)</Text>
              </View>
              <View style={styles.affinityCard}>
                <Text style={styles.affinityLabel}>TRAVEL</Text>
                <Text style={styles.affinityValuePurple}>Medium (74%)</Text>
              </View>
            </View>
          </LiquidGlassBackground>

          {/* SECTION G: JARVIS AI INSIGHT */}
          <View style={styles.jarvisInsightCard}>
            <Image
              source={require('../../assets/images/jarvis-ghost-clean.png')}
              style={styles.jarvisGhostIcon}
              resizeMode="contain"
            />
            <Text style={styles.jarvisInsightTag}>JARVIS INSIGHT</Text>
            <Text style={styles.jarvisInsightBody}>
              Amara's content style matches your creator journey niche. A simple day-in-the-life
              collab could generate 3x normal reach for both audiences.
            </Text>
          </View>

          {/* SECTION H: READINESS CHECKLIST */}
          <LiquidGlassBackground
            borderRadius={24}
            light={0.92}
            refraction={22}
            tint="light"
            accentColor="#10B981"
            style={styles.sectionGlassCard}
          >
            <View style={styles.readinessHeaderRow}>
              <Text style={styles.cardSectionTitle}>Readiness</Text>
              <View style={styles.readyGreenBadge}>
                <Text style={styles.readyGreenBadgeText}>✓ Ready</Text>
              </View>
            </View>

            <View style={styles.readinessList}>
              <View style={styles.readinessItem}>
                <Text style={styles.readinessIcon}>👤</Text>
                <Text style={styles.readinessText}>Profile verified & complete</Text>
              </View>
              <View style={styles.readinessItem}>
                <Text style={styles.readinessIcon}>⚡</Text>
                <Text style={styles.readinessText}>Active high-performance streak (44d)</Text>
              </View>
              <View style={styles.readinessItem}>
                <Text style={styles.readinessIcon}>💬</Text>
                <Text style={styles.readinessText}>High response likelihood (&lt; 2 hours)</Text>
              </View>
            </View>
          </LiquidGlassBackground>

          {/* SECTION I: STICKY BOTTOM ACTION ROW */}
          <View style={styles.bottomActionRow}>
            <Pressable
              style={({ pressed }) => [styles.connectMainBtn, pressed && styles.btnPressed]}
              onPress={() => setShowConnectModal(true)}
            >
              <LinearGradient
                colors={isConnected ? ['#10B981', '#059669'] : ['#7048EC', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.connectMainGradient}
              >
                <Text style={styles.connectMainBtnText}>
                  {isConnected ? '✓ Connection Sent' : 'Connect'}
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.bookmarkBtn,
                isBookmarked && styles.bookmarkBtnActive,
                pressed && styles.btnPressed,
              ]}
              onPress={handleToggleBookmark}
              hitSlop={6}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill={isBookmarked ? '#582CDB' : 'none'}>
                <Path
                  d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                  stroke={isBookmarked ? '#582CDB' : '#171420'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
          </View>
        </ScrollView>

        {/* 3. FLOATING LIQUID GLASS BOTTOM NAVIGATION BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* TOAST CONFIRMATION */}
        {toastMessage && (
          <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}

        {/* MODAL 1: SEND COLLAB CONNECT REQUEST */}
        <Modal
          visible={showConnectModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConnectModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalPillBadge}>
                <Text style={styles.modalPillBadgeText}>AI MATCH • 96% COMPATIBILITY</Text>
              </View>

              <Text style={styles.modalTitle}>Connect with Amara</Text>
              <Text style={styles.modalSubtitle}>
                Send a personalized pitch note or use Jarvis AI's recommended collab hook.
              </Text>

              <Text style={styles.modalInputLabel}>COLLAB PITCH NOTE</Text>
              <TextInput
                style={styles.modalTextAreaInput}
                placeholder="Write your collaboration note..."
                placeholderTextColor="#A39CB5"
                value={collabNote}
                onChangeText={setCollabNote}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setShowConnectModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={handleSendConnect}
                >
                  <Text style={styles.modalPrimaryBtnText}>Send Request</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 2: BUILD COLLAB PLAN BLUEPRINT */}
        <Modal
          visible={showCollabPlanModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCollabPlanModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalPillBadge}>
                <Text style={styles.modalPillBadgeText}>COLLAB BLUEPRINT</Text>
              </View>

              <Text style={styles.modalTitle}>24 Hours Creating in Lagos</Text>
              <Text style={styles.modalSubtitle}>3-Step Co-Creation Production Plan</Text>

              <View style={styles.planStepBox}>
                <Text style={styles.planStepNumber}>STEP 1: HOOK (0-5s)</Text>
                <Text style={styles.planStepBody}>
                  Fast-cut split screen: You waking up in mainland, Amara on Victoria Island.
                </Text>
              </View>

              <View style={styles.planStepBox}>
                <Text style={styles.planStepNumber}>STEP 2: STORY (5-30s)</Text>
                <Text style={styles.planStepBody}>
                  Meeting up for afternoon content sprint & sharing streak tips.
                </Text>
              </View>

              <View style={styles.planStepBox}>
                <Text style={styles.planStepNumber}>STEP 3: CTA (30-45s)</Text>
                <Text style={styles.planStepBody}>
                  Challenge both creator audiences to lock in their Day 1 streak.
                </Text>
              </View>

              <Pressable
                style={[styles.modalPrimaryBtn, { width: '100%', marginTop: 12 }]}
                onPress={() => {
                  setShowCollabPlanModal(false);
                  showToast('✓ Collab blueprint exported to Studio Schedule!');
                }}
              >
                <Text style={styles.modalPrimaryBtnText}>Export to Schedule</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* MODAL 3: NOTIFICATIONS */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Match Notifications</Text>
              <Text style={styles.modalSubtitle}>Live Collab Engine Alerts</Text>

              <View style={styles.notifCard}>
                <Text style={styles.notifTitle}>✨ New Match: Amara Okafor</Text>
                <Text style={styles.notifBody}>
                  Amara's audience has an 76% overlap with your creator niche. Ready to co-create.
                </Text>
              </View>

              <Pressable
                style={[styles.modalPrimaryBtn, { width: '100%', marginTop: 10 }]}
                onPress={() => setShowNotificationModal(false)}
              >
                <Text style={styles.modalPrimaryBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* MODAL 4: PROFILE */}
        <Modal
          visible={showProfileModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowProfileModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 21V19C20 17.9 19.5 16.9 18.7 16.2C17.9 15.5 16.9 15 15.8 15H8.2C7.1 15 6.1 15.5 5.3 16.2C4.5 16.9 4 17.9 4 19V21"
                  stroke="#582CDB"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx="12" cy="7" r="4" stroke="#582CDB" strokeWidth="2.2" />
              </Svg>
              <Text style={[styles.modalTitle, { marginTop: 10 }]}>Creator Profile</Text>
              <Text style={styles.modalSubtitle}>47-Day Streak • Free Plan</Text>

              <Pressable
                style={[styles.modalPrimaryBtn, { width: '100%', marginTop: 14 }]}
                onPress={() => {
                  setShowProfileModal(false);
                  if (onLogout) onLogout();
                }}
              >
                <Text style={styles.modalPrimaryBtnText}>Log Out</Text>
              </Pressable>

              <Pressable
                style={[styles.modalCancelBtn, { width: '100%', marginTop: 8 }]}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* MODAL 5: ANIMATED COMPLETION MODAL */}
        <AnimatedCompletionModal
          visible={showCompletionModal}
          title="Collab Request Sent!"
          subtitle="Your pitch note has been delivered to Amara Okafor. Day 48 streak is safe!"
          badgeText="COLLAB PITCH SENT"
          xpEarned={50}
          streakCount={48}
          actionText="Awesome, Back to Matches"
          onDismiss={() => setShowCompletionModal(false)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },

  // 1. TOP AIRY APP BAR
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FAF9F6',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF8FF',
    borderWidth: 1,
    borderColor: '#EDE8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGhostLogo: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
  },
  headerSubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#582CDB',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE8FC',
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },

  // 2. MAIN SCROLLABLE CONTENT
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 130, // Clearance for FloatingTabBar
    gap: 16,
  },

  // SECTION A: HERO CREATOR CARD
  heroCardContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  heroImageWrapper: {
    width: '100%',
    height: 380,
    position: 'relative',
  },
  heroCoverImage: {
    width: '100%',
    height: '100%',
  },
  availabilityPill: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  greenLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
  },
  heroInfoPanel: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 2,
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F7894',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#EFEBF8',
  },

  // SECTION B: NICHE CHIPS
  nicheChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nicheChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8FC',
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  nicheChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#524C62',
  },

  // GLASS CARD COMMON
  sectionGlassCard: {
    padding: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sparkleIcon: {
    fontSize: 16,
    color: '#582CDB',
  },
  ideaBulbIcon: {
    fontSize: 16,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.2,
  },
  cardBodyText: {
    fontSize: 13,
    color: '#524C62',
    lineHeight: 19,
    marginBottom: 14,
  },
  pillListRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  purplePill: {
    backgroundColor: '#FAF8FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  purplePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },

  // SECTION D: COLLAB IDEA STUDIO
  collabIdeaTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 12,
  },
  collabDetailsList: {
    gap: 8,
    marginBottom: 14,
  },
  collabDetailItem: {
    flexDirection: 'row',
    gap: 8,
  },
  collabDetailKey: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
    width: 50,
  },
  collabDetailVal: {
    fontSize: 12.5,
    color: '#524C62',
    flex: 1,
    lineHeight: 18,
  },
  collabMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  collabMetaTag: {
    backgroundColor: '#F3F0FA',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  collabMetaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#524C62',
  },
  buildPlanBtn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buildPlanGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buildPlanBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  // SECTION E: 2-COLUMN STATS
  statsGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBoxCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  statBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statBoxKey: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.6,
  },
  statBoxNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#171420',
  },

  // SECTION F: VENN DIAGRAM
  vennSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 16,
  },
  vennGraphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  vennCirclesWrapper: {
    position: 'relative',
    width: 220,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vennCircleLeft: {
    position: 'absolute',
    left: 15,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(112, 72, 236, 0.25)',
    borderWidth: 2,
    borderColor: '#784DF0',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 20,
  },
  vennCircleRight: {
    position: 'absolute',
    right: 15,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 14,
  },
  vennCircleLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
  },
  vennCircleLabelRight: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  vennOverlapCapsule: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  vennOverlapText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#582CDB',
  },
  affinityRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  affinityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#EDE8FC',
    alignItems: 'center',
  },
  affinityLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  affinityValueGreen: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#10B981',
  },
  affinityValuePurple: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },

  // SECTION G: JARVIS INSIGHT
  jarvisInsightCard: {
    backgroundColor: 'rgba(237, 232, 252, 0.65)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.8)',
  },
  jarvisGhostIcon: {
    width: 44,
    height: 44,
    marginBottom: 8,
  },
  jarvisInsightTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  jarvisInsightBody: {
    fontSize: 12.5,
    color: '#524C62',
    textAlign: 'center',
    lineHeight: 18,
  },

  // SECTION H: READINESS
  readinessHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  readyGreenBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  readyGreenBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  readinessList: {
    gap: 10,
  },
  readinessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  readinessIcon: {
    fontSize: 14,
  },
  readinessText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#524C62',
  },

  // SECTION I: BOTTOM STICKY BAR
  bottomActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  connectMainBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  connectMainGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectMainBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  bookmarkBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EDE8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkBtnActive: {
    backgroundColor: '#EDE8FC',
    borderColor: '#DDD6FE',
  },

  // TOAST
  toastContainer: {
    position: 'absolute',
    top: 54,
    alignSelf: 'center',
    backgroundColor: '#171420',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    zIndex: 999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  modalPillBadge: {
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginBottom: 8,
  },
  modalPillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#7F7894',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#7F7894',
    alignSelf: 'flex-start',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  modalTextAreaInput: {
    width: '100%',
    height: 90,
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#171420',
    backgroundColor: '#FAF8FF',
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F0FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#524C62',
  },
  modalPrimaryBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planStepBox: {
    width: '100%',
    backgroundColor: '#FAF8FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDE8FC',
    marginBottom: 8,
  },
  planStepNumber: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
    marginBottom: 2,
  },
  planStepBody: {
    fontSize: 12,
    color: '#524C62',
    lineHeight: 16,
  },
  notifCard: {
    backgroundColor: '#FAF8FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDE8FC',
    marginBottom: 10,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  notifBody: {
    fontSize: 12,
    color: '#524C62',
    lineHeight: 16,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
