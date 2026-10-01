import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

export type PlatformLogoType = 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'threads' | 'pinterest';

// App-icon style platform logos (rounded tile in each platform's own colours).
export function PlatformLogo({ type, size = 44 }: { type: PlatformLogoType; size?: number }) {
  switch (type) {
    case 'tiktok':
      return (
        <View style={[styles.platformIconBox, { width: size, height: size, backgroundColor: '#000000' }]}>
          <Svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24">
            {/* Cyan Shadow Layer */}
            <Path
              d="M17.5 4.5a4.5 4.5 0 0 1-3.5-4h-2.5v13.5a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5.05.7.15V8.5a5.5 5.5 0 1 0 4.8 5.4V7.2a7.5 7.5 0 0 0 4.5 1.3V5.5c-.5 0-1-.3-1.5-1z"
              fill="#25F4EE"
              transform="translate(-0.8, -0.8)"
            />
            {/* Red Shadow Layer */}
            <Path
              d="M17.5 4.5a4.5 4.5 0 0 1-3.5-4h-2.5v13.5a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5.05.7.15V8.5a5.5 5.5 0 1 0 4.8 5.4V7.2a7.5 7.5 0 0 0 4.5 1.3V5.5c-.5 0-1-.3-1.5-1z"
              fill="#FE2C55"
              transform="translate(0.8, 0.8)"
            />
            {/* White Primary Note */}
            <Path
              d="M17.5 4.5a4.5 4.5 0 0 1-3.5-4h-2.5v13.5a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5.05.7.15V8.5a5.5 5.5 0 1 0 4.8 5.4V7.2a7.5 7.5 0 0 0 4.5 1.3V5.5c-.5 0-1-.3-1.5-1z"
              fill="#FFFFFF"
            />
          </Svg>
        </View>
      );

    case 'instagram':
      return (
        <View style={[styles.platformIconBox, { width: size, height: size, overflow: 'hidden' }]}>
          <Svg width={size} height={size} viewBox="0 0 44 44">
            <Defs>
              <LinearGradient id="instaGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#FFDC80" />
                <Stop offset="20%" stopColor="#FCAF45" />
                <Stop offset="40%" stopColor="#F77737" />
                <Stop offset="60%" stopColor="#FD1D1D" />
                <Stop offset="80%" stopColor="#C13584" />
                <Stop offset="100%" stopColor="#833AB4" />
              </LinearGradient>
            </Defs>
            <Rect width="44" height="44" rx="12" fill="url(#instaGradient)" />
            {/* Camera Body */}
            <Rect
              x="11"
              y="11"
              width="22"
              height="22"
              rx="6"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              fill="none"
            />
            {/* Camera Lens */}
            <Circle cx="22" cy="22" r="5.2" stroke="#FFFFFF" strokeWidth="2.4" fill="none" />
            {/* Flash Dot */}
            <Circle cx="27.5" cy="16.5" r="1.5" fill="#FFFFFF" />
          </Svg>
        </View>
      );

    case 'youtube':
      return (
        <View style={[styles.platformIconBox, { width: size, height: size, backgroundColor: '#FF0000' }]}>
          <Svg width={size * 0.65} height={size * 0.46} viewBox="0 0 28 20">
            <Path
              d="M27.4 3.1a3.5 3.5 0 0 0-2.5-2.5C22.7 0 14 0 14 0S5.3 0 3.1.6A3.5 3.5 0 0 0 .6 3.1 36.6 36.6 0 0 0 0 10a36.6 36.6 0 0 0 .6 6.9 3.5 3.5 0 0 0 2.5 2.5C5.3 20 14 20 14 20s8.7 0 10.9-.6a3.5 3.5 0 0 0 2.5-2.5 36.6 36.6 0 0 0 .6-6.9 36.6 36.6 0 0 0-.6-6.9z"
              fill="#FF0000"
            />
            <Path d="M11.2 14.3l7.3-4.3-7.3-4.3v8.6z" fill="#FFFFFF" />
          </Svg>
        </View>
      );

    case 'facebook':
      return (
        <View style={[styles.platformIconBox, { width: size, height: size,  backgroundColor: '#1877F2' }]}>
          <Svg width={size * 0.70} height={size * 0.70} viewBox="0 0 24 24" fill="#FFFFFF">
            <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </Svg>
        </View>
      );

    case 'threads':
      return (
        <View style={[styles.platformIconBox, { width: size, height: size,  backgroundColor: '#000000' }]}>
          <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="#FFFFFF">
            <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.83 0 5.39-1.18 7.21-3.08l-1.47-1.37C16.27 19.06 14.25 20 12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8c4.32 0 7.85 3.43 7.99 7.72H18c-.28-3.23-2.95-5.72-6-5.72-3.31 0-6 2.69-6 6s2.69 6 6 6c1.86 0 3.52-.85 4.63-2.19.46-.55.77-1.2.92-1.91-.71-.24-1.52-.38-2.38-.38-2.6 0-4.71 1.79-4.71 4 0 2.21 2.11 4 4.71 4 3.01 0 5.48-2.22 5.8-5.18.02-.27.03-.54.03-.82 0-5.52-4.48-10-10-10z" />
          </Svg>
        </View>
      );

    case 'pinterest':
      return (
        <View style={[styles.platformIconBox, { width: size, height: size,  backgroundColor: '#E60023' }]}>
          <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="#FFFFFF">
            <Path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.332 1.365-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
          </Svg>
        </View>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  platformIconBox: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
