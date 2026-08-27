import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Image,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { sFont, sPadding, isNarrowScreen } from '../utils/responsive';
import { UserProfileData } from './UserProfileModal';

export interface FreeAppHeaderProps {
  onBack?: () => void;
  onSwitchToPro?: () => void;
  onOpenJarvisPro?: () => void;
  onOpenMessages?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  userProfile?: UserProfileData;
  unreadCount?: number;
  backgroundColor?: string;
  isDark?: boolean;
}

export const FreeAppHeader: React.FC<FreeAppHeaderProps> = ({
  onBack,
  onSwitchToPro,
  onOpenJarvisPro,
  onOpenMessages,
  onOpenNotifications,
  onOpenProfile,
  userProfile,
  unreadCount = 2,
  backgroundColor = '#FAF8F5',
  isDark = false,
}) => {
  // Gentle floating animation for ghost logo
  const ghostFloatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ghostFloatY, {
          toValue: -3.5,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(ghostFloatY, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [ghostFloatY]);

  const handleProPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (onSwitchToPro) {
      onSwitchToPro();
    } else if (onOpenJarvisPro) {
      onOpenJarvisPro();
    }
  };

  const handleChatPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onOpenMessages) {
      onOpenMessages();
    }
  };

  const handleNotifPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onOpenNotifications) {
      onOpenNotifications();
    }
  };

  const handleProfilePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onOpenProfile) {
      onOpenProfile();
    }
  };

  return (
    <View style={[styles.headerBar, { backgroundColor: isDark ? '#0C0A12' : backgroundColor }]}>
      {/* Top-Left: Back Button (if provided) + Ghost Logo Mascot + PRO Pill Badge */}
      <View style={styles.headerLeftGroup}>
        {onBack && (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backChevronBtn, pressed && styles.headerIconBtnPressed]}
            hitSlop={10}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 18l-6-6 6-6"
                stroke={isDark ? '#FFFFFF' : '#171420'}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        )}

        <Animated.View
          style={[
            styles.headerLogoWrapper,
            isDark && styles.headerLogoWrapperDark,
            { transform: [{ translateY: ghostFloatY }] },
          ]}
        >
          <Image
            source={require('../../assets/images/jarvis-ghost-clean.png')}
            style={styles.headerGhostLogo}
            resizeMode="contain"
          />
        </Animated.View>

        <Pressable
          onPress={handleProPress}
          hitSlop={8}
          style={({ pressed }) => [styles.proPillBtn, pressed && styles.headerIconBtnPressed]}
        >
          <Text style={styles.proPillBtnText} numberOfLines={1}>
            {isNarrowScreen ? '🔒 PRO' : '🔒 FREE (PRO)'}
          </Text>
        </Pressable>
      </View>

      {/* Right: Message, Notification & Person Profile Photo */}
      <View style={styles.headerRightGroup}>
        {/* Chat Bubble Button */}
        <Pressable
          style={({ pressed }) => [
            styles.headerIconBtn,
            isDark && styles.headerIconBtnDark,
            pressed && styles.headerIconBtnPressed,
          ]}
          hitSlop={8}
          onPress={handleChatPress}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
              stroke={isDark ? '#FFFFFF' : '#1A1626'}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>

        {/* Notification Bell with Red Dot */}
        <Pressable
          onPress={handleNotifPress}
          style={({ pressed }) => [
            styles.headerIconBtn,
            isDark && styles.headerIconBtnDark,
            pressed && styles.headerIconBtnPressed,
          ]}
          hitSlop={8}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
              stroke={isDark ? '#FFFFFF' : '#1A1626'}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M13.73 21a2 2 0 0 1-3.46 0"
              stroke={isDark ? '#FFFFFF' : '#1A1626'}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          {unreadCount > 0 && <View style={styles.notificationDot} />}
        </Pressable>

        {/* Top-Right: Person Icon / Avatar Placeholder */}
        <Pressable
          onPress={handleProfilePress}
          style={({ pressed }) => [
            styles.profilePhotoBtn,
            (userProfile?.customAvatarUri || userProfile?.avatarSource) ? styles.profilePhotoBtnActive : null,
            pressed && styles.headerIconBtnPressed,
          ]}
          hitSlop={8}
        >
          {userProfile?.customAvatarUri ? (
            <Image
              source={{ uri: userProfile.customAvatarUri }}
              style={styles.headerCustomAvatarImage}
              resizeMode="cover"
            />
          ) : userProfile?.avatarSource ? (
            <Image
              source={userProfile.avatarSource}
              style={styles.headerCustomAvatarImage}
              resizeMode="cover"
            />
          ) : (
            <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 21V19C20 17.9 19.5 16.9 18.7 16.2C17.9 15.5 16.9 15 15.8 15H8.2C7.1 15 6.1 15.5 5.3 16.2C4.5 16.9 4 17.9 4 19V21"
                stroke="#582CDB"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle
                cx="12"
                cy="7"
                r="4"
                stroke="#582CDB"
                strokeWidth="2.3"
              />
            </Svg>
          )}

          {/* Small "+" Add Photo Badge */}
          <View style={styles.addPhotoPlusBadge}>
            <Text style={styles.addPhotoPlusText}>
              {(userProfile?.customAvatarUri || userProfile?.avatarSource) ? '✎' : '+'}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sPadding(14),
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FAF9FD',
    width: '100%',
    maxWidth: '100%',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  backChevronBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  headerLogoWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    flexShrink: 0,
  },
  headerLogoWrapperDark: {
    backgroundColor: 'rgba(30, 24, 48, 0.9)',
    borderColor: 'rgba(45, 38, 70, 0.95)',
  },
  headerGhostLogo: {
    width: 24,
    height: 24,
  },
  proPillBtn: {
    backgroundColor: '#F3EFFD',
    borderColor: 'rgba(88, 44, 219, 0.15)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    flexShrink: 1,
  },
  proPillBtnText: {
    fontSize: sFont(10),
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.2,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  headerIconBtnDark: {
    backgroundColor: 'rgba(30, 24, 48, 0.9)',
    borderColor: 'rgba(45, 38, 70, 0.95)',
  },
  headerIconBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },
  profilePhotoBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F4F0FF',
    borderWidth: 1.5,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  profilePhotoBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#582CDB',
  },
  headerCustomAvatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  addPhotoPlusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#582CDB',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoPlusText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 11,
  },
});
