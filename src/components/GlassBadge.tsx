import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { glassmorphism } from '../theme/glassmorphism';

interface GlassBadgeProps {
  children: React.ReactNode;
  style?: ViewStyle;
  floatDelay?: number;
  floatDistance?: number;
  size?: number;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  style,
  floatDelay = 0,
  floatDistance = 6,
  size = 60,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const borderRadius = Math.round(size * 0.32);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -floatDistance,
          duration: 2200,
          useNativeDriver: true,
          delay: floatDelay,
        }),
        Animated.timing(floatAnim, {
          toValue: floatDistance * 0.4,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
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
        glassmorphism.shadowBadge,
        style,
      ]}
    >
      <BlurView
        intensity={30}
        tint="light"
        style={[styles.blurView, { borderRadius: borderRadius }]}
      >
        {/* Frosted Translucent Surface */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.88)',
            'rgba(255, 255, 255, 0.65)',
            'rgba(245, 240, 255, 0.50)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
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
    left: 4,
    right: 4,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  innerContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
});
