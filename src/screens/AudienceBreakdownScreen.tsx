import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { FitLines } from '../components/ui/FitLines';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { ConnectAccountsSheet } from '../components/growth/ConnectAccountsSheet';
import { FollowerChart } from '../components/growth/FollowerChart';
import { MonthlyHistoryCard } from '../components/growth/ProInsights';
import { ProUpsellCard } from '../components/home/ProUpsellCard';
import { PlatformLogo } from '../components/onboarding/PlatformLogo';
import { usePageWidth } from '../hooks/useBreakpoint';
import { useAsync } from '../hooks/useAsync';
import { loadGrowth, useGrowth } from '../backend/growth';
import { compactCount, plural, signedCount } from '../utils/format';
import { ds } from '../theme/colors';
import type { ConnectablePlatform, GrowthDay } from '../../frontend/shared/types/phase1';

// Your audience: how many people follow the creator across their accounts, how that has moved, and
// how it splits between the accounts. Ages, places and when people are online aren't something the
// platforms share with us, so they aren't here.

const NAMES: Record<ConnectablePlatform, string> = { tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', facebook: 'Facebook', threads: 'Threads' };
const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;

type Range = 7 | 30;

interface AudienceBreakdownScreenProps {
  tier?: 'free' | 'pro';
  onBack: () => void;
  onOpenPlatformGrowth: (platform?: ConnectablePlatform) => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  onLogout?: () => void;
}

export const AudienceBreakdownScreen: React.FC<AudienceBreakdownScreenProps> = ({ tier = 'free', onBack, onOpenPlatformGrowth, onOpenJarvisPro, onNavigateTab, userProfile, onSaveProfile, onLogout }) => {
  const pageWidth = usePageWidth();
  const { width } = useWindowDimensions();
  const chartW = Math.min(width, 560) - 40 - 32;
  const [showProfile, setShowProfile] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [range, setRange] = useState<Range>(30);
  const overview = useGrowth();
  const { failed, reload } = useAsync(loadGrowth, []);
  const enter = (d: number) => FadeInUp.delay(d).duration(500).easing(Easing.out(Easing.cubic));

  // The chart for the chosen window: the server sends today and the 30 days before it, so the ends of a
  // 7-day window are 7 days apart and the ends of a 30-day window are 30 days apart
  const points: GrowthDay[] = useMemo(() => (overview ? overview.series.slice(-(range + 1)) : []), [overview, range]);
  const rangeChange = points.length >= 2 ? points[points.length - 1]!.followers - points[0]!.followers : null;
  const total = overview?.totals.followers ?? null;
  const split = useMemo(
    () => (overview ? [...overview.platforms].filter((p) => p.followers !== null).sort((a, b) => b.followers! - a.followers!) : []),
    [overview],
  );

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FreeAppHeader backgroundColor="transparent" onBack={onBack} onOpenJarvisPro={onOpenJarvisPro} onOpenProfile={() => setShowProfile(true)} userProfile={userProfile} />
        <ScrollView contentContainerStyle={[styles.scroll, pageWidth]} showsVerticalScrollIndicator={false}>
          <Animated.View entering={enter(0)} style={styles.headline}>
            <FitLines lines={['Your', <Text key="a" style={styles.accent}>audience</Text>]} textStyle={styles.headlineText} maxFontSize={38} align="left" accessibilityLabel="Your audience" />
            <Text style={styles.sub}>Everyone who follows you, across your accounts.</Text>
          </Animated.View>

          {!overview ? (
            <View style={styles.loading}>
              {failed ? (
                <>
                  <Text style={styles.loadingText}>Couldn’t load your audience.</Text>
                  <Text style={[styles.loadingText, styles.retry]} onPress={reload} accessibilityRole="button">
                    Try again
                  </Text>
                </>
              ) : (
                <ActivityIndicator color={ds.purple} />
              )}
            </View>
          ) : total === null ? (
            <GlassCard strong radius={24} padding={18}>
              <Text style={styles.cardTitle}>{overview.hasAccounts ? 'Reading your accounts' : 'No accounts connected yet'}</Text>
              <Text style={styles.empty}>{overview.hasAccounts ? 'Your follower counts show up here as soon as the first refresh is done.' : 'Connect one and your audience shows up here.'}</Text>
              {!overview.hasAccounts && (
                <View style={styles.gap}>
                  <AppButton title="Connect an account" onPress={() => setShowAccounts(true)} />
                </View>
              )}
            </GlassCard>
          ) : (
            <>
              {/* Total, with the chart for the chosen window */}
              <Animated.View entering={enter(60)}>
                <GlassCard strong radius={26} padding={16}>
                  <Text style={styles.eyebrow}>TOTAL AUDIENCE</Text>
                  <Text style={styles.big}>{compactCount(total)}</Text>
                  <Text style={styles.bigLabel}>followers on {plural(overview.platforms.filter((p) => p.followers !== null).length, 'account')}</Text>

                  <View style={styles.ranges} accessibilityRole="tablist">
                    {([7, 30] as Range[]).map((r) => (
                      <Pressable
                        key={r}
                        onPress={() => {
                          if (Platform.OS !== 'web') Haptics.selectionAsync();
                          setRange(r);
                        }}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: range === r }}
                        style={[styles.range, range === r && styles.rangeOn, pointer]}
                      >
                        <Text style={[styles.rangeText, range === r && styles.rangeTextOn]}>{r === 7 ? '7 days' : '30 days'}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {rangeChange !== null && (
                    <Text style={[styles.change, rangeChange > 0 && styles.changeUp]}>
                      {rangeChange === 0 ? `No change in ${range === 7 ? 'the last 7 days' : 'the last 30 days'}` : `${signedCount(rangeChange)} followers in the last ${range} days`}
                    </Text>
                  )}
                  {points.length > 0 && (
                    <View style={styles.chart}>
                      <FollowerChart points={points} width={chartW} height={120} />
                    </View>
                  )}
                  {overview.totals.partial && <Text style={styles.footnote}>Some accounts are newer, so the change counts the ones with enough history.</Text>}
                </GlassCard>
              </Animated.View>

              {/* How it splits between accounts */}
              <Animated.View entering={enter(120)}>
                <Text style={styles.section}>By account</Text>
                <GlassCard radius={24} padding={6}>
                  {split.map((p, i) => (
                    <Pressable
                      key={p.platform}
                      onPress={() => onOpenPlatformGrowth(p.platform)}
                      accessibilityRole="button"
                      accessibilityLabel={`${NAMES[p.platform]}, ${compactCount(p.followers!)} followers`}
                      style={[styles.row, i < split.length - 1 && styles.rowLine, pointer]}
                    >
                      <PlatformLogo type={p.platform} size={36} />
                      <View style={styles.flex}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.rowName}>{NAMES[p.platform]}</Text>
                          <Text style={styles.rowValue}>{compactCount(p.followers!)}</Text>
                        </View>
                        <View style={styles.track}>
                          <View style={[styles.fill, { width: `${Math.max(2, Math.round((p.followers! / total) * 100))}%` }]} />
                        </View>
                        <Text style={styles.rowSub}>
                          {Math.round((p.followers! / total) * 100)}% of your audience
                          {p.change7 !== null ? ` · ${p.change7 === 0 ? 'no change' : signedCount(p.change7)} this week` : ''}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </GlassCard>
              </Animated.View>

              {/* Pro: month by month; free: the upgrade card (gold = Pro only) */}
              <Animated.View entering={enter(180)} style={styles.proWrap}>
                {tier === 'pro' ? (
                  overview.months.length > 0 && <MonthlyHistoryCard months={overview.months} />
                ) : (
                  <ProUpsellCard title="See growth month by month" benefits={['New followers each month', 'All your accounts side by side', 'Unlimited ideas and repurposing']} buttonTitle="Explore Pro" onUpgrade={() => onOpenJarvisPro?.()} />
                )}
              </Animated.View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <ConnectAccountsSheet visible={showAccounts} onClose={() => { setShowAccounts(false); void loadGrowth(); }} />
      <FloatingTabBar activeTab="growth" onTabPress={(t) => onNavigateTab?.(t)} />
      <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} onLogout={onLogout} initialProfile={userProfile} onSaveProfile={onSaveProfile} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 130, width: '100%', maxWidth: 560, alignSelf: 'center' },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.9, color: ds.ink },
  accent: { color: ds.purple },
  sub: { fontSize: 14.5, lineHeight: 20, color: ds.text2, marginTop: 6 },
  section: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24, marginBottom: 12 },
  loading: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  loadingText: { fontSize: 14.5, fontWeight: '600', color: ds.text2 },
  retry: { color: ds.purple, fontWeight: '800' },
  cardTitle: { fontSize: 17, fontWeight: '800', color: ds.ink },
  empty: { fontSize: 13.5, lineHeight: 20, color: ds.text2, marginTop: 6 },
  gap: { marginTop: 14 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  big: { fontSize: 42, lineHeight: 48, fontWeight: '800', color: ds.ink, letterSpacing: -1.4, marginTop: 6 },
  bigLabel: { fontSize: 13, fontWeight: '700', color: ds.text3 },
  ranges: { flexDirection: 'row', padding: 3, height: 40, borderRadius: 999, backgroundColor: ds.lavenderSoft, borderWidth: 1, borderColor: ds.lavender, marginTop: 14, alignSelf: 'flex-start' },
  range: { paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  rangeOn: { backgroundColor: ds.purple },
  rangeText: { fontSize: 12.5, fontWeight: '800', color: ds.text2 },
  rangeTextOn: { color: '#FFFFFF' },
  change: { fontSize: 13, fontWeight: '800', color: ds.text2, marginTop: 12 },
  changeUp: { color: ds.greenFill },
  chart: { marginTop: 12 },
  footnote: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: ds.text3, marginTop: 10 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 14 },
  rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(23, 20, 32, 0.08)' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowName: { fontSize: 15, fontWeight: '800', color: ds.ink },
  rowValue: { fontSize: 15, fontWeight: '800', color: ds.ink },
  rowSub: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 6 },
  track: { height: 8, borderRadius: 4, backgroundColor: ds.lavender, overflow: 'hidden', marginTop: 8 },
  fill: { height: 8, borderRadius: 4, backgroundColor: ds.purple },
  proWrap: { marginTop: 24 },
});
