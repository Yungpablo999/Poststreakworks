import React from 'react';
import {
  StyleSheet,
  View,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export interface LiquidGlassProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  light?: number;
  refraction?: number;
  depth?: number;
  dispersion?: number;
  frost?: number;
  splay?: number;
  tint?: 'crystal' | 'purple-gold' | 'light' | 'dark';
  accentColor?: string;
  goldAccentColor?: string;
  hasShadow?: boolean;
}

export const LiquidGlassBackground: React.FC<LiquidGlassProps> = ({
  children,
  style,
  containerStyle,
  borderRadius = 36,
  tint = 'purple-gold',
  accentColor = '#582CDB',
  hasShadow = true,
}) => {
  // Authentic Frosted Glass Gradients (Translucent, luminous, optical depth)
  const getGlassColors = (): [string, string, string] => {
    switch (tint) {
      case 'dark':
        return [
          'rgba(30, 26, 46, 0.72)',
          'rgba(22, 19, 34, 0.65)',
          'rgba(35, 30, 52, 0.70)',
        ];
      case 'crystal':
        return [
          'rgba(255, 255, 255, 0.65)',
          'rgba(240, 245, 255, 0.42)',
          'rgba(255, 255, 255, 0.55)',
        ];
      case 'purple-gold':
      default:
        return [
          'rgba(255, 255, 255, 0.68)',
          'rgba(248, 244, 255, 0.45)',
          'rgba(255, 252, 248, 0.58)',
        ];
    }
  };

  const glassColors = getGlassColors();

  return (
    <View style={[styles.rootContainer, containerStyle]}>
      {/* Outer Floating Ambient Shadow */}
      <View
        style={[
          styles.outerShadowWrapper,
          hasShadow && {
            shadowColor: '#1F2687',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: tint === 'dark' ? 0.35 : 0.14,
            shadowRadius: 28,
            elevation: 10,
          },
          { borderRadius },
          Platform.OS === 'web' && {
            // Web native CSS box-shadow + backdrop-filter for authentic frosted glass
            boxShadow: '0 12px 36px 0 rgba(31, 38, 135, 0.14), inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.85), inset 0 -1px 2px 0 rgba(255, 255, 255, 0.25)',
          } as any,
        ]}
      >
        {/* Layer 1: Native Optical Blur Backdrop */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 75 : 85}
          tint={tint === 'dark' ? 'dark' : 'light'}
          style={[
            styles.blurView,
            { borderRadius },
            Platform.OS === 'web' && {
              backdropFilter: 'blur(30px) saturate(190%)',
              WebkitBackdropFilter: 'blur(30px) saturate(190%)',
            } as any,
          ]}
        >
          {/* Layer 2: Translucent Frosted Glass Gradients */}
          <LinearGradient
            colors={glassColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.translucentSheen, { borderRadius }]}
          >
            {/* Specular Top Glare Light Edge */}
            <View
              style={[
                styles.topGlareArc,
                {
                  borderTopLeftRadius: borderRadius,
                  borderTopRightRadius: borderRadius,
                },
              ]}
            />

            {/* Crisp 1.5px Translucent Glass Perimeter Rim */}
            <View
              style={[
                styles.innerSpecularBorder,
                {
                  borderRadius,
                  borderColor:
                    tint === 'dark'
                      ? 'rgba(255, 255, 255, 0.18)'
                      : 'rgba(255, 255, 255, 0.75)',
                },
              ]}
            />

            {/* Layer 3: Content Layer */}
            <View style={[styles.contentLayer, style]}>
              {children}
            </View>
          </LinearGradient>
        </BlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    alignSelf: 'stretch',
  },
  outerShadowWrapper: {
    backgroundColor: 'transparent',
  },
  blurView: {
    overflow: 'hidden',
  },
  translucentSheen: {
    position: 'relative',
  },
  topGlareArc: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    zIndex: 2,
  },
  innerSpecularBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1.5,
    zIndex: 3,
  },
  contentLayer: {
    position: 'relative',
    zIndex: 10,
  },
});
