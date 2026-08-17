import React, { useId } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Svg, {
  Defs,
  Filter,
  FeTurbulence,
  FeDisplacementMap,
  FeGaussianBlur,
  FeColorMatrix,
  FeBlend,
  Rect,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
} from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export interface LiquidGlassProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  /**
   * Lighting / Specular intensity (0.0 to 1.0)
   * Controls highlight sheen, top specular glare arc, and light bounce
   */
  light?: number;
  /**
   * Refraction / Distortion strength (0 to 100)
   * Controls feDisplacementMap scale and water-droplet warp strength
   */
  refraction?: number;
  /**
   * Optical depth / magnification (0.0 to 1.0)
   * Controls lens surface curvature and 3D specular depth
   */
  depth?: number;
  /**
   * Chromatic dispersion (RGB split rainbow fringe) (0.0 to 1.0)
   * Controls prism edge color shifting and optical aberration
   */
  dispersion?: number;
  /**
   * Frost amount / diffusion blur (0 to 100)
   * Controls backdrop blur and SVG Gaussian blur
   */
  frost?: number;
  /**
   * Edge falloff / Splay (0.0 to 1.0)
   * Controls concentration of distortion & dispersion near borders vs center
   */
  splay?: number;
  /**
   * Color theme preset or custom tint
   */
  tint?: 'crystal' | 'purple-gold' | 'light' | 'dark';
  /**
   * Primary theme accent color
   */
  accentColor?: string;
  /**
   * Secondary gold accent color
   */
  goldAccentColor?: string;
  /**
   * Outer floating shadow enabled
   */
  hasShadow?: boolean;
}

