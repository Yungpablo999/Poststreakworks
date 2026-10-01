import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { FitLines } from '../components/ui/FitLines';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { JarvisOrb } from '../components/JarvisOrb';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { ProUpsellCard } from '../components/home/ProUpsellCard';
import { MonthlyHistoryCard, WhoAudienceCard } from '../components/growth/ProInsights';
import { PlatformLogo, type PlatformLogoType } from '../components/onboarding/PlatformLogo';
import { ConnectAccountsSheet, useConnectedAccounts } from '../components/growth/ConnectAccountsSheet';
import { ds } from '../theme/colors';

// Platform growth (returning creators): which platform is growing, side by
// side. Only connected accounts show; "Add or remove accounts" opens the
// same glass sheet as Growth. Sample numbers until accounts sync; they match
// the audience page (24.8K total, 1,280 new this week).

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const smooth = { duration: 260, easing: Easing.out(Easing.cubic) };
const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

interface PlatStats {
  id: PlatformLogoType;
  name: string;
  followers: number;
  thisWeek: number;
  lastWeek: number;
  reactions: number;
  color: string;
}

const STATS: Record<string, PlatStats> = {
  tiktok: { id: 'tiktok', name: 'TikTok', followers: 12400, thisWeek: 760, lastWeek: 640, reactions: 920, color: '#5B3EE8' },
  instagram: { id: 'instagram', name: 'Instagram', followers: 7800, thisWeek: 380, lastWeek: 360, reactions: 560, color: '#8B7CF0' },
  youtube: { id: 'youtube', name: 'YouTube', followers: 4600, thisWeek: 140, lastWeek: 160, reactions: 240, color: '#C4B5FD' },
  facebook: { id: 'facebook', name: 'Facebook', followers: 3800, thisWeek: 60, lastWeek: 55, reactions: 130, color: '#DDD6FE' },
  threads: { id: 'threads', name: 'Threads', followers: 2200, thisWeek: 45, lastWeek: 30, reactions: 110, color: '#EDE9FE' },
};

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`);

function CountUp({ to, style, prefix = '' }: { to: number; style: object; prefix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / 900);
      setN(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <Text style={style}>{prefix}{n.toLocaleString('en-US')}</Text>;
}

function Segment({ p, total, focus }: { p: PlatStats; total: number; focus: string | null }) {
  const grow = useSharedValue(0);
  const dim = useSharedValue(1);
  useEffect(() => {
    grow.value = withDelay(250, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [grow]);
  useEffect(() => {
    dim.value = withTiming(focus && focus !== p.id ? 0.25 : 1, smooth);
  }, [focus, p.id, dim]);
  const style = useAnimatedStyle(() => ({ width: `${(p.thisWeek / total) * 100 * grow.value}%`, opacity: dim.value }));
  return <Animated.View style={[styles.segment, { backgroundColor: p.color }, style]} />;
}

const CHART_H = 130;
function CompareBar({ p, ratio, index, on, onPress }: { p: PlatStats; ratio: number; index: number; on: boolean; onPress: () => void }) {
  const h = useSharedValue(0);
  const sel = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    h.value = withDelay(150 + index * 90, withTiming(Math.max(0.05, ratio) * CHART_H, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, [h, ratio, index]);
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
      accessibilityLabel={`${p.name}, ${p.thisWeek} new followers this week`}
      style={[styles.barCol, pointer]}
    >
      <Text style={[styles.barValue, on && { color: ds.purple }]}>+{p.thisWeek}</Text>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, fill]}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.barFillOn, onStyle]} />
        </Animated.View>
      </View>
      <View style={[styles.barLogo, on && styles.barLogoOn]}>
        <PlatformLogo type={p.id} size={26} />
      </View>
    </Pressable>
  );
}

interface PlatformGrowthScreenProps {
  /** Pro members see the Pro insight instead of the upgrade card. */
  tier?: 'free' | 'pro';
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenSchedule?: () => void;
  onOpenComposer?: (ideaTitle?: string) => void;
  onOpenScript?: (ideaTitle?: string) => void;
  onOpenContentAngle?: () => void;
  onOpenRepurpose?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  onLogout?: () => void;
}

export const PlatformGrowthScreen: React.FC<PlatformGrowthScreenProps> = ({
  onBack,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenComposer,
  onOpenRepurpose,
  userProfile,
  onSaveProfile,
  tier = 'free',
  onLogout,
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const accounts = useConnectedAccounts(userProfile, onSaveProfile);

  const list = accounts.connectedIds.map((id) => STATS[id]).filter(Boolean).sort((a, b) => b.thisWeek - a.thisWeek);
  const total = list.reduce((a, p) => a + p.thisWeek, 0);
  const lastTotal = list.reduce((a, p) => a + p.lastWeek, 0);
  const max = Math.max(1, ...list.map((p) => p.thisWeek));
  const leader = list[0];
  const second = list[1];
  const [sel, setSel] = useState<string>(leader?.id ?? 'tiktok');
  const chosen = list.find((p) => p.id === sel) ?? leader;
  const topic = '3 creator mistakes I stopped making';

  const enter = (d: number) => FadeInUp.delay(d).duration(500).easing(Easing.out(Easing.cubic));

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FreeAppHeader backgroundColor="transparent" onBack={onBack} onOpenJarvisPro={onOpenJarvisPro} onOpenProfile={() => setShowProfile(true)} userProfile={userProfile} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={enter(0)} style={styles.headline}>
            <FitLines
              lines={['Your platforms,', <Text key="a" style={styles.accent}>side by side</Text>]}
              textStyle={styles.headlineText}
              maxFontSize={34}
              align="left"
              accessibilityLabel="Your platforms, side by side"
            />
            <Text style={styles.sub}>
              {list.length} of 5 accounts connected
            </Text>
          </Animated.View>

          {list.length === 0 ? (
            <GlassCard strong radius={26} padding={20}>
              <Text style={styles.cardTitle}>No accounts connected</Text>
              <Text style={styles.cardBody}>Connect one to see how each platform is growing.</Text>
              <View style={styles.cta}>
                <AppButton title="Connect an account" onPress={() => setShowAccounts(true)} />
              </View>
            </GlassCard>
          ) : (
            <>
              {/* New followers this week, split by platform */}
              <Animated.View entering={enter(80)}>
                <GlassCard strong radius={26} padding={18}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.eyebrow}>NEW FOLLOWERS THIS WEEK</Text>
                  </View>
                  <CountUp to={total} prefix="+" style={styles.big} />
                  <Text style={styles.bigSub}>{total >= lastTotal ? 'Up' : 'Down'} from {lastTotal.toLocaleString('en-US')} last week</Text>
                  <View style={styles.split}>
                    {list.map((p) => (
                      <Segment key={p.id} p={p} total={total} focus={focus} />
                    ))}
                  </View>
                  <View style={styles.legend}>
                    {list.map((p) => {
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
                          <Text style={[styles.legendText, on && styles.legendTextOn]}>
                            {p.name} {Math.round((p.thisWeek / total) * 100)}%
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </GlassCard>
              </Animated.View>

              {/* Compare */}
              <Animated.View entering={enter(160)}>
                <Text style={styles.section}>Compare this week</Text>
                <GlassCard strong radius={26} padding={16}>
                  <View style={styles.chart}>
                    {list.map((p, i) => (
                      <CompareBar
                        key={p.id}
                        p={p}
                        ratio={p.thisWeek / max}
                        index={i}
                        on={chosen?.id === p.id}
                        onPress={() => {
                          tick();
                          setSel(p.id);
                        }}
                      />
                    ))}
                  </View>
                  {chosen && (
                    <Animated.View key={chosen.id} entering={FadeIn.duration(220)} style={styles.detail}>
                      <Text style={styles.detailTitle}>{chosen.name}</Text>
                      <View style={styles.detailStats}>
                        <View style={styles.detailStat}>
                          <Text style={styles.detailValue}>{fmt(chosen.followers)}</Text>
                          <Text style={styles.detailLabel}>Followers</Text>
                        </View>
                        <View style={styles.detailStat}>
                          <Text style={[styles.detailValue, { color: ds.greenFill }]}>+{chosen.thisWeek}</Text>
                          <Text style={styles.detailLabel}>This week</Text>
                        </View>
                        <View style={styles.detailStat}>
                          <Text style={styles.detailValue}>{chosen.reactions}</Text>
                          <Text style={styles.detailLabel}>Likes and comments</Text>
                        </View>
                      </View>
                      <Text style={styles.detailNote}>
                        {chosen.thisWeek >= chosen.lastWeek
                          ? `Up ${chosen.thisWeek - chosen.lastWeek} on last week.`
                          : `A little quieter than last week (${chosen.lastWeek}).`}
                      </Text>
                    </Animated.View>
                  )}
                  <Text style={styles.hint}>Tap a bar to compare</Text>
                </GlassCard>
              </Animated.View>

              {/* Jarvis: what to do with it */}
              {leader && (
                <Animated.View entering={enter(240)}>
                  <GlassCard strong radius={24} padding={16} style={styles.jarvis}>
                    <View style={styles.jarvisHead}>
                      <JarvisOrb size={32} />
                      <Text style={styles.jarvisTitle}>{leader.name} is growing fastest</Text>
                    </View>
                    <Text style={styles.jarvisBody}>
                      Your creator-advice videos brought in most of the new followers there.
                      {second ? ` Post the next one on ${leader.name} first, then share it on ${second.name}.` : ' Keep posting that kind of video there.'}
                    </Text>
                    <View style={styles.jarvisActions}>
                      <AppButton title={`Make a post for ${leader.name}`} onPress={() => onOpenComposer?.(topic)} />
                      {second && onOpenRepurpose && <AppButton title={`Repurpose for ${second.name}`} variant="glass" onPress={onOpenRepurpose} />}
                    </View>
                  </GlassCard>
                </Animated.View>
              )}

              {/* Each account */}
              <Animated.View entering={enter(320)}>
                <Text style={styles.section}>Each account</Text>
                <GlassCard radius={24} padding={0}>
                  {list.map((p, i) => (
                    <View key={p.id} style={[styles.acct, i < list.length - 1 && styles.acctLine]}>
                      <PlatformLogo type={p.id} size={36} />
                      <View style={styles.flex}>
                        <Text style={styles.acctName}>{p.name}</Text>
                        <Text style={styles.acctSub}>+{p.thisWeek} this week</Text>
                      </View>
                      <Text style={styles.acctCount}>{fmt(p.followers)}</Text>
                    </View>
                  ))}
                </GlassCard>
              </Animated.View>
            </>
          )}

          <Pressable onPress={() => setShowAccounts(true)} accessibilityRole="button" style={({ pressed }) => [styles.manage, pressed && styles.pressed, pointer]}>
            <Text style={styles.manageText}>Add or remove accounts</Text>
          </Pressable>

          <Animated.View entering={enter(400)} style={styles.pro}>
            {tier === 'pro' ? (
              <MonthlyHistoryCard />
            ) : (
            <ProUpsellCard
              title="See every month of growth"
              benefits={['Growth history by month', 'Who follows you on each platform', 'Best time to post on each one']}
              buttonTitle="Explore Pro"
              onUpgrade={() => onOpenJarvisPro?.()}
            />
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <FloatingTabBar activeTab="growth" onTabPress={(t) => onNavigateTab?.(t)} />
      <ConnectAccountsSheet visible={showAccounts} onClose={() => setShowAccounts(false)} platforms={accounts.platforms} onToggle={accounts.toggle} />
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
  sub: { fontSize: 13.5, fontWeight: '700', color: ds.greenFill, marginTop: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple, flexShrink: 1 },
  section: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24, marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: ds.ink },
  cardBody: { fontSize: 14, lineHeight: 20, color: ds.text2, marginTop: 4 },
  cta: { marginTop: 14 },

  upChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 24, borderRadius: 999, backgroundColor: ds.greenBg },
  upChipText: { fontSize: 11.5, fontWeight: '800', color: ds.greenFill },
  big: { fontSize: 38, lineHeight: 44, fontWeight: '800', color: ds.ink, letterSpacing: -1.2, marginTop: 10 },
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

  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', gap: 10 },
  barCol: { flex: 1, maxWidth: 70, alignItems: 'center' },
  barValue: { fontSize: 13, fontWeight: '800', color: ds.text2, marginBottom: 6 },
  barTrack: { width: '100%', height: CHART_H, justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 12, backgroundColor: ds.lavender, overflow: 'hidden' },
  barFillOn: { backgroundColor: ds.purple },
  barLogo: { marginTop: 8, padding: 3, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  barLogoOn: { borderColor: ds.purple },
  detail: { marginTop: 14, padding: 12, borderRadius: 16, backgroundColor: 'rgba(245, 243, 255, 0.9)' },
  detailTitle: { fontSize: 15, fontWeight: '800', color: ds.ink },
  detailStats: { flexDirection: 'row', gap: 8, marginTop: 10 },
  detailStat: { flex: 1 },
  detailValue: { fontSize: 17, fontWeight: '800', color: ds.ink },
  detailLabel: { fontSize: 11.5, fontWeight: '700', color: ds.text3, marginTop: 1 },
  detailNote: { fontSize: 13, lineHeight: 18, color: ds.text2, marginTop: 10 },
  hint: { fontSize: 12, color: ds.text3, marginTop: 10, textAlign: 'center' },

  jarvis: { marginTop: 24 },
  jarvisHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  jarvisTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: ds.ink },
  jarvisBody: { fontSize: 14, lineHeight: 20, color: ds.text2, marginTop: 10 },
  jarvisActions: { gap: 10, marginTop: 14 },

  acct: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  acctLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(23, 20, 32, 0.08)' },
  acctName: { fontSize: 15.5, fontWeight: '800', color: ds.ink },
  acctSub: { fontSize: 12.5, fontWeight: '700', color: ds.greenFill, marginTop: 1 },
  acctCount: { fontSize: 17, fontWeight: '800', color: ds.ink },
  manage: { alignSelf: 'center', height: 44, justifyContent: 'center', paddingHorizontal: 16, marginTop: 8 },
  manageText: { fontSize: 13.5, fontWeight: '800', color: ds.purple },
  pro: { marginTop: 12 },
});
