import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
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

  const badgeSize = isSmallScreen ? 34 : 38;
  const iconSize = isSmallScreen ? 15 : 17;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Main Screen Flex Container */}
      <View style={styles.mainContainer}>
        {/* HERO SECTION: Mascot Character with Soft Halo & Flanking Ambient Orbit Badges */}
        <View style={styles.heroSection}>
          {/* Left Orbit Badge */}
          <View style={styles.heroOrbitBadgeLeft}>
            <GlassBadge floatDelay={0} floatDistance={3.5} size={badgeSize}>
              <AnimatedFireIcon size={iconSize} color="#D97706" opacity={0.8} />
            </GlassBadge>
          </View>

          <HeroMascot />

          {/* Right Orbit Badge */}
          <View style={styles.heroOrbitBadgeRight}>
            <GlassBadge floatDelay={400} floatDistance={4} size={badgeSize}>
              <AnimatedAudioWaveIcon size={iconSize - 1} color={colors.primary} />
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

          {/* Social Proof Pill: Apple-grade restraint */}
          <View style={styles.socialProofChip}>
            <View style={styles.avatarStack}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' }}
                style={[styles.avatarImg, { zIndex: 3 }]}
              />
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' }}
                style={[styles.avatarImg, { marginLeft: -5, zIndex: 2 }]}
              />
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80' }}
                style={[styles.avatarImg, { marginLeft: -5, zIndex: 1 }]}
              />
            </View>

            <View style={styles.socialProofDivider} />

            <View style={styles.socialProofMeta}>
              <View style={styles.starsRow}>
                <Text style={styles.starIcon}>★★★★★</Text>
                <Text style={styles.ratingNumber}>4.9</Text>
              </View>
              <Text style={styles.socialProofLabel} numberOfLines={1}>
                Trusted by 15K+ creators
              </Text>
            </View>
          </View>
        </View>

        {/* ACTION BUTTONS CLUSTER */}
        <View style={styles.actionCluster}>
          <PrimaryButton
            title="Get Started"
            onPress={onGetStarted}
            style={[
              styles.primaryActionBtn,
              isSmallScreen && { height: 48 },
            ]}
          />
          <SecondaryButton
            title="Sign In"
            onPress={onSignIn}
            style={styles.secondaryActionBtn}
          />
        </View>

        {/* FOOTER & FLANKING AMBIENT BADGES */}
        <View style={styles.footerContainer}>
          {/* Bottom Left Floating Badge: Growth Trend */}
          <View style={styles.bottomLeftBadge}>
            <GlassBadge floatDelay={600} floatDistance={3.5} size={badgeSize}>
              <AnimatedGrowthIcon size={iconSize - 1} color={colors.primary} />
            </GlassBadge>
          </View>

          {/* Center Footer Attribution */}
          <View style={styles.footerTextContainer}>
            <Text style={styles.poweredBy}>POWERED BY</Text>
            <Text style={styles.jarvisCore}>Jarvis Core</Text>
          </View>

          {/* Bottom Right Floating Badge: Twinkling Sparkles */}
          <View style={styles.bottomRightBadge}>
            <GlassBadge floatDelay={900} floatDistance={4} size={badgeSize}>
              <AnimatedSparklesIcon size={iconSize} color="#D97706" opacity={0.8} />
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

  /* Center Hero with Symmetrically Flanking Orbit Badges */
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    width: '100%',
    position: 'relative',
  },
  heroOrbitBadgeLeft: {
    position: 'absolute',
    left: 18,
    top: 14,
    zIndex: 5,
  },
  heroOrbitBadgeRight: {
    position: 'absolute',
    right: 18,
    top: 14,
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
    transform: [{ scaleY: 2.05 }, { scaleX: 0.88 }],
    marginVertical: 18,
  },
  mainHeadline: {
    fontFamily: typography.editorialSerif,
    fontSize: 48,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.6,
    lineHeight: 52,
    ...(Platform.OS === 'web' ? { whiteSpace: 'nowrap' } : {}),
  },
  mainHeadlineMedium: {
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: 0.5,
  },
  mainHeadlineSmall: {
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: 0.4,
  },
  streakAccent: {
    fontFamily: typography.editorialSerif,
    fontWeight: '700',
    color: colors.primary, // Signature Royal Purple
  },

  /* Apple-grade Restrained Social Proof Pill */
  socialProofChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingLeft: 14,
    paddingRight: 18,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.05)',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    marginTop: 8,
    gap: 10,
    alignSelf: 'center',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 2px 10px rgba(23, 20, 32, 0.03)',
        } as any)
      : {}),
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImg: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
    backgroundColor: '#ECE8F6',
  },
  socialProofDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(23, 20, 32, 0.06)',
  },
  socialProofMeta: {
    alignItems: 'flex-start',
    gap: 1,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starIcon: {
    color: '#D97706',
    fontSize: 10,
    letterSpacing: 1,
  },
  ratingNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171420',
  },
  socialProofLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#5E576E',
    letterSpacing: -0.1,
  },

  /* Action Buttons */
  actionCluster: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
    marginVertical: 6,
    zIndex: 10,
  },
  primaryActionBtn: {
    width: '100%',
    maxWidth: 360,
    height: 50,
  },
  secondaryActionBtn: {
    width: '100%',
    maxWidth: 360,
    height: 40,
  },

  /* Footer & Flanking Badges */
  footerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 4,
    marginBottom: 4,
    minHeight: 44,
  },
  bottomLeftBadge: {
    width: 44,
    alignItems: 'flex-start',
  },
  footerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRightBadge: {
    width: 44,
    alignItems: 'flex-end',
  },
  poweredBy: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8E869E',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  jarvisCore: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.3,
  },
});
