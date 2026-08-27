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
  Image,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { TinyGoldCheck } from '../components/CreatorStoryModal';
import { sFont, sPadding, moderateScale, isNarrowScreen } from '../utils/responsive';

interface JarvisProScreenProps {
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenMessages?: () => void;
  onBack?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'faq_1',
    question: 'What is Jarvis Pro?',
    answer:
      'Jarvis Pro is your autonomous AI creator strategist that analyzes your audience, drafts viral hooks, optimizes posting times, and pairs you with high-affinity collaboration partners.',
  },
  {
    id: 'faq_2',
    question: 'How does Jarvis help creators?',
    answer:
      'It eliminates guesswork by generating daily action briefs, protecting your streak with automated contingency drafts, and analyzing creator market trends.',
  },
  {
    id: 'faq_3',
    question: 'Can I cancel anytime?',
    answer:
      'Yes! You can cancel or pause your Jarvis Pro subscription at any time with 1 tap from your profile settings. No lock-ins or hidden fees.',
  },
  {
    id: 'faq_4',
    question: 'Is Voice Studio included?',
    answer:
      'Yes, all advanced AI voice cloning, caption transcription, and audio mastering tools are completely included in Pro with unlimited credits.',
  },
];

export const JarvisProScreen: React.FC<JarvisProScreenProps> = ({
  onLogout,
  onNavigateTab,
  onOpenMessages,
  onBack,

  userProfile,
  onSaveProfile,}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('growth');
  const [expandedBriefStep, setExpandedBriefStep] = useState<string | null>(null);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Modals & Celebrations
  const [showCheckoutSuccessModal, setShowCheckoutSuccessModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animations
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const flameFloatY = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Flame floating buoyancy loop
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -4,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 3,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();

    // Pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
    };
  }, [flameFloatY, pulseScale]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  };

  const handleToggleBriefStep = (stepId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedBriefStep((prev) => (prev === stepId ? null : stepId));
  };

  const handleToggleFaq = (faqId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedFaqId((prev) => (prev === faqId ? null : faqId));
  };

  const handleUnlockPro = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowCheckoutSuccessModal(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
        {/* 1. TOP HEADER APP BAR */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeftGroup}>
            {onBack && (
              <Pressable
                onPress={onBack}
                style={({ pressed }) => [{ marginRight: 4, padding: 4 }, pressed && styles.btnPressed]}
                hitSlop={10}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M15 18l-6-6 6-6" stroke="#171420" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </Pressable>
            )}
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

            {/* Pro Badge Pill */}
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

          <View style={styles.headerRightGroup}>
            {/* Message / Chat Bubble Button */}
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
                  showToast('💬 Jarvis Pro Assistant');
                }
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

            {/* Top-Right: User Profile Avatar */}
            <Pressable
              style={({ pressed }) => [styles.headerProfileBtn, pressed && styles.btnPressed]}
              hitSlop={6}
              onPress={() => setShowProfileModal(true)}
            >
              <Image
                source={userProfile?.avatarSource || require('../../assets/images/jarvis-ghost-clean.png')}
                style={styles.headerProfileImg}
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
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: HERO DARK PURPLE CARD (MEET JARVIS PRO) */}
          <View style={styles.heroCardContainer}>
            <LinearGradient
              colors={['#1F1147', '#120A2E', '#090517']}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.heroGradient}
            >
              {/* Golden PRO ACCESS Badge */}
              <View style={styles.proAccessBadge}>
                <LinearGradient
                  colors={['#F59E0B', '#F59E0B', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.proAccessGradient}
                >
                  <Text style={styles.proAccessText}>PRO ACCESS</Text>
                </LinearGradient>
              </View>

              {/* Main Hero Headline */}
              <Text style={styles.heroHeadline}>Meet Jarvis{
}Pro</Text>
              <Text style={styles.heroSubtitle}>
                Your AI growth companion{
}inside PostStreak.
              </Text>

              {/* Frosted Pill Chips */}
              <View style={styles.heroChipsRow}>
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText}>Content Strategy</Text>
                </View>
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText}>Growth Intelligence</Text>
                </View>
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText}>Creator Matching</Text>
                </View>
              </View>

              {/* Golden Metallic CTA Button */}
              <Pressable
                style={({ pressed }) => [styles.unlockProBtn, pressed && styles.btnPressed]}
                onPress={handleUnlockPro}
              >
                <LinearGradient
                  colors={['#F59E0B', '#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.unlockProGradient}
                >
                  <Text style={styles.unlockProBtnText}>Unlock Jarvis Pro</Text>
                </LinearGradient>
              </Pressable>
            </LinearGradient>
          </View>

          {/* SECTION 2: TODAY'S JARVIS BRIEF */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Today’s Jarvis Brief</Text>
          </View>

          <View style={styles.briefCard}>
            {/* Top Row with Flame and Advice */}
            <View style={styles.briefTopRow}>
              <View style={styles.briefFlameWrapper}>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={styles.briefFlameImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.briefAdviceText}>
                Your strongest move today: post one creator advice Reel before 7:30 PM, then turn it into a caption and collab idea.
              </Text>
            </View>

            {/* 3 Expandable Action Rows */}
            <View style={styles.briefStepsContainer}>
              {/* Step 1: Create reel hook */}
              <Pressable
                style={styles.briefStepItem}
                onPress={() => handleToggleBriefStep('step_1')}
              >
                <View style={styles.briefStepHeader}>
                  <View style={styles.briefStepLeft}>
                    <View style={styles.briefStepIconBox}>
                      <Text style={styles.briefStepIcon}>▷</Text>
                    </View>
                    <Text style={styles.briefStepTitle}>Create reel hook</Text>
                  </View>
                  <Text style={styles.briefStepChevron}>
                    {expandedBriefStep === 'step_1' ? '∧' : '∨'}
                  </Text>
                </View>
                {expandedBriefStep === 'step_1' && (
                  <View style={styles.briefStepExpandedContent}>
                    <Text style={styles.briefExpandedText}>
                      💡 Hook Draft: “The 1 creator habit that took me from 0 to 80k views in 30 days.”
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Step 2: Post at 7:30 PM */}
              <Pressable
                style={styles.briefStepItem}
                onPress={() => handleToggleBriefStep('step_2')}
              >
                <View style={styles.briefStepHeader}>
                  <View style={styles.briefStepLeft}>
                    <View style={styles.briefStepIconBox}>
                      <Text style={styles.briefStepIcon}>🕒</Text>
                    </View>
                    <Text style={styles.briefStepTitle}>Post at 7:30 PM</Text>
                  </View>
                  <Text style={styles.briefStepChevron}>
                    {expandedBriefStep === 'step_2' ? '∧' : '∨'}
                  </Text>
                </View>
                {expandedBriefStep === 'step_2' && (
                  <View style={styles.briefStepExpandedContent}>
                    <Text style={styles.briefExpandedText}>
                      📈 Peak Window: Your audience engagement spikes 3.4x between 7:15 PM and 8:00 PM on weekdays.
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Step 3: Match with Amara */}
              <Pressable
                style={styles.briefStepItem}
                onPress={() => handleToggleBriefStep('step_3')}
              >
                <View style={styles.briefStepHeader}>
                  <View style={styles.briefStepLeft}>
                    <View style={styles.briefStepIconBox}>
                      <Text style={styles.briefStepIcon}>👥</Text>
                    </View>
                    <Text style={styles.briefStepTitle}>Match with Amara</Text>
                  </View>
                  <Text style={styles.briefStepChevron}>
                    {expandedBriefStep === 'step_3' ? '∧' : '∨'}
                  </Text>
                </View>
                {expandedBriefStep === 'step_3' && (
                  <View style={styles.briefStepExpandedContent}>
                    <Text style={styles.briefExpandedText}>
                      ✨ 76% Audience Overlap: Co-create “24 Hours Creating in Lagos” for maximum cross-pollination.
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Metallic Gold Action Button */}
            <Pressable
              style={({ pressed }) => [styles.usePlanBtn, pressed && styles.btnPressed]}
              onPress={handleUnlockPro}
            >
              <LinearGradient
                colors={['#F59E0B', '#F59E0B', '#F59E0B', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.usePlanGradient}
              >
                <Text style={styles.usePlanBtnText}>Use This Plan With Pro ⚡</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* SECTION 3: WHAT JARVIS PRO UNLOCKS (2x3 GRID) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>What Jarvis Pro Unlocks</Text>
          </View>

          <View style={styles.featuresGrid}>
            {/* Feature 1: AI Strategy */}
            <View style={styles.featureGridCard}>
              <View style={styles.featureIconContainer}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"
                    stroke="#582CDB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M18 16L19 18.5L21.5 19.5L19 20.5L18 23L17 20.5L14.5 19.5L17 18.5L18 16Z"
                    stroke="#784DF0"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={styles.featureTitle} numberOfLines={1}>AI Strategy</Text>
              <Text style={styles.featureDescription} numberOfLines={3}>
                Custom roadmap based on your niche.
              </Text>
            </View>

            {/* Feature 2: Script Generator */}
            <View style={styles.featureGridCard}>
              <View style={styles.featureIconContainer}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    stroke="#582CDB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path d="M14 2v6h6" stroke="#582CDB" strokeWidth="2" />
                  <Path d="M16 13H8" stroke="#784DF0" strokeWidth="2" strokeLinecap="round" />
                  <Path d="M16 17H8" stroke="#784DF0" strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </View>
              <Text style={styles.featureTitle} numberOfLines={1}>Script Generator</Text>
              <Text style={styles.featureDescription} numberOfLines={3}>
                Viral hooks generated in your style.
              </Text>
            </View>

            {/* Feature 3: Growth Radar */}
            <View style={styles.featureGridCard}>
              <View style={styles.featureIconContainer}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M3 3v18h18"
                    stroke="#582CDB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M19 9l-5 5-4-4-3 3"
                    stroke="#582CDB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={styles.featureTitle} numberOfLines={1}>Growth Radar</Text>
              <Text style={styles.featureDescription} numberOfLines={3}>
                Competitor analysis and trend alerts.
              </Text>
            </View>

            {/* Feature 4: Match Tier */}
            <View style={styles.featureGridCard}>
              <View style={styles.featureIconContainer}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx="9" cy="7" r="4" stroke="#582CDB" strokeWidth="2" />
                  <Path
                    d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
                    stroke="#582CDB"
                    strokeWidth="2"
                  />
                  <Circle cx="17" cy="11" r="3" stroke="#784DF0" strokeWidth="2" />
                  <Path
                    d="M16 3.13a4 4 0 0 1 0 7.75"
                    stroke="#784DF0"
                    strokeWidth="2"
                  />
                </Svg>
              </View>
              <Text style={styles.featureTitle} numberOfLines={1}>Match Tier</Text>
              <Text style={styles.featureDescription} numberOfLines={3}>
                Deep affinity scores for collaborations.
              </Text>
            </View>

            {/* Feature 5: Squad Missions */}
            <View style={styles.featureGridCard}>
              <View style={styles.featureIconContainer}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"
                    stroke="#582CDB"
                    strokeWidth="2"
                  />
                  <Path
                    d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"
                    stroke="#582CDB"
                    strokeWidth="2"
                  />
                </Svg>
              </View>
              <Text style={styles.featureTitle} numberOfLines={1}>Squad Missions</Text>
              <Text style={styles.featureDescription} numberOfLines={3}>
                Exclusive high-stakes missions.
              </Text>
            </View>

            {/* Feature 6: Accountability */}
            <View style={styles.featureGridCard}>
              <View style={styles.featureIconContainer}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    stroke="#582CDB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M9 12l2 2 4-4"
                    stroke="#784DF0"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={styles.featureTitle} numberOfLines={1}>Accountability</Text>
              <Text style={styles.featureDescription} numberOfLines={3}>
                Readiness audits and streak protection.
              </Text>
            </View>
          </View>

          {/* SECTION 4: PRICING CARD ($9.99 / MONTH) */}
          <View style={styles.pricingCard}>
            <Text style={styles.pricingPlanName}>Jarvis Pro</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceBigText}>$9.99</Text>
              <Text style={styles.pricePeriodText}> / MONTH</Text>
            </View>

            {/* Feature Checklist */}
            <View style={styles.pricingChecklistCol}>
              <View style={styles.pricingCheckItem}>
                <Text style={styles.pricingCheckIcon}>✓</Text>
                <Text style={styles.pricingCheckText}>Full Jarvis Intelligence</Text>
              </View>

              <View style={styles.pricingCheckItem}>
                <Text style={styles.pricingCheckIcon}>✓</Text>
                <Text style={styles.pricingCheckText}>Growth analytics suite</Text>
              </View>

              <View style={styles.pricingCheckItem}>
                <Text style={styles.pricingCheckIcon}>✓</Text>
                <Text style={styles.pricingCheckText}>Unlimited discovery</Text>
              </View>

              <View style={styles.pricingCheckItem}>
                <Text style={styles.pricingCheckIcon}>✓</Text>
                <Text style={styles.pricingCheckText}>Priority creator matching</Text>
              </View>

              <View style={styles.pricingCheckItem}>
                <Text style={styles.pricingCheckIcon}>✓</Text>
                <Text style={styles.pricingCheckText}>Digital Media Kit & Rate Card</Text>
              </View>
            </View>

            {/* Golden Metallic Action Button */}
            <Pressable
              style={({ pressed }) => [styles.startProBtn, pressed && styles.btnPressed]}
              onPress={handleUnlockPro}
            >
              <LinearGradient
                colors={['#F59E0B', '#F59E0B', '#F59E0B', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startProGradient}
              >
                <Text style={styles.startProBtnText}>Start Pro Now</Text>
              </LinearGradient>
            </Pressable>

            <Text style={styles.pricingGuaranteeText}>
              CANCEL ANYTIME • SECURE PAYMENT
            </Text>
          </View>

          {/* SECTION 5: FROM GUESSING TO GUIDED GROWTH (BEFORE vs AFTER) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>From Guessing to Guided Growth</Text>
          </View>

          <View style={styles.comparisonCard}>
            {/* Top Box: Without Pro */}
            <View style={styles.withoutProBox}>
              <View style={styles.comparisonHeaderRow}>
                <Text style={styles.withoutProHeader}>✕ Without Pro</Text>
              </View>
              <Text style={styles.withoutProItem}>• Guess content hooks</Text>
              <Text style={styles.withoutProItem}>• Track stats manually</Text>
              <Text style={styles.withoutProItem}>• Random collaborations</Text>
            </View>

            {/* Bottom Box: With Jarvis Pro */}
            <View style={styles.withProBox}>
              <View style={styles.comparisonHeaderRow}>
                <Text style={styles.withProHeader}>✓ With Jarvis Pro</Text>
              </View>
              <Text style={styles.withProItem}>• Precise daily briefs</Text>
              <Text style={styles.withProItem}>• Automated insight engine</Text>
              <Text style={styles.withProItem}>• Goal-backed matching</Text>
            </View>
          </View>

          {/* SECTION 6: FAQ ACCORDION SECTION */}
          <View style={styles.faqContainer}>
            <Text style={styles.faqPreHeading}>BUILT TO HELP YOU MOVE FASTER</Text>

            <View style={styles.faqCard}>
              {FAQ_DATA.map((faq, index) => {
                const isExpanded = expandedFaqId === faq.id;
                const isLast = index === FAQ_DATA.length - 1;
                return (
                  <View key={faq.id} style={[styles.faqItemWrapper, isLast && { borderBottomWidth: 0 }]}>
                    <Pressable
                      style={styles.faqQuestionRow}
                      onPress={() => handleToggleFaq(faq.id)}
                    >
                      <Text style={styles.faqQuestionText}>{faq.question}</Text>
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path
                          d={isExpanded ? 'M6 9l6 6 6-6' : 'M9 18l6-6-6-6'}
                          stroke="#582CDB"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </Pressable>
                    {isExpanded && (
                      <View style={styles.faqAnswerBox}>
                        <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* 3. TOAST OVERLAY */}
        <BrandToast message={toastMessage} />

        {/* 4. FLOATING LIQUID GLASS BOTTOM NAVIGATION BAR */}
        <FloatingTabBar
          activeTab={activeTab}
          onTabPress={(tab) => {
            setActiveTab(tab);
            if (onNavigateTab) onNavigateTab(tab);
          }}
        />

        {/* 5. ANIMATED COMPLETION CELEBRATION MODAL (ON PRO UNLOCKED) */}
        <AnimatedCompletionModal
          visible={showCheckoutSuccessModal}
          title="Welcome to Jarvis Pro! ⚡"
          subtitle="All autonomous AI strategies, viral script generators, and priority matching are now unlocked."
          badgeText="JARVIS PRO UNLOCKED"
          xpEarned={250}
          streakCount={48}
          actionText="Start Exploring Pro"
          onDismiss={() => setShowCheckoutSuccessModal(false)}
        />

        {/* 6. NOTIFICATIONS MODAL */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Jarvis Pro Alerts</Text>
              <Text style={styles.modalSubtitle}>Autonomous intelligence feed</Text>

              <View style={styles.notifCard}>
                <Text style={styles.notifTitle}>✨ Pro Brief Ready</Text>
                <Text style={styles.notifBody}>
                  Your high-retention Friday posting blueprint is generated and ready to execute.
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

        {/* 7. PROFILE MODAL */}
        {/* UNIVERSAL CREATOR PASSPORT & PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
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
    width: '100%',
    backgroundColor: '#FAF9F6',
  },
  // 1. TOP HEADER APP BAR
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
    width: 26,
    height: 26,
  },
  proHeaderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proHeaderBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.4,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerProfileImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E11D48',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },

  // 2. MAIN SCROLLABLE CONTENT
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: sPadding(20),
    paddingTop: 10,
    paddingBottom: 130,
  },

  // SECTION 1: HERO DARK PURPLE CARD
  heroCardContainer: {
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  heroGradient: {
    padding: 24,
    alignItems: 'center',
  },
  proAccessBadge: {
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 16,
  },
  proAccessGradient: {
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  proAccessText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: 0.8,
  },
  heroHeadline: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.6,
    lineHeight: 40,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  heroChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  heroChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unlockProBtn: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  unlockProGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockProBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
  },

  // SECTION HEADERS
  sectionHeaderRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    width: '100%',
  },
  sectionHeading: {
    fontSize: sFont(18),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
    textAlign: 'center',
  },

  // SECTION 2: TODAY'S JARVIS BRIEF CARD
  briefCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    marginBottom: 24,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  briefTopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  briefFlameWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FAF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE8FC',
  },
  briefFlameImage: {
    width: 26,
    height: 26,
  },
  briefAdviceText: {
    flex: 1,
    fontSize: 13,
    color: '#171420',
    lineHeight: 19,
    fontWeight: '500',
  },
  briefStepsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  briefStepItem: {
    backgroundColor: '#F8F6FD',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#EDE8FC',
  },
  briefStepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  briefStepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  briefStepIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#EDE8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  briefStepIcon: {
    fontSize: 11,
    color: '#582CDB',
  },
  briefStepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  briefStepChevron: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7F7894',
  },
  briefStepExpandedContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EDE8FC',
  },
  briefExpandedText: {
    fontSize: 12,
    color: '#582CDB',
    lineHeight: 17,
    fontWeight: '600',
  },
  usePlanBtn: {
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
  },
  usePlanGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usePlanBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
  },

  // SECTION 3: FEATURES 2x3 GRID
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 24,
    width: '100%',
  },
  featureGridCard: {
    width: '48.2%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: sPadding(12),
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  featureIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FAF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE8FC',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: sFont(12.5),
    fontWeight: '800',
    color: '#171420',
    marginBottom: 3,
  },
  featureDescription: {
    fontSize: sFont(10.5),
    color: '#7F7894',
    lineHeight: 14.5,
    fontWeight: '500',
  },

  // SECTION 4: PRICING CARD (.99 / MONTH)
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    marginBottom: 24,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  pricingPlanName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 18,
  },
  priceBigText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.5,
  },
  pricePeriodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7F7894',
  },
  pricingChecklistCol: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  pricingCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pricingCheckIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  pricingCheckText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B4360',
  },
  startProBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  startProGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startProBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
  },
  pricingGuaranteeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.8,
  },

  // SECTION 5: FROM GUESSING TO GUIDED GROWTH
  comparisonCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    marginBottom: 24,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  withoutProBox: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E3FA',
  },
  withoutProHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B7280',
    marginBottom: 10,
  },
  withoutProItem: {
    fontSize: 12.5,
    color: '#9CA3AF',
    lineHeight: 20,
    fontWeight: '500',
  },
  withProBox: {
    backgroundColor: '#582CDB',
    padding: 18,
  },
  withProHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  withProItem: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 20,
    fontWeight: '600',
  },
  comparisonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  // SECTION 6: FAQ ACCORDION
  faqContainer: {
    marginBottom: 24,
  },
  faqPreHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 12,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  faqItemWrapper: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E3FA',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    flex: 1,
    marginRight: 10,
  },
  faqAnswerBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FAF8FF',
  },
  faqAnswerText: {
    fontSize: 12.5,
    color: '#524C62',
    lineHeight: 18,
    fontWeight: '500',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(235, 230, 248, 0.95)',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7F7894',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14,
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#E5E1F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7F7894',
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  notifCard: {
    backgroundColor: 'rgba(250, 248, 255, 0.85)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(237, 232, 252, 0.9)',
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
  toastContainer: {
    position: 'absolute',
    bottom: 95,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#582CDB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
