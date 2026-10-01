import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInUp } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { BrandLogo } from '../BrandLogo';
import { JarvisOrb } from '../JarvisOrb';
import { HeroMascot } from '../HeroMascot';
import { ds } from '../../theme/colors';
import { typography } from '../../theme/typography';

// Desktop only: the left half of sign-up and sign-in. The brand, what
// PostStreak does in three lines, and Jarvis. The step itself sits on the right.

const POINTS = [
  'Ideas, hooks and captions shaped by what works for you',
  'One post becomes a version for every platform',
  'A gentle daily habit, at your own pace',
];

const enter = (d: number) => FadeInUp.delay(d).duration(520).easing(Easing.out(Easing.cubic));

export function OnboardingBrandPanel() {
  return (
    <View style={styles.root}>
      <View style={styles.inner}>
        <BrandLogo size="md" />
        <Animated.View entering={enter(80)} style={styles.mascot}>
          <HeroMascot />
        </Animated.View>
        <Animated.View entering={enter(160)}>
          <Text style={styles.title}>
            Create. Grow. <Text style={styles.earn}>Earn.</Text>
          </Text>
        </Animated.View>
        <Animated.View entering={enter(240)} style={styles.points}>
          {POINTS.map((p) => (
            <View key={p} style={styles.point}>
              <View style={styles.tick}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                  <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <Text style={styles.pointText}>{p}</Text>
            </View>
          ))}
        </Animated.View>
        <Animated.View entering={enter(320)} style={styles.jarvis}>
          <JarvisOrb size={28} />
          <Text style={styles.jarvisText}>Jarvis helps with every step.</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    maxWidth: 620,
    justifyContent: 'center',
    paddingHorizontal: 56,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  inner: { maxWidth: 460 },
  mascot: { alignItems: 'flex-start', marginTop: 24, marginBottom: 4 },
  title: { fontSize: 46, lineHeight: 52, fontWeight: '800', letterSpacing: -1.5, color: ds.ink },
  earn: { fontFamily: typography.earnAccent, color: ds.purple, fontWeight: '400' },
  points: { marginTop: 24, gap: 14 },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tick: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.purple, marginTop: 1 },
  pointText: { flex: 1, fontSize: 16, lineHeight: 23, fontWeight: '600', color: ds.text2 },
  jarvis: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 32 },
  jarvisText: { fontSize: 14.5, fontWeight: '700', color: ds.text3 },
});
