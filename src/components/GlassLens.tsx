import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { glassmorphism } from '../theme/glassmorphism';

interface GlassLensProps {
  size: number;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const GlassLens: React.FC<GlassLensProps> = ({ size, children, style }) => {
  const radius = size / 2;

  return (
    <View
      style={[
        styles.outerContainer,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
        glassmorphism.shadowLens,
        style,
      ]}
    >
      {/* 1. Frosted Blur Background Layer */}
      <BlurView
        intensity={35}
        tint="light"
        style={[styles.blurLayer, { borderRadius: radius }]}
      >
        {/* 2. Glass Surface Gradient & Translucency */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.85)',
            'rgba(245, 240, 255, 0.60)',
            'rgba(238, 230, 255, 0.35)',
          ]}
          start={{ x: 0.1, y: 0.05 }}
          end={{ x: 0.9, y: 0.95 }}
          style={[styles.gradientLayer, { borderRadius: radius }]}
        />

        {/* 3. Specular Curved Top Glass Shine Arc */}
        <View
          style={[
            styles.specularShine,
            {
              width: size * 0.75,
              height: size * 0.32,
              borderRadius: radius,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.fillGradient}
          />
        </View>

        {/* 4. Child Content (3D Mascot, etc.) */}
        <View style={[styles.contentWrapper, { borderRadius: radius }]}>
          {children}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurLayer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  specularShine: {
    position: 'absolute',
    top: 6,
    overflow: 'hidden',
  },
  fillGradient: {
    width: '100%',
    height: '100%',
  },
  contentWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
