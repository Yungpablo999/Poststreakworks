import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { BrandLogo } from '../BrandLogo';
import { ds } from '../../theme/colors';
import { IS_WEB_APP, useBreakpoint } from '../../hooks/useBreakpoint';
import { ONBOARDING_STEPS } from '../onboarding/OnboardingProgress';

// Web app on desktop: the header across the top of sign-up and sign-in,
// like a website. Logo on the left, the step and a slim progress line in the
// middle (sign-up only), a quiet Back and the "sign in / create an account"
// switch on the right. Replaces the phone's back arrow and progress card.

/** True when sign-up and sign-in show the website header (any web app size) */
export function useWebFrame(): boolean {
  const bp = useBreakpoint();
  return IS_WEB_APP || bp === 'desktop';
}

/** Website layout for the step itself (wider grid, button under the content): desktop */
export function useWideFrame(): boolean {
  return useBreakpoint() === 'desktop';
}

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;

export function WebAuthHeader({
  step,
  onBack,
  switchLabel,
  switchAction,
  onSwitch,
}: {
  /** 0-based sign-up step, or null on sign-in */
  step: number | null;
  onBack?: () => void;
  switchLabel: string;
  switchAction: string;
  onSwitch: () => void;
}) {
  const total = ONBOARDING_STEPS.length;
  const fill = useSharedValue(step === null ? 0 : step / total);
  useEffect(() => {
    if (step !== null) fill.value = withTiming((step + 1) / total, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [step, total, fill]);
  const bar = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const [backHover, setBackHover] = useState(false);

  // Phones and small tablets: logo, Back and the switch on one row; the step
  // and progress line on a second row
  const compact = useBreakpoint() !== 'desktop';
  if (compact) {
    return (
      <View style={[styles.root, styles.rootCompact]}>
        <View style={styles.row}>
          <View style={styles.side}>
            {onBack ? (
              <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={6} style={[styles.backIcon, pointer]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M15 18l-6-6 6-6" stroke={ds.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </Pressable>
            ) : null}
            <BrandLogo size="sm" />
          </View>
          <Text style={[styles.switchLink, pointer]} onPress={onSwitch} accessibilityRole="link" accessibilityLabel={`${switchLabel} ${switchAction}`}>
            {switchAction}
          </Text>
        </View>
        {step !== null && (
          <View style={styles.compactStep} accessible accessibilityRole="progressbar" accessibilityLabel={`Step ${step + 1} of ${total}: ${ONBOARDING_STEPS[step]}`}>
            <Text style={styles.stepText}>
              Step {step + 1} of {total} <Text style={styles.stepName}>· {ONBOARDING_STEPS[step]}</Text>
            </Text>
            <View style={styles.track}>
              <Animated.View style={[styles.fill, bar]} />
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={styles.side}>
          <BrandLogo size="md" />
        </View>

        {step !== null ? (
          <View style={styles.center} accessible accessibilityRole="progressbar" accessibilityLabel={`Step ${step + 1} of ${total}: ${ONBOARDING_STEPS[step]}`}>
            <Text style={styles.stepText}>
              Step {step + 1} of {total} <Text style={styles.stepName}>· {ONBOARDING_STEPS[step]}</Text>
            </Text>
            <View style={styles.track}>
              <Animated.View style={[styles.fill, bar]} />
            </View>
          </View>
        ) : (
          <View style={styles.center} />
        )}

        <View style={[styles.side, styles.sideRight]}>
          {onBack ? (
            <Pressable onPress={onBack} onHoverIn={() => setBackHover(true)} onHoverOut={() => setBackHover(false)} accessibilityRole="button" style={[styles.back, pointer, backHover && styles.backHover]}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ) : null}
          <Text style={styles.switchText}>
            {switchLabel}{' '}
            <Text style={[styles.switchLink, pointer]} onPress={onSwitch} accessibilityRole="link">
              {switchAction}
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 72,
    justifyContent: 'center',
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(247, 245, 240, 0.7)',
    zIndex: 5,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  rootCompact: { height: undefined, paddingHorizontal: 14, paddingVertical: 10 },
  compactStep: { marginTop: 10 },
  backIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 6, backgroundColor: 'rgba(255, 255, 255, 0.8)' },
  side: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  sideRight: { justifyContent: 'flex-end', gap: 18 },
  center: { width: 380, alignItems: 'center' },
  stepText: { fontSize: 13, fontWeight: '800', color: ds.ink },
  stepName: { fontSize: 13, fontWeight: '700', color: ds.text3 },
  track: { width: '100%', height: 6, marginTop: 8, borderRadius: 3, backgroundColor: ds.lavender, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: ds.purple },
  back: { paddingHorizontal: 14, height: 36, borderRadius: 12, justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.75)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' },
  backHover: { backgroundColor: '#FFFFFF' },
  backText: { fontSize: 14, fontWeight: '700', color: ds.text2 },
  switchText: { fontSize: 14, fontWeight: '600', color: ds.text3 },
  switchLink: { fontWeight: '800', color: ds.purple },
});
