import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Rect } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { GlassCard } from '../glass/GlassCard';
import { PlatformLogo, type PlatformLogoType } from './PlatformLogo';
import { ds } from '../../theme/colors';
import { PLAN_POSTS_PER_WEEK, postsPerWeek, type AccountSnapshot } from '../../data';

// "Your account right now" — built to be understood in a glance:
// one big comparison (posting now vs. with the plan), one line on what they're
// missing (from their own data), and a slim line of what unlocks on saving.
// Tabs switch between every connected platform. "Sample" tag while the app
// runs on mock data.

const PLATFORM_NAMES: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  threads: 'Threads',
};

export function AccountSnapshotCard({ snapshots }: { snapshots: AccountSnapshot[] }) {
  const [active, setActive] = useState(0);
  const snap = snapshots[Math.min(active, snapshots.length - 1)];
  const now = postsPerWeek(snap);
  const missed =
    snap.postsAtBestTime < snap.recentPosts
      ? `Your best time is ${snap.bestTime}. Only ${snap.postsAtBestTime} of your last ${snap.recentPosts} posts went out then.`
      : `Your best time is ${snap.bestTime}. Posting there more often is your easiest win.`;

  return (
    <GlassCard strong radius={26} padding={20}>
      {/* Platform tabs (only when more than one is connected) */}
      <View style={styles.topRow}>
        {snapshots.length > 1 ? (
          <View style={styles.tabs} accessibilityRole="tablist">
            {snapshots.map((s, i) => {
              const on = i === active;
              return (
                <Pressable
                  key={s.platform}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    setActive(i);
                  }}
                  accessibilityRole="tab"
                  accessibilityLabel={PLATFORM_NAMES[s.platform]}
                  accessibilityState={{ selected: on }}
                  style={[styles.tab, on && styles.tabOn]}
                >
                  <PlatformLogo type={s.platform as PlatformLogoType} size={18} />
                  {on && <Text style={styles.tabText}>{PLATFORM_NAMES[s.platform]}</Text>}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.singleLabel}>
            <PlatformLogo type={snap.platform as PlatformLogoType} size={20} />
            <Text style={styles.eyebrow}>YOUR {PLATFORM_NAMES[snap.platform]?.toUpperCase()}</Text>
          </View>
        )}
        {snap.isSample && <Text style={styles.sample}>Sample</Text>}
      </View>

      {/* The one comparison that matters */}
      <Animated.View key={snap.platform} entering={FadeIn.duration(300)}>
        <View style={styles.compare}>
          <View style={styles.side}>
            <Text style={styles.sideLabel}>NOW</Text>
            <Text style={styles.bigNow}>{now}×</Text>
            <Text style={styles.sideSub}>a week</Text>
          </View>

          <Svg width={36} height={16} viewBox="0 0 36 16" fill="none">
            <Path d="M2 8h30M26 2l6 6-6 6" stroke={ds.text3} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>

          <View style={styles.side}>
            <Text style={[styles.sideLabel, { color: ds.purple }]}>WITH YOUR PLAN</Text>
            <Text style={styles.bigPlan}>{PLAN_POSTS_PER_WEEK}×</Text>
            <Text style={styles.sideSub}>a week</Text>
          </View>
        </View>

        <Animated.Text entering={FadeInUp.delay(120).duration(350)} style={styles.missed}>
          {missed}
        </Animated.Text>
      </Animated.View>

      {/* What unlocks — one slim line */}
      <View style={styles.lockRow}>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Rect x="5" y="11" width="14" height="10" rx="2" stroke={ds.purple} strokeWidth={2.2} />
          <Path d="M8 11V8a4 4 0 118 0v3" stroke={ds.purple} strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
        <Text style={styles.lockText} numberOfLines={2}>
          Save your plan to unlock audience, top formats and trends
        </Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  singleLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    padding: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(23, 20, 32, 0.05)',
    flexShrink: 1,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    minWidth: 30,
    paddingHorizontal: 6,
    borderRadius: 999,
    justifyContent: 'center',
  },
  tabOn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
  tabText: { fontSize: 12.5, fontWeight: '800', color: ds.ink },
  sample: { fontSize: 10.5, fontWeight: '700', color: ds.text3, marginLeft: 8 },
  compare: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 18,
    marginBottom: 4,
  },
  side: { alignItems: 'center', minWidth: 90 },
  sideLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1, color: ds.text3 },
  bigNow: { fontSize: 44, lineHeight: 50, fontWeight: '800', color: ds.text3, letterSpacing: -1.5, marginTop: 2 },
  bigPlan: { fontSize: 44, lineHeight: 50, fontWeight: '800', color: ds.purple, letterSpacing: -1.5, marginTop: 2 },
  sideSub: { fontSize: 12.5, fontWeight: '600', color: ds.text2 },
  missed: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: ds.ink,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 4,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ds.line,
  },
  lockText: { flexShrink: 1, fontSize: 12.5, fontWeight: '700', color: ds.purple },
});
