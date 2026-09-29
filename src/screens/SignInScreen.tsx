import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Platform, KeyboardAvoidingView, Image, Alert } from 'react-native';
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

// Sign in: one-tap Apple / Google first (same as sign-up), or an email code.
// The email path goes to the Verify screen (without the sign-up progress card).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignInScreenProps {
  onBack: () => void;
  onCreateAccount: () => void;
  onSubmit?: (email: string) => void;
  /** One-tap sign-in (mock: goes straight in; a real app runs the provider's sign-in). */
  onSocialSignIn?: (provider: SocialProvider) => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ onBack, onCreateAccount, onSubmit, onSocialSignIn }) => {
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
          <View style={styles.header}>
            <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back" style={styles.backBtn}>
              <BlurView intensity={30} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 20, overflow: 'hidden' }]} />
              <View>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M15 18l-6-6 6-6" stroke={ds.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* The mascot floats in to say hello */}
            <Animated.View entering={FadeInUp.duration(650)} style={styles.mascotWrap}>
              <View style={styles.mascotHalo}>
                <Image
                  source={require('../../assets/images/jarvis-ghost-clean.png')}
                  style={styles.mascot}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(140).duration(550)}>
              <FitLines
                lines={['Welcome', <Text key="b" style={styles.titleAccent}>back</Text>]}
                textStyle={styles.title}
                maxFontSize={38}
                accessibilityLabel="Welcome back"
              />
              <Text style={styles.subtitle}>One tap, or a code by email.</Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(280).duration(500)} style={styles.socialStack}>
              <SocialButton provider="apple" onPress={() => handleSocial('apple')} />
              <SocialButton provider="google" onPress={() => handleSocial('google')} />
            </Animated.View>

            <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or use your email</Text>
              <View style={styles.dividerLine} />
            </Animated.View>

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
                  <Animated.Text entering={FadeIn.duration(200)} style={styles.hint}>
                    That doesn't look quite right. Try something like you@example.com
                  </Animated.Text>
                )}
                <View style={styles.sendBtn}>
                  <AppButton title="Send me a code" onPress={handleSendCode} disabled={!valid} />
                </View>
              </GlassCard>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(620).duration(400)} style={styles.switchRow}>
              <Text style={styles.switchText}>New here? </Text>
              <Pressable onPress={onCreateAccount} hitSlop={8} accessibilityRole="button">
                <Text style={styles.switchLink}>Create an account</Text>
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
  sendBtn: { marginTop: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  switchText: { fontSize: 14, color: ds.text2 },
  switchLink: { fontSize: 14, fontWeight: '800', color: ds.purple },
  legal: { fontSize: 12, lineHeight: 17, color: ds.text3, textAlign: 'center', marginTop: 14 },
  legalLink: { fontWeight: '700', color: ds.text2, textDecorationLine: 'underline' },
});
