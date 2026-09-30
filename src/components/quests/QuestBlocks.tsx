import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { PressableCard } from '../ui/PressableCard';
import { ds } from '../../theme/colors';

// Building blocks for the Quests tab. Rewards are XP and badges only — no
// streak-loss warnings, no countdowns.

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Progress ring ──────────────────────────────────────────────────────────
export function ProgressRing({ progress, size = 76, done }: { progress: number; size?: number; done?: boolean }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(300, withTiming(progress, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [progress, p]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.value) }));
  const color = done ? ds.greenFill : ds.purple;
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(91, 62, 232, 0.12)" strokeWidth={stroke} fill="none" />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        animatedProps={animatedProps}
      />
    </Svg>
  );
}

// Target icon that gently pulses to invite a tap
export function PulsingTarget() {
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    t.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduceMotion, t]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.08 * t.value }] }));
  return (
    <Animated.View style={style}>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={ds.purple} strokeWidth={2.4} />
        <Circle cx="12" cy="12" r="4.5" stroke={ds.purple} strokeWidth={2.4} />
        <Circle cx="12" cy="12" r="1.2" fill={ds.purple} />
      </Svg>
    </Animated.View>
  );
}

export function TodayQuestCard({
  title,
  body,
  xp,
  done,
  onStart,
}: {
  title: string;
  body: string;
  xp: number;
  done: boolean;
  onStart: () => void;
}) {
  return (
    <GlassCard strong radius={26} padding={20}>
      <View style={styles.todayTop}>
        <View style={styles.todayText}>
          <View style={styles.eyebrowChip}>
            <PulsingTarget />
            <Text style={styles.eyebrowText}>TODAY'S QUEST</Text>
          </View>
          <Text style={styles.todayTitle}>{title}</Text>
        </View>
        <View style={styles.ringWrap} accessibilityLabel={done ? 'Completed' : '0 of 1 done'}>
          <ProgressRing progress={done ? 1 : 0.04} done={done} />
          <View style={styles.ringCenter}>
            <Text style={[styles.ringXp, done && { color: ds.greenFill }]}>+{xp}</Text>
            <Text style={styles.ringXpLabel}>XP</Text>
          </View>
        </View>
      </View>
      <Text style={styles.todayBody}>{body}</Text>
      <View style={styles.todayCta}>
        <AppButton
          title={done ? 'Completed' : 'Start quest'}
          size="lg"
          variant={done ? 'quiet' : 'primary'}
          onPress={onStart}
          disabled={done}
          iconRight={
            done ? undefined : (
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )
          }
        />
      </View>
    </GlassCard>
  );
}

// ─── Quest row ──────────────────────────────────────────────────────────────
export type QuestIcon = 'idea' | 'audience' | 'calendar';

