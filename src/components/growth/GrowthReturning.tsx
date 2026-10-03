import React, { useEffect, useState } from 'react';
import { Image, Linking, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { PressableCard } from '../ui/PressableCard';
import { PlatformLogo } from '../onboarding/PlatformLogo';
import { FollowerChart } from './FollowerChart';
import { ds } from '../../theme/colors';
import { compactCount, plural, shortDay, signedCount } from '../../utils/format';
import { timeAgo } from '../../utils/time';
import type { ChallengeState, GrowthOverview, GrowthPlatform, GrowthPost } from '../../../frontend/shared/types/phase1';

// Growth for creators with a connected account: the same glass cards as day 0, filled with what the
// platforms have really reported. Plain words, no "viral" or "top 5%" hype, gold only for Pro. A
// number we don't have is not shown (the server sends null, never a zero or a guess).

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;

function Bar({ ratio, delay = 0, color = ds.purple }: { ratio: number; delay?: number; color?: string }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(250 + delay, withTiming(Math.max(0, Math.min(1, ratio)), { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [ratio, delay, w]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { backgroundColor: color }, style]} />
    </View>
  );
}

function CountUp({ to, format, style }: { to: number; format: (n: number) => string; style: object }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / 900);
      setN(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <Text style={style}>{format(n)}</Text>;
}

const Chevron = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M9 6l6 6-6 6" stroke={ds.purple} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** "↑ 375 in 30 days" / "↓ 12 this week" / "No change this week": how followers moved, in plain words. */
function movement(change: number, when: string): { text: string; up: boolean } {
  if (change === 0) return { text: `No change ${when}`, up: false };
  return { text: `${change > 0 ? '↑' : '↓'} ${compactCount(Math.abs(change))} ${when}`, up: change > 0 };
}

function MovementChip({ overview }: { overview: GrowthOverview }) {
  const { totals } = overview;
  const first = overview.platforms.map((p) => p.trackedSince).filter((d): d is string => !!d).sort()[0];
  const m = totals.change30 !== null ? movement(totals.change30, 'in 30 days') : totals.change7 !== null ? movement(totals.change7, 'this week') : null;
  if (!m) {
    return (
      <View style={styles.chip}>
        <Text style={styles.chipText}>{first ? `Tracking since ${shortDay(first)}` : 'Just connected'}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.chip, m.up && styles.chipUp]}>
      <Text style={[styles.chipText, m.up && styles.chipTextUp]}>{m.text}</Text>
    </View>
  );
}

