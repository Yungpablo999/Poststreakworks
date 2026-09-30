import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { Text } from './AppText';
import { ds } from '../../theme/colors';

// The app's one confirmation message. Frosted glass (matches the rest of the
// app), with a small icon: green tick for things that worked, purple for tips
// and "not quite yet" notes. Rises a little and fades in (no bounce), and sits
// just above the tab bar wherever the creator has scrolled.

export type ToastTone = 'success' | 'info';

// Older callers pass emoji / ticks inside the text; show it clean
const clean = (t: string) =>
  t
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, '')
    .replace(/^[\s✓✔•·-]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

const SUCCESS_WORDS = /(saved|copied|connected|added|removed|linked|scheduled|posted|set for|updated|swapped|done|ready)/i;
const NOT_YET_WORDS = /(couldn|please|select|pick |add |try again|no rush|not yet)/i;

export function guessTone(message: string): ToastTone {
  if (NOT_YET_WORDS.test(message)) return 'info';
  return SUCCESS_WORDS.test(message) ? 'success' : 'info';
}

export function AppToast({ message, tone, bottom = 108 }: { message: string | null; tone?: ToastTone; bottom?: number }) {
  if (!message) return null;
  const text = clean(message);
  const t = tone ?? guessTone(text);
  return (
    <Animated.View
      key={text}
      pointerEvents="none"
      entering={FadeInUp.duration(260).easing(Easing.out(Easing.cubic))}
      exiting={FadeOutDown.duration(180)}
      style={[styles.wrap, { bottom }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View style={styles.toast}>
        <BlurView intensity={40} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 18, overflow: 'hidden' }]} />
        <View style={[StyleSheet.absoluteFill, styles.fill]} />
        <View style={[styles.icon, t === 'success' ? styles.iconSuccess : styles.iconInfo]}>
          {t === 'success' ? (
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          ) : (
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill={ds.purple} />
            </Svg>
          )}
        </View>
        <Text style={styles.text}>{text}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 440,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#3F25BF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  fill: { borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.88)' },
  icon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconSuccess: { backgroundColor: ds.greenFill },
  iconInfo: { backgroundColor: ds.lavender },
  text: { flexShrink: 1, fontSize: 13.5, lineHeight: 19, fontWeight: '700', color: ds.ink },
});