export const LiquidGlassBackground: React.FC<LiquidGlassProps> = ({
  children,
  style,
  containerStyle,
  borderRadius = 36,
  light = 0.85,
  refraction = 28,
  depth = 0.65,
  dispersion = 0.75,
  frost = 50,
  splay = 0.8,
  tint = 'purple-gold',
  accentColor = '#582CDB',
  goldAccentColor = '#F59E0B',
  hasShadow = true,
}) => {
  const rawId = useId();
  const filterId = 'liquid_glass_' + rawId.replace(/[^a-zA-Z0-9]/g, '_');

  // Derived optical filter parameters
  const displacementScale = Math.max(1, refraction * 0.8);
  const baseFreq = (0.015 + (1 - splay) * 0.02).toFixed(3);
  const blurDev = Math.max(0.5, (frost / 100) * 4);
  const chromaticOffset = (dispersion * 3.2).toFixed(1);

  // Background tint gradients
  const getGlassGradient = (): [string, string, string] => {
    switch (tint) {
      case 'purple-gold':
        return [
          'rgba(255, 255, 255, 0.82)',
          'rgba(246, 240, 255, 0.65)',
          'rgba(255, 253, 245, 0.75)',
        ];
      case 'crystal':
        return [
          'rgba(255, 255, 255, 0.88)',
          'rgba(240, 248, 255, 0.70)',
          'rgba(255, 255, 255, 0.82)',
        ];
      case 'dark':
        return [
          'rgba(28, 25, 38, 0.88)',
          'rgba(20, 18, 28, 0.92)',
          'rgba(34, 30, 48, 0.85)',
        ];
      default:
        return [
          'rgba(255, 255, 255, 0.85)',
          'rgba(250, 248, 255, 0.70)',
          'rgba(255, 255, 255, 0.80)',
        ];
    }
  };

  const glassGradient = getGlassGradient();

  return (
    <View style={[styles.rootContainer, containerStyle]}>
      {/* Outer Floating Diffuse Shadow */}
      <View
        style={[
          styles.outerShadowWrapper,
          hasShadow && {
            shadowColor: tint === 'dark' ? '#000000' : accentColor,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: tint === 'dark' ? 0.35 : 0.16,
            shadowRadius: 28,
            elevation: 10,
          },
          { borderRadius },
        ]}
      >
        {/* Layer 1: Native Optical Blur Backdrop */}
        <BlurView
          intensity={Platform.OS === 'ios' ? Math.min(95, frost + 25) : 85}
          tint={tint === 'dark' ? 'dark' : 'light'}
          style={[styles.blurView, { borderRadius }]}
        >
          {/* Layer 2: SVG Liquid Displacement Filter & Chromatic Dispersion Canvas */}
          <View style={styles.absoluteFill} pointerEvents="none">
            <Svg width="100%" height="100%" style={styles.absoluteFill}>
              <Defs>
                {/* A. Liquid Refraction & Water Droplet Displacement Filter */}
                <Filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
                  {/* Fractal turbulence simulating fluid refraction */}
                  <FeTurbulence
                    type="fractalNoise"
                    baseFrequency={baseFreq}
                    numOctaves={3}
                    seed={25}
                    result="fluid_noise"
                  />

                  {/* Warps and displaces the background like looking through water */}
                  <FeDisplacementMap
                    in="SourceGraphic"
                    in2="fluid_noise"
                    scale={displacementScale}
                    xChannelSelector="R"
                    yChannelSelector="G"
                    result="displaced_glass"
                  />

                  {/* Frost diffusion */}
                  <FeGaussianBlur
                    in="displaced_glass"
                    stdDeviation={blurDev}
                    result="frosted_liquid"
                  />

                  {/* Highlighting sheen via ColorMatrix */}
                  <FeColorMatrix
                    in="frosted_liquid"
                    type="matrix"
                    values="1 0 0 0 0.05  0 1 0 0 0.05  0 0 1 0 0.1  0 0 0 1 0"
                    result="specular_shine"
                  />

                  {/* Merge liquid refraction with specular reflection */}
                  <FeBlend
                    in="frosted_liquid"
                    in2="specular_shine"
                    mode="screen"
                    result="liquid_final"
                  />
                </Filter>

                {/* B. Edge Splay Falloff Gradient Mask */}
                <SvgRadialGradient
                  id={filterId + '_splay_mask'}
                  cx="50%"
                  cy="50%"
                  rx="50%"
                  ry="50%"
                  fx="50%"
                  fy="50%"
                >
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={1 - splay * 0.5} />
                  <Stop offset="70%" stopColor="#FFFFFF" stopOpacity={0.7} />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={1} />
                </SvgRadialGradient>

                {/* C. Chromatic Dispersion Rainbow Fringe Prism Gradient */}
                <SvgLinearGradient
                  id={filterId + '_chromatic_fringe'}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <Stop offset="0%" stopColor="rgba(255, 80, 120, 0.45)" />
                  <Stop offset="25%" stopColor="rgba(245, 158, 11, 0.40)" />
                  <Stop offset="50%" stopColor="rgba(110, 231, 183, 0.35)" />
                  <Stop offset="75%" stopColor="rgba(96, 165, 250, 0.40)" />
                  <Stop offset="100%" stopColor="rgba(168, 85, 247, 0.50)" />
                </SvgLinearGradient>

                {/* D. Specular Top Glaze Gradient */}
                <SvgLinearGradient
                  id={filterId + '_top_glaze'}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.1)" />
                  <Stop offset="20%" stopColor="rgba(255, 255, 255, 0.95)" />
                  <Stop offset="80%" stopColor="rgba(255, 255, 255, 0.95)" />
                  <Stop offset="100%" stopColor="rgba(255, 255, 255, 0.1)" />
                </SvgLinearGradient>
              </Defs>

              {/* Base Refraction Glass Layer */}
              <Rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                rx={borderRadius}
                ry={borderRadius}
                fill={'url(#' + filterId + '_splay_mask)'}
                filter={'url(#' + filterId + ')'}
              />

              {/* Chromatic Dispersion (Prism Edge Rainbow Fringe) */}
              <Rect
                x="1"
                y="1"
                width="99%"
                height="98%"
                rx={borderRadius}
                ry={borderRadius}
                fill="none"
                stroke={'url(#' + filterId + '_chromatic_fringe)'}
                strokeWidth={Number(chromaticOffset)}
                opacity={dispersion * 0.75}
              />

              {/* Top Specular Glaze Arc */}
              <Rect
                x="12"
                y="0.5"
                width="92%"
                height="1.5"
                rx="1"
                fill={'url(#' + filterId + '_top_glaze)'}
                opacity={light}
              />
            </Svg>
          </View>

          {/* Layer 3: Iridescent Liquid Crystal Translucent Sheen */}
          <LinearGradient
            colors={glassGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.translucentSheen, { borderRadius }]}
          >
            {/* Fine Specular Hairline Inner Border */}
            <View
              style={[
                styles.innerSpecularBorder,
                {
                  borderRadius,
                  borderColor:
                    tint === 'dark'
                      ? 'rgba(255, 255, 255, 0.16)'
                      : 'rgba(255, 255, 255, 0.88)',
                },
              ]}
            />

            {/* Layer 4: Content Layer */}
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
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  translucentSheen: {
    position: 'relative',
  },
  innerSpecularBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1.2,
  },
  contentLayer: {
    position: 'relative',
    zIndex: 10,
  },
});
