import React, { useEffect, useMemo, useState } from 'react';
import { usePageWidth } from '../hooks/useBreakpoint';
import { View, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { FitLines } from '../components/ui/FitLines';
import { PressableCard } from '../components/ui/PressableCard';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { JarvisOrb } from '../components/JarvisOrb';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { ProUpsellCard } from '../components/home/ProUpsellCard';
import { MonthlyHistoryCard, WhoAudienceCard } from '../components/growth/ProInsights';
import { ConnectAccountsSheet } from '../components/growth/ConnectAccountsSheet';
import { PlatformLogo, type PlatformLogoType } from '../components/onboarding/PlatformLogo';
import { ds } from '../theme/colors';

// Audience, up close (returning creators; opened from the audience card on
// Growth). Everything here is tappable: the platform split, the new-followers
// bars and the platform rows. Sample numbers until real accounts sync; the
// totals match the Growth card (24.8K).

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const smooth = { duration: 260, easing: Easing.out(Easing.cubic) };
const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

// ─── Sample data ────────────────────────────────────────────────────────────
interface PlatformSlice {
  id: PlatformLogoType;
  name: string;
  followers: number;
  newThisMonth: number;
  color: string;
}

const PLATFORMS: PlatformSlice[] = [
  { id: 'tiktok', name: 'TikTok', followers: 12400, newThisMonth: 780, color: '#5B3EE8' },
  { id: 'instagram', name: 'Instagram', followers: 7800, newThisMonth: 310, color: '#8B7CF0' },
  { id: 'youtube', name: 'YouTube', followers: 4600, newThisMonth: 110, color: '#C4B5FD' },
];
const TOTAL = PLATFORMS.reduce((a, p) => a + p.followers, 0);

type Period = 'week' | 'month' | 'quarter';
const PERIODS: { id: Period; label: string }[] = [
  { id: 'week', label: '7 days' },
  { id: 'month', label: '4 weeks' },
  { id: 'quarter', label: '3 months' },
];

interface Bar {
  id: string;
  label: string;
  when: string;
  gain: number;
  /** The post that went out around then (plain description, no hype) */
  post?: string;
}

const BARS: Record<Period, Bar[]> = {
  week: [
    { id: 'mon', label: 'M', when: 'Monday', gain: 120 },
    { id: 'tue', label: 'T', when: 'Tuesday', gain: 160, post: 'Your Reel about morning routines' },
    { id: 'wed', label: 'W', when: 'Wednesday', gain: 140 },
    { id: 'thu', label: 'T', when: 'Thursday', gain: 340, post: 'Your TikTok “3 creator mistakes I stopped making”' },
    { id: 'fri', label: 'F', when: 'Friday', gain: 210 },
    { id: 'sat', label: 'S', when: 'Saturday', gain: 180, post: 'Your weekend Q&A' },
    { id: 'sun', label: 'S', when: 'Sunday', gain: 130 },
  ],
  month: [
    { id: 'w1', label: 'Wk 1', when: 'Week 1', gain: 680 },
    { id: 'w2', label: 'Wk 2', when: 'Week 2', gain: 840, post: 'You posted 4 times this week' },
    { id: 'w3', label: 'Wk 3', when: 'Week 3', gain: 1060, post: 'Your hook experiment series' },
    { id: 'w4', label: 'Wk 4', when: 'This week', gain: 1280, post: 'Your TikTok “3 creator mistakes I stopped making”' },
  ],
  quarter: [
    { id: 'aug', label: 'Aug', when: 'August', gain: 2840 },
    { id: 'sep', label: 'Sep', when: 'September', gain: 3950, post: 'You started posting 3 times a week' },
    { id: 'oct', label: 'Oct', when: 'October so far', gain: 5210, post: 'Your creator-advice TikToks' },
  ],
};

const SIGNALS = [
  { id: 'saves', label: 'Saves', value: 842, word: 'Strong', meaning: 'People keep your posts to come back to. Tips and lists do this best.' },
  { id: 'comments', label: 'Comments', value: 316, word: 'Steady', meaning: 'People reply when you end with a question they can answer quickly.' },
  { id: 'shares', label: 'Shares', value: 529, word: 'Strong', meaning: 'People send your posts to friends. Relatable ones travel furthest.' },
] as const;

const fmt = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString('en-US'));

