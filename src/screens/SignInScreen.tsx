import React, { useState } from 'react';
import { MascotSays } from '../components/mascot/MascotSays';
import { useWebFrame, useWideFrame } from '../components/web/WebAuthHeader';
import { StyleSheet, View, ScrollView, Pressable, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { Text, TextInput } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { FitLines } from '../components/ui/FitLines';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { SocialButton, type SocialProvider } from '../components/auth/SocialButton';
import { ds } from '../theme/colors';
import type { TestAccount } from '../../frontend/shared/types/phase1';

// Sign in: one-tap Apple / Google first (same as sign-up), or an email code.
// The email path goes to the Verify screen (without the sign-up progress card).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignInScreenProps {
  /** Leave out to hide the back button (the web app's first screens) */
  onBack?: () => void;
  onCreateAccount: () => void;
  onSubmit?: (email: string) => void;
  /** One-tap sign-in (mock: goes straight in; a real app runs the provider's sign-in). */
  onSocialSignIn?: (provider: SocialProvider) => void;
  /** The code is being sent. */
  busy?: boolean;
  /** Why the code couldn't be sent (shown under the email box). */
  error?: string | null;
  /** Which one-tap buttons to show. Leave out for both; an empty list hides them (and "or use your email"). */
  providers?: SocialProvider[];
  /** Local testing: the seeded accounts to sign in as with one tap (empty everywhere else). */
  testAccounts?: TestAccount[];
  onTestAccount?: (email: string) => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ onBack, onCreateAccount, onSubmit, onSocialSignIn, busy = false, error, providers, testAccounts = [], onTestAccount }) => {
  const showApple = !providers || providers.includes('apple');
  const showGoogle = !providers || providers.includes('google');
  const showSocial = showApple || showGoogle;
  const webFrame = useWebFrame();
  const wideFrame = useWideFrame();
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  const trimmed = email.trim();
  const valid = EMAIL_RE.test(trimmed);
  const showHint = touched && trimmed.length > 0 && !valid;

  const handleSocial = (provider: SocialProvider) => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSocialSignIn?.(provider);
  };

  const handleSendCode = () => {
    if (busy) return;
    if (!valid) {
      setTouched(true);
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit?.(trimmed);
  };

  const showLegal = (which: 'Terms' | 'Privacy') => {
    const msg = `${which} will open here.`;
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert(which, msg);
  };

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Desktop web: the website header above replaces this */}
          {!webFrame && (
            <View style={styles.header}>
              {onBack && (
                <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back" style={styles.backBtn}>
                  <BlurView intensity={30} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 20, overflow: 'hidden' }]} />
                  <View>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M15 18l-6-6 6-6" stroke={ds.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                </Pressable>
              )}
            </View>
          )}

          <ScrollView contentContainerStyle={[styles.scroll, wideFrame && webStyles.scroll]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* The mascot guides each step and reacts to your choices */}
            <MascotSays text={'Welcome back! Good to see you.'} />

            <Animated.View entering={FadeInUp.delay(140).duration(550)}>
              <FitLines
                lines={['Welcome', <Text key="b" style={styles.titleAccent}>back</Text>]}
                textStyle={styles.title}
                maxFontSize={38}
                accessibilityLabel="Welcome back"
              />
              <Text style={styles.subtitle}>One tap, or a code by email.</Text>
            </Animated.View>

            {showSocial && (
              <>
                <Animated.View entering={FadeInUp.delay(280).duration(500)} style={styles.socialStack}>
                  {showApple && <SocialButton provider="apple" onPress={() => handleSocial('apple')} />}
                  {showGoogle && <SocialButton provider="google" onPress={() => handleSocial('google')} />}
                </Animated.View>

                <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or use your email</Text>
                  <View style={styles.dividerLine} />
                </Animated.View>
              </>
            )}
            {!showSocial && <View style={{ height: 20 }} />}

            <Animated.View entering={FadeInUp.delay(480).duration(500)}>
              <GlassCard strong radius={24} padding={16}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputWrap, focused && styles.inputWrapFocused, showHint && styles.inputWrapHint]}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M4 6h16v12H4z" stroke={focused ? ds.purple : ds.text3} strokeWidth={2} strokeLinejoin="round" />
                    <Path d="M4 7l8 6 8-6" stroke={focused ? ds.purple : ds.text3} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocused(true)}
                    onBlur={() => {
                      setFocused(false);
                      setTouched(true);
                    }}
                    placeholder="you@example.com"
                    placeholderTextColor={ds.text3}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmitEditing={handleSendCode}
                    style={styles.input}
                    accessibilityLabel="Email address"
                  />
                </View>
                {showHint && (
                  <Animated.View entering={FadeIn.duration(200)}>
                    <Text style={styles.hint}>
                      That doesn't look quite right. Try something like you@example.com
                    </Text>
                  </Animated.View>
                )}
                {error ? (
                  <Animated.View entering={FadeIn.duration(200)}>
                    <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</Text>
                  </Animated.View>
                ) : null}
                <View style={styles.sendBtn}>
                  <AppButton title={busy ? 'Sending your code…' : 'Send me a code'} onPress={handleSendCode} disabled={!valid || busy} />
                </View>
              </GlassCard>
            </Animated.View>

            {testAccounts.length > 0 && (
              <Animated.View entering={FadeIn.delay(560).duration(400)} style={styles.testWrap}>
                <GlassCard radius={24} padding={16}>
                  <Text style={styles.testTitle}>Test accounts</Text>
                  <Text style={styles.testNote}>This computer only. Real accounts with real data in the local database, signed in with one tap.</Text>
                  {testAccounts.map((a) => (
                    <Pressable
                      key={a.email}
                      onPress={() => !busy && onTestAccount?.(a.email)}
                      disabled={busy}
                      accessibilityRole="button"
                      accessibilityLabel={`Sign in as ${a.label}`}
                      style={({ pressed }) => [styles.testRow, pressed && { opacity: 0.8 }, busy && { opacity: 0.5 }]}
                    >
                      <View style={styles.flex}>
                        <Text style={styles.testLabel}>{a.label}</Text>
                        <Text style={styles.testBlurb}>{a.displayName}. {a.blurb}</Text>
                      </View>
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path d="M9 6l6 6-6 6" stroke={ds.purple} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </Pressable>
                  ))}
                </GlassCard>
              </Animated.View>
            )}

            {/* Desktop web shows this switch in the header, so it isn't repeated */}
            {!webFrame && (
              <Animated.View entering={FadeIn.delay(620).duration(400)} style={styles.switchRow}>
                <Text style={styles.switchText}>New here? </Text>
                <Pressable onPress={onCreateAccount} hitSlop={8} accessibilityRole="button">
                  <Text style={styles.switchLink}>Create an account</Text>
                </Pressable>
              </Animated.View>
            )}

            <Text style={styles.legal}>
              By continuing you agree to our{' '}
              <Text style={styles.legalLink} onPress={() => showLegal('Terms')}>Terms</Text> and{' '}
              <Text style={styles.legalLink} onPress={() => showLegal('Privacy')}>Privacy Policy</Text>.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 6 },
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
  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32, width: '100%', maxWidth: 520, alignSelf: 'center' },
  mascotWrap: { alignItems: 'center', marginBottom: 12 },
  mascotHalo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#3F25BF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  mascot: { width: 60, height: 60 },
  title: { fontWeight: '800', letterSpacing: -0.6, color: ds.ink },
  titleAccent: { color: ds.purple },
  subtitle: { fontSize: 15, lineHeight: 22, color: ds.text2, marginTop: 10, textAlign: 'center' },
  socialStack: { gap: 12, marginTop: 22 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(23, 20, 32, 0.15)' },
  dividerText: { fontSize: 12.5, fontWeight: '700', color: ds.text3 },
  label: { fontSize: 13, fontWeight: '800', color: ds.ink, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.5,
    borderColor: ds.line,
  },
  inputWrapFocused: { borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  inputWrapHint: { borderColor: '#A99BFF' },
  // The glass field's purple border shows focus; drop the browser's own outline on web
  input: { flex: 1, fontSize: 16, color: ds.ink, height: '100%', ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}) },
  hint: { fontSize: 12.5, lineHeight: 17, color: ds.purple, marginTop: 8, fontWeight: '600' },
  error: { fontSize: 13, lineHeight: 18, color: '#B3261E', marginTop: 10, fontWeight: '600' },
  sendBtn: { marginTop: 14 },
  testWrap: { marginTop: 18 },
  testTitle: { fontSize: 13, fontWeight: '800', color: ds.ink },
  testNote: { fontSize: 12, lineHeight: 17, color: ds.text3, marginTop: 4, marginBottom: 6 },
  testRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(23, 20, 32, 0.12)' },
  testLabel: { fontSize: 14.5, fontWeight: '800', color: ds.ink },
  testBlurb: { fontSize: 12, lineHeight: 17, color: ds.text2, marginTop: 2 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  switchText: { fontSize: 14, color: ds.text2 },
  switchLink: { fontSize: 14, fontWeight: '800', color: ds.purple },
  legal: { fontSize: 12, lineHeight: 17, color: ds.text3, textAlign: 'center', marginTop: 14 },
  legalLink: { fontWeight: '700', color: ds.text2, textDecorationLine: 'underline' },
});

// Desktop web: the step uses the page like a website (wider, button under the content)
const webStyles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', maxWidth: 460, paddingTop: 40, paddingBottom: 56 },
  cta: { width: '100%', maxWidth: 460, alignSelf: 'center', marginTop: 32 },
});
