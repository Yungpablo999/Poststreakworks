import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Path,
  G,
  Ellipse,
  Rect,
  Circle,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';

export const LiveGhostMascot: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const isCompact = height < 750;
  const mascotWidth = isCompact ? 190 : Math.min(width * 0.58, 230);
  const mascotHeight = mascotWidth * 1.05;

  // 1. Interactive States
  const [isHappy, setIsHappy] = useState(false);

  // 2. Character Physics Animations
  const hoverY = useRef(new Animated.Value(0)).current;
  const bodyStretchY = useRef(new Animated.Value(1)).current;
  const bodySquishX = useRef(new Animated.Value(1)).current;
  const bodyTilt = useRef(new Animated.Value(0)).current;

  // 3. Eye & Face Expressions (Duolingo-style blinking & wandering gaze)
  const eyeBlink = useRef(new Animated.Value(1)).current;
  const eyeLookX = useRef(new Animated.Value(0)).current;
  const eyeLookY = useRef(new Animated.Value(0)).current;
  const pupilScale = useRef(new Animated.Value(1)).current;

  // 4. Ghost Tail & Speed Streaks Motion
  const streak1X = useRef(new Animated.Value(0)).current;
  const streak2X = useRef(new Animated.Value(0)).current;
  const streak3X = useRef(new Animated.Value(0)).current;
  const streakPulse = useRef(new Animated.Value(0.85)).current;
  const tailWave = useRef(new Animated.Value(0)).current;

  // 5. Interactive Spring Bounce
  const tapScale = useRef(new Animated.Value(1)).current;
  const tapBounceY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // A. Living Hover & Organic Float Loop
    const hoverLoop = Animated.loop(
      Animated.sequence([
        // Float Up + Elongate (Stretch) + Gentle Left Tilt
        Animated.parallel([
          Animated.timing(hoverY, {
            toValue: -14,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(bodyStretchY, {
            toValue: 1.08,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(bodySquishX, {
            toValue: 0.94,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(bodyTilt, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(tailWave, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        // Hover Hang & Settle
        Animated.parallel([
          Animated.timing(hoverY, {
            toValue: -10,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(bodyStretchY, {
            toValue: 1.02,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
        // Descent into Soft Cushion (Squash) + Right Tilt
        Animated.parallel([
          Animated.timing(hoverY, {
            toValue: 8,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(bodyStretchY, {
            toValue: 0.92,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(bodySquishX, {
            toValue: 1.08,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(bodyTilt, {
            toValue: -1,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(tailWave, {
            toValue: -1,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]),
        // Rebound to Center
        Animated.parallel([
          Animated.timing(hoverY, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(bodyStretchY, {
            toValue: 1.0,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(bodySquishX, {
            toValue: 1.0,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(bodyTilt, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(tailWave, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // B. Speed Streaks Flowing & Pulsing
    const streaksLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(streak1X, {
            toValue: -8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(streak2X, {
            toValue: -12,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(streak3X, {
            toValue: -6,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(streakPulse, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(streak1X, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(streak2X, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(streak3X, {
            toValue: 0,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(streakPulse, {
            toValue: 0.65,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // C. Natural Blinking Loop (Blinks every ~3.5s with occasional double-blink)
    let blinkTimeout: ReturnType<typeof setTimeout>;
    const triggerNaturalBlink = () => {
      const isDoubleBlink = Math.random() > 0.65;

      Animated.sequence([
        // Close eyes
        Animated.timing(eyeBlink, {
          toValue: 0.08,
          duration: 90,
          useNativeDriver: true,
        }),
        // Open eyes
        Animated.timing(eyeBlink, {
          toValue: 1.0,
          duration: 110,
          useNativeDriver: true,
        }),
        ...(isDoubleBlink
          ? [
              Animated.delay(120),
              Animated.timing(eyeBlink, {
                toValue: 0.08,
                duration: 80,
                useNativeDriver: true,
              }),
              Animated.timing(eyeBlink, {
                toValue: 1.0,
                duration: 100,
                useNativeDriver: true,
              }),
            ]
          : []),
      ]).start();

      const nextBlinkDelay = Math.random() * 2500 + 2500;
      blinkTimeout = setTimeout(triggerNaturalBlink, nextBlinkDelay);
    };

    // D. Curious Gaze / Looking Around Loop
    let gazeTimeout: ReturnType<typeof setTimeout>;
    const triggerCuriousGaze = () => {
      const directions = [
        { x: 3.5, y: -2 }, // Look top right
        { x: -3.5, y: 1 }, // Look left
        { x: 0, y: 0 },    // Look center
        { x: 2, y: 3 },    // Look down
        { x: 0, y: 0 },    // Return forward
      ];
      const target = directions[Math.floor(Math.random() * directions.length)];

      Animated.parallel([
        Animated.timing(eyeLookX, {
          toValue: target.x,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(eyeLookY, {
          toValue: target.y,
          duration: 450,
          useNativeDriver: true,
        }),
      ]).start();

      const nextGazeDelay = Math.random() * 3000 + 2000;
      gazeTimeout = setTimeout(triggerCuriousGaze, nextGazeDelay);
    };

    hoverLoop.start();
    streaksLoop.start();
    blinkTimeout = setTimeout(triggerNaturalBlink, 1800);
    gazeTimeout = setTimeout(triggerCuriousGaze, 2200);

    return () => {
      hoverLoop.stop();
      streaksLoop.stop();
      clearTimeout(blinkTimeout);
      clearTimeout(gazeTimeout);
    };
  }, [
    hoverY,
    bodyStretchY,
    bodySquishX,
    bodyTilt,
    tailWave,
    streak1X,
    streak2X,
    streak3X,
    streakPulse,
    eyeBlink,
    eyeLookX,
    eyeLookY,
  ]);

  // 6. Interactive Tap Reaction (Happy Jump, Joyful Wiggle, Squint Eyes)
  const handleTap = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsHappy(true);

    Animated.sequence([
      // 1. Anticipation Squash Down
      Animated.parallel([
        Animated.timing(tapScale, {
          toValue: 0.86,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(tapBounceY, {
          toValue: 10,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(bodySquishX, {
          toValue: 1.22,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(bodyStretchY, {
          toValue: 0.8,
          duration: 90,
          useNativeDriver: true,
        }),
      ]),

      // 2. High-Energy Spring Leap Up
      Animated.parallel([
        Animated.spring(tapScale, {
          toValue: 1.16,
          useNativeDriver: true,
          speed: 28,
          bounciness: 12,
        }),
        Animated.spring(tapBounceY, {
          toValue: -34,
          useNativeDriver: true,
          speed: 24,
          bounciness: 12,
        }),
        Animated.spring(bodyStretchY, {
          toValue: 1.25,
          useNativeDriver: true,
          speed: 26,
          bounciness: 8,
        }),
        Animated.spring(bodySquishX, {
          toValue: 0.82,
          useNativeDriver: true,
          speed: 26,
          bounciness: 8,
        }),
        Animated.timing(bodyTilt, {
          toValue: -1.6,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),

      // 3. Playful Joyful Wobble in Air
      Animated.sequence([
        Animated.timing(bodyTilt, {
          toValue: 1.8,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.timing(bodyTilt, {
          toValue: -1.0,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.timing(bodyTilt, {
          toValue: 0,
          duration: 130,
          useNativeDriver: true,
        }),
      ]),

      // 4. Elastic Cushion Landing
      Animated.parallel([
        Animated.spring(tapScale, {
          toValue: 1.0,
          useNativeDriver: true,
          speed: 20,
          bounciness: 8,
        }),
        Animated.spring(tapBounceY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 6,
        }),
        Animated.spring(bodyStretchY, {
          toValue: 1.0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 6,
        }),
        Animated.spring(bodySquishX, {
          toValue: 1.0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 6,
        }),
      ]),
    ]).start(() => {
      setTimeout(() => setIsHappy(false), 300);
    });
  };

  const rotation = bodyTilt.interpolate({
    inputRange: [-2, -1, 0, 1, 2],
    outputRange: ['-9deg', '-4.5deg', '0deg', '4.5deg', '9deg'],
  });

  return (
    <View style={styles.container}>
      <Pressable onPress={handleTap} style={styles.pressable}>
        <Animated.View
          style={[
            styles.mascotTransformWrapper,
            {
              transform: [
                { translateY: hoverY },
                { translateY: tapBounceY },
                { scale: tapScale },
                { scaleY: bodyStretchY },
                { scaleX: bodySquishX },
                { rotate: rotation },
              ],
            },
          ]}
        >
          {/* SVG RENDERING OF THE LIVE 3D PURPLE GHOST MASCOT */}
          <Svg
            width={mascotWidth}
            height={mascotHeight}
            viewBox="0 0 240 240"
            fill="none"
          >
            <Defs>
              {/* Soft Ambient Halo Aura */}
              <RadialGradient
                id="haloAura"
                cx="50%"
                cy="50%"
                rx="50%"
                ry="50%"
                fx="50%"
                fy="50%"
              >
                <Stop offset="0%" stopColor="#EDE7FF" stopOpacity="0.85" />
                <Stop offset="55%" stopColor="#F5F1FF" stopOpacity="0.4" />
                <Stop offset="100%" stopColor="#FAF8F5" stopOpacity="0" />
              </RadialGradient>

              {/* 3D Glossy Translucent Purple Glass Ghost Body */}
              <LinearGradient
                id="ghostBodyGrad"
                x1="40"
                y1="30"
                x2="190"
                y2="210"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor="#C4A8FF" stopOpacity="0.95" />
                <Stop offset="25%" stopColor="#9E72FF" stopOpacity="0.9" />
                <Stop offset="65%" stopColor="#6C3BF0" stopOpacity="0.92" />
                <Stop offset="100%" stopColor="#4A18D1" stopOpacity="0.96" />
              </LinearGradient>

              {/* Glowing Rim Light */}
              <LinearGradient
                id="rimLightGrad"
                x1="80"
                y1="40"
                x2="180"
                y2="180"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <Stop offset="50%" stopColor="#D8C7FF" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#5F3ADD" stopOpacity="0" />
              </LinearGradient>

              {/* Specular White Highlight on Crest */}
              <LinearGradient
                id="crestGlossGrad"
                x1="125"
                y1="40"
                x2="160"
                y2="110"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
                <Stop offset="60%" stopColor="#E9DFFF" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>

              {/* Eye Gloss Gradient */}
              <LinearGradient
                id="eyeGloss"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <Stop offset="100%" stopColor="#E0D6FF" stopOpacity="0.5" />
              </LinearGradient>

              {/* Speed Trail Gradient */}
              <LinearGradient
                id="streakGrad"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <Stop offset="0%" stopColor="#9E72FF" stopOpacity="0" />
                <Stop offset="100%" stopColor="#B394FF" stopOpacity="0.75" />
              </LinearGradient>
            </Defs>

            {/* 1. SOFT HALO BACKDROP */}
            <Circle cx="120" cy="120" r="105" fill="url(#haloAura)" />

            {/* 2. TRAILING SPEED STREAKS (Animated Left Drifting Lines) */}
            <G opacity={0.85}>
              {/* Top Streak */}
              <Rect
                x="32"
                y="92"
                width="34"
                height="6"
                rx="3"
                fill="url(#streakGrad)"
              />
              {/* Middle Longer Streak */}
              <Rect
                x="22"
                y="108"
                width="48"
                height="7"
                rx="3.5"
                fill="url(#streakGrad)"
              />
              {/* Bottom Streak */}
              <Rect
                x="36"
                y="126"
                width="30"
                height="6"
                rx="3"
                fill="url(#streakGrad)"
              />
            </G>

            {/* 3. 3D TRANSLUCENT PURPLE GHOST MASCOT BODY */}
            {/* The iconic curved flame/crest head and rounded body */}
            <Path
              d="M136 34C140 44 148 60 162 76C176 92 184 108 184 126C184 162 155 190 120 190C88 190 62 166 60 134C58 116 68 96 84 80C94 70 106 60 114 48C120 40 124 32 136 34Z"
              fill="url(#ghostBodyGrad)"
            />

            {/* Ghost Outer Rim Reflection Lighting */}
            <Path
              d="M136 36C140 46 147 61 160 76C174 91 181 107 181 125C181 159 153 186 120 186C90 186 65 163 63 133C61 117 70 98 86 82C95 72 107 63 115 50C120 43 124 35 136 36Z"
              stroke="url(#rimLightGrad)"
              strokeWidth="2.5"
              fill="none"
            />

            {/* 4. 3D GLOSS / SPECULAR HIGHLIGHTS */}
            {/* Crest highlight */}
            <Path
              d="M134 44C138 52 144 65 154 78C164 91 170 104 172 118C170 100 160 84 148 70C140 60 134 50 134 44Z"
              fill="url(#crestGlossGrad)"
            />

            {/* Soft inner core ambient translucency */}
            <Ellipse
              cx="120"
              cy="132"
              rx="42"
              ry="38"
              fill="#B99AFF"
              opacity={0.25}
            />

            {/* 5. GHOST FLAME TAIL ACCENTS */}
            <Path
              d="M84 148C74 158 70 172 78 178C84 182 96 178 104 168C96 168 88 160 84 148Z"
              fill="#7C4DF2"
              opacity={0.8}
            />
          </Svg>

          {/* 6. ANIMATED LIVING EYES & FACE (Positioned over the 3D Ghost Head) */}
          <Animated.View
            style={[
              styles.eyesContainer,
              {
                transform: [
                  { translateX: eyeLookX },
                  { translateY: eyeLookY },
                ],
              },
            ]}
          >
            {isHappy ? (
              // Happy Crescent Squint Eyes on Tap (Duolingo joyful style ^_^)
              <View style={styles.happyEyesRow}>
                <Svg width={46} height={20} viewBox="0 0 46 20" fill="none">
                  {/* Left Happy Eye */}
                  <Path
                    d="M6 14C9 6 17 6 20 14"
                    stroke="#FFFFFF"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Right Happy Eye */}
                  <Path
                    d="M26 14C29 6 37 6 40 14"
                    stroke="#FFFFFF"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
            ) : (
              // Normal Animated Blinking Capsule Eyes
              <Animated.View
                style={[
                  styles.eyesRow,
                  {
                    transform: [{ scaleY: eyeBlink }],
                  },
                ]}
              >
                {/* Left Eye */}
                <View style={styles.eyeCapsule}>
                  <View style={styles.eyePupilGlint} />
                </View>

                {/* Right Eye */}
                <View style={styles.eyeCapsule}>
                  <View style={styles.eyePupilGlint} />
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotTransformWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyesContainer: {
    position: 'absolute',
    top: '44%',
    left: '42%',
    transform: [{ translateX: -20 }, { translateY: -10 }],
    zIndex: 20,
  },
  eyesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  eyeCapsule: {
    width: 10,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 2,
    paddingRight: 2,
    shadowColor: '#3C0DA3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  eyePupilGlint: {
    width: 3.5,
    height: 4.5,
    borderRadius: 2,
    backgroundColor: '#E8DDFF',
    opacity: 0.9,
  },
  happyEyesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
