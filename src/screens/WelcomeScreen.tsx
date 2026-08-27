import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { GlassBadge } from '../components/GlassBadge';
import { HeroMascot } from '../components/HeroMascot';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';

// Exact Figma SVG Vector Icons with Micro-Animations
import { AnimatedFireIcon } from '../components/icons/AnimatedFireIcon';
import { AnimatedAudioWaveIcon } from '../components/icons/AnimatedAudioWaveIcon';
import { AnimatedGrowthIcon } from '../components/icons/AnimatedGrowthIcon';
import { AnimatedSparklesIcon } from '../components/icons/AnimatedSparklesIcon';

interface WelcomeScreenProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted = () => {},
  onSignIn = () => {},
}) => {
  const { height } = useWindowDimensions();
  const isSmallScreen = height < 740;
  const isMediumScreen = height >= 740 && height < 860;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Main Screen Flex Container */}
      <View style={styles.mainContainer}>
        {/* HERO SECTION: Mascot Character with Soft Halo & Flanking Ambient Orbit Badges */}
        <View style={styles.heroSection}>
          {/* Left Orbit Badge */}
          <View style={styles.heroOrbitBadgeLeft}>
            <GlassBadge floatDelay={0} floatDistance={5} size={isSmallScreen ? 50 : 58}>
              <AnimatedFireIcon size={isSmallScreen ? 23 : 26} color="#FABD32" opacity={0.9} />
            </GlassBadge>
          </View>

          <HeroMascot />

          {/* Right Orbit Badge */}
          <View style={styles.heroOrbitBadgeRight}>
            <GlassBadge floatDelay={400} floatDistance={6} size={isSmallScreen ? 50 : 58}>
              <AnimatedAudioWaveIcon size={isSmallScreen ? 22 : 25} color={colors.primary} />
            </GlassBadge>
          </View>
        </View>

        {/* CONTENT SECTION: Clean, Minimalist Premium Headline & Subtitle */}
        <View style={styles.contentSection}>
          <Text
            style={[
              styles.mainHeadline,
              isSmallScreen && styles.mainHeadlineSmall,
              isMediumScreen && styles.mainHeadlineMedium,
            ]}
          >
            Create. Grow.{'\n'}
            <Text style={styles.streakAccent}>Earn.</Text>
          </Text>

          <Text
            style={[
              styles.subtitle,
              isSmallScreen && styles.subtitleSmall,
            ]}
          >
            Your AI-powered creator operating system.
          </Text>
        </View>

        {/* ACTION BUTTONS CLUSTER */}
        <View style={styles.actionCluster}>
          <PrimaryButton
            title="Get Started"
            onPress={onGetStarted}
            style={styles.actionBtn}
          />
          <SecondaryButton
            title="Sign In"
            onPress={onSignIn}
            style={styles.actionBtn}
          />
        </View>

        {/* FOOTER & FLANKING AMBIENT BADGES */}
        <View style={styles.footerContainer}>
          {/* Bottom Left Floating Badge: Growth Trend */}
          <View style={styles.bottomLeftBadge}>
            <GlassBadge floatDelay={600} floatDistance={5} size={isSmallScreen ? 50 : 56}>
              <AnimatedGrowthIcon size={isSmallScreen ? 22 : 25} color={colors.primary} />
            </GlassBadge>
          </View>

          {/* Center Footer Attribution */}
          <View style={styles.footerTextContainer}>
            <Text style={styles.poweredBy}>POWERED BY</Text>
            <Text style={styles.jarvisCore}>Jarvis Core</Text>
          </View>

          {/* Bottom Right Floating Badge: Twinkling Sparkles */}
          <View style={styles.bottomRightBadge}>
            <GlassBadge floatDelay={900} floatDistance={6} size={isSmallScreen ? 50 : 56}>
              <AnimatedSparklesIcon size={isSmallScreen ? 24 : 27} color="#FABD32" opacity={0.9} />
            </GlassBadge>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 4 : 12,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  /* Center Hero with Flanking Orbit Badges */
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    width: '100%',
    position: 'relative',
  },
  heroOrbitBadgeLeft: {
    position: 'absolute',
    left: 8,
    top: 14,
    zIndex: 5,
  },
  heroOrbitBadgeRight: {
    position: 'absolute',
    right: 8,
    top: 22,
    zIndex: 5,
  },

  /* Content & Typography */
  contentSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 2,
  },
  mainHeadline: {
    fontSize: 38,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -1.6,
    lineHeight: 44,
    marginBottom: 4,
  },
  mainHeadlineMedium: {
    fontSize: 35,
    lineHeight: 40,
    letterSpacing: -1.4,
  },
  mainHeadlineSmall: {
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -1.1,
    marginBottom: 3,
  },
  streakAccent: {
    color: colors.primary,
  },
  subtitle: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#7F7894',
    textAlign: 'center',
    letterSpacing: 0.1,
    marginTop: 4,
    maxWidth: 320,
  },
  subtitleSmall: {
    fontSize: 13,
    marginTop: 3,
    maxWidth: 280,
  },

  /* Action Buttons */
  actionCluster: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    marginVertical: 6,
    zIndex: 10,
  },
  actionBtn: {
    width: '100%',
    maxWidth: 380,
    height: 56,
  },

  /* Footer & Flanking Badges */
  footerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginTop: 4,
    marginBottom: 4,
    minHeight: 56,
  },
  bottomLeftBadge: {
    width: 56,
    alignItems: 'flex-start',
  },
  footerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRightBadge: {
    width: 56,
    alignItems: 'flex-end',
  },
  poweredBy: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  jarvisCore: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.4,
  },
});
