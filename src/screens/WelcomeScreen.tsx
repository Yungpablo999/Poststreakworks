import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, useWindowDimensions, Platform } from 'react-native';
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

// Headline words rise in one after another; "Earn." uses the Playfair accent
const HEADLINE = [
  { word: 'Create.', accent: false },
  { word: 'Grow.', accent: false },
  { word: 'Earn.', accent: true },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted = () => {}, onSignIn = () => {} }) => {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = height < 740;
  // Size the headline from the available width so all three words fit on one line
  const contentWidth = Math.min(width, 480) - 40;
  const headlineSize = Math.min(isSmallScreen ? 38 : 42, Math.floor(contentWidth / 9.2));

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.container}>
          {/* Brand: ghost + wordmark together */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.topBar}>
            <BrandLogo size="sm" />
          </Animated.View>

          {/* Mascot floats up, then keeps its gentle idle bob (tap it to make it bounce) */}
          <Animated.View entering={FadeInUp.delay(120).duration(ENTER_MS + 150)} style={styles.hero}>
            <HeroMascot />
          </Animated.View>

          {/* Headline: word-by-word rise */}
          <View style={styles.headlineRow} accessible accessibilityRole="header" accessibilityLabel="Create. Grow. Earn.">
            {HEADLINE.map(({ word, accent }, i) => (
              <Animated.View key={word} entering={FadeInUp.delay(380 + i * 130).duration(ENTER_MS)}>
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
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: 10,
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
