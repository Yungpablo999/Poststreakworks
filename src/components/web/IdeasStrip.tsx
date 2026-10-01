import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { GlassCard } from '../glass/GlassCard';
import { JarvisOrb } from '../JarvisOrb';
import { getIdeaFeed, type FeedIdea, type IdeaGoal } from '../../data';
import { ds } from '../../theme/colors';
import { openComposer } from './webActions';

// Desktop web app: a row of ready-to-start ideas from the creator's topics,
// so wide pages have something useful to do instead of empty space.
// Shuffle brings a fresh set; each card starts a post with it.

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const ease = Easing.out(Easing.cubic);

const GOALS: { id: IdeaGoal; label: string }[] = [
  { id: 'often', label: 'Quick to make' },
  { id: 'followers', label: 'New followers' },
  { id: 'saves', label: 'More saves' },
  { id: 'comments', label: 'More comments' },
];

function IdeaCard({ idea, index }: { idea: FeedIdea; index: number }) {
  const lift = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -4 * lift.value }] }));
  return (
    <Animated.View entering={FadeInUp.delay(index * 70).duration(420).easing(ease)} style={styles.cardWrap}>
      <Animated.View style={[styles.fill, style]}>
        <Pressable
          onPress={() => openComposer(idea.title)}
          onHoverIn={() => (lift.value = withTiming(1, { duration: 200, easing: ease }))}
          onHoverOut={() => (lift.value = withTiming(0, { duration: 200, easing: ease }))}
          accessibilityRole="button"
          accessibilityLabel={`Start a post: ${idea.title}`}
          style={[styles.fill, pointer]}
        >
          <GlassCard strong radius={22} padding={16} style={styles.fill}>
            <View style={styles.cardTop}>
              <View style={styles.format}>
                <Text style={styles.formatText}>{idea.format}</Text>
              </View>
              <View style={styles.time}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="9" stroke={ds.text3} strokeWidth={2.2} />
                  <Path d="M12 7v5l3 2" stroke={ds.text3} strokeWidth={2.2} strokeLinecap="round" />
                </Svg>
                <Text style={styles.timeText}>{idea.bestTime}</Text>
              </View>
            </View>
            <Text style={styles.ideaTitle} numberOfLines={2}>{idea.title}</Text>
            <Text style={styles.hook} numberOfLines={3}>“{idea.hook}”</Text>
            <View style={styles.start}>
              <Text style={styles.startText}>Start this post</Text>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M5 12h14M13 6l6 6-6 6" stroke={ds.purple} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </GlassCard>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export function IdeasStrip({ niches, platforms, count = 3 }: { niches: string[]; platforms: string[]; count?: number }) {
  const [goal, setGoal] = useState<IdeaGoal>('often');
  const [round, setRound] = useState(0);
  const all = useMemo(() => getIdeaFeed(niches, goal, platforms), [niches, goal, platforms]);
  const ideas = useMemo(() => {
    if (all.length === 0) return [];
    const start = (round * count) % all.length;
    return Array.from({ length: Math.min(count, all.length) }, (_, i) => all[(start + i) % all.length]);
  }, [all, round, count]);

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <JarvisOrb size={24} />
          <View>
            <Text style={styles.title}>Ideas for you</Text>
            <Text style={styles.sub}>From your topics. Pick one and it opens ready to go.</Text>
          </View>
        </View>
        <View style={styles.headRight}>
          {GOALS.map((g) => (
            <Pressable key={g.id} onPress={() => { setGoal(g.id); setRound(0); }} accessibilityRole="button" accessibilityState={{ selected: goal === g.id }} style={[styles.goal, goal === g.id && styles.goalOn, pointer]}>
              <Text style={[styles.goalText, goal === g.id && styles.goalTextOn]}>{g.label}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setRound((r) => r + 1)} accessibilityRole="button" accessibilityLabel="Show other ideas" style={[styles.shuffle, pointer]}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M4 12a8 8 0 0113.7-5.7L20 8M20 3v5h-5M20 12a8 8 0 01-13.7 5.7L4 16M4 21v-5h5" stroke={ds.purple} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.shuffleText}>Shuffle</Text>
          </Pressable>
        </View>
      </View>
      <View key={`${goal}-${round}`} style={styles.grid}>
        {ideas.map((idea, i) => (
          <IdeaCard key={`${idea.id}-${i}`} idea={idea} index={i} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 22 },
  fill: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headRight: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  title: { fontSize: 18, fontWeight: '800', color: ds.ink, letterSpacing: -0.3 },
  sub: { fontSize: 13, fontWeight: '600', color: ds.text3, marginTop: 1 },
  goal: { paddingHorizontal: 11, height: 32, borderRadius: 999, justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.7)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' },
  goalOn: { backgroundColor: ds.purple, borderColor: ds.purple },
  goalText: { fontSize: 12.5, fontWeight: '800', color: ds.text2 },
  goalTextOn: { color: '#FFFFFF' },
  shuffle: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, height: 32, borderRadius: 999, backgroundColor: ds.lavender, marginLeft: 4 },
  shuffleText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  grid: { flexDirection: 'row', gap: 14 },
  cardWrap: { flex: 1, minWidth: 0 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  format: { paddingHorizontal: 8, height: 22, borderRadius: 999, justifyContent: 'center', backgroundColor: ds.lavender },
  formatText: { fontSize: 11, fontWeight: '800', color: ds.purple },
  time: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11.5, fontWeight: '700', color: ds.text3 },
  ideaTitle: { fontSize: 15.5, fontWeight: '800', color: ds.ink, marginTop: 10 },
  hook: { fontSize: 13, lineHeight: 18, color: ds.text2, marginTop: 4, flex: 1 },
  start: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  startText: { fontSize: 13, fontWeight: '800', color: ds.purple },
});
