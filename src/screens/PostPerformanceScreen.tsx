import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, FadeInUp, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { FitLines } from '../components/ui/FitLines';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { PostThumb, comparisonLine, openPostOnPlatform, postMetrics } from '../components/growth/GrowthReturning';
import { usePageWidth } from '../hooks/useBreakpoint';
import { useAsync } from '../hooks/useAsync';
import { loadGrowthPost } from '../backend/growth';
import { compactCount } from '../utils/format';
import { ds } from '../theme/colors';
import type { GrowthPost } from '../../frontend/shared/types/phase1';

// How one of the creator's posts did, from the numbers its platform reported at the last refresh:
// views, likes, comments, shares (and saves where the platform gives them), set against the
// account's other posts. It states what stands out and never claims to know exactly why a post
// took off. Retention curves, watch time and "who watched" aren't available from the platforms, so
// they aren't shown.

interface PostPerformanceScreenProps {
  /** `tiktok:7012…`: which post (from Growth). */
  postKey: string | null;
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  /** Starts a new post, with this one's title as the idea. */
  onPlanSimilar?: (title: string) => void;
  /** Only given when the server can write ideas (the AI is set up). */
  onMakeMoreLikeThis?: (post: GrowthPost) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  onLogout?: () => void;
}

function Bars({ post }: { post: GrowthPost }) {
  const average = post.comparison!.averageViews;
  const max = Math.max(post.views, average, 1);
  const rows = [
    { label: 'This post', value: post.views, color: ds.purple },
    { label: `Your usual ${post.platformName} post`, value: average, color: '#C4B5FD' },
  ];
  return (
    <View style={styles.bars}>
      {rows.map((r, i) => (
        <View key={r.label}>
          <View style={styles.rowBetween}>
            <Text style={styles.barLabel}>{r.label}</Text>
            <Text style={styles.barValue}>{compactCount(r.value)}</Text>
          </View>
          <Bar ratio={r.value / max} color={r.color} delay={i * 120} />
        </View>
      ))}
    </View>
  );
}

