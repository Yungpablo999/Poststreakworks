import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Image,
  useWindowDimensions,
  Platform,
  StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish = () => {} }) => {
  const { width, height } = useWindowDimensions();
  const isCompact = height < 750;
  const ghostSize = isCompact ? 240 : Math.min(width * 0.75, 300);

  // 0.0s — Ghost Entry
  const ghostOpacity = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(0.85)).current;
  const ghostY = useRef(new Animated.Value(20)).current;

  // Ambient living float loop
  const hoverY = useRef(new Animated.Value(0)).current;

  // 0.4s — PostStreak Logo Text
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.92)).current;
  const titleY = useRef(new Animated.Value(12)).current;

  // 0.7s — Streak Pill Expansion
  const pillOpacity = useRef(new Animated.Value(0)).current;
  const pillScale = useRef(new Animated.Value(0.86)).current;
  const pillY = useRef(new Animated.Value(10)).current;

  // 1.2s — Powered by Jarvis Core
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const footerY = useRef(new Animated.Value(8)).current;

  // 1.5–1.8s — Transition directly into Get Started (Welcome Screen)
  const splashMasterOpacity = useRef(new Animated.Value(1)).current;
  const ghostMorphY = useRef(new Animated.Value(0)).current;
  const ghostMorphScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Safety auto-dismiss fallback
    const fallbackTimer = setTimeout(() => {
      onFinish();
    }, 3000);

    // 1. Start Ambient Hover Loop
    const hoverLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hoverY, {
          toValue: -8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(hoverY, {
          toValue: 4,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );
    hoverLoop.start();

    // 2. Orchestrated Brand Intro Timeline (0.0s -> 0.4s -> 0.7s -> 1.2s -> 1.5-1.8s)
    Animated.sequence([
      // 0.0s: Ghost fades/scales in
      Animated.parallel([
        Animated.timing(ghostOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.spring(ghostScale, {
          toValue: 1.0,
          speed: 18,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.spring(ghostY, {
          toValue: 0,
          speed: 16,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]),

      // Wait until 0.4s (380ms elapsed, wait 40ms)
      Animated.delay(40),

      // 0.4s: PostStreak logo text appears
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.spring(titleScale, {
          toValue: 1.0,
          speed: 20,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.spring(titleY, {
          toValue: 0,
          speed: 18,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]),

      // Wait until 0.7s (380+40+260 = 680ms elapsed, wait 40ms)
      Animated.delay(40),

      // 0.7s: The pill smoothly expands and fades in
      Animated.parallel([
        Animated.timing(pillOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(pillScale, {
          toValue: 1.0,
          speed: 18,
          bounciness: 9,
          useNativeDriver: true,
        }),
        Animated.spring(pillY, {
          toValue: 0,
          speed: 18,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]),

      // Wait until 1.2s (680+40+280 = 1000ms elapsed, wait 200ms)
      Animated.delay(200),

      // 1.2s: "Powered by Jarvis Core" appears subtly
      Animated.parallel([
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(footerY, {
          toValue: 0,
          speed: 16,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]),

      // Wait until 1.5s (1200+280 = 1480ms elapsed, wait 70ms)
      Animated.delay(70),

      // 1.55s–1.8s: Everything transitions directly into the Get Started screen
      Animated.parallel([
        // Whole splash fades out smoothly
        Animated.timing(splashMasterOpacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        // Ghost floats smoothly into the Welcome Hero spot
        Animated.timing(ghostMorphY, {
          toValue: isCompact ? -70 : -90,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(ghostMorphScale, {
          toValue: 0.88,
          duration: 280,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onFinish();
    });

    // Subtle tactile haptics during animation milestones
    const t1 = setTimeout(() => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 400);

    const t2 = setTimeout(() => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 720);

    return () => {
      clearTimeout(fallbackTimer);
      clearTimeout(t1);
      clearTimeout(t2);
      hoverLoop.stop();
    };
  }, [
    ghostOpacity,
    ghostScale,
    ghostY,
    titleOpacity,
    titleScale,
    titleY,
    pillOpacity,
    pillScale,
    pillY,
    footerOpacity,
    footerY,
    splashMasterOpacity,
    ghostMorphY,
    ghostMorphScale,
    hoverY,
    isCompact,
    onFinish,
  ]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          opacity: splashMasterOpacity,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Main Center Area: Mascot + Orchestrated Brand Elements */}
      <View style={styles.mascotArea}>
        {/* 1. HERO GHOST MASCOT (0.0s) */}
        <Animated.View
          style={[
            styles.ghostWrapper,
            {
              opacity: ghostOpacity,
              transform: [
                { translateY: ghostY },
                { translateY: hoverY },
                { translateY: ghostMorphY },
                { scale: ghostScale },
                { scale: ghostMorphScale },
              ],
            },
          ]}
        >
          <Image
            source={require('../../assets/images/jarvis-ghost-clean.png')}
            style={{ width: ghostSize, height: ghostSize }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* 2. POSTSTREAK LOGO TEXT (0.4s) */}
        <Animated.View
          style={[
            styles.titleWrapper,
            {
              opacity: titleOpacity,
              transform: [
                { scale: titleScale },
                { translateY: titleY },
              ],
            },
          ]}
        >
          <Text style={styles.solidBrandTitle}>Poststreak</Text>
        </Animated.View>

        {/* 3. SMOOTHLY EXPANDING CREATOR STREAK PILL (0.7s) */}
        <Animated.View
          style={[
            styles.taglinePill,
            {
              opacity: pillOpacity,
              transform: [
                { scale: pillScale },
                { translateY: pillY },
              ],
            },
          ]}
        >
          <Text style={styles.taglineEmoji}>✨</Text>
          <Text style={styles.taglineText}>Build your creator streak</Text>
          <Text style={styles.taglineEmoji}>🔥</Text>
        </Animated.View>
      </View>

      {/* 4. SUBTLE COMPANION INTRODUCTION (1.2s) */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: footerOpacity,
            transform: [{ translateY: footerY }],
          },
        ]}
      >
        <Text style={styles.poweredBy}>POWERED BY</Text>
        <View style={styles.jarvisRow}>
          <Text style={styles.jarvisCore}>JARVIS CORE</Text>
          <Text style={styles.sparkleGlyph}>✦</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 52 : 44,
    paddingHorizontal: 20,
    zIndex: 999,
  },
  mascotArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  ghostWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  titleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  solidBrandTitle: {
    fontSize: 44,
    fontWeight: '700',
    color: '#491ECC', // Deep Signature Royal Purple
    letterSpacing: -1.2,
    textAlign: 'center',
    fontFamily: typography.editorialSerif,
    textShadowColor: 'rgba(73, 30, 204, 0.12)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  taglinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(88, 44, 219, 0.08)',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(88, 44, 219, 0.16)',
    gap: 7,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 2,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 3px 10px rgba(88, 44, 219, 0.06)',
        } as any)
      : {}),
  },
  taglineEmoji: {
    fontSize: 13.5,
  },
  taglineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#582CDB',
    letterSpacing: -0.1,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  poweredBy: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#8E869E',
    letterSpacing: 1.5,
    marginBottom: 2,
    textAlign: 'center',
  },
  jarvisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  jarvisCore: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  sparkleGlyph: {
    fontSize: 11,
    color: '#D97706',
    marginTop: -1,
  },
});
