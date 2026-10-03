import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { PlatformLogo, type PlatformLogoType } from '../onboarding/PlatformLogo';
import { ds } from '../../theme/colors';
import { useAccounts, useConnectablePlatforms } from '../../backend/accounts';
import { AccountRows } from './AccountRows';

// "Your accounts": how many are connected, a row to connect or disconnect each platform, and what
// we do with them. Shown in the accounts sheet and in the profile's Accounts tab.

function LogoDot({ id, on }: { id: string; on: boolean }) {
  const o = useSharedValue(on ? 1 : 0.3);
  useEffect(() => {
    o.value = withTiming(on ? 1 : 0.3, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [on, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={style}>
      <PlatformLogo type={id as PlatformLogoType} size={26} />
    </Animated.View>
  );
}

export function AccountsPanel() {
  const platforms = useConnectablePlatforms();
  const accounts = useAccounts();
  // One that needs the creator to approve again isn't working, so it isn't counted
  const working = (p: string) => accounts.some((a) => a.platform === p && a.status !== 'needs_reauth');
  const connected = platforms.filter(working).length;

  const bar = useSharedValue(0);
  useEffect(() => {
    bar.value = withTiming(platforms.length ? connected / platforms.length : 0, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [connected, platforms.length, bar]);
  const fill = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));

  return (
    <View>
      {platforms.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.dots}>
            {platforms.map((p) => (
              <LogoDot key={p} id={p} on={working(p)} />
            ))}
          </View>
          <View style={styles.track}>
            <Animated.View style={[styles.trackFill, fill]} />
          </View>
          <Text style={styles.summaryText}>{connected === 0 ? 'None connected yet. One is enough to start.' : `${connected} of ${platforms.length} connected`}</Text>
        </View>
      )}

      <View style={styles.list}>
        <AccountRows />
      </View>

      <View style={styles.privacy}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Rect x="5" y="11" width="14" height="10" rx="2.5" stroke={ds.purple} strokeWidth={2} />
          <Path d="M8 11V8a4 4 0 118 0v3" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" />
        </Svg>
        <Text style={styles.privacyText}>We only read your stats. Nothing is posted without you, and you can disconnect any time.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  dots: { flexDirection: 'row', gap: 8 },
  track: { height: 6, borderRadius: 3, backgroundColor: ds.lavender, marginTop: 12, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: ds.greenFill },
  summaryText: { fontSize: 13, fontWeight: '700', color: ds.text2, marginTop: 8 },
  list: { marginTop: 14 },
  privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16, padding: 12, borderRadius: 16, backgroundColor: 'rgba(245, 243, 255, 0.9)' },
  privacyText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: ds.text2 },
});