const ICONS: Record<QuestIcon, React.ReactNode> = {
  idea: (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0012 3z" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  audience: (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 17l6-6 4 4 8-8M21 7h-6M21 7v6" stroke={ds.purple} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  calendar: (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={ds.purple} strokeWidth={2.1} />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={ds.purple} strokeWidth={2.1} strokeLinecap="round" />
    </Svg>
  ),
};

function ActionPill({ label, hover }: { label: string; hover: SharedValue<number> }) {
  const arrow = useAnimatedStyle(() => ({ transform: [{ translateX: 3 * hover.value }] }));
  return (
    <View style={styles.actionPill}>
      <Text style={styles.actionText} numberOfLines={1}>
        {label}
      </Text>
      <Animated.View style={arrow}>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path d="M9 6l6 6-6 6" stroke={ds.purple} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function QuestRow({
  icon,
  title,
  xp,
  cadence,
  action,
  onPress,
}: {
  icon: QuestIcon;
  title: string;
  xp: number;
  cadence: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <PressableCard onPress={onPress} accessibilityLabel={`${title}. ${cadence}, plus ${xp} XP. ${action}`}>
      {(hover) => (
        <GlassCard strong radius={22} padding={14}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>{ICONS[icon]}</View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {title}
              </Text>
              <View style={styles.rowMeta}>
                <Text style={styles.rowXp} numberOfLines={1}>
                  +{xp} XP
                </Text>
                <View style={styles.dot} />
                <Text style={styles.rowCadence} numberOfLines={1}>
                  {cadence}
                </Text>
              </View>
            </View>
            <ActionPill label={action} hover={hover} />
          </View>
        </GlassCard>
      )}
    </PressableCard>
  );
}

// ─── Returning creators: level + totals ─────────────────────────────────────
export function LevelCard({ level, xp, active, progress }: { level: number; xp: string; active: number; progress: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(250, withTiming(progress, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [progress, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <GlassCard strong radius={24} padding={18}>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: ds.purple }]}>{level}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{xp}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>
      <View style={styles.levelRow}>
        <Text style={styles.levelLabel}>LV {level}</Text>
        <View style={styles.levelTrack}>
          <Animated.View style={[styles.levelFill, fill]} />
        </View>
        <Text style={styles.levelLabel}>LV {level + 1}</Text>
      </View>
    </GlassCard>
  );
}

// ─── Weekly challenge ───────────────────────────────────────────────────────
function PostSlot({ index, filled }: { index: number; filled: boolean }) {
  const reduceMotion = useReducedMotion();
  const s = useSharedValue(reduceMotion ? 1 : 0.4);
  useEffect(() => {
    if (reduceMotion) return;
    s.value = withDelay(350 + index * 110, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
  }, [reduceMotion, index, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={[styles.slot, filled && styles.slotFilled, style]}>
      {filled ? (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path d="M20 6L9 17l-5-5" stroke={ds.purple} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ) : (
        <Text style={styles.slotNum}>{index + 1}</Text>
      )}
    </Animated.View>
  );
}

/** Without onJoin (the challenge page itself) the join button is hidden. */
export function ChallengeCard({ done, goal, onJoin }: { done: number; goal: number; onJoin?: () => void }) {
  return (
    <View style={styles.challenge}>
      <LinearGradient colors={['#6A4BF0', '#4B2FD6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {/* Soft light blooms for depth */}
      <View pointerEvents="none" style={[styles.bloom, { top: -60, right: -40 }]} />
      <View pointerEvents="none" style={[styles.bloom, styles.bloomSmall, { bottom: -50, left: -30 }]} />

      {/* Padding lives on this inner layer so the gradient fills the whole card on web */}
      <View style={styles.challengeInner}>
        <View style={styles.challengeChip}>
          <Text style={styles.challengeChipText}>THIS WEEK'S CHALLENGE</Text>
        </View>
        <Text style={styles.challengeTitle}>Post 3 times this week</Text>
        <Text style={styles.challengeBody}>At your own pace, alongside other creators doing the same.</Text>

        <View style={styles.slots}>
          {Array.from({ length: goal }).map((_, i) => (
            <PostSlot key={i} index={i} filled={i < done} />
          ))}
          <Text style={styles.slotsLabel}>
            {done} of {goal} posted
          </Text>
        </View>

        <View style={styles.rewardRow}>
          <View style={styles.badgeIcon}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="9" r="6" stroke="#FFFFFF" strokeWidth={2.2} />
              <Path d="M8.5 13.5L7 22l5-3 5 3-1.5-8.5" stroke="#FFFFFF" strokeWidth={2.2} strokeLinejoin="round" />
            </Svg>
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rewardTitle}>Consistency badge</Text>
            <Text style={styles.rewardSub}>+250 XP when you finish</Text>
          </View>
        </View>

        {onJoin && (
          <Pressable
            onPress={onJoin}
            accessibilityRole="button"
            style={({ pressed }) => [styles.joinBtn, pressed && { transform: [{ translateY: 2 }] }, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
          >
            <Text style={styles.joinText}>Join the challenge</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Jarvis's idea pick (shuffle through a few) ─────────────────────────────
function ShuffleButton({ onPress }: { onPress: () => void }) {
  const turn = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));
  return (
    <Pressable
      onPress={() => {
        turn.value = withTiming(turn.value + 180, { duration: 320, easing: Easing.out(Easing.cubic) });
        onPress();
      }}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel="Show another idea"
      style={({ pressed }) => [styles.shuffle, pressed && { transform: [{ scale: 0.94 }] }, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
    >
      <Animated.View style={style}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" stroke={ds.purple} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

export interface PickIdea {
  id: string;
  title: string;
  hook: string;
  format: string;
}

export function JarvisPickCard({ orb, ideas, onUse }: { orb: React.ReactNode; ideas: PickIdea[]; onUse: (idea: PickIdea) => void }) {
  const [pick, setPick] = useState(0);
  if (!ideas.length) return null;
  const idea = ideas[pick % ideas.length];
  return (
    <GlassCard strong radius={24} padding={18}>
      <View style={styles.pickHead}>
        {orb}
        <Text style={styles.pickCount}>
          Idea {(pick % ideas.length) + 1} of {ideas.length}
        </Text>
        <ShuffleButton
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
            setPick((p) => p + 1);
          }}
        />
      </View>
      <Animated.View key={idea.id} entering={FadeIn.duration(260)}>
        <Text style={styles.pickTitle}>“{idea.title}”</Text>
        <View style={styles.hookBox}>
          <Text style={styles.hookLabel}>OPEN WITH</Text>
          <Text style={styles.hookText}>{idea.hook}</Text>
        </View>
        <View style={styles.formatChip}>
          <Text style={styles.formatText}>{idea.format}</Text>
        </View>
      </Animated.View>
      <View style={styles.pickCta}>
        <AppButton
          title="Use this idea"
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onUse(idea);
          }}
        />
      </View>
    </GlassCard>
  );
}

// ─── Jarvis tip ─────────────────────────────────────────────────────────────
export function JarvisTip({ orb, text }: { orb: React.ReactNode; text: string }) {
  return (
    <GlassCard radius={22} padding={16}>
      <View style={styles.row}>
        {orb}
        <Text style={styles.tipText}>{text}</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  todayTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  todayText: { flex: 1 },
  eyebrowChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 999,
    backgroundColor: ds.lavender,
  },
  eyebrowText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  todayTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: ds.ink, letterSpacing: -0.5, marginTop: 10 },
  todayBody: { fontSize: 14.5, lineHeight: 21, color: ds.text2, marginTop: 8 },
  todayCta: { marginTop: 18 },
  ringWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringXp: { fontSize: 17, fontWeight: '800', color: ds.purple, letterSpacing: -0.4 },
  ringXpLabel: { fontSize: 10, fontWeight: '800', color: ds.text3, letterSpacing: 0.6, marginTop: -2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(237, 233, 254, 0.95)',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, lineHeight: 20, fontWeight: '800', color: ds.ink },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  rowXp: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: ds.text3 },
  rowCadence: { flexShrink: 1, fontSize: 12.5, fontWeight: '600', color: ds.text3 },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 32,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: ds.lavender,
  },
  actionText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  statNum: { fontSize: 20, fontWeight: '800', color: ds.ink, letterSpacing: -0.5 },
  statLabel: { fontSize: 11.5, fontWeight: '700', color: ds.text3, marginTop: 1 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  levelLabel: { fontSize: 11.5, fontWeight: '800', color: ds.text3 },
  levelTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(91, 62, 232, 0.12)', overflow: 'hidden' },
  levelFill: { height: '100%', borderRadius: 4, backgroundColor: ds.purple },
  challenge: {
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#3F25BF',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 6,
  },
  challengeInner: { padding: 20 },
  bloom: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255, 255, 255, 0.10)' },
  bloomSmall: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(196, 181, 253, 0.18)' },
  challengeChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    height: 24,
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  challengeChipText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: '#FFFFFF' },
  challengeTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginTop: 12 },
  challengeBody: { fontSize: 14, lineHeight: 20, color: 'rgba(255, 255, 255, 0.82)', marginTop: 4 },
  slots: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  slot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderStyle: 'dashed',
  },
  slotFilled: { backgroundColor: '#FFFFFF', borderStyle: 'solid', borderColor: '#FFFFFF' },
  slotNum: { fontSize: 13, fontWeight: '800', color: 'rgba(255, 255, 255, 0.7)' },
  slotsLabel: { fontSize: 12.5, fontWeight: '700', color: 'rgba(255, 255, 255, 0.8)', marginLeft: 4 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  rewardTitle: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  rewardSub: { fontSize: 12.5, fontWeight: '600', color: 'rgba(255, 255, 255, 0.75)', marginTop: 1 },
  joinBtn: {
    marginTop: 18,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(23, 20, 32, 0.18)',
  },
  joinText: { fontSize: 15.5, fontWeight: '800', color: ds.purple },
  pickHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickCount: { flex: 1, fontSize: 12.5, fontWeight: '800', color: ds.text3 },
  shuffle: { width: 40, height: 40, borderRadius: 20, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center' },
  pickTitle: { fontSize: 19, lineHeight: 25, fontWeight: '800', color: ds.ink, letterSpacing: -0.3, marginTop: 14 },
  hookBox: { marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: 'rgba(245, 243, 255, 0.9)' },
  hookLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, color: ds.purple },
  hookText: { fontSize: 14, lineHeight: 20, color: ds.ink, marginTop: 4 },
  formatChip: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  formatText: { fontSize: 12, fontWeight: '800', color: ds.text2 },
  pickCta: { marginTop: 16 },
  tipText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: ds.text2, fontWeight: '600' },
});
