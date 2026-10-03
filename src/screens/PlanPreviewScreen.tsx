import React, { useState } from 'react';
import { MascotSays } from '../components/mascot/MascotSays';
import { useWebFrame, useWideFrame } from '../components/web/WebAuthHeader';
import { StyleSheet, View, ScrollView, Pressable, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Svg, { Path, Circle } from 'react-native-svg';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { FitLines } from '../components/ui/FitLines';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress';
import { JarvisOrb } from '../components/JarvisOrb';
import type { FeedIdea } from '../../frontend/shared/types/phase1';
import { loadStarterIdeas } from '../backend/ideas';
import { useAsync } from '../hooks/useAsync';
import { ds } from '../theme/colors';

// Onboarding step 3: value before sign-up, built to be scanned in seconds: their first post, from the
// PostStreak idea library for the topics they picked. (Their account numbers wait until they have
// connected a real account; nothing is shown here that isn't theirs.)

interface PlanPreviewScreenProps {
  niches: string[];
  platforms: string[];
  onBack: () => void;
  onContinue: (idea: FeedIdea) => void;
}

export const PlanPreviewScreen: React.FC<PlanPreviewScreenProps> = ({ niches, platforms, onBack, onContinue }) => {
  const webFrame = useWebFrame();
  const wideFrame = useWideFrame();
  const loaded = useAsync(() => loadStarterIdeas(niches, platforms), [niches.join('|'), platforms.join('|')]);
  const ideas = loaded.data ?? [];
  const [index, setIndex] = useState(0);
  const idea: FeedIdea | undefined = ideas.length ? ideas[index % ideas.length] : undefined;

  // Shuffle icon spins a full turn on each tap
  const spin = useSharedValue(0);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));

  const shuffle = () => {
    if (ideas.length < 2) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    spin.value = withTiming(spin.value + 1, { duration: 500, easing: Easing.out(Easing.cubic) });
    setIndex((i) => i + 1);
  };

  const handleSave = () => {
    if (!idea) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onContinue(idea);
  };

  // The one action: a sticky footer on phones, right under the content on desktop web
  const cta = (
    <AppButton
      title="Save my plan"
      size="lg"
      disabled={!idea}
      onPress={handleSave}
      iconRight={
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      }
    />
  );

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
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
              <OnboardingProgress current={2} />
            </Animated.View>
          </View>
        )}

        <ScrollView contentContainerStyle={[styles.scroll, wideFrame && webStyles.scroll]} showsVerticalScrollIndicator={false}>
          {/* The mascot guides each step and reacts to your choices */}
          <MascotSays text={'Look! I made you a starter plan.'} />
          <Animated.View entering={FadeInUp.delay(120).duration(550)}>
            <FitLines
              lines={['Jarvis made you a', <Text key="s" style={styles.titleAccent}>starter plan</Text>]}
              textStyle={styles.title}
              maxFontSize={40}
              accessibilityLabel="Jarvis made you a starter plan"
            />
          </Animated.View>

          {/* Their first post */}
          <Animated.View entering={FadeInUp.delay(380).duration(600)} style={styles.section}>
            <GlassCard strong radius={26} padding={20}>
              <View style={styles.ideaHeader}>
                <JarvisOrb size={26} />
                <Text style={styles.eyebrow} numberOfLines={1}>FIRST POST</Text>
                <Pressable
                  onPress={shuffle}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Show me another idea"
                  style={({ pressed }) => [styles.shuffleBtn, pressed && { transform: [{ scale: 0.92 }] }]}
                >
                  <Animated.View style={spinStyle}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M4 12a8 8 0 0113.7-5.7L20 8M20 3v5h-5M20 12a8 8 0 01-13.7 5.7L4 16M4 21v-5h5" stroke={ds.purple} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </Animated.View>
                  <Text style={styles.shuffleText}>Another</Text>
                </Pressable>
              </View>

              {!idea ? (
                <View style={styles.thinking}>
                  {loaded.failed ? (
                    <>
                      <Text style={styles.meta}>Couldn’t load your ideas.</Text>
                      <Text style={[styles.meta, { color: ds.purple }]} onPress={loaded.reload} accessibilityRole="button">
                        Try again
                      </Text>
                    </>
                  ) : (
                    <ActivityIndicator color={ds.purple} />
                  )}
                </View>
              ) : (
                <Animated.View key={idea.id} entering={FadeInUp.duration(350)} style={styles.ideaBody}>
                  <Text style={styles.ideaTitle}>{idea.title}</Text>
                  <Text style={styles.hook} numberOfLines={2}>“{idea.hook}”</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.meta}>{idea.format}</Text>
                    <View style={styles.metaDot} />
                    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                      <Circle cx="12" cy="12" r="9" stroke={ds.text2} strokeWidth={2.2} />
                      <Path d="M12 7v5l3 2" stroke={ds.text2} strokeWidth={2.2} strokeLinecap="round" />
                    </Svg>
                    <Text style={styles.meta}>Try posting around {idea.bestTime}</Text>
                  </View>
                </Animated.View>
              )}
            </GlassCard>
            <Text style={styles.nextSteps}>You can pick a different idea any time from Create.</Text>
          </Animated.View>
          {wideFrame && <View style={webStyles.cta}>{cta}</View>}
        </ScrollView>

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
  root: { flex: 1, backgroundColor: ds.bg },
  safeArea: { flex: 1 },
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
  scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 140, width: '100%', maxWidth: 520, alignSelf: 'center' },
  title: { fontWeight: '800', letterSpacing: -0.6, color: ds.ink },
  titleAccent: { color: ds.purple },
  section: { marginTop: 16 },
  ideaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple, flex: 1 },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(237, 233, 254, 0.9)',
  },
  shuffleText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  thinking: { height: 104, alignItems: 'center', justifyContent: 'center', gap: 6 },
  ideaBody: { minHeight: 104, marginTop: 12 },
  ideaTitle: { fontSize: 20, lineHeight: 26, fontWeight: '800', color: ds.ink, letterSpacing: -0.3 },
  hook: { fontSize: 14.5, lineHeight: 21, color: ds.text2, marginTop: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  meta: { fontSize: 12.5, fontWeight: '700', color: ds.text2 },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: ds.text3 },
  nextSteps: { fontSize: 13, color: ds.text3, textAlign: 'center', marginTop: 12 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.9)',
  },
  footerFill: { backgroundColor: 'rgba(247, 245, 240, 0.6)' },
  footerInner: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, width: '100%', maxWidth: 520, alignSelf: 'center' },
});

// Desktop web: the step uses the page like a website (wider, button under the content)
const webStyles = StyleSheet.create({
  scroll: { maxWidth: 760, paddingTop: 40, paddingBottom: 56 },
  cta: { width: '100%', maxWidth: 460, alignSelf: 'center', marginTop: 32 },
});
