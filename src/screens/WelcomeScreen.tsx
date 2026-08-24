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
        {/* TOP ROW: Floating Animated Badges (Fire & Audio Wave) */}
        <View style={styles.topBadgesRow}>
          <GlassBadge floatDelay={0} floatDistance={6} size={isSmallScreen ? 54 : 62}>
            <AnimatedFireIcon size={isSmallScreen ? 24 : 28} color="#FABD32" opacity={0.9} />
          </GlassBadge>

          <GlassBadge floatDelay={400} floatDistance={7} size={isSmallScreen ? 54 : 62}>
            <AnimatedAudioWaveIcon size={isSmallScreen ? 23 : 26} color={colors.primary} />
          </GlassBadge>
        </View>

        {/* HERO SECTION: Mascot Character with Soft Halo */}
        <View style={styles.heroSection}>
          <HeroMascot />
        </View>

        {/* CONTENT SECTION: Brand, Main Headline & Subtitle */}
        <View style={styles.contentSection}>
          <Text style={styles.brandTag}>Poststreak</Text>

          <Text
            style={[
              styles.mainHeadline,
              isSmallScreen && styles.mainHeadlineSmall,
              isMediumScreen && styles.mainHeadlineMedium,
            ]}
          >
            Build your{'\n'}
            creator <Text style={styles.streakAccent}>streak.</Text>
          </Text>

          <Text
            style={[
              styles.subtitle,
              isSmallScreen && styles.subtitleSmall,
            ]}
          >
            Create, schedule, collaborate, grow and earn—all in one creator engine.
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

  /* Top Badges Row */
  topBadgesRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginTop: 2,
    zIndex: 10,
  },

  /* Center Hero */
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },

  /* Content & Typography */
  contentSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  brandTag: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.amberDark,
    letterSpacing: 0.2,
    marginBottom: 6,
    textAlign: 'center',
  },
  mainHeadline: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -1.6,
    lineHeight: 44,
    marginBottom: 10,
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
    marginBottom: 6,
  },
  streakAccent: {
    color: colors.primary,
  },
  subtitle: {
    fontSize: 15.5,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 310,
  },
  subtitleSmall: {
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 275,
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
    maxWidth: 270,
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
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.4,
  },
});