// ─── Total audience ─────────────────────────────────────────────────────────
export function AudienceHero({ overview, onOpen }: { overview: GrowthOverview; onOpen: () => void }) {
  const { width } = useWindowDimensions();
  const chartW = Math.min(width, 520) - 40 - 40;
  const { totals } = overview;
  const noPosts = totals.posts30 === 0;
  const stats = [
    { label: 'Views', value: compactCount(totals.views30) },
    { label: 'Likes', value: compactCount(totals.likes30) },
    { label: 'Comments', value: compactCount(totals.comments30) },
  ];
  return (
    <PressableCard onPress={onOpen} accessibilityLabel={`Total audience ${totals.followers === null ? 'not read yet' : compactCount(totals.followers)}. See the full breakdown`}>
      <GlassCard strong radius={26} padding={20}>
        <View style={styles.rowBetween}>
          <Text style={styles.eyebrow}>TOTAL AUDIENCE</Text>
          <Text style={styles.muted}>{plural(overview.connected, 'account')}</Text>
        </View>
        <View style={styles.bigRow}>
          {totals.followers === null ? (
            <Text style={styles.big}>—</Text>
          ) : (
            <CountUp to={totals.followers} format={(n) => compactCount(Math.round(n))} style={styles.big} />
          )}
          <MovementChip overview={overview} />
        </View>
        {totals.partial && <Text style={styles.footnote}>Some accounts are newer, so the change counts the ones with enough history.</Text>}

        {noPosts ? (
          <Text style={styles.noPosts}>No posts in the last 30 days.</Text>
        ) : (
          <>
            <View style={styles.stats}>
              {stats.map((s) => (
                <View key={s.label} style={styles.stat}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.footnote}>On your {plural(totals.posts30, 'post')} from the last 30 days, as of the last refresh.</Text>
          </>
        )}

        {overview.series.length > 0 && (
          <View style={styles.chart}>
            <FollowerChart points={overview.series} width={chartW} height={96} />
          </View>
        )}
        <View style={styles.seeMore}>
          <Text style={styles.seeMoreText}>See full breakdown</Text>
          <Chevron />
        </View>
      </GlassCard>
    </PressableCard>
  );
}

// ─── A post's picture ───────────────────────────────────────────────────────
export function PostThumb({ post, width = 64, height = 80 }: { post: Pick<GrowthPost, 'coverUrl' | 'platform'>; width?: number; height?: number }) {
  const [failed, setFailed] = useState(false);
  if (post.coverUrl && !failed) {
    return <Image source={{ uri: post.coverUrl }} style={{ width, height, borderRadius: 14, backgroundColor: ds.lavender }} resizeMode="cover" onError={() => setFailed(true)} />;
  }
  return (
    <View style={{ width, height, borderRadius: 14, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center' }}>
      <PlatformLogo type={post.platform} size={Math.min(width, height) * 0.55} />
    </View>
  );
}

const postKind = (post: GrowthPost) => (post.durationSeconds ? `${post.platformName} · ${post.durationSeconds}s video` : post.platformName);

/** "29% more views than your usual TikTok post" / "About the same as your usual…" / null without enough posts to compare. */
export function comparisonLine(post: GrowthPost): string | null {
  if (!post.comparison) return null;
  const { percent, averageViews } = post.comparison;
  if (percent >= 10) return `${percent}% more views than your usual ${post.platformName} post`;
  if (percent <= -10) return `${-percent}% fewer views than your usual ${post.platformName} post`;
  return `About the same as your usual ${post.platformName} post (${compactCount(averageViews)} views)`;
}

export function postMetrics(post: GrowthPost): { label: string; value: string }[] {
  return [
    { label: 'Views', value: compactCount(post.views) },
    { label: 'Likes', value: compactCount(post.likes) },
    { label: 'Comments', value: compactCount(post.comments) },
    post.saves !== null ? { label: 'Saves', value: compactCount(post.saves) } : { label: 'Shares', value: compactCount(post.shares) },
  ];
}

// ─── Best post ──────────────────────────────────────────────────────────────
export function BestPostCard({ post, onWhy, onMore }: { post: GrowthPost; onWhy: () => void; onMore?: () => void }) {
  const note = comparisonLine(post);
  return (
    <GlassCard strong radius={26} padding={18}>
      <View style={styles.postTop}>
        <PostThumb post={post} />
        <View style={styles.flex}>
          <View style={styles.platChip}>
            <Text style={styles.platChipText}>{postKind(post)}</Text>
          </View>
          <Text style={styles.postTitle} numberOfLines={3}>
            “{post.title || 'Untitled post'}”
          </Text>
          {post.postedAt && <Text style={styles.postWhen}>Posted {timeAgo(post.postedAt)}</Text>}
        </View>
      </View>
      <View style={styles.stats}>
        {postMetrics(post).map((m) => (
          <View key={m.label} style={styles.stat}>
            <Text style={styles.statValue}>{m.value}</Text>
            <Text style={styles.statLabel}>{m.label}</Text>
          </View>
        ))}
      </View>
      {note && <Text style={styles.metricNote}>{note}</Text>}
      <View style={styles.postActions}>
        <AppButton title="See how it did" onPress={onWhy} />
        {onMore && <AppButton title="Make more like this" variant="glass" onPress={onMore} />}
      </View>
    </GlassCard>
  );
}

const PLATFORM_LABEL: Record<string, string> = { tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', facebook: 'Facebook', threads: 'Threads' };

// ─── Where posts do best (needs two accounts with posts to compare) ─────────
export function PlatformsCompareCard({ platforms, onOpen }: { platforms: GrowthPlatform[]; onOpen: (p: GrowthPlatform) => void }) {
  const rows = platforms.filter((p) => p.avgViews30 !== null).sort((a, b) => b.avgViews30! - a.avgViews30!);
  if (rows.length < 2) return null;
  const max = rows[0]!.avgViews30!;
  return (
    <GlassCard strong radius={26} padding={18}>
      <Text style={styles.cardTitle}>Where your posts do best</Text>
      <Text style={styles.cardSub}>Average views per post, last 30 days</Text>
      <View style={styles.compareRows}>
        {rows.map((p, i) => (
          <Pressable
            key={p.platform}
            onPress={() => onOpen(p)}
            accessibilityRole="button"
            accessibilityLabel={`${PLATFORM_LABEL[p.platform]}, ${compactCount(p.avgViews30!)} views per post`}
            style={[styles.compareRow, pointer]}
          >
            <View style={styles.rowBetween}>
              <View style={styles.compareName}>
                <PlatformLogo type={p.platform} size={22} />
                <Text style={[styles.formatName, i === 0 && { color: ds.purple }]}>{PLATFORM_LABEL[p.platform]}</Text>
              </View>
              <Text style={styles.formatScore}>{compactCount(p.avgViews30!)}</Text>
            </View>
            <Bar ratio={p.avgViews30! / max} delay={i * 120} color={i === 0 ? ds.purple : '#C4B5FD'} />
          </Pressable>
        ))}
      </View>
    </GlassCard>
  );
}

// ─── Your accounts, with how each is moving ─────────────────────────────────
export function PlatformListCard({ platforms, onOpen, onManage }: { platforms: GrowthPlatform[]; onOpen: (p: GrowthPlatform) => void; onManage: () => void }) {
  return (
    <GlassCard radius={26} padding={0}>
      <View style={styles.msHeader}>
        <Text style={styles.cardTitle}>Your platforms</Text>
        <Text style={styles.cardSub}>Tap one for its own numbers</Text>
      </View>
      {platforms.map((p, i) => {
        const move = p.change7 !== null ? movement(p.change7, 'this week') : null;
        const who = p.handle ? `@${p.handle}` : p.name ?? PLATFORM_LABEL[p.platform];
        return (
          <Pressable
            key={p.platform}
            onPress={() => onOpen(p)}
            accessibilityRole="button"
            accessibilityLabel={`${PLATFORM_LABEL[p.platform]}, ${p.followers === null ? 'no follower count yet' : `${compactCount(p.followers)} followers`}`}
            style={[styles.listRow, styles.msLine, pointer]}
          >
            <PlatformLogo type={p.platform} size={40} />
            <View style={styles.flex}>
              <Text style={styles.msTitle} numberOfLines={1}>
                {PLATFORM_LABEL[p.platform]}
              </Text>
              <Text style={styles.msSub} numberOfLines={1}>
                {p.status === 'needs_reauth' ? 'Connect again to refresh' : who}
              </Text>
            </View>
            <View style={styles.listViews}>
              <Text style={styles.statValue}>{p.followers === null ? '—' : compactCount(p.followers)}</Text>
              <Text style={[styles.statLabel, move?.up && { color: ds.greenFill }]}>{move ? move.text : 'followers'}</Text>
            </View>
          </Pressable>
        );
      })}
      <Pressable onPress={onManage} accessibilityRole="button" accessibilityLabel="Manage accounts" style={[styles.manage, pointer]}>
        <Text style={styles.seeMoreText}>Manage accounts</Text>
        <Chevron />
      </Pressable>
    </GlassCard>
  );
}

// ─── Your posts ─────────────────────────────────────────────────────────────
export function RecentPostsCard({ posts, onOpen, title = 'Your latest posts' }: { posts: GrowthPost[]; onOpen: (post: GrowthPost) => void; title?: string }) {
  if (posts.length === 0) return null;
  return (
    <GlassCard radius={26} padding={0}>
      <View style={styles.msHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>Tap one to see how it did</Text>
      </View>
      {posts.map((post, i) => (
        <Pressable
          key={post.key}
          onPress={() => onOpen(post)}
          accessibilityRole="button"
          accessibilityLabel={`${post.title}, ${compactCount(post.views)} views`}
          style={[styles.listRow, i < posts.length - 1 && styles.msLine, pointer]}
        >
          <PostThumb post={post} width={44} height={56} />
          <View style={styles.flex}>
            <Text style={styles.msTitle} numberOfLines={2}>
              {post.title || 'Untitled post'}
            </Text>
            <Text style={styles.msSub}>
              {post.platformName}
              {post.postedAt ? ` · ${timeAgo(post.postedAt)}` : ''}
            </Text>
          </View>
          <View style={styles.listViews}>
            <Text style={styles.statValue}>{compactCount(post.views)}</Text>
            <Text style={styles.statLabel}>views</Text>
          </View>
        </Pressable>
      ))}
    </GlassCard>
  );
}

// ─── Milestones ─────────────────────────────────────────────────────────────
const STREAK_STEPS = [3, 7, 14, 30, 60, 100, 200, 365];

export function MilestonesCard({
  overview,
  challenge,
  streakDays,
  onChallenge,
}: {
  overview: GrowthOverview;
  challenge: Pick<ChallengeState, 'done' | 'goal' | 'joined'> | null;
  streakDays: number;
  onChallenge: () => void;
}) {
  const nextStreak = STREAK_STEPS.find((n) => n > streakDays);
  const rows = overview.milestones.length + (challenge ? 1 : 0) + (nextStreak ? 1 : 0);
  if (rows === 0) return null;
  let index = 0;
  const line = () => index++ < rows - 1;
  return (
    <GlassCard radius={26} padding={0}>
      <View style={styles.msHeader}>
        <Text style={styles.cardTitle}>Milestones</Text>
        <Text style={styles.cardSub}>Goals you’re close to</Text>
      </View>

      {overview.milestones.map((m) => (
        <View key={m.platform} style={[styles.ms, line() && styles.msLine]}>
          <View style={styles.msIcon}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M3 17l6-6 4 4 8-8M21 7h-6M21 7v6" stroke={ds.purple} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <View style={styles.flex}>
            <Text style={styles.msTitle}>{m.label}</Text>
            <Bar ratio={m.ratio} />
            <Text style={styles.msSub}>{m.note}</Text>
          </View>
        </View>
      ))}

      {challenge && (
        <PressableCard onPress={onChallenge} accessibilityLabel={`Post ${challenge.goal} times this week, ${challenge.done} of ${challenge.goal} done`} haptic>
          <View style={[styles.ms, line() && styles.msLine]}>
            <View style={styles.msIcon}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Rect x="3" y="4" width="18" height="17" rx="3" stroke={ds.purple} strokeWidth={2} />
                <Path d="M16 2v4M8 2v4M3 10h18" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </View>
            <View style={styles.flex}>
              <Text style={styles.msTitle}>Post {challenge.goal} times this week</Text>
              <Bar ratio={challenge.done / challenge.goal} />
              <Text style={styles.msSub}>
                {challenge.done} of {challenge.goal} posted · {challenge.joined ? 'see the challenge' : 'join the challenge'}
              </Text>
            </View>
            <Chevron />
          </View>
        </PressableCard>
      )}

      {nextStreak && (
        <View style={[styles.ms, line() && styles.msLine]}>
          <View style={styles.msIcon}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M20 6L9 17l-5-5" stroke={ds.purple} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <View style={styles.flex}>
            <Text style={styles.msTitle}>Check in {nextStreak} days in a row</Text>
            <Bar ratio={streakDays / nextStreak} />
            <Text style={styles.msSub}>
              {plural(streakDays, 'day')} now · {nextStreak - streakDays} to go
            </Text>
          </View>
        </View>
      )}
    </GlassCard>
  );
}

// ─── The last seven days ────────────────────────────────────────────────────
export function WeeklyReportCard({ overview }: { overview: GrowthOverview }) {
  const { week, bestTime } = overview;
  const withPosts = overview.platforms.filter((p) => p.avgViews30 !== null).sort((a, b) => b.avgViews30! - a.avgViews30!);
  const tiles: { label: string; value: string; note?: string; icon: React.ReactNode }[] = [];
  if (week.followersChange !== null) {
    tiles.push({
      label: 'Followers',
      value: week.followersChange === 0 ? 'No change' : signedCount(week.followersChange),
      note: 'last 7 days',
      icon: <Path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" />,
    });
  }
  tiles.push({
    label: 'Posts',
    value: plural(week.postsThisWeek, 'post'),
    note: `${week.postsLastWeek} the week before`,
    icon: <Path d="M15 10l5-3v10l-5-3M4 6h11v12H4z" stroke={ds.purple} strokeWidth={2} strokeLinejoin="round" />,
  });
  if (bestTime) {
    tiles.push({
      label: 'Best time',
      value: bestTime.label,
      note: `from ${plural(bestTime.postsAtBestTime, 'post')} near then`,
      icon: (
        <>
          <Circle cx="12" cy="12" r="9" stroke={ds.purple} strokeWidth={2} />
          <Path d="M12 7v5l3 2" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" />
        </>
      ),
    });
  }
  if (withPosts.length >= 2) {
    tiles.push({
      label: 'Most views per post',
      value: PLATFORM_LABEL[withPosts[0]!.platform] ?? withPosts[0]!.platform,
      note: `${compactCount(withPosts[0]!.avgViews30!)} on average`,
      icon: <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" stroke={ds.purple} strokeWidth={2} strokeLinejoin="round" />,
    });
  }
  return (
    <GlassCard strong radius={24} padding={18}>
      <View style={styles.reportTop}>
        <View style={styles.msIcon}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Rect x="3" y="3" width="18" height="18" rx="3" stroke={ds.purple} strokeWidth={2} />
            <Path d="M7 14l3-3 3 2 4-5" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <View style={styles.flex}>
          <Text style={styles.msTitle}>This week</Text>
          <Text style={styles.msSub}>A quick look at how it’s going</Text>
        </View>
      </View>
      <View style={styles.reportGrid}>
        {tiles.map((r) => (
          <View key={r.label} style={styles.reportTile}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              {r.icon}
            </Svg>
            <Text style={styles.reportLabel}>{r.label}</Text>
            <Text style={styles.reportValue}>{r.value}</Text>
            {r.note && <Text style={styles.reportNote}>{r.note}</Text>}
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

/** Opens a post where it lives (the platform's own page). */
export function openPostOnPlatform(post: Pick<GrowthPost, 'shareUrl'>): void {
  if (post.shareUrl) void Linking.openURL(post.shareUrl);
}

const glass = { backgroundColor: 'rgba(255, 255, 255, 0.8)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' };

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  muted: { fontSize: 12, fontWeight: '700', color: ds.text3 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2 },
  cardSub: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 2 },
  footnote: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: ds.text3, marginTop: 8 },
  noPosts: { fontSize: 13.5, fontWeight: '600', color: ds.text2, marginTop: 12 },

  bigRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  big: { fontSize: 38, lineHeight: 44, fontWeight: '800', color: ds.ink, letterSpacing: -1.2 },
  chip: { paddingHorizontal: 9, height: 24, justifyContent: 'center', borderRadius: 999, backgroundColor: 'rgba(23, 20, 32, 0.06)' },
  chipUp: { backgroundColor: ds.greenBg },
  chipText: { fontSize: 12, fontWeight: '800', color: ds.text2 },
  chipTextUp: { color: ds.greenFill },
  stats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 16, alignItems: 'center', ...glass },
  statValue: { fontSize: 17, fontWeight: '800', color: ds.ink },
  statLabel: { fontSize: 11, fontWeight: '700', color: ds.text3, marginTop: 2, textAlign: 'center' },
  chart: { marginTop: 14 },
  seeMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8 },
  seeMoreText: { fontSize: 13.5, fontWeight: '800', color: ds.purple },

  barTrack: { height: 8, borderRadius: 4, backgroundColor: ds.lavender, overflow: 'hidden', marginTop: 6 },
  barFill: { height: 8, borderRadius: 4 },

  postTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  platChip: { alignSelf: 'flex-start', paddingHorizontal: 8, height: 22, borderRadius: 999, justifyContent: 'center', backgroundColor: ds.lavender },
  platChipText: { fontSize: 11, fontWeight: '800', color: ds.purple },
  postTitle: { fontSize: 15.5, lineHeight: 21, fontWeight: '800', color: ds.ink, marginTop: 6 },
  postWhen: { fontSize: 12, fontWeight: '600', color: ds.text3, marginTop: 2 },
  metricNote: { fontSize: 12.5, fontWeight: '700', color: ds.greenFill, marginTop: 10 },
  postActions: { gap: 10, marginTop: 16 },

  compareRows: { gap: 10, marginTop: 14 },
  compareRow: { padding: 10, borderRadius: 14 },
  compareName: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  formatName: { fontSize: 14, fontWeight: '800', color: ds.ink },
  formatScore: { fontSize: 13, fontWeight: '800', color: ds.text2 },

  msHeader: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6 },
  ms: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14 },
  msLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(23, 20, 32, 0.08)' },
  msIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center' },
  msTitle: { fontSize: 15, fontWeight: '800', color: ds.ink },
  msSub: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 4 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 12 },
  listViews: { alignItems: 'flex-end', minWidth: 44 },
  manage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 14 },

  reportTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, marginTop: 14 },
  reportTile: { width: '48.5%', padding: 12, borderRadius: 16, ...glass },
  reportLabel: { fontSize: 11.5, fontWeight: '800', color: ds.text3, marginTop: 6 },
  reportValue: { fontSize: 14, fontWeight: '800', color: ds.ink, marginTop: 1 },
  reportNote: { fontSize: 11.5, fontWeight: '600', color: ds.text3, marginTop: 2 },
});
