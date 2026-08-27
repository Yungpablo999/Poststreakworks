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
  const ghostSize = isCompact ? 270 : Math.min(width * 0.82, 330);

  // 1. Ghost Mascot Full Character Physics (Leap, Squash & Stretch, 3D Tilt)
  const ghostScale = useRef(new Animated.Value(0.1)).current;
  const ghostY = useRef(new Animated.Value(90)).current;
  const ghostStretchY = useRef(new Animated.Value(0.6)).current;
  const ghostSquishX = useRef(new Animated.Value(1.4)).current;
  const ghostRotate = useRef(new Animated.Value(-1)).current;
  const ghostOpacity = useRef(new Animated.Value(0)).current;

  // 2. Continuous Living Hover Loop
  const hoverY = useRef(new Animated.Value(0)).current;
  const hoverTilt = useRef(new Animated.Value(0)).current;

  // 3. 0.4s — PostStreak Title: "Zoom & Pop" Snap
  const titleScale = useRef(new Animated.Value(0.2)).current;
  const titleY = useRef(new Animated.Value(35)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  // 4. 0.7s — Creator Streak Pill: Smooth Expansion & Pop
  const pillOpacity = useRef(new Animated.Value(0)).current;
  const pillScale = useRef(new Animated.Value(0.85)).current;
  const pillY = useRef(new Animated.Value(12)).current;

  // 5. 1.2s — Footer Companion Intro: Subtle Rise
  const footerY = useRef(new Animated.Value(20)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  // 6. 1.5–1.8s — Seamless Morph Transition to Welcome Screen
  const splashTextOpacity = useRef(new Animated.Value(1)).current;
  const splashTextY = useRef(new Animated.Value(0)).current;
  const ghostMorphY = useRef(new Animated.Value(0)).current;
  const ghostMorphScale = useRef(new Animated.Value(1)).current;
  const splashBgOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      onFinish();
    }, 4500);

    // Continuous Living Hover Loop
    const hoverLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(hoverY, {
            toValue: -10,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(hoverTilt, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(hoverY, {
            toValue: 6,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(hoverTilt, {
            toValue: -1,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Complete Choreographed Intro Timeline
    Animated.sequence([
      // 0.0s: Step 1 — Ghost Emerges & Floats Upward with Squash & Stretch
      Animated.parallel([
        Animated.timing(ghostOpacity, {
          toValue: 1,
          duration: 340,
          useNativeDriver: true,
        }),
        Animated.spring(ghostScale, {
          toValue: 1.18,
          speed: 18,
          bounciness: 10,
          useNativeDriver: true,
        }),
        Animated.spring(ghostY, {
          toValue: -20,
          speed: 16,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.spring(ghostStretchY, {
          toValue: 1.25,
          speed: 18,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.spring(ghostSquishX, {
          toValue: 0.82,
          speed: 18,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.timing(ghostRotate, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),

      // Step 2 — Joyful Cushion Landing & Reset
      Animated.parallel([
        Animated.spring(ghostScale, {
          toValue: 1.0,
          speed: 22,
          bounciness: 12,
          useNativeDriver: true,
        }),
        Animated.spring(ghostY, {
          toValue: 0,
          speed: 22,
          bounciness: 10,
          useNativeDriver: true,
        }),
        Animated.spring(ghostStretchY, {
          toValue: 1.0,
          speed: 18,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.spring(ghostSquishX, {
          toValue: 1.0,
          speed: 18,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.timing(ghostRotate, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]),

      // 0.4s: Step 3 — PostStreak Logo Text "Zoom & Pop"
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.spring(titleScale, {
          toValue: 1.0,
          speed: 22,
          bounciness: 10,
          useNativeDriver: true,
        }),
        Animated.spring(titleY, {
          toValue: 0,
          speed: 20,
          bounciness: 8,
          useNativeDriver: true,
        }),
      ]),

      // 0.7s: Step 4 — The Pill Smoothly Expands and Fades In
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

      // Wait until 1.2s
      Animated.delay(200),

      // 1.2s: Step 5 — "POWERED BY JARVIS CORE ✦" appears subtly
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

      // 1.5s–1.8s: Step 6 — Transition directly into Get Started Screen
      Animated.delay(120),
      Animated.parallel([
        // Splash text sinks away
        Animated.timing(splashTextOpacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(splashTextY, {
          toValue: 20,
          duration: 280,
          useNativeDriver: true,
        }),
        // Ghost gracefully floats up and morphs directly into Welcome hero spot
        Animated.timing(ghostMorphY, {
          toValue: isCompact ? -95 : -120,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.timing(ghostMorphScale, {
          toValue: isCompact ? 0.82 : 0.80,
          duration: 480,
          useNativeDriver: true,
        }),
        // Background softly reveals Welcome Screen
        Animated.timing(splashBgOpacity, {
          toValue: 0,
          duration: 480,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onFinish();
    });

    hoverLoop.start();

    // Haptics milestones
    const t1 = setTimeout(() => {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 450);

    const t2 = setTimeout(() => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 750);

    return () => {
      clearTimeout(fallbackTimer);
      clearTimeout(t1);
      clearTimeout(t2);
      hoverLoop.stop();
    };
  }, [
    ghostScale,
    ghostY,
    ghostStretchY,
    ghostSquishX,
    ghostRotate,
    ghostOpacity,
    titleScale,
    titleY,
    titleOpacity,
    pillOpacity,
    pillScale,
    pillY,
    footerY,
    footerOpacity,
    splashTextOpacity,
    splashTextY,
    ghostMorphY,
    ghostMorphScale,
    splashBgOpacity,
    hoverY,
    hoverTilt,
    isCompact,
    onFinish,
  ]);

  const rotation = ghostRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-16deg', '0deg', '16deg'],
  });

  const liveTilt = hoverTilt.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-3.5deg', '0deg', '3.5deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          opacity: splashBgOpacity,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Main Center Area: Extra-Large Mascot + Orchestrated Typography */}
      <View style={styles.mascotArea}>
        {/* 1. HERO GHOST MASCOT (0.0s) with Full Squash & Stretch Physics */}
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
                { scaleY: ghostStretchY },
                { scaleX: ghostSquishX },
                { rotate: rotation },
                { rotate: liveTilt },
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

        {/* 2. ORCHESTRATED BRANDING */}
        <Animated.View
          style={[
            styles.brandContainer,
            {
              opacity: splashTextOpacity,
              transform: [{ translateY: splashTextY }],
            },
          ]}
        >
          {/* PostStreak Title (0.4s): "Zoom & Pop" in Signature Royal Purple */}
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

          {/* Tagline Pill (0.7s): Smoothly Expands and Fades In */}
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
        </Animated.View>
      </View>

      {/* 3. BOTTOM FOOTER (1.2s): Subtle Companion Introduction */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: Animated.multiply(footerOpacity, splashTextOpacity),
            transform: [
              { translateY: footerY },
              { translateY: splashTextY },
            ],
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
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
