import React, { useEffect, useState } from 'react';
import { View, Image, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { JarvisOrb } from '../JarvisOrb';
import { ds, goldTokens } from '../../theme/colors';
import { CheckInCard } from '../CheckInCard';

// Day-0 Home for brand-new creators. No stats, no streak counts, no fake
// numbers: a warm welcome, one clear next step, and a gentle check-in.
// Glass cards rise in one after another; the ghost floats; the three steps
// Jarvis helps with light up in turn so the first action explains itself.

interface HomeDayZeroProps {
  tier: 'free' | 'pro';
  firstName?: string;
  isDark?: boolean;
  onPlanFirstPost: () => void;
  onOpenSchedule?: () => void;
  onOpenGrowth?: () => void;
  onOpenQuests?: () => void;
  onOpenVoiceStudio?: () => void;
}

const STEP_MS = 1400;

// ─── Floating ghost ─────────────────────────────────────────────────────────
function FloatingGhost() {
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    t.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduceMotion, t]);
  const float = useAnimatedStyle(() => ({ transform: [{ translateY: -6 * t.value }, { rotate: `${-3 + 6 * t.value}deg` }] }));
  const shadow = useAnimatedStyle(() => ({ transform: [{ scaleX: 1 - 0.18 * t.value }], opacity: 0.55 - 0.2 * t.value }));

  return (
    <View style={styles.ghostWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={float}>
        <Image source={require('../../../assets/images/jarvis-ghost-clean.png')} style={styles.ghostImage} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={[styles.ghostShadow, shadow]} />
    </View>
  );
}

// ─── Idea → Caption → Best time, lighting up in turn ────────────────────────
const STEPS = [
  {
    key: 'idea',
    label: 'Idea',
    icon: (c: string) => (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0012 3z" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
  },
  {
    key: 'caption',
    label: 'Caption',
    icon: (c: string) => (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M4 6h16M4 12h16M4 18h10" stroke={c} strokeWidth={2.2} strokeLinecap="round" />
      </Svg>
    ),
  },
  {
    key: 'time',
    label: 'Best time',
    icon: (c: string) => (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={2} />
        <Path d="M12 7v5l3 2" stroke={c} strokeWidth={2.2} strokeLinecap="round" />
      </Svg>
    ),
  },
];

function StepChip({ step, active }: { step: (typeof STEPS)[number]; active: boolean }) {
  const on = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    on.value = withTiming(active ? 1 : 0, { duration: 320 });
  }, [active, on]);
  const chip = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], ['rgba(255,255,255,0.6)', ds.lavender]),
    borderColor: interpolateColor(on.value, [0, 1], ['rgba(255,255,255,0.9)', '#C9BDFB']),
    transform: [{ translateY: -2 * on.value }],
  }));
  return (
    <Animated.View style={[styles.stepChip, chip]}>
      {step.icon(active ? ds.purple : ds.text3)}
      <Text style={[styles.stepLabel, { color: active ? ds.purple : ds.text2 }]} numberOfLines={1}>
        {step.label}
      </Text>
    </Animated.View>
  );
}

