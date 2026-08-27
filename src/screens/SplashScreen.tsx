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

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish = () => {} }) => {
  const { width, height } = useWindowDimensions();
  // Extra-large, majestic hero mascot
  const isCompact = height < 750;
  const ghostSize = isCompact ? 280 : Math.min(width * 0.85, 350);

  // 1. Ghost Mascot Animations (Duolingo float, 3D turn, happy leap)
  const ghostScale = useRef(new Animated.Value(0.1)).current;
  const ghostY = useRef(new Animated.Value(100)).current;
  const ghostStretchY = useRef(new Animated.Value(0.6)).current;
  const ghostSquishX = useRef(new Animated.Value(1.4)).current;
  const ghostRotate = useRef(new Animated.Value(-1)).current;
  const ghostOpacity = useRef(new Animated.Value(0)).current;

  // 2. Continuous Living Hover after Entrance
  const hoverY = useRef(new Animated.Value(0)).current;
  const hoverTilt = useRef(new Animated.Value(0)).current;

  // 3. PowerPoint-Style Kinetic Text Transitions
  // A. Title: "Zoom & Pop" Snap with 3D scale spring
  const titleScale = useRef(new Animated.Value(0.2)).current;
  const titleY = useRef(new Animated.Value(45)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  // B. Tagline: "Fly In from Left" Kinetic Slide with ease-out
  const taglineX = useRef(new Animated.Value(-80)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const tagScale = useRef(new Animated.Value(0.9)).current;

  // C. Footer: Kinetic Rise & Glow
  const footerY = useRef(new Animated.Value(30)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  // 4. Seamless Hero Morph Transition to Welcome Screen
  const splashTextOpacity = useRef(new Animated.Value(1)).current;
  const splashTextY = useRef(new Animated.Value(0)).current;
  const ghostMorphY = useRef(new Animated.Value(0)).current;
  const ghostMorphScale = useRef(new Animated.Value(1)).current;
  const splashBgOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Safety auto-dismiss fallback (generous so it never cuts animation prematurely)
    const fallbackTimer = setTimeout(() => {
      onFinish();
    }, 5500);

    // Grand Duolingo + PowerPoint Cinematic Opening Sequence
    const playOpeningSequence = () => {
      Animated.sequence([
        // Step 1: Ghost Emerges & Floats Upward
        Animated.parallel([
          Animated.timing(ghostOpacity, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.spring(ghostScale, {
            toValue: 1.22,
            useNativeDriver: true,
            speed: 18,
            bounciness: 12,
          }),
          Animated.spring(ghostY, {
            toValue: -26,
            useNativeDriver: true,
            speed: 16,
            bounciness: 8,
          }),
          Animated.spring(ghostStretchY, {
            toValue: 1.3,
            useNativeDriver: true,
            speed: 18,
            bounciness: 8,
          }),
          Animated.spring(ghostSquishX, {
            toValue: 0.78,
            useNativeDriver: true,
            speed: 18,
            bounciness: 8,
          }),
          Animated.timing(ghostRotate, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),

        // Step 2: Ghost Joyful Air Turn & Wobble
        Animated.parallel([
          Animated.timing(ghostRotate, {
            toValue: -0.6,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(ghostY, {
            toValue: 14,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(ghostStretchY, {
            toValue: 0.85,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(ghostSquishX, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),

        // Step 3: Ghost Happy Cushion Landing
        Animated.parallel([
          Animated.spring(ghostScale, {
            toValue: 1.0,
            useNativeDriver: true,
            speed: 22,
            bounciness: 14,
          }),
          Animated.spring(ghostY, {
            toValue: 0,
            useNativeDriver: true,
            speed: 22,
            bounciness: 12,
          }),
          Animated.spring(ghostStretchY, {
            toValue: 1.0,
            useNativeDriver: true,
            speed: 18,
            bounciness: 8,
          }),
          Animated.spring(ghostSquishX, {
            toValue: 1.0,
            useNativeDriver: true,
            speed: 18,
            bounciness: 8,
          }),
          Animated.timing(ghostRotate, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),

        // Step 4: Kinetic Reveal #1 — Title "Zoom & Pop"
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.spring(titleScale, {
            toValue: 1.0,
            useNativeDriver: true,
            speed: 24,
            bounciness: 12,
          }),
          Animated.spring(titleY, {
            toValue: 0,
            useNativeDriver: true,
            speed: 22,
            bounciness: 10,
          }),
        ]),

        // Step 5: Kinetic Reveal #2 — Tagline "Fly In from Left" & Footer
        Animated.parallel([
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.spring(taglineX, {
            toValue: 0,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
          }),
          Animated.spring(tagScale, {
            toValue: 1.0,
            useNativeDriver: true,
            speed: 20,
            bounciness: 8,
          }),
          Animated.timing(footerOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(footerY, {
            toValue: 0,
            useNativeDriver: true,
            speed: 18,
            bounciness: 8,
          }),
        ]),

        // Step 6: Admire pause
        Animated.delay(950),

        // Step 7: Continuous Ghost Morph — Text sinks away, Ghost gracefully floats UP to Welcome Hero spot
        Animated.parallel([
          // Splash texts fade & slide slightly down
          Animated.timing(splashTextOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(splashTextY, {
            toValue: 24,
            duration: 300,
            useNativeDriver: true,
          }),

          // Ghost smoothly floats UP and scales to Welcome Hero position
          Animated.timing(ghostMorphY, {
            toValue: isCompact ? -110 : -135,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(ghostMorphScale, {
            toValue: isCompact ? 0.78 : 0.76,
            duration: 650,
            useNativeDriver: true,
          }),

          // Background softly reveals Welcome Screen underneath
          Animated.timing(splashBgOpacity, {
            toValue: 0,
            duration: 650,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onFinish();
      });

      // Trigger Success Haptics on Ghost Landing
      setTimeout(() => {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }, 650);
    };

    // Continuous Living Hover Loop
    const hoverLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(hoverY, {
            toValue: -12,
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
            toValue: 8,
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

    playOpeningSequence();
    hoverLoop.start();

    return () => {
      clearTimeout(fallbackTimer);
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
    taglineX,
    taglineOpacity,
    tagScale,
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
    outputRange: ['-18deg', '0deg', '18deg'],
  });

  const liveTilt = hoverTilt.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-4deg', '0deg', '4deg'],
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

      {/* Main Center Area: Extra-Large Mascot + PowerPoint Animated Typography */}
      <View style={styles.mascotArea}>
        {/* 1. BIGGER HERO GHOST MASCOT (Morphs & Floats Up to Welcome Screen) */}
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

        {/* 2. POWERPOINT-STYLE ANIMATED BRANDING */}
        <Animated.View
          style={[
            styles.brandContainer,
            {
              opacity: splashTextOpacity,
              transform: [{ translateY: splashTextY }],
            },
          ]}
        >
          {/* Poststreak Title: "Zoom & Pop" Snap in Deep Solid Royal Purple */}
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

          {/* Tagline: "Fly In from Left" in Elegant Violet Frosted Pill Badge */}
          <Animated.View
            style={[
              styles.taglinePill,
              {
                opacity: taglineOpacity,
                transform: [
                  { translateX: taglineX },
                  { scale: tagScale },
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

      {/* 3. BOTTOM FOOTER: Kinetic Rise */}
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
        <Text style={styles.jarvisCore}>Jarvis Core</Text>
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
    paddingVertical: 48,
    paddingHorizontal: 20,
    zIndex: 999,
  },
  mascotArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  solidBrandTitle: {
    fontSize: 50,
    fontWeight: '700',
    color: '#491ECC', // Deep Solid Royal Purple with ultra contrast
    letterSpacing: -1.8,
    textShadowColor: 'rgba(73, 30, 204, 0.18)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 14,
  },
  taglinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(95, 58, 221, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(95, 58, 221, 0.18)',
    gap: 8,
    shadowColor: '#491ECC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  taglineEmoji: {
    fontSize: 14,
  },
  taglineText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5F3ADD',
    letterSpacing: -0.3,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  poweredBy: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8E859E',
    letterSpacing: 2,
    marginBottom: 4,
  },
  jarvisCore: {
    fontSize: 22,
    fontWeight: '700',
    color: '#491ECC',
    letterSpacing: -0.4,
  },
});