function Bar({ ratio, color, delay }: { ratio: number; color: string; delay: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(250 + delay, withTiming(Math.max(0.02, Math.min(1, ratio)), { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [ratio, delay, w]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { backgroundColor: color }, style]} />
    </View>
  );
}

export const PostPerformanceScreen: React.FC<PostPerformanceScreenProps> = ({
  postKey,
  onBack,
  onNavigateTab,
  onOpenJarvisPro,
  onPlanSimilar,
  onMakeMoreLikeThis,
  userProfile,
  onSaveProfile,
  onLogout,
}) => {
  const pageWidth = usePageWidth();
  const [showProfile, setShowProfile] = useState(false);
  const enter = (d: number) => FadeInUp.delay(d).duration(500).easing(Easing.out(Easing.cubic));
  const { data: post, loading, reload } = useAsync(() => (postKey ? loadGrowthPost(postKey) : Promise.resolve(null)), [postKey]);

  const note = post ? comparisonLine(post) : null;
  // The comparison card already says how the views compare, so don't say it twice
  const stoodOut = post ? post.insights.filter((i) => !(post.comparison && /^Got .*views/.test(i))) : [];

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FreeAppHeader backgroundColor="transparent" onBack={onBack} onOpenJarvisPro={onOpenJarvisPro} onOpenProfile={() => setShowProfile(true)} userProfile={userProfile} />
        <ScrollView contentContainerStyle={[styles.scroll, pageWidth]} showsVerticalScrollIndicator={false}>
          <Animated.View entering={enter(0)} style={styles.headline}>
            <FitLines lines={['How your', <Text key="a" style={styles.accent}>post did</Text>]} textStyle={styles.headlineText} maxFontSize={38} align="left" accessibilityLabel="How your post did" />
            <Text style={styles.sub}>The numbers from the platform, set against your other posts.</Text>
          </Animated.View>

          {!post ? (
            <View style={styles.loading}>
              {loading ? (
                <ActivityIndicator color={ds.purple} />
              ) : (
                <>
                  <Text style={styles.loadingText}>{postKey ? 'Couldn’t load that post.' : 'Pick a post from Growth to see how it did.'}</Text>
                  {postKey ? (
                    <Text style={[styles.loadingText, styles.retry]} onPress={reload} accessibilityRole="button">
                      Try again
                    </Text>
                  ) : (
                    <Text style={[styles.loadingText, styles.retry]} onPress={onBack} accessibilityRole="button">
                      Back to Growth
                    </Text>
                  )}
                </>
              )}
            </View>
          ) : (
            <>
              {/* The post */}
              <Animated.View entering={enter(60)}>
                <GlassCard strong radius={26} padding={16}>
                  <View style={styles.top}>
                    <PostThumb post={post} width={92} height={116} />
                    <View style={styles.flex}>
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>{post.durationSeconds ? `${post.platformName} · ${post.durationSeconds}s video` : post.platformName}</Text>
                      </View>
                      <Text style={styles.title} numberOfLines={4}>
                        {post.title || 'Untitled post'}
                      </Text>
                      {post.postedAt && (
                        <Text style={styles.when}>
                          Posted {new Date(post.postedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, {new Date(post.postedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </Text>
                      )}
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
                  {post.saves !== null && (
                    <Text style={styles.extra}>
                      {compactCount(post.shares)} shares · {compactCount(post.saves)} saves
                    </Text>
                  )}
                  {post.engagementRate !== null && (
                    <Text style={styles.extra}>
                      About {(post.engagementRate * 100).toFixed(post.engagementRate >= 0.1 ? 0 : 1)} likes, comments and shares for every 100 views.
                    </Text>
                  )}
                </GlassCard>
              </Animated.View>

              {/* Compared with usual */}
              <Animated.View entering={enter(120)}>
                <Text style={styles.section}>Compared with your usual</Text>
                <GlassCard radius={24} padding={16}>
                  {post.comparison ? (
                    <>
                      <Bars post={post} />
                      {note && <Text style={styles.compareNote}>{note}</Text>}
                    </>
                  ) : (
                    <Text style={styles.empty}>
                      There aren’t enough other {post.platformName} posts from the last 90 days to compare with yet. After a few more, you’ll see how this one measures up.
                    </Text>
                  )}
                </GlassCard>
              </Animated.View>

              {/* What stands out */}
              <Animated.View entering={enter(180)}>
                <Text style={styles.section}>What stands out</Text>
                <GlassCard radius={24} padding={6}>
                  {stoodOut.length > 0 ? (
                    stoodOut.map((text, i) => (
                      <View key={text} style={[styles.stand, i < stoodOut.length - 1 && styles.standLine]}>
                        <View style={styles.standNum}>
                          <Text style={styles.standNumText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.standBody}>{text}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.empty, styles.emptyPad]}>Nothing in particular stands out yet. This fills in as you post more.</Text>
                  )}
                </GlassCard>
              </Animated.View>

              {/* What next */}
              <Animated.View entering={enter(240)}>
                <GlassCard strong radius={24} padding={16} style={styles.next}>
                  <Text style={styles.nextTitle}>What next</Text>
                  <View style={styles.actions}>
                    {onMakeMoreLikeThis && <AppButton title="Make more like this" onPress={() => onMakeMoreLikeThis(post)} />}
                    {onPlanSimilar && <AppButton title="Plan a post like this" variant={onMakeMoreLikeThis ? 'glass' : 'primary'} onPress={() => onPlanSimilar(post.title)} />}
                    {post.shareUrl && <AppButton title={`Open on ${post.platformName}`} variant="quiet" onPress={() => openPostOnPlatform(post)} />}
                  </View>
                </GlassCard>
              </Animated.View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

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
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  section: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24, marginBottom: 12 },
  loading: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  loadingText: { fontSize: 14.5, fontWeight: '600', color: ds.text2, textAlign: 'center' },
  retry: { color: ds.purple, fontWeight: '800' },

  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 8, height: 22, borderRadius: 999, justifyContent: 'center', backgroundColor: ds.lavender },
  chipText: { fontSize: 11, fontWeight: '800', color: ds.purple },
  title: { fontSize: 17, lineHeight: 23, fontWeight: '800', color: ds.ink, marginTop: 8 },
  when: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stat: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 16, alignItems: 'center', ...glass },
  statValue: { fontSize: 18, fontWeight: '800', color: ds.ink },
  statLabel: { fontSize: 11, fontWeight: '700', color: ds.text3, marginTop: 2 },
  extra: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: ds.text2, marginTop: 10 },

  bars: { gap: 14 },
  barLabel: { fontSize: 13, fontWeight: '700', color: ds.text2, flexShrink: 1 },
  barValue: { fontSize: 14, fontWeight: '800', color: ds.ink },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: ds.lavender, overflow: 'hidden', marginTop: 6 },
  barFill: { height: 10, borderRadius: 5 },
  compareNote: { fontSize: 13.5, lineHeight: 19, fontWeight: '700', color: ds.greenFill, marginTop: 14 },
  empty: { fontSize: 13.5, lineHeight: 20, color: ds.text2 },
  emptyPad: { padding: 12 },

  stand: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 12, paddingVertical: 14 },
  standLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(23, 20, 32, 0.08)' },
  standNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center' },
  standNumText: { fontSize: 13, fontWeight: '800', color: ds.purple },
  standBody: { flex: 1, fontSize: 14.5, lineHeight: 21, color: ds.ink, fontWeight: '600', marginTop: 3 },

  next: { marginTop: 24 },
  nextTitle: { fontSize: 16, fontWeight: '800', color: ds.ink },
  actions: { gap: 10, marginTop: 14 },
});