// ─── Count-up number ────────────────────────────────────────────────────────
function CountUp({ value, style }: { value: number; style: object }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / 900);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <Text style={style}>{shown.toLocaleString('en-US')}</Text>;
}

// ─── Platform split bar ─────────────────────────────────────────────────────
function SplitSegment({ p, focus }: { p: PlatformSlice; focus: string | null }) {
  const grow = useSharedValue(0);
  const dim = useSharedValue(1);
  useEffect(() => {
    grow.value = withDelay(250, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [grow]);
  useEffect(() => {
    dim.value = withTiming(focus && focus !== p.id ? 0.25 : 1, smooth);
  }, [focus, p.id, dim]);
  const style = useAnimatedStyle(() => ({ width: `${(p.followers / TOTAL) * 100 * grow.value}%`, opacity: dim.value }));
  return <Animated.View style={[styles.segment, { backgroundColor: p.color }, style]} />;
}

// ─── Period switch (sliding pill) ───────────────────────────────────────────
function PeriodSwitch({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const [w, setW] = useState(0);
  const idx = PERIODS.findIndex((p) => p.id === value);
  const cell = w / PERIODS.length;
  const x = useSharedValue(0);
  useEffect(() => {
    if (cell > 0) x.value = withTiming(idx * cell, smooth);
  }, [idx, cell, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View
      style={styles.switchTrack}
      accessibilityRole="tablist"
      onLayout={(e) => {
        const nw = e.nativeEvent.layout.width - 6;
        if (Math.abs(nw - w) > 1) {
          setW(nw);
          x.value = idx * (nw / PERIODS.length);
        }
      }}
    >
      {cell > 0 && <Animated.View pointerEvents="none" style={[styles.switchPill, { width: cell }, pill]} />}
      {PERIODS.map((p) => {
        const on = p.id === value;
        return (
          <Pressable
            key={p.id}
            onPress={() => {
              tick();
              onChange(p.id);
            }}
            style={[styles.switchCell, pointer]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.switchText, on && styles.switchTextOn]} numberOfLines={1}>
              {p.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── One bar ────────────────────────────────────────────────────────────────
const CHART_H = 120;
function GrowthBar({ bar, ratio, index, on, onPress }: { bar: Bar; ratio: number; index: number; on: boolean; onPress: () => void }) {
  const h = useSharedValue(0);
  const sel = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    h.value = withDelay(120 + index * 60, withTiming(Math.max(0.06, ratio) * CHART_H, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [h, index, ratio]);
  useEffect(() => {
    sel.value = withTiming(on ? 1 : 0, smooth);
  }, [on, sel]);
  const fill = useAnimatedStyle(() => ({ height: h.value }));
  const onStyle = useAnimatedStyle(() => ({ opacity: sel.value }));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`${bar.when}, ${bar.gain} new followers`}
      style={[styles.barCol, pointer]}
    >
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, fill]}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.barFillOn, onStyle]} />
        </Animated.View>
      </View>
      <Text style={[styles.barLabel, on && styles.barLabelOn]} numberOfLines={1}>
        {bar.label}
      </Text>
    </Pressable>
  );
}

interface AudienceBreakdownScreenProps {
  /** Pro members see the Pro insight instead of the upgrade card. */
  tier?: 'free' | 'pro';
  onBack: () => void;
  onOpenPostPerformance?: () => void;
  onOpenPlatformGrowth?: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenCreate?: (prefillTopic?: string) => void;
  onOpenPostComposer?: (prefillTitle?: string) => void;
  onOpenPlatformConnect?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

export const AudienceBreakdownScreen: React.FC<AudienceBreakdownScreenProps> = ({
  onBack,
  onOpenPlatformGrowth,
  onLogout,
  onOpenJarvisPro,
  onNavigateTab,
  onOpenCreate,
  onOpenPostComposer,
  userProfile,
  onSaveProfile,
  tier = 'free',
}) => {
  const pageWidth = usePageWidth();
  const [showProfile, setShowProfile] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('week');
  const bars = BARS[period];
  const peak = useMemo(() => bars.reduce((a, b) => (b.gain > a.gain ? b : a), bars[0]), [bars]);
  const [selBar, setSelBar] = useState(peak.id);
  const [signal, setSignal] = useState<string>('saves');

  useEffect(() => setSelBar(peak.id), [peak.id]);

  const max = Math.max(...bars.map((b) => b.gain));
  const bar = bars.find((b) => b.id === selBar) ?? peak;
  const periodTotal = bars.reduce((a, b) => a + b.gain, 0);
  const focused = PLATFORMS.find((p) => p.id === focus);
  const topic = '3 creator mistakes I stopped making';

  const enter = (d: number) => FadeInUp.delay(d).duration(500).easing(Easing.out(Easing.cubic));

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FreeAppHeader backgroundColor="transparent" onBack={onBack} onOpenJarvisPro={onOpenJarvisPro} onOpenProfile={() => setShowProfile(true)} userProfile={userProfile} />
        <ScrollView contentContainerStyle={[styles.scroll, pageWidth]} showsVerticalScrollIndicator={false}>
          <Animated.View entering={enter(0)} style={styles.headline}>
            <FitLines
              lines={['Your audience,', <Text key="a" style={styles.accent}>up close</Text>]}
              textStyle={styles.headlineText}
              maxFontSize={34}
              align="left"
              accessibilityLabel="Your audience, up close"
            />
          </Animated.View>

          {/* Total + platform split */}
          <Animated.View entering={enter(80)}>
            <GlassCard strong radius={26} padding={18}>
              <View style={styles.rowBetween}>
                <Text style={styles.eyebrow}>TOTAL AUDIENCE</Text>
                <View style={styles.upChip}>
                  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                    <Path d="M12 19V5M5 12l7-7 7 7" stroke={ds.greenFill} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                  <Text style={styles.upChipText}>1,280 this week</Text>
                </View>
              </View>
              {focused ? (
                <Animated.View key={focused.id} entering={FadeIn.duration(200)}>
                  <Text style={styles.bigNumber}>{focused.followers.toLocaleString('en-US')}</Text>
                  <Text style={styles.bigSub}>
                    on {focused.name} · {Math.round((focused.followers / TOTAL) * 100)}% of your audience
                  </Text>
                </Animated.View>
              ) : (
                <View>
                  <CountUp value={TOTAL} style={styles.bigNumber} />
                  <Text style={styles.bigSub}>across {PLATFORMS.length} platforms</Text>
                </View>
              )}

              <View style={styles.split}>
                {PLATFORMS.map((p) => (
                  <SplitSegment key={p.id} p={p} focus={focus} />
                ))}
              </View>
              <View style={styles.legend}>
                {PLATFORMS.map((p) => {
                  const on = focus === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => {
                        tick();
                        setFocus(on ? null : p.id);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      style={({ pressed }) => [styles.legendItem, on && styles.legendItemOn, pressed && styles.pressed, pointer]}
                    >
                      <View style={[styles.legendDot, { backgroundColor: p.color }]} />
                      <Text style={[styles.legendText, on && styles.legendTextOn]}>{p.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.hint}>Tap a platform to see its share</Text>
            </GlassCard>
          </Animated.View>

          {/* New followers */}
          <Animated.View entering={enter(160)}>
            <Text style={styles.section}>New followers</Text>
            <GlassCard strong radius={26} padding={16}>
              <PeriodSwitch value={period} onChange={setPeriod} />
              <View style={styles.periodTotal}>
                <Text style={styles.periodNumber}>+{periodTotal.toLocaleString('en-US')}</Text>
                <Text style={styles.periodLabel}>in the last {PERIODS.find((p) => p.id === period)?.label}</Text>
              </View>
              <View key={period} style={styles.chart}>
                {bars.map((b, i) => (
                  <GrowthBar
                    key={b.id}
                    bar={b}
                    ratio={b.gain / max}
                    index={i}
                    on={b.id === bar.id}
                    onPress={() => {
                      tick();
                      setSelBar(b.id);
                    }}
                  />
                ))}
              </View>
              <Animated.View key={`${period}-${bar.id}`} entering={FadeIn.duration(220)} style={styles.barDetail}>
                <View style={styles.rowBetween}>
                  <Text style={styles.detailWhen}>{bar.when}</Text>
                  <Text style={styles.detailGain}>+{bar.gain.toLocaleString('en-US')}</Text>
                </View>
                <Text style={styles.detailNote}>{bar.post ? `Around then: ${bar.post}` : 'A quieter stretch, no new posts.'}</Text>
              </Animated.View>
            </GlassCard>
          </Animated.View>

          {/* Platforms */}
          <Animated.View entering={enter(240)}>
            <Text style={styles.section}>Where they follow you</Text>
            <View style={styles.stack}>
              {PLATFORMS.map((p) => (
                <PressableCard key={p.id} onPress={() => onOpenPlatformGrowth?.()} accessibilityLabel={`${p.name}, ${fmt(p.followers)} followers`}>
                  <GlassCard radius={20} padding={14}>
                    <View style={styles.platRow}>
                      <PlatformLogo type={p.id} size={36} />
                      <View style={styles.flex}>
                        <Text style={styles.platName}>{p.name}</Text>
                        <Text style={styles.platSub}>+{p.newThisMonth} this month</Text>
                      </View>
                      <Text style={styles.platCount}>{fmt(p.followers)}</Text>
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Path d="M9 6l6 6-6 6" stroke={ds.text3} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </View>
                  </GlassCard>
                </PressableCard>
              ))}
            </View>
            {(
              <Pressable onPress={() => setShowAccounts(true)} accessibilityRole="button" style={({ pressed }) => [styles.manage, pressed && styles.pressed, pointer]}>
                <Text style={styles.manageText}>Add or remove accounts</Text>
              </Pressable>
            )}
          </Animated.View>

          {/* How they respond */}
          <Animated.View entering={enter(320)}>
            <Text style={styles.section}>How they respond</Text>
            <View style={styles.signals}>
              {SIGNALS.map((s) => {
                const on = signal === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      tick();
                      setSignal(s.id);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={({ pressed }) => [styles.signal, on && styles.signalOn, pressed && styles.pressed, pointer]}
                  >
                    <Text style={[styles.signalValue, on && styles.signalTextOn]}>{s.value}</Text>
                    <Text style={[styles.signalLabel, on && styles.signalTextOn]}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {SIGNALS.filter((s) => s.id === signal).map((s) => (
              <Animated.View key={s.id} entering={FadeIn.duration(220)} style={styles.signalNote}>
                <Text style={styles.signalNoteText}>
                  <Text style={styles.signalWord}>{s.word}. </Text>
                  {s.meaning}
                </Text>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Jarvis */}
          <Animated.View entering={enter(400)}>
            <GlassCard strong radius={24} padding={16} style={styles.jarvis}>
              <View style={styles.jarvisHead}>
                <JarvisOrb size={32} />
                <Text style={styles.jarvisTitle}>Jarvis noticed</Text>
              </View>
              <Text style={styles.jarvisBody}>
                Most of this week’s new followers came from TikTok, after your post “{topic}”. Another creator lesson could do the same.
              </Text>
              <View style={styles.jarvisCta}>
                <AppButton
                  title="Make a post like that"
                  onPress={() => (onOpenPostComposer ? onOpenPostComposer(topic) : onOpenCreate?.(topic))}
                />
              </View>
            </GlassCard>
          </Animated.View>

          {/* Pro */}
          <Animated.View entering={enter(480)} style={styles.pro}>
            {tier === 'pro' ? (
              <WhoAudienceCard />
            ) : (
            <ProUpsellCard
              title="See who your audience is"
              benefits={['Ages and locations', 'When they’re online', 'What else they like']}
              buttonTitle="Explore Pro"
              onUpgrade={() => onOpenJarvisPro?.()}
            />
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <FloatingTabBar activeTab="growth" onTabPress={(t) => onNavigateTab?.(t)} />
      <ConnectAccountsSheet visible={showAccounts} onClose={() => setShowAccounts(false)} />
      <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} onLogout={onLogout} initialProfile={userProfile} onSaveProfile={onSaveProfile} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  flex: { flex: 1 },
  pressed: { transform: [{ scale: 0.96 }] },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 130, width: '100%', maxWidth: 560, alignSelf: 'center' },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  accent: { color: ds.purple },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  section: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24, marginBottom: 12 },
  stack: { gap: 10 },

  upChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 24, borderRadius: 999, backgroundColor: ds.greenBg },
  upChipText: { fontSize: 11.5, fontWeight: '800', color: ds.greenFill },
  bigNumber: { fontSize: 38, lineHeight: 44, fontWeight: '800', color: ds.ink, letterSpacing: -1.2, marginTop: 10 },
  bigSub: { fontSize: 13.5, fontWeight: '600', color: ds.text2 },
  split: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', backgroundColor: ds.lavender, marginTop: 16, gap: 2 },
  segment: { height: '100%' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  legendItemOn: { borderColor: ds.purple, backgroundColor: ds.lavenderSoft },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12.5, fontWeight: '700', color: ds.text2 },
  legendTextOn: { color: ds.purple, fontWeight: '800' },
  hint: { fontSize: 12, color: ds.text3, marginTop: 10 },

  switchTrack: { flexDirection: 'row', padding: 3, height: 40, borderRadius: 999, backgroundColor: ds.lavenderSoft, borderWidth: 1, borderColor: ds.lavender },
  switchPill: { position: 'absolute', top: 3, left: 3, bottom: 3, borderRadius: 999, backgroundColor: ds.purple },
  switchCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  switchText: { fontSize: 13, fontWeight: '800', color: ds.text2 },
  switchTextOn: { color: '#FFFFFF' },
  periodTotal: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 14, flexWrap: 'wrap' },
  periodNumber: { fontSize: 24, fontWeight: '800', color: ds.ink, letterSpacing: -0.5 },
  periodLabel: { fontSize: 13, fontWeight: '600', color: ds.text3 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 14 },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: { width: '100%', height: CHART_H, justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 8, backgroundColor: ds.lavender, overflow: 'hidden' },
  barFillOn: { backgroundColor: ds.purple },
  barLabel: { fontSize: 11, fontWeight: '700', color: ds.text3, marginTop: 6 },
  barLabelOn: { color: ds.purple, fontWeight: '800' },
  barDetail: { marginTop: 14, padding: 12, borderRadius: 16, backgroundColor: 'rgba(245, 243, 255, 0.9)' },
  detailWhen: { fontSize: 14.5, fontWeight: '800', color: ds.ink },
  detailGain: { fontSize: 14.5, fontWeight: '800', color: ds.greenFill },
  detailNote: { fontSize: 13.5, lineHeight: 19, color: ds.text2, marginTop: 4 },

  platRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  platName: { fontSize: 15.5, fontWeight: '800', color: ds.ink },
  platSub: { fontSize: 12.5, fontWeight: '700', color: ds.greenFill, marginTop: 1 },
  platCount: { fontSize: 17, fontWeight: '800', color: ds.ink },
  manage: { alignSelf: 'center', height: 44, justifyContent: 'center', paddingHorizontal: 16, marginTop: 4 },
  manageText: { fontSize: 13.5, fontWeight: '800', color: ds.purple },

  signals: { flexDirection: 'row', gap: 8 },
  signal: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  signalOn: { backgroundColor: ds.purple, borderColor: ds.purple },
  signalValue: { fontSize: 18, fontWeight: '800', color: ds.ink },
  signalLabel: { fontSize: 12, fontWeight: '700', color: ds.text3, marginTop: 1 },
  signalTextOn: { color: '#FFFFFF' },
  signalNote: { marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.8)' },
  signalNoteText: { fontSize: 13.5, lineHeight: 19, color: ds.text2 },
  signalWord: { fontWeight: '800', color: ds.ink },

  jarvis: { marginTop: 24 },
  jarvisHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  jarvisTitle: { fontSize: 16, fontWeight: '800', color: ds.ink },
  jarvisBody: { fontSize: 14, lineHeight: 20, color: ds.text2, marginTop: 10 },
  jarvisCta: { marginTop: 14 },
  pro: { marginTop: 16 },
});
