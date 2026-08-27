import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

interface SignUpScreenProps {
  onBack: () => void;
  onSignIn?: () => void;
  onSubmit?: (username: string, email: string) => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onBack,
  onSignIn = () => {
    if (Platform.OS === 'web') {
      window.alert('🔑 Opening Sign In...');
    } else {
      Alert.alert('Sign In', '🔑 Open Sign In screen');
    }
  },
  onSubmit = (username: string, email: string) => {
    const msg = `🎉 Account created for @${username} (${email})!\nNext step: Customizing your creator streaks...`;
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Welcome to Poststreak!', msg);
    }
  },
}) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [focusedField, setFocusedField] = useState<'username' | 'email' | null>(null);

  // Jarvis Validation Modal State
  const [showJarvisModal, setShowJarvisModal] = useState(false);
  const [jarvisModalTitle, setJarvisModalTitle] = useState('');
  const [jarvisModalMessage, setJarvisModalMessage] = useState<React.ReactNode>('');

  // 1. Ghost Mascot Living Float Animations (Header)
  const mascotFloatY = useRef(new Animated.Value(0)).current;
  const mascotStretchY = useRef(new Animated.Value(1)).current;
  const mascotSquishX = useRef(new Animated.Value(1)).current;
  const mascotTilt = useRef(new Animated.Value(0)).current;
  const mascotTapScale = useRef(new Animated.Value(1)).current;
  const mascotTapY = useRef(new Animated.Value(0)).current;

  // 2. Subtle Soft-Gold Flash Icon Animations
  const lightningOpacity = useRef(new Animated.Value(0.75)).current;
  const lightningScale = useRef(new Animated.Value(1)).current;

  // 3. Jarvis Flame Crystal Kinetic Star-Glow for Pop-up (Pure icon alone)
  const jarvisStarFloatY = useRef(new Animated.Value(0)).current;
  const jarvisStarScale = useRef(new Animated.Value(1)).current;
  const modalPopScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // A. Mascot Living Float Loop
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(mascotFloatY, {
            toValue: -7,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(mascotStretchY, {
            toValue: 1.05,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(mascotSquishX, {
            toValue: 0.96,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(mascotTilt, {
            toValue: 1,
            duration: 1300,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(mascotFloatY, {
            toValue: -5,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(mascotStretchY, {
            toValue: 1.02,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(mascotFloatY, {
            toValue: 5,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(mascotStretchY, {
            toValue: 0.95,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(mascotSquishX, {
            toValue: 1.05,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(mascotTilt, {
            toValue: -1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(mascotFloatY, {
            toValue: 0,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(mascotStretchY, {
            toValue: 1.0,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(mascotSquishX, {
            toValue: 1.0,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(mascotTilt, {
            toValue: 0,
            duration: 750,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // B. Subtle Soft-Gold Flash Icon Glow Loop
    const lightningLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(lightningOpacity, {
            toValue: 1.0,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(lightningScale, {
            toValue: 1.06,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(lightningOpacity, {
            toValue: 0.72,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(lightningScale, {
            toValue: 0.98,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // C. Jarvis Star-Pulsing Animation for Pop-up Modal
    const jarvisStarLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(jarvisStarFloatY, {
            toValue: -8,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(jarvisStarScale, {
            toValue: 1.12,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(jarvisStarFloatY, {
            toValue: 5,
            duration: 1050,
            useNativeDriver: true,
          }),
          Animated.timing(jarvisStarScale, {
            toValue: 0.95,
            duration: 1050,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    floatLoop.start();
    lightningLoop.start();
    jarvisStarLoop.start();

    return () => {
      floatLoop.stop();
      lightningLoop.stop();
      jarvisStarLoop.stop();
    };
  }, [
    mascotFloatY,
    mascotStretchY,
    mascotSquishX,
    mascotTilt,
    lightningOpacity,
    lightningScale,
    jarvisStarFloatY,
    jarvisStarScale,
  ]);

  // Mascot Interactive Tap Reaction
  const handleMascotTap = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Animated.sequence([
      Animated.parallel([
        Animated.timing(mascotTapScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
        Animated.timing(mascotTapY, { toValue: 6, duration: 80, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(mascotTapScale, { toValue: 1.14, useNativeDriver: true, speed: 28, bounciness: 12 }),
        Animated.spring(mascotTapY, { toValue: -18, useNativeDriver: true, speed: 24, bounciness: 12 }),
      ]),
      Animated.parallel([
        Animated.spring(mascotTapScale, { toValue: 1.0, useNativeDriver: true, speed: 20, bounciness: 8 }),
        Animated.spring(mascotTapY, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 6 }),
      ]),
    ]).start();
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

  const handleCreateAccount = () => {
    const trimmedUser = username.trim();
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 1. Both Username and Email are missing
    if (!trimmedUser && !trimmedEmail) {
      triggerJarvisModal(
        'Missing Details',
        <Text style={styles.modalText}>
          Jarvis needs both your <Text style={styles.highlightText}>Username</Text> and{' '}
          <Text style={styles.highlightText}>Email Address</Text> to set up your creator profile and start building streaks!
        </Text>
      );
      return;
    }

    // 2. Only Username is missing
    if (!trimmedUser) {
      triggerJarvisModal(
        'Missing Username',
        <Text style={styles.modalText}>
          Please choose a <Text style={styles.highlightText}>Creator Username</Text> so PostStreak and collaborators can identify you!
        </Text>
      );
      return;
    }

    // 3. Only Email is missing
    if (!trimmedEmail) {
      triggerJarvisModal(
        'Missing Email Address',
        <Text style={styles.modalText}>
          Please enter your <Text style={styles.highlightText}>Email Address</Text> so Jarvis can secure your account and track your milestones!
        </Text>
      );
      return;
    }

    // 4. Email is improperly formatted
    if (!emailRegex.test(trimmedEmail)) {
      triggerJarvisModal(
        'Invalid Email Address',
        <Text style={styles.modalText}>
          That email doesn&apos;t look quite right. Please enter a valid email format like{' '}
          <Text style={styles.highlightText}>you@example.com</Text>.
        </Text>
      );
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSubmit(trimmedUser, trimmedEmail);
  };

  // Direct SSO Handler
  const handleDirectAuth = (provider: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const msg = `⚡ Signing in with ${provider}...`;
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert(provider, msg);
    }
  };

  const handleTerms = () => {
    const msg = 'Terms of Service';
    Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Terms', msg);
  };

  const handlePrivacy = () => {
    const msg = 'Privacy Policy';
    Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Privacy', msg);
  };

  const rotation = mascotTilt.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-5deg', '0deg', '5deg'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
          {/* 1. TOP BAR: Back Arrow + 4-Step Progress Indicator */}
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
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
            </View>

            {/* Placeholder to balance left arrow */}
            <View style={styles.topBarRightPlaceholder} />
          </View>

          {/* 2. ANIMATED LOGO GRAPHIC WITH SUBTLE GOLD FLASH ICON */}
          <View style={styles.graphicSection}>
            <View style={styles.circleGraphicContainer}>
              {/* Outer Circular Frame with Living Mascot */}
              <Pressable onPress={handleMascotTap} style={styles.mascotCircleFrame}>
                <Animated.View
                  style={{
                    transform: [
                      { translateY: mascotFloatY },
                      { translateY: mascotTapY },
                      { scale: mascotTapScale },
                      { scaleY: mascotStretchY },
                      { scaleX: mascotSquishX },
                      { rotate: rotation },
                    ],
                  }}
                >
                  <Image
                    source={require('../../assets/images/jarvis-ghost-clean.png')}
                    style={styles.mascotImage}
                    resizeMode="contain"
                  />
                </Animated.View>
              </Pressable>

              {/* Standalone Subtle Gold Flash Icon */}
              <Animated.View
                style={[
                  styles.standaloneFlashContainer,
                  {
                    opacity: lightningOpacity,
                    transform: [{ scale: lightningScale }],
                  },
                ]}
              >
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                    fill="#FFE07A"
                    stroke="#D4A017"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Animated.View>
            </View>
          </View>

          {/* 3. HEADINGS */}
          <View style={styles.headingSection}>
            <Text style={styles.mainHeading}>Create Your Account</Text>
            <Text style={styles.subHeading}>
              Join creators using PostStreak to create, schedule, collaborate, grow and earn in one place.
            </Text>
          </View>

          {/* 4. FORM CARD */}
          <View style={styles.formCard}>
            {/* USERNAME FIELD */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>USERNAME</Text>
              <View
                style={[
                  styles.inputFieldContainer,
                  focusedField === 'username' && styles.inputFieldFocused,
                ]}
              >
                <View style={styles.inputIconContainer}>
                  {/* @ Symbol Icon */}
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Circle
                      cx="12"
                      cy="12"
                      r="4"
                      stroke={focusedField === 'username' ? '#582CDB' : '#736B88'}
                      strokeWidth="2"
                    />
                    <Path
                      d="M16 8V12C16 13.6569 17.3431 15 19 15C20.6569 15 22 13.6569 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C14.7614 22 17.2614 20.8807 19.0711 19.0711"
                      stroke={focusedField === 'username' ? '#582CDB' : '#736B88'}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="creatorname"
                  placeholderTextColor="#A39BB5"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* EMAIL ADDRESS FIELD */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View
                style={[
                  styles.inputFieldContainer,
                  focusedField === 'email' && styles.inputFieldFocused,
                ]}
              >
                <View style={styles.inputIconContainer}>
                  {/* Envelope Mail Icon */}
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                      stroke={focusedField === 'email' ? '#582CDB' : '#736B88'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M22 6L12 13L2 6"
                      stroke={focusedField === 'email' ? '#582CDB' : '#736B88'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="you@example.com"
                  placeholderTextColor="#A39BB5"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* CREATE ACCOUNT BUTTON */}
            <Pressable
              onPress={handleCreateAccount}
              style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
            >
              <Text style={styles.submitButtonText}>Create Account  →</Text>
            </Pressable>
          </View>

          {/* 5. SIGN IN LINK */}
          <View style={styles.signInContainer}>
            <Text style={styles.alreadyHaveText}>Already have an account? </Text>
            <Pressable onPress={onSignIn} hitSlop={8}>
              <Text style={styles.signInLinkText}>Sign In</Text>
            </Pressable>
          </View>

          {/* 6. DIRECT SIGN-IN DIVIDER */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 7. DUAL DIRECT AUTH BUTTONS (Google & Apple) */}
          <View style={styles.socialAuthRow}>
            {/* GOOGLE SSO */}
            <Pressable
              onPress={() => handleDirectAuth('Google')}
              style={({ pressed }) => [styles.socialButton, pressed && styles.socialButtonPressed]}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <Path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <Path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <Path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </Svg>
              <Text style={styles.socialButtonText}>Google</Text>
            </Pressable>

            {/* APPLE SSO */}
            <Pressable
              onPress={() => handleDirectAuth('Apple')}
              style={({ pressed }) => [styles.socialButton, pressed && styles.socialButtonPressed]}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="#1A1626">
                <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.56.65-1.05 1.71-.92 2.73 1 .08 2.02-.51 2.62-1.23z" />
              </Svg>
              <Text style={styles.socialButtonText}>Apple</Text>
            </Pressable>
          </View>

          {/* 8. TERMS & PRIVACY */}
          <View style={styles.legalContainer}>
            <Pressable onPress={handleTerms} hitSlop={6}>
              <Text style={styles.legalText}>TERMS</Text>
            </Pressable>
            <Text style={styles.legalSpacer}> </Text>
            <Pressable onPress={handlePrivacy} hitSlop={6}>
              <Text style={styles.legalText}>PRIVACY</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* 9. BOTTOM STATUS BAR (Sign up Step / 25% Complete) */}
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
                  d="M17 11L19 13L23 9"
                  stroke="#582CDB"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.statusLabelText}>Sign up Step</Text>
          </View>

          <Text style={styles.statusPercentageText}>25% Complete</Text>
        </View>

        {/* 10. JARVIS CORE VALIDATION POPUP MODAL */}
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
              {/* Pure Glowing Star-Flame in Pop-up (Zero Circles) */}
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
                  source={require('../../assets/images/jarvis-ghost-clean.png')}
                  style={styles.modalPureStarImage}
                  resizeMode="contain"
                />
              </Animated.View>

              {/* Jarvis Core Badge */}
              <View style={styles.jarvisCoreBadge}>
                <Text style={styles.jarvisBadgeSparkle}>🔥</Text>
                <Text style={styles.jarvisBadgeText}>JARVIS CORE AI</Text>
              </View>

              {/* Modal Heading */}
              <Text style={styles.modalTitle}>{jarvisModalTitle}</Text>

              {/* Dynamic Modal Advice Message */}
              {jarvisModalMessage}

              {/* Got It Button */}
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
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    backgroundColor: '#FAF9FD',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'space-between',
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
  graphicSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  circleGraphicContainer: {
    position: 'relative',
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotCircleFrame: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#F3EEFB',
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotImage: {
    width: 74,
    height: 74,
  },
  standaloneFlashContainer: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 20,
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
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: 22,
    marginBottom: 16,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A4358',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: 'rgba(23, 20, 32, 0.09)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputFieldFocused: {
    borderColor: '#582CDB',
    backgroundColor: '#FAF9FF',
  },
  inputIconContainer: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
    color: '#171420',
    paddingVertical: 0,
  },
  submitButton: {
    backgroundColor: '#582CDB',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  submitButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alreadyHaveText: {
    fontSize: 14,
    color: '#5E576E',
    fontWeight: '400',
  },
  signInLinkText: {
    fontSize: 14,
    color: '#582CDB',
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.06)',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E869E',
    letterSpacing: 0.5,
    marginHorizontal: 12,
  },
  socialAuthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.08)',
    gap: 9,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  socialButtonPressed: {
    backgroundColor: '#F8F6FD',
    borderColor: 'rgba(88, 44, 219, 0.2)',
    transform: [{ scale: 0.97 }],
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171420',
  },
  legalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  legalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E869E',
    letterSpacing: 0.5,
  },
  legalSpacer: {
    width: 8,
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
