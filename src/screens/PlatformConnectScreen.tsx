import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
} from 'react-native';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

interface PlatformItem {
  id: string;
  name: string;
  description: string;
  iconType: 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'threads' | 'pinterest';
}

const PRIMARY_PLATFORMS: PlatformItem[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Schedule videos, track growth and discover opportunities.',
    iconType: 'tiktok',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Schedule content, track growth and manage collaborations.',
    iconType: 'instagram',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Schedule videos, track channel growth and manage content.',
    iconType: 'youtube',
  },
];

const MORE_PLATFORMS: PlatformItem[] = [
  { id: 'facebook', name: 'Facebook', description: 'Pages, Groups and community engagement.', iconType: 'facebook' },
  { id: 'threads', name: 'Threads', description: 'Text updates and creator conversations.', iconType: 'threads' },
  { id: 'pinterest', name: 'Pinterest', description: 'Pins, visual inspiration and aesthetic curation.', iconType: 'pinterest' },
];

interface PlatformConnectScreenProps {
  onBack: () => void;
  onContinue: (connectedPlatforms: string[]) => void;
  onSkipLater: () => void;
}

export const PlatformConnectScreen: React.FC<PlatformConnectScreenProps> = ({
  onBack,
  onContinue,
  onSkipLater,
}) => {
  // Initial connected platforms (empty by default so user manually connects)
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  // Jarvis Validation Modal
  const [showJarvisModal, setShowJarvisModal] = useState(false);
  const [jarvisModalTitle, setJarvisModalTitle] = useState('');
  const [jarvisModalMessage, setJarvisModalMessage] = useState<React.ReactNode>('');

  // Jarvis Flame Crystal Star-Glow Animation (Pure icon alone, zero circles)
  const jarvisStarFloatY = useRef(new Animated.Value(0)).current;
  const jarvisStarScale = useRef(new Animated.Value(1)).current;
  const modalPopScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const starLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(jarvisStarFloatY, {
            toValue: -7,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(jarvisStarScale, {
            toValue: 1.1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(jarvisStarFloatY, {
            toValue: 5,
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
    starLoop.start();
    return () => starLoop.stop();
  }, [jarvisStarFloatY, jarvisStarScale]);

  const togglePlatform = (id: string, name: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (connectedPlatforms.includes(id)) {
      setConnectedPlatforms(connectedPlatforms.filter((p) => p !== id));
    } else {
      setConnectedPlatforms([...connectedPlatforms, id]);
    }
  };

  const triggerJarvisModal = (title: string, message: React.ReactNode) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setJarvisModalTitle(title);
    setJarvisModalMessage(message);
    setShowJarvisModal(true);
    Animated.spring(modalPopScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 10,
    }).start();
  };

  const handleCloseJarvisModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowJarvisModal(false);
    modalPopScale.setValue(0.85);
  };

  const handleContinue = () => {
    if (connectedPlatforms.length === 0) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      triggerJarvisModal(
        'Connect a Platform',
        <Text style={styles.modalText}>
          Please connect at least <Text style={styles.highlightText}>1 creator platform</Text> to continue and build your personalized creator plan.
        </Text>
      );
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onContinue(connectedPlatforms);
  };

  const handleSkipLater = () => {
    if (connectedPlatforms.length === 0) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      triggerJarvisModal(
        'Connect a Platform',
        <Text style={styles.modalText}>
          Please connect at least <Text style={styles.highlightText}>1 creator platform</Text> to continue. You can always connect additional platforms later from your profile.
        </Text>
      );
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSkipLater();
  };

  // Render Real Official Social Media Logos
  const renderPlatformIcon = (type: PlatformItem['iconType'], size: number = 44) => {
    switch (type) {
      case 'tiktok':
        return (
          <View style={[styles.platformIconBox, { width: size, height: size, backgroundColor: '#000000' }]}>
            <Svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24">
              {/* Cyan Shadow Layer */}
              <Path
                d="M17.5 4.5a4.5 4.5 0 0 1-3.5-4h-2.5v13.5a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5.05.7.15V8.5a5.5 5.5 0 1 0 4.8 5.4V7.2a7.5 7.5 0 0 0 4.5 1.3V5.5c-.5 0-1-.3-1.5-1z"
                fill="#25F4EE"
                transform="translate(-0.8, -0.8)"
              />
              {/* Red Shadow Layer */}
              <Path
                d="M17.5 4.5a4.5 4.5 0 0 1-3.5-4h-2.5v13.5a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5.05.7.15V8.5a5.5 5.5 0 1 0 4.8 5.4V7.2a7.5 7.5 0 0 0 4.5 1.3V5.5c-.5 0-1-.3-1.5-1z"
                fill="#FE2C55"
                transform="translate(0.8, 0.8)"
              />
              {/* White Primary Note */}
              <Path
                d="M17.5 4.5a4.5 4.5 0 0 1-3.5-4h-2.5v13.5a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5.05.7.15V8.5a5.5 5.5 0 1 0 4.8 5.4V7.2a7.5 7.5 0 0 0 4.5 1.3V5.5c-.5 0-1-.3-1.5-1z"
                fill="#FFFFFF"
              />
            </Svg>
          </View>
        );

      case 'instagram':
        return (
          <View style={[styles.platformIconBox, { width: size, height: size, overflow: 'hidden' }]}>
            <Svg width={size} height={size} viewBox="0 0 44 44">
              <Defs>
                <LinearGradient id="instaGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#FFDC80" />
                  <Stop offset="20%" stopColor="#FCAF45" />
                  <Stop offset="40%" stopColor="#F77737" />
                  <Stop offset="60%" stopColor="#FD1D1D" />
                  <Stop offset="80%" stopColor="#C13584" />
                  <Stop offset="100%" stopColor="#833AB4" />
                </LinearGradient>
              </Defs>
              <Rect width="44" height="44" rx="12" fill="url(#instaGradient)" />
              {/* Camera Body */}
              <Rect
                x="11"
                y="11"
                width="22"
                height="22"
                rx="6"
                stroke="#FFFFFF"
                strokeWidth="2.4"
                fill="none"
              />
              {/* Camera Lens */}
              <Circle cx="22" cy="22" r="5.2" stroke="#FFFFFF" strokeWidth="2.4" fill="none" />
              {/* Flash Dot */}
              <Circle cx="27.5" cy="16.5" r="1.5" fill="#FFFFFF" />
            </Svg>
          </View>
        );

      case 'youtube':
        return (
          <View style={[styles.platformIconBox, { width: size, height: size, backgroundColor: '#FF0000' }]}>
            <Svg width={size * 0.65} height={size * 0.46} viewBox="0 0 28 20">
              <Path
                d="M27.4 3.1a3.5 3.5 0 0 0-2.5-2.5C22.7 0 14 0 14 0S5.3 0 3.1.6A3.5 3.5 0 0 0 .6 3.1 36.6 36.6 0 0 0 0 10a36.6 36.6 0 0 0 .6 6.9 3.5 3.5 0 0 0 2.5 2.5C5.3 20 14 20 14 20s8.7 0 10.9-.6a3.5 3.5 0 0 0 2.5-2.5 36.6 36.6 0 0 0 .6-6.9 36.6 36.6 0 0 0-.6-6.9z"
                fill="#FF0000"
              />
              <Path d="M11.2 14.3l7.3-4.3-7.3-4.3v8.6z" fill="#FFFFFF" />
            </Svg>
          </View>
        );

      case 'facebook':
        return (
          <View style={[styles.miniBrandIcon, { backgroundColor: '#1877F2' }]}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="#FFFFFF">
              <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </Svg>
          </View>
        );

      case 'threads':
        return (
          <View style={[styles.miniBrandIcon, { backgroundColor: '#000000' }]}>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="#FFFFFF">
              <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.83 0 5.39-1.18 7.21-3.08l-1.47-1.37C16.27 19.06 14.25 20 12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8c4.32 0 7.85 3.43 7.99 7.72H18c-.28-3.23-2.95-5.72-6-5.72-3.31 0-6 2.69-6 6s2.69 6 6 6c1.86 0 3.52-.85 4.63-2.19.46-.55.77-1.2.92-1.91-.71-.24-1.52-.38-2.38-.38-2.6 0-4.71 1.79-4.71 4 0 2.21 2.11 4 4.71 4 3.01 0 5.48-2.22 5.8-5.18.02-.27.03-.54.03-.82 0-5.52-4.48-10-10-10z" />
            </Svg>
          </View>
        );

      case 'pinterest':
        return (
          <View style={[styles.miniBrandIcon, { backgroundColor: '#E60023' }]}>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="#FFFFFF">
              <Path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.332 1.365-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
            </Svg>
          </View>
        );

      default:
        return null;
    }
  };

  const hasConnected = connectedPlatforms.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* 1. TOP BAR: Back Arrow + 4-Step Progress Indicator (Steps 1, 2, 3 Active) */}
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

            <View style={styles.progressContainer}>
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
            </View>

            <View style={styles.topBarRightPlaceholder} />
          </View>

          {/* 2. HEADINGS */}
          <View style={styles.headingSection}>
            <Text style={styles.mainHeading}>Connect your creator platforms</Text>
            <Text style={styles.subHeading}>
              Connect your accounts so PostStreak can personalise your experience, track your growth and find better opportunities.
            </Text>

            {/* Instruction Badge */}
            <View style={styles.instructionBadge}>
              <Text
                style={styles.instructionBadgeText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                CONNECT 1 PLATFORM TO CONTINUE
              </Text>
            </View>
          </View>

          {/* 3. PRIMARY PLATFORM LIST (With Real Social Media Icons) */}
          <View style={styles.platformList}>
            {PRIMARY_PLATFORMS.map((item) => {
              const isConnected = connectedPlatforms.includes(item.id);
              return (
                <View
                  key={item.id}
                  style={[
                    styles.platformCard,
                    isConnected && styles.platformCardConnected,
                  ]}
                >
                  {/* Left: Authentic Platform Logo */}
                  {renderPlatformIcon(item.iconType, 44)}

                  {/* Middle: Title & Description */}
                  <View style={styles.platformTextContainer}>
                    <Text
                      style={styles.platformTitle}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.platformSubtitle}>{item.description}</Text>
                  </View>

                  {/* Right: Connect or Connected State */}
                  {isConnected ? (
                    <Pressable
                      onPress={() => togglePlatform(item.id, item.name)}
                      hitSlop={6}
                      style={styles.connectedBadge}
                    >
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="#582CDB">
                        <Circle cx="12" cy="12" r="10" />
                        <Path
                          d="M9 12L11 14L15 10"
                          stroke="#FFFFFF"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                      <Text style={styles.connectedText}>Connected</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => togglePlatform(item.id, item.name)}
                      style={({ pressed }) => [
                        styles.connectButton,
                        pressed && styles.connectButtonPressed,
                      ]}
                    >
                      <Text style={styles.connectButtonText}>Connect</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>

          {/* 4. MORE PLATFORMS SECTION (With Real Logos) */}
          <View style={styles.morePlatformsSection}>
            <Text style={styles.morePlatformsHeading}>MORE PLATFORMS</Text>
            <View style={styles.morePlatformsRow}>
              {MORE_PLATFORMS.map((item) => {
                const isConnected = connectedPlatforms.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => togglePlatform(item.id, item.name)}
                    style={({ pressed }) => [
                      styles.miniPlatformBtn,
                      isConnected && styles.miniPlatformBtnConnected,
                      pressed && styles.miniPlatformBtnPressed,
                    ]}
                  >
                    <View style={styles.miniIconWrapper}>
                      {renderPlatformIcon(item.iconType, 20)}
                    </View>
                    <Text
                      style={[
                        styles.miniPlatformText,
                        isConnected && styles.miniPlatformTextConnected,
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Coming Soon Note */}
            <Text style={styles.comingSoonText}>More platforms are on the way</Text>
          </View>

          {/* 5. JARVIS CORE ADVICE CARD (With Pure Star-Glowing Flame) */}
          <View style={styles.jarvisAdviceCard}>
            {/* Left: Star-Glowing Crystal Flame (Zero Circles) */}
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

            {/* Right: Advice Content */}
            <View style={styles.jarvisTextWrapper}>
              <View style={styles.jarvisHeaderRow}>
                <View style={styles.jarvisDot} />
                <Text style={styles.jarvisHeaderLabel}>JARVIS CORE</Text>
              </View>
              <Text style={styles.jarvisQuoteText}>
                &ldquo;Connect your platforms so I can build your personalised creator plan.&rdquo;
              </Text>
            </View>
          </View>

          {/* 6. PRIMARY CONTINUE BUTTON */}
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.continueButton,
              !hasConnected && styles.continueButtonDisabled,
              pressed && hasConnected && styles.continueButtonPressed,
            ]}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>

          {/* 7. CONNECT MORE LATER LINK */}
          <Pressable onPress={handleSkipLater} hitSlop={10} style={styles.skipLaterContainer}>
            <Text style={styles.skipLaterText}>connect more later</Text>
          </Pressable>
        </ScrollView>

        {/* 8. BOTTOM STATUS BAR (Platform Step / 50% Complete) */}
        <View style={styles.bottomStatusBar}>
          <View style={styles.statusLeftGroup}>
            <View style={styles.statusIconBadge}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
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
            <Text style={styles.statusLabelText}>Platform Step</Text>
          </View>

          <Text style={styles.statusPercentageText}>50% Complete</Text>
        </View>
      </View>

      {/* 9. JARVIS CORE POPUP MODAL */}
      <Modal
        visible={showJarvisModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseJarvisModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                transform: [{ scale: modalPopScale }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.modalPureStarWrapper,
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
                style={styles.modalPureStarImage}
                resizeMode="contain"
              />
            </Animated.View>

            <View style={styles.jarvisCoreBadge}>
              <Text style={styles.jarvisBadgeSparkle}>🔥</Text>
              <Text style={styles.jarvisBadgeText}>JARVIS CORE</Text>
            </View>

            <Text style={styles.modalTitle}>{jarvisModalTitle}</Text>
            {jarvisModalMessage}

            <Pressable
              onPress={handleCloseJarvisModal}
              style={({ pressed }) => [
                styles.gotItButton,
                pressed && styles.gotItButtonPressed,
              ]}
            >
              <Text style={styles.gotItButtonText}>Got it, Jarvis  ✓</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9FD',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF9FD',
  },
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#FAF9FD',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    backgroundColor: 'rgba(23, 20, 32, 0.06)',
  },
  progressActive: {
    width: 48,
    backgroundColor: '#582CDB',
  },
  topBarRightPlaceholder: {
    width: 36,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  mainHeading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '400',
    color: '#5E576E',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: 10,
  },
  instructionBadge: {
    backgroundColor: '#F4F0FF',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  platformList: {
    gap: 10,
    marginBottom: 18,
  },
  platformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    paddingVertical: 13,
    paddingHorizontal: 12,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  platformCardConnected: {
    borderColor: 'rgba(88, 44, 219, 0.15)',
    backgroundColor: '#FAF9FF',
  },
  platformIconBox: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  platformTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  platformTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  platformSubtitle: {
    fontSize: 11.5,
    fontWeight: '400',
    color: '#5E576E',
    lineHeight: 16,
  },
  connectButton: {
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#582CDB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectButtonPressed: {
    backgroundColor: '#F8F6FD',
    transform: [{ scale: 0.96 }],
  },
  connectButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  connectedText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  morePlatformsSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  morePlatformsHeading: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E869E',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  morePlatformsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  miniPlatformBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.08)',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  miniPlatformBtnConnected: {
    backgroundColor: '#F8F6FD',
    borderColor: 'rgba(88, 44, 219, 0.2)',
  },
  miniPlatformBtnPressed: {
    transform: [{ scale: 0.96 }],
  },
  miniIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  miniBrandIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPlatformText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5E576E',
    textAlign: 'center',
    flexShrink: 1,
  },
  miniPlatformTextConnected: {
    color: '#582CDB',
    fontWeight: '700',
  },
  comingSoonText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#8E869E',
    marginTop: 10,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  jarvisAdviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  jarvisFlameWrapper: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    backgroundColor: 'transparent',
  },
  jarvisFlameImage: {
    width: 50,
    height: 50,
  },
  jarvisTextWrapper: {
    flex: 1,
  },
  jarvisHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  jarvisDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#582CDB',
  },
  jarvisHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.8,
  },
  jarvisQuoteText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#524C62',
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: '#582CDB',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(181, 165, 232, 0.7)',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  skipLaterContainer: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 16,
  },
  skipLaterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#582CDB',
  },
  bottomStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
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
    width: 32,
    height: 32,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  modalPureStarWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  modalPureStarImage: {
    width: 88,
    height: 88,
  },
  jarvisCoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginBottom: 10,
    gap: 5,
  },
  jarvisBadgeSparkle: {
    fontSize: 13,
  },
  jarvisBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.8,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  modalText: {
    fontSize: 14,
    color: '#524C62',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  highlightText: {
    color: '#582CDB',
    fontWeight: '700',
  },
  gotItButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  gotItButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  gotItButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
