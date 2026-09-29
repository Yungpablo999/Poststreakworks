import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Svg, { Path, Circle } from 'react-native-svg';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { FitLines } from '../components/ui/FitLines';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress';
import { PlatformLogo, type PlatformLogoType } from '../components/onboarding/PlatformLogo';
import { JarvisOrb } from '../components/JarvisOrb';
import { getStarterIdeas, type StarterIdea } from '../data';
import { ds } from '../theme/colors';

// Onboarding step 3: value before sign-up. Jarvis turns the creator's niches +
// platforms into a first post idea and a gentle 3-day starter plan. Nothing here
// is a stat or a score — only what they told us.

const NICHE_LABELS: Record<string, string> = {
  lifestyle: 'Lifestyle',
  comedy: 'Comedy',
  education: 'Education',
  beauty: 'Beauty & Fashion',
  food: 'Food',
  fitness: 'Fitness',
  tech: 'Tech & Business',
  music: 'Music & Dance',
  general: 'Getting started',
};

const PLATFORM_NAMES: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  threads: 'Threads',
};

const THINK_MS = 650;

interface PlanPreviewScreenProps {
  niches: string[];
  platforms: string[];
  onBack: () => void;
  onContinue: (idea: StarterIdea) => void;
}

export const PlanPreviewScreen: React.FC<PlanPreviewScreenProps> = ({ niches, platforms, onBack, onContinue }) => {
  const ideas = useMemo(() => getStarterIdeas(niches, platforms), [niches, platforms]);
  const [index, setIndex] = useState(0);
  const [thinking, setThinking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idea = ideas[index % ideas.length];

  const mainPlatform = (platforms.find((p) => p in PLATFORM_NAMES) ?? 'tiktok') as PlatformLogoType;

  const shuffle = () => {
    if (thinking) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThinking(true);
    timer.current = setTimeout(() => {
      setIndex((i) => i + 1);
      setThinking(false);
      if (Platform.OS !== 'web') Haptics.selectionAsync();
    }, THINK_MS);
  };

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleSave = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onContinue(idea);
  };

  const plan = [
    { day: 'Day 1', title: 'Post your first idea', body: idea.title, highlight: true },
    { day: 'Day 2', title: 'Check in', body: 'A quick hello. Jarvis shares a tip.', highlight: false },
    { day: 'Day 3', title: 'Post idea #2', body: 'Jarvis will have one ready for you.', highlight: false },
  ];

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
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
            <OnboardingProgress current={2} />
          </Animated.View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInUp.delay(120).duration(550)}>
            <FitLines
              lines={['Jarvis made you a', <Text key="s" style={styles.titleAccent}>starter plan</Text>]}
              textStyle={styles.title}
              maxFontSize={40}
              accessibilityLabel="Jarvis made you a starter plan"
            />
            <Text style={styles.subtitle}>Built from what you picked. Like the idea? Keep it. If not, shuffle for another.</Text>
          </Animated.View>

          {/* First post idea */}
          <Animated.View entering={FadeInUp.delay(280).duration(600)} style={styles.section}>
            <GlassCard strong radius={24} padding={18}>
              <View style={styles.ideaHeader}>
                <JarvisOrb size={28} />
                <Text style={styles.eyebrow}>YOUR FIRST POST IDEA</Text>
              </View>

              {thinking ? (
                <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(120)} style={styles.thinking}>
                  <ActivityIndicator color={ds.purple} />
                  <Text style={styles.thinkingText}>Jarvis is thinking…</Text>
                </Animated.View>
              ) : (
                <Animated.View key={idea.id} entering={FadeInUp.duration(380)}>
                  <Text style={styles.nicheTag}>{NICHE_LABELS[idea.niche] ?? 'Your niche'}</Text>
                  <Text style={styles.ideaTitle}>{idea.title}</Text>

                  <View style={styles.hookBox}>
                    <Text style={styles.hookLabel}>OPENING LINE</Text>
                    <Text style={styles.hookText}>“{idea.hook}”</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                      <PlatformLogo type={mainPlatform} size={18} />
                      <Text style={styles.metaText}>{idea.format}</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Circle cx="12" cy="12" r="9" stroke={ds.purple} strokeWidth={2.2} />
                        <Path d="M12 7v5l3 2" stroke={ds.purple} strokeWidth={2.2} strokeLinecap="round" />
                      </Svg>
                      <Text style={styles.metaText}>Try {idea.bestTime}</Text>
                    </View>
                  </View>
                </Animated.View>
              )}

              <View style={styles.shuffleRow}>
                <AppButton title="Show me another" variant="glass" onPress={shuffle} disabled={thinking} />
              </View>
            </GlassCard>
          </Animated.View>

          {/* 3-day starter plan */}
          <Animated.View entering={FadeInUp.delay(420).duration(600)} style={styles.section}>
            <GlassCard radius={24} padding={18}>
              <Text style={styles.planTitle}>Your first 3 days</Text>
              <Text style={styles.planSub}>Small steps, no pressure. Miss a day? Just pick up again.</Text>
              {plan.map((row, i) => (
                <Animated.View key={row.day} entering={FadeInUp.delay(560 + i * 110).duration(450)} style={[styles.planRow, i > 0 && styles.planRowBorder]}>
                  <View style={[styles.dayBadge, row.highlight && styles.dayBadgeActive]}>
                    <Text style={[styles.dayBadgeText, row.highlight && styles.dayBadgeTextActive]}>{row.day.replace('Day ', '')}</Text>
                  </View>
                  <View style={styles.planText}>
                    <Text style={styles.planRowTitle}>{row.title}</Text>
                    <Text style={styles.planRowBody} numberOfLines={2}>{row.body}</Text>
                  </View>
                </Animated.View>
              ))}
            </GlassCard>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.footerFill]} />
          <SafeAreaView edges={['bottom']} style={styles.footerInner}>
            <AppButton
              title="Save my plan"
              size="lg"
              onPress={handleSave}
              iconRight={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              }
            />
          </SafeAreaView>
        </View>
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
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140, width: '100%', maxWidth: 520, alignSelf: 'center' },
  title: { fontWeight: '800', letterSpacing: -0.6, color: ds.ink },
  titleAccent: { color: ds.purple },
  subtitle: { fontSize: 15, lineHeight: 22, color: ds.text2, marginTop: 10, textAlign: 'center' },
  section: { marginTop: 18 },
  ideaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  thinking: { minHeight: 172, alignItems: 'center', justifyContent: 'center', gap: 10 },
  thinkingText: { fontSize: 14, fontWeight: '700', color: ds.purple },
  nicheTag: {
    alignSelf: 'flex-start',
    fontSize: 11.5,
    fontWeight: '800',
    color: ds.purple,
    backgroundColor: 'rgba(237, 233, 254, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  ideaTitle: { fontSize: 20, lineHeight: 26, fontWeight: '800', color: ds.ink, marginTop: 10, letterSpacing: -0.3 },
  hookBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 243, 255, 0.9)',
    borderLeftWidth: 3,
    borderLeftColor: ds.purple,
  },
  hookLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: ds.text3 },
  hookText: { fontSize: 14.5, lineHeight: 21, color: ds.ink, marginTop: 4, fontWeight: '600' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: ds.line,
  },
  metaText: { fontSize: 12.5, fontWeight: '700', color: ds.ink },
  shuffleRow: { marginTop: 16 },
  planTitle: { fontSize: 17, fontWeight: '800', color: ds.ink },
  planSub: { fontSize: 13, lineHeight: 19, color: ds.text2, marginTop: 4, marginBottom: 6 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  planRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ds.line },
  dayBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(237, 233, 254, 0.9)',
  },
  dayBadgeActive: { backgroundColor: ds.purple },
  dayBadgeText: { fontSize: 15, fontWeight: '800', color: ds.purple },
  dayBadgeTextActive: { color: '#FFFFFF' },
  planText: { flex: 1, minWidth: 0 },
  planRowTitle: { fontSize: 15, fontWeight: '800', color: ds.ink },
  planRowBody: { fontSize: 13, lineHeight: 18, color: ds.text2, marginTop: 2 },
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
