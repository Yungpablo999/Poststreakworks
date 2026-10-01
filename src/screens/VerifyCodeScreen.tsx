import React, { useEffect, useRef, useState } from 'react';
import { react } from '../mascot/mascot';
import { MascotSays } from '../components/mascot/MascotSays';
import { useWebFrame, useWideFrame } from '../components/web/WebAuthHeader';
import { StyleSheet, View, ScrollView, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { Text, TextInput } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { FitLines } from '../components/ui/FitLines';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress';
import { ds } from '../theme/colors';

// Email code step (sign-up step 5 of 5, and sign-in). Six glass boxes backed by
// one hidden input, so paste and one-time-code autofill work. Verifies itself
// on the 6th digit, then celebrates (boxes turn green in sequence) and moves on.
// Mock: any 6 digits are accepted.

const CODE_LENGTH = 6;
const RESEND_SECONDS = 45;
const CHECK_MS = 700;
const CELEBRATE_MS = 1100;

interface VerifyCodeScreenProps {
  mode: 'signup' | 'signin';
  email: string;
  username?: string;
  onBack: () => void;
  onEditEmail: () => void;
  onSuccess: (email: string) => void;
}

type Status = 'entering' | 'checking' | 'verified';

function CodeBox({ digit, index, active, status }: { digit: string; index: number; active: boolean; status: Status }) {
  const reduceMotion = useReducedMotion();
  const verified = status === 'verified';

  // Blinking caret in the active empty box
  const caret = useSharedValue(1);
  useEffect(() => {
    if (!active || digit || reduceMotion) return;
    caret.value = withRepeat(withSequence(withTiming(0, { duration: 450 }), withTiming(1, { duration: 450 })), -1);
  }, [active, digit, reduceMotion, caret]);
  const caretStyle = useAnimatedStyle(() => ({ opacity: caret.value }));

  // Success: each box pops green one after another
  const pop = useSharedValue(1);
  useEffect(() => {
    if (!verified || reduceMotion) return;
    pop.value = withDelay(index * 70, withSequence(withTiming(1.12, { duration: 140 }), withTiming(1, { duration: 160 })));
  }, [verified, index, reduceMotion, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <Animated.View
      style={[
        styles.box,
        active && status === 'entering' && styles.boxActive,
        !!digit && styles.boxFilled,
        verified && styles.boxVerified,
        popStyle,
      ]}
    >
      {/* iOS's blur ignores the parent's rounded clip, so it gets its own corners */}
      <BlurView intensity={24} tint="light" style={styles.boxBlur} />
      {digit ? (
        <Animated.View entering={ZoomIn.duration(160)}>
          <Text style={[styles.digit, verified && { color: '#FFFFFF' }]}>
            {digit}
          </Text>
        </Animated.View>
      ) : active && status === 'entering' ? (
        <Animated.View style={[styles.caret, caretStyle]} />
      ) : null}
    </Animated.View>
  );
}

export const VerifyCodeScreen: React.FC<VerifyCodeScreenProps> = ({ mode, email, onBack, onEditEmail, onSuccess }) => {
  const webFrame = useWebFrame();
  const wideFrame = useWideFrame();
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(true);
  const [status, setStatus] = useState<Status>('entering');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resentNote, setResentNote] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Resend countdown (a normal code cooldown; nothing expires for the user)
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const verify = (value: string) => {
    if (value.length !== CODE_LENGTH || status !== 'entering') return;
    setStatus('checking');
    inputRef.current?.blur();
    timers.current.push(
      setTimeout(() => {
        setStatus('verified');
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        react('celebrate');
        timers.current.push(setTimeout(() => onSuccess(email), CELEBRATE_MS));
      }, CHECK_MS),
    );
  };

  const handleChange = (text: string) => {
    if (status !== 'entering') return;
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (digits.length > code.length && Platform.OS !== 'web') Haptics.selectionAsync();
    setCode(digits);
    if (digits.length === CODE_LENGTH) verify(digits);
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCode('');
    setSecondsLeft(RESEND_SECONDS);
    setResentNote(true);
    inputRef.current?.focus();
  };

  const activeIndex = Math.min(code.length, CODE_LENGTH - 1);

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Desktop web: the website header above replaces this */}
          {!webFrame && (
            <View style={styles.header}>
              <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back" style={styles.backBtn}>
                <BlurView intensity={30} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 20, overflow: 'hidden' }]} />
                <View>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path d="M15 18l-6-6 6-6" stroke={ds.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
              </Pressable>
              {mode === 'signup' && (
                <Animated.View entering={FadeInUp.duration(500)}>
                  <OnboardingProgress current={4} />
                </Animated.View>
              )}
            </View>
          )}

          <ScrollView contentContainerStyle={[styles.scroll, wideFrame && webStyles.scroll]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* The mascot guides each step and reacts to your choices */}
            <MascotSays text={mode === 'signup' ? 'Last step! Pop in the code from your email.' : 'Check your email for your code.'} />
            <Animated.View entering={FadeInUp.delay(120).duration(550)}>
              <FitLines
                lines={['Check your', <Text key="i" style={styles.titleAccent}>inbox</Text>]}
                textStyle={styles.title}
                maxFontSize={40}
                accessibilityLabel="Check your inbox"
              />
              <Text style={styles.subtitle}>We sent a 6-digit code to</Text>
              <View style={styles.emailRow}>
                <Text style={styles.email} numberOfLines={1}>{email || 'your email'}</Text>
                <Pressable onPress={onEditEmail} hitSlop={8} accessibilityRole="button" accessibilityLabel="Change email address">
                  <Text style={styles.change}>Change</Text>
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(260).duration(550)} style={styles.section}>
              <GlassCard strong radius={26} padding={18}>
                {/* Six boxes; a transparent input sits on top so taps focus it, and paste/autofill work */}
                <View style={styles.boxesWrap}>
                  <View style={styles.boxes}>
                    {Array.from({ length: CODE_LENGTH }, (_, i) => (
                      <CodeBox key={i} index={i} digit={code[i] ?? ''} active={focused && i === activeIndex} status={status} />
                    ))}
                  </View>
                  <TextInput
                    ref={inputRef}
                    value={code}
                    onChangeText={handleChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="one-time-code"
                    maxLength={CODE_LENGTH}
                    autoFocus
                    caretHidden
                    editable={status === 'entering'}
                    accessibilityLabel="6-digit verification code"
                    style={styles.hiddenInput}
                  />
                </View>

                <View style={styles.action}>
                  {status === 'verified' ? (
                    <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.verified}>
                      <View style={styles.verifiedTick}>
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                          <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      </View>
                      <Text style={styles.verifiedText}>You're verified</Text>
                    </Animated.View>
                  ) : (
                    <AppButton
                      title={status === 'checking' ? 'Checking…' : 'Verify'}
                      onPress={() => verify(code)}
                      disabled={code.length < CODE_LENGTH || status === 'checking'}
                    />
                  )}
                </View>
              </GlassCard>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(450).duration(400)} style={styles.resendRow}>
              {resentNote && secondsLeft > RESEND_SECONDS - 4 ? (
                <Text style={styles.resendSent}>New code sent</Text>
              ) : secondsLeft > 0 ? (
                <Text style={styles.resendText}>
                  Didn't get it? Resend in <Text style={styles.resendStrong}>{secondsLeft}s</Text>
                </Text>
              ) : (
                <Pressable onPress={handleResend} hitSlop={8} accessibilityRole="button">
                  <Text style={styles.resendLink}>Resend code</Text>
                </Pressable>
              )}
            </Animated.View>
            <Text style={styles.tip}>Tip: check your spam folder too.</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const BOX_GAP = 8;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 6, gap: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, width: '100%', maxWidth: 520, alignSelf: 'center' },
  title: { fontWeight: '800', letterSpacing: -0.6, color: ds.ink },
  titleAccent: { color: ds.purple },
  subtitle: { fontSize: 15, lineHeight: 22, color: ds.text2, marginTop: 10, textAlign: 'center' },
  emailRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 2 },
  email: { flexShrink: 1, fontSize: 15, fontWeight: '800', color: ds.ink },
  change: { fontSize: 14, fontWeight: '800', color: ds.purple },
  section: { marginTop: 20 },
  boxesWrap: { position: 'relative' },
  boxes: { flexDirection: 'row', gap: BOX_GAP },
  box: {
    flex: 1,
    aspectRatio: 0.82,
    maxHeight: 64,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1.5,
    borderColor: ds.line,
  },
  boxBlur: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12.5, overflow: 'hidden' },
  boxActive: { borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  boxFilled: { borderColor: '#B9ACF7' },
  boxVerified: { backgroundColor: ds.greenFill, borderColor: ds.greenFill },
  digit: { fontSize: 24, fontWeight: '800', color: ds.ink },
  caret: { width: 2, height: 24, borderRadius: 1, backgroundColor: ds.purple },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.02,
    color: 'transparent',
    fontSize: 1,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', caretColor: 'transparent' } as object) : {}),
  },
  action: { marginTop: 16, minHeight: 49, justifyContent: 'center' },
  verified: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 49 },
  verifiedTick: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ds.greenFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: { fontSize: 16, fontWeight: '800', color: ds.green },
  resendRow: { alignItems: 'center', marginTop: 18, minHeight: 22 },
  resendText: { fontSize: 14, color: ds.text2 },
  resendStrong: { fontWeight: '800', color: ds.ink },
  resendLink: { fontSize: 14, fontWeight: '800', color: ds.purple },
  resendSent: { fontSize: 14, fontWeight: '700', color: ds.green },
  tip: { fontSize: 12.5, color: ds.text3, textAlign: 'center', marginTop: 6 },
});

// Desktop web: the step uses the page like a website (wider, button under the content)
const webStyles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', maxWidth: 460, paddingTop: 40, paddingBottom: 56 },
  cta: { width: '100%', maxWidth: 460, alignSelf: 'center', marginTop: 32 },
});