function StepPath() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), STEP_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <View style={styles.stepRow} accessibilityLabel="Jarvis helps with the idea, the caption and the best time to post">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.key}>
          {i > 0 && <View style={[styles.stepLink, i <= active && styles.stepLinkOn]} />}
          <StepChip step={s} active={i === active} />
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── A "coming up" row with hover / press feedback ──────────────────────────
function PreviewRow({
  title,
  body,
  icon,
  pro,
  first,
  onPress,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
  pro?: boolean;
  first: boolean;
  onPress?: () => void;
}) {
  const hover = useSharedValue(0);
  const chevron = useAnimatedStyle(() => ({ transform: [{ translateX: hover.value * 4 }] }));
  const bg = useAnimatedStyle(() => ({ opacity: hover.value }));

  return (
    <Pressable
      onPress={() => {
        if (!onPress) return;
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        onPress();
      }}
      onHoverIn={() => (hover.value = withTiming(1, { duration: 150 }))}
      onHoverOut={() => (hover.value = withTiming(0, { duration: 200 }))}
      onPressIn={() => (hover.value = withTiming(1, { duration: 80 }))}
      onPressOut={() => (hover.value = withTiming(0, { duration: 250 }))}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${title}. ${body}`}
      style={[styles.previewRow, !first && styles.previewDivider, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
    >
      <Animated.View pointerEvents="none" style={[styles.previewHover, bg]} />
      <View style={styles.previewIcon}>{icon}</View>
      <View style={styles.previewText}>
        <View style={styles.previewTitleRow}>
          <Text style={styles.previewTitle}>{title}</Text>
          {pro && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        <Text style={styles.previewBody}>{body}</Text>
      </View>
      {onPress && (
        <Animated.View style={chevron}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M9 6l6 6-6 6" stroke={ds.text3} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      )}
    </Pressable>
  );
}

export function HomeDayZero({
  tier,
  firstName,
  isDark = false,
  onPlanFirstPost,
  onOpenSchedule,
  onOpenGrowth,
  onOpenQuests,
  onOpenVoiceStudio,
}: HomeDayZeroProps) {
  const previews: { key: string; title: string; body: string; icon: React.ReactNode; onPress?: () => void; pro?: boolean }[] = [
    {
      key: 'schedule',
      title: 'Your schedule',
      body: 'Posts you plan will line up here.',
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="17" rx="3" stroke={ds.purple} strokeWidth={2} />
          <Path d="M16 2v4M8 2v4M3 10h18" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      ),
      onPress: onOpenSchedule,
    },
    {
      key: 'insights',
      title: 'Insights',
      body: 'After your first posts, see what your audience loves.',
      icon: (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M3 17l6-6 4 4 8-8M21 7h-6M21 7v6" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ),
      onPress: onOpenGrowth,
    },
    tier === 'pro'
      ? {
          key: 'voice',
          title: 'Voice Studio',
          body: 'Clone your voice for hands-free voiceovers.',
          pro: true,
          icon: (
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Rect x="9" y="2" width="6" height="12" rx="3" stroke={ds.purple} strokeWidth={2} />
              <Path d="M5 11a7 7 0 0014 0M12 18v4" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          ),
          onPress: onOpenVoiceStudio,
        }
      : {
          key: 'quests',
          title: 'Quests',
          body: 'Small weekly goals to help you find your rhythm.',
          icon: (
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" stroke={ds.purple} strokeWidth={2} strokeLinejoin="round" />
            </Svg>
          ),
          onPress: onOpenQuests,
        },
  ];

  return (
    <View style={styles.stack}>
      {/* 1. Welcome + the one clear next action */}
      <Animated.View entering={FadeInUp.duration(550)}>
        <GlassCard strong radius={26} padding={20}>
          <View style={styles.welcomeRow}>
            <View style={styles.welcomeText}>
              <View style={styles.dayChip}>
                <View style={styles.dayChipDot} />
                <Text style={styles.dayChipText}>DAY 1</Text>
              </View>
              <Text style={styles.welcomeTitle} numberOfLines={2}>
                Welcome{firstName ? ',' : ' to'}{'\n'}
                <Text style={styles.welcomeName}>{firstName ?? 'PostStreak'}</Text>
              </Text>
            </View>
            <FloatingGhost />
          </View>

          <Text style={styles.welcomeBody}>Let's plan your first post together.</Text>

          <View style={styles.jarvisRow}>
            <JarvisOrb size={22} />
            <Text style={styles.jarvisText}>Jarvis helps with each step</Text>
          </View>
          <StepPath />

          <View style={styles.cta}>
            <AppButton
              title="Plan your first post"
              size="lg"
              onPress={onPlanFirstPost}
              iconRight={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              }
            />
          </View>
        </GlassCard>
      </Animated.View>

      {/* 2. Gentle daily check-in */}
      <Animated.View entering={FadeInUp.delay(120).duration(550)}>
        <CheckInCard persona="new" isDark={isDark} />
      </Animated.View>

      {/* 3. What will appear here — a preview with no numbers */}
      <Animated.View entering={FadeInUp.delay(240).duration(550)}>
        <GlassCard radius={26} padding={0}>
          <View style={styles.previewHeader}>
            <Text style={styles.cardTitle}>Coming up on your Home</Text>
            <Text style={styles.cardSub}>Fills in as you post</Text>
          </View>
          {previews.map((p, i) => (
            <PreviewRow key={p.key} first={i === 0} title={p.title} body={p.body} icon={p.icon} pro={p.pro} onPress={p.onPress} />
          ))}
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  welcomeText: { flex: 1 },
  dayChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 999,
    backgroundColor: ds.lavender,
    marginBottom: 8,
  },
  dayChipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ds.purple },
  dayChipText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  welcomeTitle: { fontSize: 28, lineHeight: 33, fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  welcomeName: { color: ds.purple },
  ghostWrap: { width: 72, height: 78, alignItems: 'center', justifyContent: 'center' },
  ghostImage: { width: 64, height: 64 },
  ghostShadow: { width: 30, height: 5, borderRadius: 3, backgroundColor: 'rgba(63, 37, 191, 0.14)', marginTop: 0 },
  welcomeBody: { fontSize: 15.5, lineHeight: 22, color: ds.text2, marginTop: 10 },
  jarvisRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  jarvisText: { fontSize: 12.5, fontWeight: '700', color: ds.text3 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  stepLink: { width: 8, height: 2, borderRadius: 1, backgroundColor: ds.line, marginHorizontal: 3 },
  stepLinkOn: { backgroundColor: '#C9BDFB' },
  // Icon over label, so all three fit side by side even on 320-wide screens
  stepChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 56,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  stepLabel: { fontSize: 12, fontWeight: '800' },
  cta: { marginTop: 18 },
  previewHeader: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2 },
  cardSub: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 2 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 20, minHeight: 60 },
  previewDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(23, 20, 32, 0.08)' },
  previewHover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(237, 233, 254, 0.55)' },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(237, 233, 254, 0.9)',
  },
  previewText: { flex: 1 },
  previewTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewTitle: { fontSize: 15, fontWeight: '800', color: ds.ink },
  previewBody: { fontSize: 13, lineHeight: 18, marginTop: 2, color: ds.text2 },
  proBadge: {
    backgroundColor: goldTokens.light,
    borderColor: goldTokens.border,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  proBadgeText: { color: goldTokens.dark, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});
