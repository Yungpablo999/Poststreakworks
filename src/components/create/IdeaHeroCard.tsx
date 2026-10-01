import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import Animated, { Easing, FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { JarvisOrb } from '../JarvisOrb';
import { PlatformLogo, type PlatformLogoType } from '../onboarding/PlatformLogo';
import { ds } from '../../theme/colors';
import { getStarterIdeas, type StarterIdea } from '../../data';

// Create's hero: one idea, ready to use. "Another" shuffles with a spin and a
// short thinking beat so it feels like Jarvis is picking, not a random list.

const THINK_MS = 550;

interface IdeaHeroCardProps {
  isNewUser: boolean;
  niches: string[];
  platforms: string[];
  onUseIdea: (idea: StarterIdea) => void;
}

export function IdeaHeroCard({ isNewUser, niches, platforms, onUseIdea }: IdeaHeroCardProps) {
  const ideas = useMemo(() => getStarterIdeas(niches, platforms), [niches, platforms]);
  const [index, setIndex] = useState(0);
  const [thinking, setThinking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idea = ideas[index % ideas.length];
  const shown = platforms.filter((p) => ['tiktok', 'instagram', 'youtube', 'threads', 'facebook'].includes(p)).slice(0, 3);

  const spin = useSharedValue(0);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const shuffle = () => {
    if (thinking) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    spin.value = withTiming(spin.value + 1, { duration: 500, easing: Easing.out(Easing.cubic) });
    setThinking(true);
    timer.current = setTimeout(() => {
      setIndex((i) => i + 1);
      setThinking(false);
    }, THINK_MS);
  };

  return (
    <GlassCard strong radius={26} padding={20}>
      <View style={styles.topRow}>
        <JarvisOrb size={26} />
        <Text style={styles.eyebrow} numberOfLines={1}>
          {isNewUser ? 'YOUR FIRST IDEA' : "TODAY'S IDEA"}
        </Text>
        <Pressable
          onPress={shuffle}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Show me another idea"
          style={({ pressed }) => [styles.shuffleBtn, pressed && { transform: [{ scale: 0.92 }] }, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
        >
          <Animated.View style={spinStyle}>
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
              <Path d="M4 12a8 8 0 0113.7-5.7L20 8M20 3v5h-5M20 12a8 8 0 01-13.7 5.7L4 16M4 21v-5h5" stroke={ds.purple} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Animated.View>
          <Text style={styles.shuffleText}>Another</Text>
        </Pressable>
      </View>

      {thinking ? (
        <Animated.View entering={FadeIn.duration(120)} style={styles.thinking}>
          <ActivityIndicator color={ds.purple} />
          <Text style={styles.thinkingText}>Jarvis is picking…</Text>
        </Animated.View>
      ) : (
        <Animated.View key={idea.id} entering={FadeInUp.duration(360)} style={styles.body}>
          <View style={styles.formatChip}>
            <Text style={styles.formatText}>{idea.format}</Text>
          </View>
          <Text style={styles.title}>{idea.title}</Text>
          <Text style={styles.hook} numberOfLines={3}>
            “{idea.hook}”
          </Text>
          <View style={styles.metaRow}>
            {shown.length > 0 && (
              <View style={styles.logos}>
                {shown.map((p, i) => (
                  <View key={p} style={[styles.logoWrap, i > 0 && { marginLeft: -6 }]}>
                    <PlatformLogo type={p as PlatformLogoType} size={22} />
                  </View>
                ))}
              </View>
            )}
            <View style={styles.timeChip}>
              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="9" stroke={ds.purple} strokeWidth={2.2} />
                <Path d="M12 7v5l3 2" stroke={ds.purple} strokeWidth={2.2} strokeLinecap="round" />
              </Svg>
              <Text style={styles.timeText}>Best at {idea.bestTime}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      <View style={styles.cta}>
        <AppButton
          title="Use this idea"
          size="lg"
          onPress={() => onUseIdea(idea)}
          disabled={thinking}
          iconRight={
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          }
        />
      </View>

      <View style={styles.learnRow}>
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill={ds.text3} />
        </Svg>
        <Text style={styles.learnText}>
          {isNewUser ? 'Ideas sharpen as you post' : 'Based on what your audience liked'}
        </Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
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
  thinking: { height: 124, alignItems: 'center', justifyContent: 'center', gap: 8 },
  thinkingText: { fontSize: 12.5, fontWeight: '700', color: ds.text3 },
  body: { minHeight: 124, marginTop: 14 },
  formatChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    height: 22,
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(23, 20, 32, 0.05)',
  },
  formatText: { fontSize: 11.5, fontWeight: '800', color: ds.text2 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: ds.ink, letterSpacing: -0.5, marginTop: 8 },
  hook: { fontSize: 14.5, lineHeight: 21, color: ds.text2, marginTop: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  logos: { flexDirection: 'row' },
  logoWrap: { borderRadius: 8, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#FFFFFF' },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: ds.lavender,
  },
  timeText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  cta: { marginTop: 18 },
  learnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  learnText: { fontSize: 12, fontWeight: '600', color: ds.text3 },
});
