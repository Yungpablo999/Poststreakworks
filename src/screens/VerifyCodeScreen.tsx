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

interface VerifyCodeScreenProps {
  mode: 'signup' | 'signin';
  email: string;
  username?: string;
  onBack: () => void;
  onEditEmail: () => void;
  onSuccess: (email: string) => void;
}

export const VerifyCodeScreen: React.FC<VerifyCodeScreenProps> = ({
  mode,
  email,
  username,
  onBack,
  onEditEmail,
  onSuccess,
}) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [resendTimer, setResendTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);

  // Jarvis Validation Modal
  const [showJarvisModal, setShowJarvisModal] = useState(false);
  const [jarvisModalTitle, setJarvisModalTitle] = useState('');
  const [jarvisModalMessage, setJarvisModalMessage] = useState<React.ReactNode>('');

  // Mascot Animations
  const mascotFloatY = useRef(new Animated.Value(0)).current;
  const mascotStretchY = useRef(new Animated.Value(1)).current;
  const mascotSquishX = useRef(new Animated.Value(1)).current;
  const mascotTilt = useRef(new Animated.Value(0)).current;
  const mascotTapScale = useRef(new Animated.Value(1)).current;
  const mascotTapY = useRef(new Animated.Value(0)).current;

  // Flash Icon Animations
  const lightningOpacity = useRef(new Animated.Value(0.75)).current;
  const lightningScale = useRef(new Animated.Value(1)).current;

  // Jarvis Modal Animations
  const jarvisStarFloatY = useRef(new Animated.Value(0)).current;
  const jarvisStarScale = useRef(new Animated.Value(1)).current;
  const modalPopScale = useRef(new Animated.Value(0.85)).current;

  // 6 OTP Input Refs
  const otpInputRefs = useRef<Array<TextInput | null>>([]);

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

    // B. Gold Flash Pulsation
    const lightningLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(lightningOpacity, {
            toValue: 1.0,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(lightningScale, {
            toValue: 1.12,
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

    // C. Jarvis Star Loop
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

  // Resend Timer Countdown
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

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

  const handleOtpChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    // Handle full paste
    if (cleanText.length >= 6) {
      const pastedDigits = cleanText.slice(0, 6).split('');
      setOtp(pastedDigits);
      otpInputRefs.current[5]?.focus();
      return;
    }

    newOtp[index] = cleanText.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (cleanText && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleResendCode = () => {
    if (!canResend) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setResendTimer(45);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    otpInputRefs.current[0]?.focus();

    const msg = `A new 6-digit code has been sent to ${email || 'your email'}.`;
    Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Code Resent', msg);
  };

  const isCodeComplete = otp.every((d) => d.length > 0);

  const handleVerify = () => {
    const enteredCode = otp.join('');
    if (enteredCode.length < 6) {
      triggerJarvisModal(
        'Incomplete Code',
        <Text style={styles.modalText}>
          Please enter the full <Text style={styles.highlightText}>6-digit code</Text> sent to{' '}
          <Text style={styles.highlightText}>{email || 'your email'}</Text>.
        </Text>
      );
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSuccess(email);
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
          {/* 1. TOP BAR */}
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

            {mode === 'signup' ? (
              <View style={styles.progressContainer}>
                <View style={[styles.progressSegment, styles.progressActive]} />
                <View style={[styles.progressSegment, styles.progressActive]} />
                <View style={[styles.progressSegment, styles.progressActive]} />
                <View style={styles.progressSegment} />
              </View>
            ) : (
              <View style={styles.headerTitleWrap}>
                <Text style={styles.headerNavTitle}>Sign In</Text>
              </View>
            )}

            <View style={styles.topBarRightPlaceholder} />
          </View>

          {/* 2. ANIMATED LOGO GRAPHIC WITH LIVING MASCOT */}
          <View style={styles.graphicSection}>
            <View style={styles.circleGraphicContainer}>
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
            <Text style={styles.mainHeading}>Enter Verification Code</Text>
            <Text style={styles.subHeading}>
              We sent a 6-digit {mode === 'signup' ? 'verification' : 'login'} code to{' '}
              <Text style={styles.emailHighlighted}>{email || 'your email'}</Text>
            </Text>
            <Pressable onPress={onEditEmail} hitSlop={8} style={styles.editEmailPressable}>
              <Text style={styles.editEmailText}>Edit email address</Text>
            </Pressable>
          </View>

          {/* 4. FORM CARD */}
          <View style={styles.formCard}>
            {/* 6 FLUID OTP DIGIT BOXES */}
            <View style={styles.otpRow}>
              {otp.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(ref) => {
                    otpInputRefs.current[idx] = ref;
                  }}
                  style={[
                    styles.otpBox,
                    digit ? styles.otpBoxFilled : null,
                    focusedIndex === idx && styles.otpBoxFocused,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, idx)}
                  onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                  onFocus={() => setFocusedIndex(idx)}
                  onBlur={() => setFocusedIndex(null)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* VERIFY BUTTON */}
            <Pressable
              onPress={handleVerify}
              style={({ pressed }) => [
                styles.submitButton,
                !isCodeComplete && styles.submitButtonDisabled,
                pressed && isCodeComplete && styles.submitButtonPressed,
              ]}
            >
              <Text style={styles.submitButtonText}>
                {mode === 'signup' ? 'Verify Code  →' : 'Verify & Sign In  →'}
              </Text>
            </Pressable>

            {/* RESEND TIMER & LINK */}
            <View style={styles.resendContainer}>
              {canResend ? (
                <Pressable onPress={handleResendCode} hitSlop={8}>
                  <Text style={styles.resendActiveText}>Resend code</Text>
                </Pressable>
              ) : (
                <Text style={styles.resendTimerText}>
                  Resend code in <Text style={styles.timerBold}>{resendTimer}s</Text>
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* 5. BOTTOM STATUS BAR (For Onboarding Flow) */}
        {mode === 'signup' && (
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
              <Text style={styles.statusLabelText}>Account Step</Text>
            </View>

            <Text style={styles.statusPercentageText}>75% Complete</Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* JARVIS MODAL POPUP */}
      <Modal
        visible={showJarvisModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseJarvisModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.jarvisModalCard,
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
                source={require('../../assets/images/jarvis-ghost-clean.png')}
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
    justifyContent: 'space-between',
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
    marginBottom: 4,
    height: 40,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 140,
    justifyContent: 'center',
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(88, 44, 219, 0.12)',
  },
  progressActive: {
    backgroundColor: '#582CDB',
  },
  headerTitleWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerNavTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
  },
  topBarRightPlaceholder: {
    width: 36,
  },
  graphicSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  circleGraphicContainer: {
    position: 'relative',
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotCircleFrame: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(88, 44, 219, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  mascotImage: {
    width: 50,
    height: 50,
  },
  standaloneFlashContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#171420',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '400',
    color: '#5E576E',
    textAlign: 'center',
    lineHeight: 18,
  },
  emailHighlighted: {
    color: '#582CDB',
    fontWeight: '700',
  },
  editEmailPressable: {
    marginTop: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  editEmailText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#582CDB',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    paddingVertical: 20,
    paddingHorizontal: 14,
    marginBottom: 14,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 5,
    marginBottom: 20,
    width: '100%',
  },
  otpBox: {
    flex: 1,
    minWidth: 0,
    maxWidth: 42,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(88, 44, 219, 0.15)',
    backgroundColor: '#FAF9FF',
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '700',
    color: '#171420',
    paddingVertical: 0,
    paddingHorizontal: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  otpBoxFilled: {
    borderColor: '#582CDB',
    backgroundColor: '#FFFFFF',
  },
  otpBoxFocused: {
    borderColor: '#582CDB',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#582CDB',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(181, 165, 232, 0.7)',
    shadowOpacity: 0,
    elevation: 0,
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
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendActiveText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#582CDB',
  },
  resendTimerText: {
    fontSize: 13,
    color: '#7F7894',
  },
  timerBold: {
    fontWeight: '700',
    color: '#171420',
  },
  bottomStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 20, 32, 0.06)',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statusLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ECE8FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  statusPercentageText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#582CDB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  jarvisModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalPureStarWrapper: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalPureStarImage: {
    width: 60,
    height: 60,
  },
  jarvisCoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3EFFF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  jarvisBadgeSparkle: {
    fontSize: 11,
  },
  jarvisBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171420',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  modalText: {
    fontSize: 13,
    color: '#5E576E',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  highlightText: {
    color: '#582CDB',
    fontWeight: '700',
  },
  gotItButton: {
    backgroundColor: '#582CDB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  gotItButtonPressed: {
    opacity: 0.9,
  },
  gotItButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
