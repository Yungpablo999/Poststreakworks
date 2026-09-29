import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, useWindowDimensions, Platform } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect, Mask, RadialGradient, Stop, Path } from 'react-native-svg';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { BrandLogo } from '../components/BrandLogo';
import { HeroMascot } from '../components/HeroMascot';
import { SocialBrandIcon } from '../components/SocialBrandIcon';
import { ds, dsRadius } from '../theme/colors';
import { typography } from '../theme/typography';
import { STAGE_1_PLATFORMS } from '../config/features';

interface WelcomeScreenProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

const PLATFORM_LABELS: Record<(typeof STAGE_1_PLATFORMS)[number], string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  threads: 'Threads',
  facebook: 'Facebook',
};

// Display order for the "Works with" row
const PLATFORM_ORDER = ['tiktok', 'instagram', 'youtube', 'threads', 'facebook'] as const;

// Soft dot grid behind the mascot, fading out towards the edges (as on the website hero)
function DotField({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="welcomeDots" width={22} height={22} patternUnits="userSpaceOnUse">
          <Circle cx={11} cy={11} r={1.2} fill={ds.ink} fillOpacity={0.12} />
        </Pattern>
        <RadialGradient id="welcomeDotsFade" cx="50%" cy="48%" rx="55%" ry="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset="55%" stopColor="#FFFFFF" stopOpacity={0.6} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <Mask id="welcomeDotsMask">
          <Rect width={width} height={height} fill="url(#welcomeDotsFade)" />
        </Mask>
      </Defs>
      <Rect width={width} height={height} fill="url(#welcomeDots)" mask="url(#welcomeDotsMask)" />
    </Svg>
  );
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted = () => {}, onSignIn = () => {} }) => {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = height < 740;
  const heroHeight = isSmallScreen ? 280 : 320;
  // Size the headline from the available width so "Earn." always fits on one line
  const contentWidth = Math.min(width, 480) - 40;
  const headlineSize = Math.min(isSmallScreen ? 36 : 40, Math.floor(contentWidth / 9.6));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={ds.bg} />

      <View style={styles.container}>
        {/* Brand: ghost + wordmark together */}
        <View style={styles.topBar}>
          <BrandLogo size="sm" />
        </View>

        {/* Hero mascot over a soft dot field */}
        <View style={[styles.hero, { height: heroHeight }]}>
          <DotField width={Math.min(width, 520)} height={heroHeight} />
          <HeroMascot />
        </View>

        {/* Headline + what the app does */}
        <View style={styles.copy}>
          <Text
            style={[styles.headline, { fontSize: headlineSize, lineHeight: Math.round(headlineSize * 1.2) }]}
            accessibilityRole="header"
          >
            Create. Grow. <Text style={styles.earn}>Earn.</Text>
          </Text>
          <Text style={styles.subhead}>
            Your daily creator habit. Plan, post and grow with Jarvis by your side.
          </Text>
        </View>

        {/* Honest proof: the platforms PostStreak works with */}
        <View style={styles.worksWith} accessible accessibilityLabel="Works with TikTok, Instagram, YouTube, Threads and Facebook">
          <Text style={styles.worksWithLabel}>WORKS WITH</Text>
          <View style={styles.platformRow}>
            {PLATFORM_ORDER.map((id) => (
              <View key={id} style={styles.platformBadge} accessibilityLabel={PLATFORM_LABELS[id]}>
                <SocialBrandIcon platform={id} size={20} />
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
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
          <AppButton title="I already have an account" variant="outline" onPress={onSignIn} />
        </View>

        <Text style={styles.footer}>
          Powered by <Text style={styles.footerStrong}>Jarvis</Text>, your AI creative partner
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ds.bg,
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
    overflow: 'hidden',
  },
  copy: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  headline: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '800',
    letterSpacing: -1,
    color: ds.ink,
    textAlign: 'center',
  },
  earn: {
    fontFamily: typography.earnAccent,
    color: ds.purple,
    letterSpacing: -0.5,
  },
  subhead: {
    fontSize: 16,
    lineHeight: 24,
    color: ds.text2,
    textAlign: 'center',
    maxWidth: 320,
  },
  worksWith: {
    alignItems: 'center',
    gap: 10,
  },
  worksWithLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: ds.text3,
  },
  platformRow: {
    flexDirection: 'row',
    gap: 10,
  },
  platformBadge: {
    width: 40,
    height: 40,
    borderRadius: dsRadius.sm,
    backgroundColor: ds.surface,
    borderWidth: 1,
    borderColor: ds.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  footer: {
    fontSize: 12,
    color: ds.text3,
    textAlign: 'center',
  },
  footerStrong: {
    fontWeight: '700',
    color: ds.purple,
  },
});
