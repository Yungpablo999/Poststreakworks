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
import { typography } from '../theme/typography';
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

        {/* CONTENT SECTION: Tall Editorial Luxury Headline & Social Proof */}
        <View style={styles.contentSection}>
          <View style={styles.tallHeadlineContainer}>
            <Text
              style={[
                styles.mainHeadline,
                isSmallScreen && styles.mainHeadlineSmall,
                isMediumScreen && styles.mainHeadlineMedium,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              Create. Grow. <Text style={styles.streakAccent}>Earn.</Text>
            </Text>
          </View>

          {/* Social Proof Pill: Overlapping Creator Badges + 5 Stars + 12k+ Creators */}
          <View style={styles.socialProofChip}>
            <View style={styles.avatarStack}>
              <View style={[styles.avatarBubble, { backgroundColor: '#FF5C5C', zIndex: 3 }]}>
                <Text style={styles.avatarLetter}>✦</Text>
              </View>
              <View style={[styles.avatarBubble, { backgroundColor: '#582CDB', marginLeft: -7, zIndex: 2 }]}>
                <Text style={styles.avatarLetter}>🔥</Text>
              </View>
              <View style={[styles.avatarBubble, { backgroundColor: '#FABD32', marginLeft: -7, zIndex: 1 }]}>
                <Text style={styles.avatarLetter}>⚡</Text>
              </View>
            </View>

            <View style={styles.socialProofDivider} />

            <View style={styles.socialProofMeta}>
              <View style={styles.starsRow}>
                <Text style={styles.starIcon}>★★★★★</Text>
                <Text style={styles.ratingNumber}>4.9</Text>
              </View>
              <Text style={styles.socialProofLabel}>Joined by 12,000+ creators</Text>
            </View>
          </View>
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
    paddingHorizontal: 8,
    marginVertical: 4,
    width: '100%',
  },
  tallHeadlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scaleY: 2.4 }, { scaleX: 0.82 }],
    marginVertical: 32,
    minHeight: 80,
  },
  mainHeadline: {
    fontFamily: typography.editorialSerif,
    fontSize: 58,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.8,
    lineHeight: 62,
    ...(Platform.OS === 'web' ? { whiteSpace: 'nowrap' } : {}),
  },
  mainHeadlineMedium: {
    fontSize: 50,
    lineHeight: 54,
    letterSpacing: 0.6,
  },
  mainHeadlineSmall: {
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: 0.4,
  },
  streakAccent: {
    fontFamily: typography.editorialSerif,
    fontWeight: '700',
    color: colors.primary,
  },

  /* Social Proof Chip */
  socialProofChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.1)',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginTop: 6,
    gap: 9,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarLetter: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  socialProofDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(23, 20, 32, 0.1)',
  },
  socialProofMeta: {
    alignItems: 'flex-start',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starIcon: {
    color: '#FABD32',
    fontSize: 11,
    letterSpacing: 1,
  },
  ratingNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  socialProofLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F7894',
    letterSpacing: 0.1,
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
