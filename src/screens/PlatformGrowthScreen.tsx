import React, { useEffect, useState } from 'react';
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
import { RecentPostsCard } from '../components/growth/GrowthReturning';
import { PlatformLogo } from '../components/onboarding/PlatformLogo';
import { usePageWidth } from '../hooks/useBreakpoint';
import { useAsync } from '../hooks/useAsync';
import { loadGrowth, useGrowth } from '../backend/growth';
import { compactCount, plural, shortDay } from '../utils/format';
import { ds } from '../theme/colors';
import type { ConnectablePlatform, GrowthPlatform } from '../../frontend/shared/types/phase1';

// One connected account at a time: its followers and how they moved, its latest posts' numbers, and
// its newest posts. Switch accounts with the chips at the top.

const NAMES: Record<ConnectablePlatform, string> = { tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', facebook: 'Facebook', threads: 'Threads' };
const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;

interface PlatformGrowthScreenProps {
  /** Which account to open on (from Growth). */
  platform?: ConnectablePlatform | null;
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenPostPerformance: (key: string) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  onLogout?: () => void;
}

/** "↑ 107 this week" style lines for the two windows we can report. */
function moves(p: GrowthPlatform): { text: string; up: boolean }[] {
  const line = (n: number, when: string) => ({ text: n === 0 ? `No change ${when}` : `${n > 0 ? '↑' : '↓'} ${compactCount(Math.abs(n))} ${when}`, up: n > 0 });
  const out: { text: string; up: boolean }[] = [];
  if (p.change7 !== null) out.push(line(p.change7, 'this week'));
  if (p.change30 !== null) out.push(line(p.change30, 'in 30 days'));
  return out;
}

export const PlatformGrowthScreen: React.FC<PlatformGrowthScreenProps> = ({ platform, onBack, onNavigateTab, onOpenJarvisPro, onOpenPostPerformance, userProfile, onSaveProfile, onLogout }) => {
  const pageWidth = usePageWidth();
  const { width } = useWindowDimensions();
  const chartW = Math.min(width, 560) - 40 - 32;
  const [showProfile, setShowProfile] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const overview = useGrowth();
  const { failed, reload } = useAsync(loadGrowth, []);
  const enter = (d: number) => FadeInUp.delay(d).duration(500).easing(Easing.out(Easing.cubic));

  const accounts = overview?.platforms ?? [];
  const [picked, setPicked] = useState<ConnectablePlatform | null>(platform ?? null);
  // The account asked for, else the one with the most followers
  useEffect(() => {
    if (platform) setPicked(platform);
  }, [platform]);
  const current = accounts.find((a) => a.platform === picked) ?? [...accounts].sort((a, b) => (b.followers ?? -1) - (a.followers ?? -1))[0];

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FreeAppHeader backgroundColor="transparent" onBack={onBack} onOpenJarvisPro={onOpenJarvisPro} onOpenProfile={() => setShowProfile(true)} userProfile={userProfile} />
        <ScrollView contentContainerStyle={[styles.scroll, pageWidth]} showsVerticalScrollIndicator={false}>
          <Animated.View entering={enter(0)} style={styles.headline}>
            <FitLines lines={['Platform', <Text key="a" style={styles.accent}>growth</Text>]} textStyle={styles.headlineText} maxFontSize={38} align="left" accessibilityLabel="Platform growth" />
            <Text style={styles.sub}>One account at a time.</Text>
          </Animated.View>

          {!overview ? (
            <View style={styles.loading}>
              {failed ? (
                <>
                  <Text style={styles.loadingText}>Couldn’t load your accounts.</Text>
                  <Text style={[styles.loadingText, styles.retry]} onPress={reload} accessibilityRole="button">
                    Try again
                  </Text>
                </>
              ) : (
                <ActivityIndicator color={ds.purple} />
              )}
            </View>
          ) : !current ? (
            <GlassCard strong radius={24} padding={18}>
              <Text style={styles.cardTitle}>No accounts connected yet</Text>
              <Text style={styles.empty}>Connect one and its numbers show up here.</Text>
              <View style={styles.gap}>
                <AppButton title="Connect an account" onPress={() => setShowAccounts(true)} />
              </View>
            </GlassCard>
          ) : (
            <>
              {/* Which account */}
              {accounts.length > 1 && (
                <Animated.View entering={enter(60)} style={styles.chips}>
                  {accounts.map((a) => {
                    const on = a.platform === current.platform;
                    return (
                      <Pressable
                        key={a.platform}
                        onPress={() => {
                          if (Platform.OS !== 'web') Haptics.selectionAsync();
                          setPicked(a.platform);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        style={[styles.chip, on && styles.chipOn, pointer]}
                      >
                        <PlatformLogo type={a.platform} size={22} />
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{NAMES[a.platform]}</Text>
                      </Pressable>
                    );
                  })}
                </Animated.View>
              )}

              {current.status === 'needs_reauth' && (
                <Animated.View entering={enter(80)} style={styles.banner}>
                  <GlassCard radius={20} padding={14}>
                    <Text style={styles.bannerText}>{NAMES[current.platform]} needs you to connect it again before its numbers can update.</Text>
                    <View style={styles.bannerButton}>
                      <AppButton title="Reconnect" onPress={() => setShowAccounts(true)} />
                    </View>
                  </GlassCard>
                </Animated.View>
              )}

              {/* Followers */}
              <Animated.View entering={enter(100)}>
                <GlassCard strong radius={26} padding={16}>
                  <View style={styles.who}>
                    <PlatformLogo type={current.platform} size={44} />
                    <View style={styles.flex}>
                      <Text style={styles.name} numberOfLines={1}>
                        {current.name ?? NAMES[current.platform]}
                      </Text>
                      <Text style={styles.handle} numberOfLines={1}>
                        {current.handle ? `@${current.handle}` : NAMES[current.platform]}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.big}>{current.followers === null ? '—' : compactCount(current.followers)}</Text>
                  <Text style={styles.bigLabel}>followers</Text>
                  <View style={styles.moves}>
                    {moves(current).map((m) => (
                      <Text key={m.text} style={[styles.move, m.up && styles.moveUp]}>
                        {m.text}
                      </Text>
                    ))}
                    {moves(current).length === 0 && <Text style={styles.move}>{current.trackedSince ? `Tracking since ${shortDay(current.trackedSince)}` : 'Just connected'}</Text>}
                  </View>
                  {current.series.length > 0 && (
                    <View style={styles.chart}>
                      <FollowerChart points={current.series} width={chartW} height={110} />
                    </View>
                  )}
                </GlassCard>
              </Animated.View>

              {/* The last 30 days */}
              <Animated.View entering={enter(160)}>
                <Text style={styles.section}>Last 30 days</Text>
                {current.posts30 === 0 ? (
                  <GlassCard radius={22} padding={16}>
                    <Text style={styles.empty}>No posts on {NAMES[current.platform]} in the last 30 days.</Text>
                  </GlassCard>
                ) : (
                  <>
                    <View style={styles.grid}>
                      {[
                        { label: 'Posts', value: String(current.posts30) },
                        { label: 'Average views', value: current.avgViews30 === null ? '—' : compactCount(current.avgViews30) },
                        { label: 'Likes', value: compactCount(current.likes30) },
                        { label: 'Comments', value: compactCount(current.comments30) },
                      ].map((t) => (
                        <View key={t.label} style={styles.tile}>
                          <Text style={styles.tileLabel}>{t.label}</Text>
                          <Text style={styles.tileValue}>{t.value}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.footnote}>On {plural(current.posts30, 'post')} from the last 30 days, as of the last refresh.</Text>
                  </>
                )}
              </Animated.View>

              {/* Its newest posts */}
              {current.recentPosts.length > 0 && (
                <Animated.View entering={enter(220)} style={styles.listWrap}>
                  <RecentPostsCard posts={current.recentPosts} onOpen={(p) => onOpenPostPerformance(p.key)} title={`Latest on ${NAMES[current.platform]}`} />
                </Animated.View>
              )}
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

const glass = { backgroundColor: 'rgba(255, 255, 255, 0.82)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' };

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

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 40, borderRadius: 999, ...glass },
  chipOn: { backgroundColor: ds.purple, borderColor: ds.purple },
  chipText: { fontSize: 13.5, fontWeight: '800', color: ds.ink },
  chipTextOn: { color: '#FFFFFF' },

  banner: { marginBottom: 14 },
  bannerText: { fontSize: 13.5, lineHeight: 19, fontWeight: '600', color: ds.text2 },
  bannerButton: { alignSelf: 'flex-start', marginTop: 10 },

  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 16, fontWeight: '800', color: ds.ink },
  handle: { fontSize: 13, fontWeight: '600', color: ds.text3, marginTop: 1 },
  big: { fontSize: 42, lineHeight: 48, fontWeight: '800', color: ds.ink, letterSpacing: -1.4, marginTop: 14 },
  bigLabel: { fontSize: 13, fontWeight: '700', color: ds.text3 },
  moves: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  move: { fontSize: 12, fontWeight: '800', color: ds.text2, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(23, 20, 32, 0.06)', overflow: 'hidden' },
  moveUp: { color: ds.greenFill, backgroundColor: ds.greenBg },
  chart: { marginTop: 14 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  tile: { width: '48.5%', padding: 12, borderRadius: 18, ...glass },
  tileLabel: { fontSize: 11.5, fontWeight: '800', color: ds.text3 },
  tileValue: { fontSize: 20, fontWeight: '800', color: ds.ink, marginTop: 2 },
  footnote: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: ds.text3, marginTop: 10 },
  listWrap: { marginTop: 24 },
});
