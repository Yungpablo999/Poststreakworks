import React, { useRef, useEffect, useState } from 'react';
import { TourTarget } from './tour/GhostTour';
import { LiveMascot } from './mascot/LiveMascot';
import {
  StyleSheet,
  View,
  Pressable,
  Animated,
  Image,
  Platform,
} from 'react-native';
import { Text } from './ui/AppText';
import { BrandLogo } from './BrandLogo';
import { useBreakpoint, useWebChrome } from '../hooks/useBreakpoint';
import { BellButton } from './home/BellButton';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { sFont, sPadding, isNarrowScreen } from '../utils/responsive';
import { UserProfileData } from './UserProfileModal';
import { NotificationsSheet, useUnreadNotifications } from './notifications/NotificationsSheet';

import { PlanBadge } from './PlanBadge';
import type { UserPersona, UserTier } from '../types/account';

export interface FreeAppHeaderProps {
  onBack?: () => void;
  userPersona?: UserPersona;
  onOpenJarvisPro?: () => void;
  onOpenProfile?: () => void;
  userProfile?: UserProfileData;
  /** Ghost rides along in the header on most pages; Home has him in its own card. */
  showMascot?: boolean;
  backgroundColor?: string;
  isDark?: boolean;
}

export const FreeAppHeader: React.FC<FreeAppHeaderProps> = ({
  onBack,
  userPersona,
  onOpenJarvisPro,
  onOpenProfile,
  userProfile,
  showMascot = true,
  backgroundColor = '#FAF8F5',
  isDark = false,
}) => {
  const handleNotifPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowNotifications(true);
  };

  const handleProfilePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onOpenProfile) {
      onOpenProfile();
    }
  };

  // Desktop shows the logo in the side menu, so the header doesn't repeat it
  // The web app's header and menu replace this phone header in a browser
  const onDesktop = useWebChrome();
  const currentPersona = userPersona || userProfile?.userPersona || 'returning';
  const currentTier = (userProfile?.tier as UserTier) || 'free';
  // The bell opens the shared notifications sheet on every screen
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = useUnreadNotifications();

  // Desktop web app: the top bar and side menu replace this phone header
  if (onDesktop) return null;

  return (
    <View style={[styles.headerBar, { backgroundColor: isDark ? '#0C0A12' : backgroundColor }]}>
      {/* Top-Left: Back Button (if provided) + Ghost Logo Mascot + Dual Switcher Pills */}
      <View style={styles.headerLeftGroup}>
        {onBack && (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backChevronBtn, pressed && styles.headerIconBtnPressed]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
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

        <View style={styles.headerBrandStack}>
          {!onDesktop && <BrandLogo size="sm" isDark={isDark} />}

          <PlanBadge tier={currentTier} onPress={onOpenJarvisPro} />
        </View>
      </View>

      {/* Right: Notification & Person Profile Photo */}
      <View style={styles.headerRightGroup}>
        {/* The live mascot rides along on every page */}
        {showMascot ? (
          <TourTarget id="ghost" style={{ zIndex: 50 }}>
            <LiveMascot size={42} bubble="under" bubbleWidth={220} />
          </TourTarget>
        ) : null}
        {/* Notification bell: swings on tap, unread dot breathes */}
        <TourTarget id="bell">
          <BellButton unread={unreadCount > 0} onPress={handleNotifPress} />
        </TourTarget>

        {/* Top-Right: Person Icon / Avatar Placeholder */}
        <Pressable
          onPress={handleProfilePress}
          style={({ pressed }) => [
            styles.profilePhotoBtn,
            (userProfile?.customAvatarUri || (userProfile?.avatarSource && userProfile.avatarId && userProfile.avatarId !== 'ghost')) ? styles.profilePhotoBtnActive : null,
            pressed && styles.headerIconBtnPressed,
          ]}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Creator profile settings"
        >
          {userProfile?.customAvatarUri ? (
            <Image
              source={{ uri: userProfile.customAvatarUri }}
              style={styles.headerCustomAvatarImage}
              resizeMode="cover"
            />
          ) : (userProfile?.avatarSource && userProfile.avatarId && userProfile.avatarId !== 'ghost') ? (
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
              {(userProfile?.customAvatarUri || (userProfile?.avatarSource && userProfile.avatarId && userProfile.avatarId !== 'ghost')) ? '✎' : '+'}
            </Text>
          </View>
        </Pressable>
      </View>

      <NotificationsSheet visible={showNotifications} onClose={() => setShowNotifications(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerBrandStack: {
    alignItems: 'flex-start',
    gap: 6,
    flexShrink: 1,
  },
  headerBar: {
    // above the page so the mascot's speech bubble can drop over it
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sPadding(14),
    paddingTop: 6,
    paddingBottom: 6,
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
    gap: 8,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
