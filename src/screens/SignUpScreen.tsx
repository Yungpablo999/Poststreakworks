import React, { useState } from 'react';
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
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress';
import { ds, dsRadius } from '../theme/colors';

// Onboarding step 4: create an account to save the plan they just made.
// One-tap Apple / Google first; email-only as the fallback (name comes later).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SocialProvider = 'apple' | 'google';

interface SignUpScreenProps {
  onBack: () => void;
  onSignIn?: () => void;
  onSubmit?: (username: string, email: string) => void;
  /** One-tap sign-up (mock: continues straight on; a real app runs the provider's sign-in). */
  onSocialSignUp?: (provider: SocialProvider) => void;
  /** The idea they kept on the "Your plan" step, shown as what they're saving. */
  savedIdeaTitle?: string;
}

// A tactile "ledge" button with a brand logo, for Apple / Google
function SocialButton({ provider, onPress }: { provider: SocialProvider; onPress: () => void }) {
  const apple = provider === 'apple';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={apple ? 'Continue with Apple' : 'Continue with Google'}
      style={styles.socialWrap}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.socialLedge, { backgroundColor: apple ? '#000000' : ds.line }]} />
          <View
            style={[
              styles.socialFace,
              apple ? styles.socialFaceApple : styles.socialFaceGoogle,
              pressed && { transform: [{ translateY: 2 }] },
            ]}
          >
            {apple ? (
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="#FFFFFF">
                <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.56.65-1.05 1.71-.92 2.73 1 .08 2.02-.51 2.62-1.23z" />
              </Svg>
            ) : (
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </Svg>
            )}
            <Text style={[styles.socialText, apple && { color: '#FFFFFF' }]}>
              {apple ? 'Continue with Apple' : 'Continue with Google'}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onBack,
  onSignIn,
  onSubmit,
  onSocialSignUp,
  savedIdeaTitle,
}) => {
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  const trimmed = email.trim();
  const valid = EMAIL_RE.test(trimmed);
  const showHint = touched && trimmed.length > 0 && !valid;

  const handleSocial = (provider: SocialProvider) => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSocialSignUp?.(provider);
  };

  const handleCreate = () => {
    if (!valid) {
      setTouched(true);
      return;
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Name is picked later; use the part before the @ for now
    const handle = trimmed.split('@')[0];
    onSubmit?.(handle, trimmed);
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
          <View style={styles.header}>
            <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back" style={styles.backBtn}>
              <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
              <View>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M15 18l-6-6 6-6" stroke={ds.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            </Pressable>
            <Animated.View entering={FadeInUp.duration(500)}>
              <OnboardingProgress current={3} />
            </Animated.View>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Animated.View entering={FadeInUp.delay(120).duration(550)}>
              <FitLines
                lines={['Save your', <Text key="p" style={styles.titleAccent}>starter plan</Text>]}
                textStyle={styles.title}
                maxFontSize={40}
                accessibilityLabel="Save your starter plan"
              />
              <Text style={styles.subtitle}>Create a free account so Jarvis can keep your plan and first idea.</Text>
            </Animated.View>

            {/* What they're saving */}
            {savedIdeaTitle ? (
              <Animated.View entering={FadeIn.delay(260).duration(450)} style={styles.savedChip}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path d="M6 3h12v18l-6-4-6 4V3z" stroke={ds.purple} strokeWidth={2.2} strokeLinejoin="round" />
                </Svg>
                <Text style={styles.savedChipText} numberOfLines={1}>
                  Saved: {savedIdeaTitle}
                </Text>
              </Animated.View>
            ) : null}

            {/* One tap first */}
            <Animated.View entering={FadeInUp.delay(320).duration(500)} style={styles.socialStack}>
              <SocialButton provider="apple" onPress={() => handleSocial('apple')} />
              <SocialButton provider="google" onPress={() => handleSocial('google')} />
            </Animated.View>

            <Animated.View entering={FadeIn.delay(440).duration(400)} style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or use your email</Text>
              <View style={styles.dividerLine} />
            </Animated.View>

            {/* Email */}
            <Animated.View entering={FadeInUp.delay(520).duration(500)}>
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
                    onSubmitEditing={handleCreate}
                    style={styles.input}
                    accessibilityLabel="Email address"
                  />
                </View>
                {showHint && (
                  <Animated.Text entering={FadeIn.duration(200)} style={styles.hint}>
                    That doesn't look quite right. Try something like you@example.com
                  </Animated.Text>
                )}
                <View style={styles.createBtn}>
                  <AppButton title="Create account" onPress={handleCreate} disabled={!valid} />
                </View>
              </GlassCard>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(650).duration(400)} style={styles.signInRow}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <Pressable onPress={onSignIn} hitSlop={8} accessibilityRole="button">
                <Text style={styles.signInLink}>Sign in</Text>
              </Pressable>
            </Animated.View>

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
  savedChip: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(237, 233, 254, 0.9)',
  },
  savedChipText: { flexShrink: 1, fontSize: 13, fontWeight: '700', color: ds.purple },
  socialStack: { gap: 12, marginTop: 20 },
  socialWrap: { width: '100%', height: 53 },
  socialLedge: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 50, borderRadius: dsRadius.md },
  socialFace: {
    height: 50,
    borderRadius: dsRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialFaceApple: { backgroundColor: '#111111' },
  socialFaceGoogle: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: ds.line },
  socialText: { fontSize: 15.5, fontWeight: '700', color: ds.ink },
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
  createBtn: { marginTop: 14 },
  signInRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  signInText: { fontSize: 14, color: ds.text2 },
  signInLink: { fontSize: 14, fontWeight: '800', color: ds.purple },
  legal: { fontSize: 12, lineHeight: 17, color: ds.text3, textAlign: 'center', marginTop: 14 },
  legalLink: { fontWeight: '700', color: ds.text2, textDecorationLine: 'underline' },
});
