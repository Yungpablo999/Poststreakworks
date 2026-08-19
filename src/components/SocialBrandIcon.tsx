import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

export type SocialPlatformType =
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'linkedin'
  | 'x'
  | 'twitter'
  | 'threads'
  | 'pinterest'
  | 'snapchat'
  | 'facebook';

interface SocialBrandIconProps {
  platform: SocialPlatformType | string;
  size?: number;
  style?: ViewStyle;
}

export const SocialBrandIcon: React.FC<SocialBrandIconProps> = ({
  platform,
  size = 24,
  style,
}) => {
  const norm = (platform || '').toLowerCase();

  // TIKTOK
  if (norm.includes('tiktok') || norm === 'tt') {
    return (
      <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12.5 3v11.8a3.2 3.2 0 1 1-2.3-3.1v-2.3a5.5 5.5 0 1 0 4.6 5.4V7.5a6.8 6.8 0 0 0 4.2 1.5V6.7a4.6 4.6 0 0 1-3.5-3.7h-3z"
            fill="#000000"
          />
          <Path
            d="M19 6.7a4.6 4.6 0 0 1-3.5-3.7h-1.2v2.3a4.6 4.6 0 0 0 3.5 3.7V6.7z"
            fill="#00F2FE"
          />
          <Path
            d="M10.2 14.8a3.2 3.2 0 0 1 2.3-3.1V9.4a5.5 5.5 0 0 0-4.6 5.4 5.5 5.5 0 0 0 5.5 5.5v-2.3a3.2 3.2 0 0 1-3.2-3.2z"
            fill="#FE2C55"
          />
        </Svg>
      </View>
    );
  }

  // INSTAGRAM
  if (norm.includes('instagram') || norm.includes('ig') || norm.includes('reel')) {
    return (
      <View style={[{ width: size, height: size, borderRadius: size * 0.28, overflow: 'hidden' }, style]}>
        <LinearGradient
          colors={['#833AB4', '#FD1D1D', '#F77737', '#FFDC80']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
        >
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 24 24" fill="none">
            <Rect x="2" y="2" width="20" height="20" rx="6" stroke="#FFFFFF" strokeWidth="2.2" />
            <Circle cx="12" cy="12" r="4.5" stroke="#FFFFFF" strokeWidth="2.2" />
            <Circle cx="17.8" cy="6.2" r="1.3" fill="#FFFFFF" />
          </Svg>
        </LinearGradient>
      </View>
    );
  }

  // YOUTUBE
  if (norm.includes('youtube') || norm.includes('yt') || norm.includes('short')) {
    return (
      <View
        style={[
          {
            width: size,
            height: size * 0.76,
            backgroundColor: '#FF0000',
            borderRadius: size * 0.22,
            justifyContent: 'center',
            alignItems: 'center',
          },
          style,
        ]}
      >
        <Svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="none">
          <Path d="M9.5 7.5L16.5 12L9.5 16.5V7.5Z" fill="#FFFFFF" />
        </Svg>
      </View>
    );
  }

  // LINKEDIN
  if (norm.includes('linkedin') || norm === 'li') {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            backgroundColor: '#0A66C2',
            borderRadius: size * 0.22,
            justifyContent: 'center',
            alignItems: 'center',
          },
          style,
        ]}
      >
        <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="#FFFFFF">
          <Path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 1 0-.01-3.3 1.65 1.65 0 0 0 .01 3.3m1.4 9.74v-8.37H5.06v8.37h2.8z" />
        </Svg>
      </View>
    );
  }

  // X / TWITTER
  if (norm === 'x' || norm.includes('twitter') || norm.includes('tweet')) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            backgroundColor: '#000000',
            borderRadius: size * 0.22,
            justifyContent: 'center',
            alignItems: 'center',
          },
          style,
        ]}
      >
        <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="#FFFFFF">
          <Path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </Svg>
      </View>
    );
  }

  // THREADS
  if (norm.includes('threads')) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            backgroundColor: '#000000',
            borderRadius: size * 0.22,
            justifyContent: 'center',
            alignItems: 'center',
          },
          style,
        ]}
      >
        <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.8 12.2c-.3 1.6-1.5 2.6-3.2 2.6-2.1 0-3.6-1.6-3.6-3.8 0-2.3 1.6-3.9 3.8-3.9 1.7 0 2.8.9 3.2 2.3h-1.5c-.3-.7-.9-1.1-1.7-1.1-1.3 0-2.2 1-2.2 2.7s.9 2.6 2.1 2.6c.9 0 1.5-.5 1.7-1.4h1.4z"
            fill="#FFFFFF"
          />
        </Svg>
      </View>
    );
  }

  // PINTEREST
  if (norm.includes('pinterest') || norm === 'pin') {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            backgroundColor: '#E60023',
            borderRadius: size / 2,
            justifyContent: 'center',
            alignItems: 'center',
          },
          style,
        ]}
      >
        <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="#FFFFFF">
          <Path d="M12 0a12 12 0 0 0-4.37 23.18c-.06-.98-.12-2.5.02-3.58l.74-3.13s-.19-.38-.19-.94c0-.88.51-1.54 1.15-1.54.54 0 .8.41.8.9 0 .55-.35 1.37-.53 2.13-.15.64.32 1.16.95 1.16 1.14 0 2.02-1.2 2.02-2.94 0-1.54-1.1-2.61-2.68-2.61-1.83 0-2.9 1.37-2.9 2.79 0 .55.21 1.14.48 1.46.05.06.06.12.04.18l-.18.74c-.03.12-.1.17-.23.11-1.07-.5-1.74-2.07-1.74-3.33 0-2.71 1.97-5.2 5.68-5.2 2.98 0 5.3 2.12 5.3 4.96 0 2.96-1.87 5.34-4.46 5.34-.87 0-1.69-.45-1.97-.98l-.54 2.05c-.19.75-.72 1.68-1.07 2.25A12 12 0 1 0 12 0z" />
        </Svg>
      </View>
    );
  }

  // SNAPCHAT
  if (norm.includes('snapchat') || norm === 'snap') {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            backgroundColor: '#FFFC00',
            borderRadius: size * 0.24,
            justifyContent: 'center',
            alignItems: 'center',
          },
          style,
        ]}
      >
        <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="#000000">
          <Path d="M12.003 2c-3.1 0-5.25 2.15-5.25 4.7 0 .6.1 1.25.3 1.8-.75.35-1.5 1-1.5 1.8 0 .55.35 1.05.9 1.35-.1.35-.35 1.15-.35 1.75 0 1.25 1.15 2 2.5 2.1.25.75 1.15 1.3 2.1 1.3.6 0 1.15-.2 1.3-.2.15 0 .7.2 1.3.2.95 0 1.85-.55 2.1-1.3 1.35-.1 2.5-.85 2.5-2.1 0-.6-.25-1.4-.35-1.75.55-.3.9-.8.9-1.35 0-.8-.75-1.45-1.5-1.8.2-.55.3-1.2.3-1.8 0-2.55-2.15-4.7-5.25-4.7z" />
        </Svg>
      </View>
    );
  }

  // FACEBOOK
  if (norm.includes('facebook') || norm === 'fb') {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            backgroundColor: '#1877F2',
            borderRadius: size / 2,
            justifyContent: 'center',
            alignItems: 'center',
          },
          style,
        ]}
      >
        <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="#FFFFFF">
          <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </Svg>
      </View>
    );
  }

  // Fallback
  return (
    <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="#171420">
        <Circle cx="12" cy="12" r="9" stroke="#171420" strokeWidth="2" />
      </Svg>
    </View>
  );
};
