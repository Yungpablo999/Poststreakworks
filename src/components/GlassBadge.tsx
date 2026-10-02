import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { glassmorphism } from '../theme/glassmorphism';

interface GlassBadgeProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  floatDelay?: number;
  floatDistance?: number;
  size?: number;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  style,
  floatDelay = 0,
  floatDistance = 4,
  size = 38,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const borderRadius = Math.round(size * 0.35);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -floatDistance,
          duration: 2400,
          useNativeDriver: true,
          delay: floatDelay,
        }),
        Animated.timing(floatAnim, {
          toValue: floatDistance * 0.35,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [floatAnim, floatDelay, floatDistance]);

  return (
    <Animated.View
      style={[
        styles.badgeContainer,
        {
          width: size,
          height: size,
          borderRadius: borderRadius,
          transform: [{ translateY: floatAnim }],
        },
        style,
      ]}
    >
      <BlurView
        intensity={20}
        tint="light"
        style={[styles.blurView, { borderRadius: borderRadius }]}
      >
        {/* Frosted Translucent Surface */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.65)',
            'rgba(255, 255, 255, 0.25)',
            'rgba(245, 240, 255, 0.15)',
          ]}
          start={{ x: 0.1, y: 0.05 }}
          end={{ x: 0.9, y: 0.95 }}
          style={[styles.surfaceGradient, { borderRadius: borderRadius }]}
        />

        {/* Specular Top Rim Shine */}
        <View style={[styles.topShine, { borderRadius: borderRadius }]} />

        {/* Inner Content Icon */}
        <View style={styles.innerContent}>
          {children}
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 2px 8px rgba(23, 20, 32, 0.03)',
        } as any)
      : {}),
  },
  blurView: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  surfaceGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topShine: {
    position: 'absolute',
    top: 0,
    left: 3,
    right: 3,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
  },
  innerContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
});
