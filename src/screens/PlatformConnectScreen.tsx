import React from 'react';
import { react } from '../mascot/mascot';
import { MascotSays } from '../components/mascot/MascotSays';
import { useWebFrame, useWideFrame } from '../components/web/WebAuthHeader';
import { StyleSheet, View, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { FitLines } from '../components/ui/FitLines';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress';
import { PlatformRow } from '../components/onboarding/PlatformRow';
import type { PlatformLogoType } from '../components/onboarding/PlatformLogo';
import { JarvisOrb } from '../components/JarvisOrb';
import { ds } from '../theme/colors';

interface PlatformItem {
  id: string;
  name: string;
  description: string;
  logo: PlatformLogoType;
}

// The five Stage 1 platforms, most popular first
const PLATFORMS: PlatformItem[] = [
  { id: 'tiktok', name: 'TikTok', description: 'Videos and growth insights', logo: 'tiktok' },
  { id: 'instagram', name: 'Instagram', description: 'Posts, Reels and insights', logo: 'instagram' },
  { id: 'youtube', name: 'YouTube', description: 'Shorts and channel growth', logo: 'youtube' },
  { id: 'facebook', name: 'Facebook', description: 'Pages and groups', logo: 'facebook' },
  { id: 'threads', name: 'Threads', description: 'Text posts and replies', logo: 'threads' },
];

interface PlatformConnectScreenProps {
  onBack: () => void;
  onContinue: (connectedPlatforms: string[]) => void;
  /** Kept for compatibility; the "connect more later" link was removed (it dropped the connected list). */
  onSkipLater: () => void;
}

export const PlatformConnectScreen: React.FC<PlatformConnectScreenProps> = ({ onBack, onContinue }) => {
  const webFrame = useWebFrame();
  const wideFrame = useWideFrame();
  const [connected, setConnected] = React.useState<string[]>([]);
  const count = connected.length;

  // Counter pill bumps on every connect / disconnect
  const counterScale = useSharedValue(1);
  const counterStyle = useAnimatedStyle(() => ({ transform: [{ scale: counterScale.value }] }));

  const togglePlatform = (id: string) => {
    if (!connected.includes(id)) react('connected');
    setConnected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    counterScale.value = withSequence(withTiming(1.12, { duration: 110 }), withSpring(1, { damping: 10 }));
  };

  const handleContinue = () => {
    if (count === 0) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onContinue(connected);
  };

  // The one action: a sticky footer on phones, right under the content on desktop web
  const cta = (
    <AppButton
      title={count === 0 ? 'Pick one to continue' : 'Continue'}
      size="lg"
      disabled={count === 0}
      onPress={handleContinue}
      iconRight={
        count > 0 ? (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        ) : undefined
      }
    />
  );

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top: back + progress (step 2 of 5) */}
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
            <Animated.View entering={FadeInUp.duration(500)}>
              <OnboardingProgress current={1} />
            </Animated.View>
          </View>
        )}

        <ScrollView contentContainerStyle={[styles.scroll, wideFrame && webStyles.scroll]} showsVerticalScrollIndicator={false}>
          {/* The mascot guides each step and reacts to your choices */}
          <MascotSays text={'Connect where you post and I’ll learn what works for you.'} />
          {/* Title: always "Connect your creator" / "platforms" */}
          <Animated.View entering={FadeInUp.delay(120).duration(550)}>
            <FitLines
              lines={['Connect your creator', <Text key="p" style={styles.titleAccent}>platforms</Text>]}
              textStyle={styles.title}
              maxFontSize={40}
              accessibilityLabel="Connect your creator platforms"
            />
            {/* There's no account yet to attach a real connection to, so this step is a pick-list;
                the real connections happen from Home once the account is ready. */}
            <Text style={styles.subtitle}>Pick the ones you post on. You’ll connect them for real once your account is ready.</Text>
          </Animated.View>

          {/* Live counter */}
          <Animated.View entering={FadeIn.delay(260).duration(400)} style={styles.counterRow}>
            <Animated.View style={[styles.counterPill, count > 0 && styles.counterPillActive, counterStyle]}>
              <Text style={[styles.counterText, count > 0 && styles.counterTextActive]}>
                {count === 0 ? 'None picked yet' : `${count} picked`}
              </Text>
            </Animated.View>
          </Animated.View>

          {/* Platforms */}
          <View style={[styles.list, wideFrame && webStyles.list]}>
            {PLATFORMS.map((p, i) => (
              <Animated.View key={p.id} entering={FadeInUp.delay(300 + i * 70).duration(500)} style={wideFrame ? webStyles.listItem : undefined}>
                <PlatformRow
                  name={p.name}
                  description={p.description}
                  logo={p.logo}
                  state={connected.includes(p.id) ? 'connected' : 'idle'}
                  idleLabel="Pick"
                  onPress={() => togglePlatform(p.id)}
                />
              </Animated.View>
            ))}
          </View>

          <Animated.View entering={FadeIn.delay(700).duration(400)}>
            <Text style={styles.moreSoon}>
              More platforms are on the way. You can connect or remove any of these later.
            </Text>
          </Animated.View>

          {/* Jarvis note */}
          <Animated.View entering={FadeIn.delay(850).duration(500)} style={styles.jarvisNote}>
            <JarvisOrb size={30} />
            <Text style={styles.jarvisText}>
              <Text style={styles.jarvisName}>Jarvis: </Text>
              start with the one you post on most. I'll learn what works for you from there.
            </Text>
          </Animated.View>
          {wideFrame && <View style={webStyles.cta}>{cta}</View>}
        </ScrollView>

        {/* Sticky glass footer with the one clear action */}
        {!wideFrame && (
          <View style={styles.footer}>
            <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, styles.footerFill]} />
            <SafeAreaView edges={['bottom']} style={styles.footerInner}>
              {cta}
            </SafeAreaView>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ds.bg,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    gap: 12,
  },
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
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.6,
    color: ds.ink,
  },
  titleAccent: {
    color: ds.purple,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: ds.text2,
    marginTop: 10,
    textAlign: 'center',
  },
  counterRow: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 14,
  },
  counterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: ds.line,
  },
  counterPillActive: {
    backgroundColor: ds.greenFill,
    borderColor: ds.greenFill,
  },
  counterText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: ds.text2,
  },
  counterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    gap: 12,
  },
  moreSoon: {
    fontSize: 13,
    lineHeight: 19,
    color: ds.text3,
    textAlign: 'center',
    marginTop: 16,
  },
  jarvisNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 4,
  },
  jarvisText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: ds.text2,
  },
  jarvisName: {
    fontWeight: '800',
    color: ds.purple,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.9)',
  },
  footerFill: {
    backgroundColor: 'rgba(247, 245, 240, 0.6)',
  },
  footerInner: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
});

// Desktop web: the step uses the page like a website (wider, button under the content)
const webStyles = StyleSheet.create({
  scroll: { maxWidth: 980, paddingTop: 40, paddingBottom: 56 },
  cta: { width: '100%', maxWidth: 460, alignSelf: 'center', marginTop: 32 },
  list: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  listItem: { width: '49%' },
});
