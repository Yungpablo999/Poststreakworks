import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import Animated, { Easing, FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { JarvisOrb } from '../JarvisOrb';
import { PlatformLogo, type PlatformLogoType } from '../onboarding/PlatformLogo';
import { ds } from '../../theme/colors';
import { loadIdeaList } from '../../backend/ideas';
import type { FeedIdea, IdeaList } from '../../../frontend/shared/types/phase1';

// Create's hero: one idea for the creator's own topics, ready to use. The ideas come from the server
// (its idea library, or Jarvis when an AI is switched on there); "Another" shows the next one.

interface IdeaHeroCardProps {
  isNewUser: boolean;
  platforms: string[];
  onUseIdea: (idea: FeedIdea) => void;
}

type Load = { state: 'loading' } | { state: 'failed' } | { state: 'ready'; list: IdeaList };

export function IdeaHeroCard({ isNewUser, platforms, onUseIdea }: IdeaHeroCardProps) {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [index, setIndex] = useState(0);
  const mounted = useRef(true);
  const shown = platforms.filter((p) => ['tiktok', 'instagram', 'youtube', 'threads', 'facebook'].includes(p)).slice(0, 3);

  const spin = useSharedValue(0);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));

  const fetchIdeas = useCallback(async () => {
    setLoad({ state: 'loading' });
    const list = await loadIdeaList('followers');
    if (!mounted.current) return;
    setIndex(0);
    setLoad(list && list.ideas.length > 0 ? { state: 'ready', list } : { state: 'failed' });
  }, []);

  useEffect(() => {
    mounted.current = true;
    void fetchIdeas();
    return () => {
      mounted.current = false;
    };
  }, [fetchIdeas]);

  const ideas = load.state === 'ready' ? load.list.ideas : [];
  const idea = ideas.length ? ideas[index % ideas.length] : null;

  const next = () => {
    if (ideas.length < 2) return;
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    spin.value = withTiming(spin.value + 1, { duration: 500, easing: Easing.out(Easing.cubic) });
    setIndex((i) => i + 1);
  };

  return (
    <GlassCard strong radius={26} padding={20}>
      <View style={styles.topRow}>
        <JarvisOrb size={26} />
        <Text style={styles.eyebrow} numberOfLines={1}>
          {isNewUser ? 'YOUR FIRST IDEA' : "TODAY'S IDEA"}
        </Text>
        {ideas.length > 1 && (
          <Pressable
            onPress={next}
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
        )}
      </View>

      {load.state === 'loading' && (
        <View style={styles.placeholder}>
          <ActivityIndicator color={ds.purple} />
        </View>
      )}

      {load.state === 'failed' && (
        <View style={styles.placeholder}>
          <Text style={styles.failedText}>Couldn’t load ideas just now.</Text>
          <AppButton title="Try again" variant="quiet" onPress={() => void fetchIdeas()} />
        </View>
      )}

      {idea && (
        <>
          <Animated.View key={idea.id} entering={FadeInUp.duration(360)} style={styles.body}>
            <View style={styles.formatChip}>
              <Text style={styles.formatText}>{idea.format}</Text>
            </View>
            <Text style={styles.title}>{idea.title}</Text>
            <Text style={styles.hook} numberOfLines={3}>
              “{idea.hook}”
            </Text>
            {shown.length > 0 && (
              <View style={styles.logos}>
                {shown.map((p, i) => (
                  <View key={p} style={[styles.logoWrap, i > 0 && { marginLeft: -6 }]}>
                    <PlatformLogo type={p as PlatformLogoType} size={22} />
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          <View style={styles.cta}>
            <AppButton
              title="Use this idea"
              size="lg"
              onPress={() => onUseIdea(idea)}
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
            <Text style={styles.learnText}>{load.state === 'ready' && load.list.source === 'ai' ? 'Written by Jarvis for your topics' : 'Picked for the topics you chose'}</Text>
          </View>
        </>
      )}
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
  placeholder: { minHeight: 124, alignItems: 'center', justifyContent: 'center', gap: 10 },
  failedText: { fontSize: 14, fontWeight: '700', color: ds.text2 },
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
  logos: { flexDirection: 'row', marginTop: 14 },
  logoWrap: { borderRadius: 8, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#FFFFFF' },
  cta: { marginTop: 18 },
  learnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  learnText: { fontSize: 12, fontWeight: '600', color: ds.text3 },
});
