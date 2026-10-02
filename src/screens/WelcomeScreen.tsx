import React, { useRef, useState } from 'react';
import { StyleSheet, View, StatusBar, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { BrandLogo } from '../components/BrandLogo';
import { HeroMascot } from '../components/HeroMascot';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { ds } from '../theme/colors';
import { typography } from '../theme/typography';

interface WelcomeScreenProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

// One smooth curve for every entrance, as on the website
const ENTER_MS = 650;
const MASCOT_DELAY = 120;
const MASCOT_ENTER_MS = 800;

// Headline words rise in one after another; "Earn." uses the Playfair accent
const HEADLINE = [
  { word: 'Create.', accent: false },
  { word: 'Grow.', accent: false },
  { word: 'Earn.', accent: true },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted = () => {}, onSignIn = () => {} }) => {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = height < 740;
  // Headline starts at its ideal size, then shrinks to fit once we've measured it.
  // Measuring (instead of guessing) matters because fonts render at slightly
  // different widths on iPhone, Android and the web.
  const contentWidth = Math.min(width, 480) - 40;
  const maxHeadlineSize = isSmallScreen ? 38 : 42;
  const WORD_GAP = 10;
  const [fitScale, setFitScale] = useState(1);
  const headlineSize = Math.floor(maxHeadlineSize * fitScale);
  const wordWidths = useRef<number[]>([]);
  const handleWordLayout = (index: number, w: number) => {
    wordWidths.current[index] = w;
    const measured = wordWidths.current.filter((x) => x > 0);
    if (measured.length < HEADLINE.length) return;
    const total = measured.reduce((a, b) => a + b, 0) + WORD_GAP * (HEADLINE.length - 1);
    const naturalWidth = total / fitScale; // width at the ideal size
    const next = Math.min(1, (contentWidth * 0.96) / naturalWidth);
    if (Math.abs(next - fitScale) > 0.01) setFitScale(next);
  };

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.container}>
          {/* Brand: ghost + wordmark together */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.topBar}>
            <BrandLogo size="sm" wordmarkOnly />
          </Animated.View>

          {/* Mascot floats up, then keeps its gentle idle bob (tap it to make it bounce) */}
          <Animated.View entering={FadeInUp.delay(MASCOT_DELAY).duration(MASCOT_ENTER_MS)} style={styles.hero}>
            {/* The ghost rises into place and stays there (no idle float); tapping it still makes it bounce */}
            <HeroMascot idleFloat={false} />
          </Animated.View>

          {/* Headline: word-by-word rise */}
          <View
            // Fixed height: shrinking the words to fit must never shift the ghost or buttons
            style={[styles.headlineRow, { height: Math.round(maxHeadlineSize * 1.25) }]}
            accessible
            accessibilityRole="header"
            accessibilityLabel="Create. Grow. Earn."
          >
            {HEADLINE.map(({ word, accent }, i) => (
              <Animated.View
                key={word}
                entering={FadeInUp.delay(380 + i * 130).duration(ENTER_MS)}
                onLayout={(e) => handleWordLayout(i, e.nativeEvent.layout.width)}
                style={styles.word}
              >
                <Text
                  style={[
                    styles.headline,
                    { fontSize: headlineSize, lineHeight: Math.round(headlineSize * 1.2) },
                    accent && styles.earn,
                  ]}
                >
                  {word}
                </Text>
              </Animated.View>
            ))}
          </View>

          {/* Actions */}
          <Animated.View entering={FadeInUp.delay(820).duration(ENTER_MS)} style={styles.actions}>
            <AppButton
              title="Get started, it's free"
              size="lg"
              onPress={onGetStarted}
              iconRight={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              }
            />
            <AppButton title="I already have an account" variant="glass" onPress={onSignIn} />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(1100).duration(600)}>
            <Text style={styles.footer}>
              Powered by <Text style={styles.footerStrong}>Jarvis</Text>, your AI creative partner
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ds.bg,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 4 : 16,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBar: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'baseline',
    gap: 10,
  },
  word: {
    flexShrink: 0, // keep each word's natural width so it can be measured
  },
  headline: {
    fontWeight: '800',
    letterSpacing: -1,
    color: ds.ink,
  },
  earn: {
    fontFamily: typography.earnAccent,
    color: ds.purple,
    letterSpacing: -0.5,
  },
  actions: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  footer: {
    fontSize: 12,
    color: ds.text2,
    textAlign: 'center',
  },
  footerStrong: {
    fontWeight: '700',
    color: ds.purple,
  },
});
