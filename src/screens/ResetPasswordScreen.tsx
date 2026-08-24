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
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

interface ResetPasswordScreenProps {
  onBack: () => void;
  onSuccess: (email: string) => void;
}

type ResetStep = 'email' | 'otp' | 'new-password' | 'success';

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Countdown timer for OTP resend
  const [resendTimer, setResendTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);

  // Jarvis Validation Modal
  const [showJarvisModal, setShowJarvisModal] = useState(false);
  const [jarvisModalTitle, setJarvisModalTitle] = useState('');
  const [jarvisModalMessage, setJarvisModalMessage] = useState<React.ReactNode>('');

  // Animation references
  const jarvisStarFloatY = useRef(new Animated.Value(0)).current;
  const jarvisStarScale = useRef(new Animated.Value(1)).current;
  const modalPopScale = useRef(new Animated.Value(0.85)).current;
  const successScale = useRef(new Animated.Value(0.5)).current;

  // Refs for 6-digit OTP inputs
  const otpInputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    // Star Pulsation & Living Celestial Float Loop
    const starLoop = Animated.loop(
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
    starLoop.start();
    return () => starLoop.stop();
  }, [jarvisStarFloatY, jarvisStarScale]);

  // Resend OTP countdown effect
  useEffect(() => {
    let interval: any;
    if (step === 'otp' && resendTimer > 0) {
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
  }, [step, resendTimer]);

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

  // Step 1: Send Verification Code
  const handleSendCode = () => {
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmed) {
      triggerJarvisModal(
        'Missing Email Address',
        <Text style={styles.modalText}>
          Please enter your <Text style={styles.highlightText}>Email Address</Text> so Jarvis can generate a secure 6-digit verification code.
        </Text>
      );
      return;
    }

    if (!emailRegex.test(trimmed)) {
      triggerJarvisModal(
        'Invalid Email Address',
        <Text style={styles.modalText}>
          Please enter a valid email address format like{' '}
          <Text style={styles.highlightText}>you@example.com</Text>.
        </Text>
      );
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Advance to Step 2 (OTP)
    setStep('otp');
    setResendTimer(45);
    setCanResend(false);
  };

  // Step 2: Handle OTP input typing
  const handleOtpChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanText.slice(-1);
    setOtp(newOtp);

    // Auto focus next input
    if (cleanText && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = () => {
    if (!canResend) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setOtp(['', '', '', '', '', '']);
    setResendTimer(45);
    setCanResend(false);
    triggerJarvisModal(
      'New Code Sent! ⚡',
      <Text style={styles.modalText}>
        Jarvis just transmitted a fresh 6-digit code to{' '}
        <Text style={styles.highlightText}>{email}</Text>.
      </Text>
    );
  };

  const handleVerifyOtp = () => {
    const fullCode = otp.join('');
    if (fullCode.length < 6) {
      triggerJarvisModal(
        'Incomplete Code',
        <Text style={styles.modalText}>
          Please enter the full <Text style={styles.highlightText}>6-digit verification code</Text> sent to your email.
        </Text>
      );
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setStep('new-password');
  };

  // Step 3: Handle Set New Password
  const handleUpdatePassword = () => {
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedNew) {
      triggerJarvisModal(
        'Missing New Password',
        <Text style={styles.modalText}>
          Please create a <Text style={styles.highlightText}>New Password</Text> with at least 6 characters.
        </Text>
      );
      return;
    }

    if (trimmedNew.length < 6) {
      triggerJarvisModal(
        'Password Too Short',
        <Text style={styles.modalText}>
          Your new password must contain at least <Text style={styles.highlightText}>6 characters</Text> for security.
        </Text>
      );
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      triggerJarvisModal(
        'Passwords Do Not Match',
        <Text style={styles.modalText}>
          Please make sure your <Text style={styles.highlightText}>New Password</Text> and{' '}
          <Text style={styles.highlightText}>Confirm Password</Text> fields match exactly.
        </Text>
      );
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setStep('success');
    Animated.spring(successScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 12,
    }).start();
  };

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
          {/* 1. TOP BAR: Back Arrow */}
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

            {/* Step progress pills */}
            <View style={styles.stepPillsContainer}>
              <View
                style={[
                  styles.stepPill,
                  step === 'email' && styles.stepPillActive,
                  (step === 'otp' || step === 'new-password' || step === 'success') && styles.stepPillCompleted,
                ]}
              />
              <View
                style={[
                  styles.stepPill,
                  step === 'otp' && styles.stepPillActive,
                  (step === 'new-password' || step === 'success') && styles.stepPillCompleted,
                ]}
              />
              <View
                style={[
                  styles.stepPill,
                  step === 'new-password' && styles.stepPillActive,
                  step === 'success' && styles.stepPillCompleted,
                ]}
              />
            </View>

            <View style={styles.topBarRightPlaceholder} />
          </View>

          {/* 2. STAR-GLOWING JARVIS CORE FLAME (Zero Circles) */}
          <View style={styles.graphicSection}>
            <Animated.View
              style={[
                styles.pureStarWrapper,
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
                style={styles.pureStarImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* ============================================================ */}
          {/* STEP 1: ENTER EMAIL                                          */}
          {/* ============================================================ */}
          {step === 'email' && (
            <>
              <View style={styles.headingSection}>
                <Text style={styles.mainHeading}>Reset Password</Text>
                <Text style={styles.subHeading}>
                  Enter the email address tied to your PostStreak account to receive a 6-digit verification code.
                </Text>
              </View>

              <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ACCOUNT EMAIL</Text>
                  <View
                    style={[
                      styles.inputFieldContainer,
                      focusedField === 'email' && styles.inputFieldFocused,
                    ]}
                  >
                    <View style={styles.inputIconContainer}>
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

                <Pressable
                  onPress={handleSendCode}
                  style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
                >
                  <Text style={styles.submitButtonText}>Send 6-Digit Code  →</Text>
                </Pressable>
              </View>
            </>
          )}

          {/* ============================================================ */}
          {/* STEP 2: 6-DIGIT OTP VERIFICATION                             */}
          {/* ============================================================ */}
          {step === 'otp' && (
            <>
              <View style={styles.headingSection}>
                <Text style={styles.mainHeading}>Enter Verification Code</Text>
                <Text style={styles.subHeading}>
                  We sent a 6-digit code to{' '}
                  <Text style={styles.emailHighlighted}>{email}</Text>
                </Text>
                <Pressable onPress={() => setStep('email')} hitSlop={6}>
                  <Text style={styles.changeEmailLink}>Edit email address</Text>
                </Pressable>
              </View>

              <View style={styles.formCard}>
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
                        focusedField === `otp_${idx}` && styles.otpBoxFocused,
                      ]}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, idx)}
                      onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                      onFocus={() => setFocusedField(`otp_${idx}`)}
                      onBlur={() => setFocusedField(null)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                <Pressable
                  onPress={handleVerifyOtp}
                  style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
                >
                  <Text style={styles.submitButtonText}>Verify Code  →</Text>
                </Pressable>

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
            </>
          )}

          {/* ============================================================ */}
          {/* STEP 3: SET NEW PASSWORD                                     */}
          {/* ============================================================ */}
          {step === 'new-password' && (
            <>
              <View style={styles.headingSection}>
                <Text style={styles.mainHeading}>Create New Password</Text>
                <Text style={styles.subHeading}>
                  Choose a strong new password to protect your creator account and streak stats.
                </Text>
              </View>

              <View style={styles.formCard}>
                {/* NEW PASSWORD */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                  <View
                    style={[
                      styles.inputFieldContainer,
                      focusedField === 'newPassword' && styles.inputFieldFocused,
                    ]}
                  >
                    <View style={styles.inputIconContainer}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                          stroke={focusedField === 'newPassword' ? '#582CDB' : '#736B88'}
                          strokeWidth="2"
                        />
                        <Path
                          d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11"
                          stroke={focusedField === 'newPassword' ? '#582CDB' : '#736B88'}
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </Svg>
                    </View>

                    <TextInput
                      style={styles.textInput}
                      placeholder="At least 6 characters"
                      placeholderTextColor="#A39BB5"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      onFocus={() => setFocusedField('newPassword')}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />

                    <Pressable
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      hitSlop={8}
                      style={styles.eyeIconButton}
                    >
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8-11-8-11-8z"
                          stroke={showNewPassword ? '#582CDB' : '#736B88'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke={showNewPassword ? '#582CDB' : '#736B88'}
                          strokeWidth="2"
                        />
                        {!showNewPassword && (
                          <Path d="M3 3L21 21" stroke="#736B88" strokeWidth="2" strokeLinecap="round" />
                        )}
                      </Svg>
                    </Pressable>
                  </View>
                </View>

                {/* CONFIRM NEW PASSWORD */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
                  <View
                    style={[
                      styles.inputFieldContainer,
                      focusedField === 'confirmPassword' && styles.inputFieldFocused,
                    ]}
                  >
                    <View style={styles.inputIconContainer}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                          stroke={focusedField === 'confirmPassword' ? '#582CDB' : '#736B88'}
                          strokeWidth="2"
                        />
                        <Path
                          d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11"
                          stroke={focusedField === 'confirmPassword' ? '#582CDB' : '#736B88'}
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </Svg>
                    </View>

                    <TextInput
                      style={styles.textInput}
                      placeholder="Repeat your password"
                      placeholderTextColor="#A39BB5"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />

                    <Pressable
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      hitSlop={8}
                      style={styles.eyeIconButton}
                    >
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8-11-8-11-8z"
                          stroke={showConfirmPassword ? '#582CDB' : '#736B88'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke={showConfirmPassword ? '#582CDB' : '#736B88'}
                          strokeWidth="2"
                        />
                        {!showConfirmPassword && (
                          <Path d="M3 3L21 21" stroke="#736B88" strokeWidth="2" strokeLinecap="round" />
                        )}
                      </Svg>
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  onPress={handleUpdatePassword}
                  style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
                >
                  <Text style={styles.submitButtonText}>Update Password & Sign In  →</Text>
                </Pressable>
              </View>
            </>
          )}

          {/* ============================================================ */}
          {/* STEP 4: SUCCESS STATE                                        */}
          {/* ============================================================ */}
          {step === 'success' && (
            <Animated.View
              style={[
                styles.successCard,
                {
                  transform: [{ scale: successScale }],
                },
              ]}
            >
              <View style={styles.successCheckBadge}>
                <Text style={styles.successCheckEmoji}>✓</Text>
              </View>

              <Text style={styles.successTitle}>Password Updated!</Text>
              <Text style={styles.successSubtitle}>
                Your PostStreak password has been successfully updated. You can now access your creator dashboard.
              </Text>

              <Pressable
                onPress={() => onSuccess(email)}
                style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
              >
                <Text style={styles.submitButtonText}>Continue to Dashboard  →</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* 3. RETURN TO SIGN IN LINK */}
          {step !== 'success' && (
            <View style={styles.returnContainer}>
              <Pressable onPress={onBack} hitSlop={8}>
                <Text style={styles.returnLinkText}>← Back to Sign In</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* 4. JARVIS CORE VALIDATION POPUP MODAL */}
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
                <Text style={styles.jarvisBadgeText}>JARVIS CORE AI</Text>
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
      </KeyboardAvoidingView>
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
  stepPillsContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  stepPill: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(234, 229, 248, 0.8)',
  },
  stepPillActive: {
    width: 36,
    backgroundColor: '#582CDB',
  },
  stepPillCompleted: {
    backgroundColor: '#582CDB',
  },
  topBarRightPlaceholder: {
    width: 36,
  },
  graphicSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  pureStarWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  pureStarImage: {
    width: 80,
    height: 80,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainHeading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.7,
    marginBottom: 8,
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '400',
    color: '#7F7894',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  emailHighlighted: {
    fontWeight: '700',
    color: '#171420',
  },
  changeEmailLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#582CDB',
    marginTop: 6,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    padding: 20,
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 16,
    width: '100%',
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#524C62',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    width: '100%',
  },
  inputFieldFocused: {
    borderColor: '#582CDB',
    backgroundColor: 'rgba(250, 248, 255, 0.95)',
  },
  inputIconContainer: {
    marginRight: 10,
  },
  eyeIconButton: {
    padding: 4,
    marginLeft: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#171420',
    paddingVertical: 0,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    width: '100%',
  },
  otpBox: {
    width: 42,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    backgroundColor: 'rgba(250, 248, 255, 0.8)',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#171420',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  otpBoxFilled: {
    borderColor: '#582CDB',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  otpBoxFocused: {
    borderColor: '#582CDB',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
  submitButton: {
    backgroundColor: '#582CDB',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    width: '100%',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  successCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    padding: 24,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  successCheckBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successCheckEmoji: {
    fontSize: 32,
    fontWeight: '900',
    color: '#582CDB',
  },
  successTitle: {
    fontSize: 23,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#7F7894',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  returnContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  returnLinkText: {
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
    fontSize: 13.5,
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
    shadowOpacity: 0.25,
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
