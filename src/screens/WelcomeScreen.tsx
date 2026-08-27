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

          {/* Social Proof Pill: Overlapping Creator Avatars + 5 Stars + 15k+ Creators */}
          <View style={styles.socialProofChip}>
            <View style={styles.avatarStack}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' }}
                style={[styles.avatarImg, { zIndex: 3 }]}
              />
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' }}
                style={[styles.avatarImg, { marginLeft: -6, zIndex: 2 }]}
              />
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80' }}
                style={[styles.avatarImg, { marginLeft: -6, zIndex: 1 }]}
              />
            </View>

            <View style={styles.socialProofDivider} />

            <View style={styles.socialProofMeta}>
              <View style={styles.starsRow}>
                <Text style={styles.starIcon}>★★★★★</Text>
                <Text style={styles.ratingNumber}>4.9</Text>
              </View>
              <Text style={styles.socialProofLabel} numberOfLines={1}>
                Joined by 15k+ creators
              </Text>
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
    left: 12,
    top: 16,
    zIndex: 5,
  },
  heroOrbitBadgeRight: {
    position: 'absolute',
    right: 12,
    top: 16,
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
    color: colors.primary,
  },

  /* Luxury Social Proof Chip */
  socialProofChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingLeft: 18,
    paddingRight: 22,
    paddingVertical: 7,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.08)',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    marginTop: 8,
    gap: 12,
    alignSelf: 'center',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 4px 16px rgba(23, 20, 32, 0.05)',
        } as any)
      : {}),
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.6,
    borderColor: '#FFFFFF',
    backgroundColor: '#ECE8F6',
  },
  socialProofDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(23, 20, 32, 0.08)',
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
    color: '#F59E0B',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  ratingNumber: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  socialProofLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5C546E',
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
