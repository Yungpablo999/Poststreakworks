import React, { useEffect, useState } from 'react';
import { TourTarget } from '../tour/GhostTour';
import { LiveMascot } from '../mascot/LiveMascot';
import { Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { BrandLogo } from '../BrandLogo';
import { BellButton } from '../home/BellButton';
import { NotificationsSheet, useUnreadNotifications } from '../notifications/NotificationsSheet';
import { ds } from '../../theme/colors';
import { SIDEBAR_W } from '../../hooks/useBreakpoint';

// The web app on a phone: a slim web header instead of the phone app's.
// Main pages: menu button, logo, notifications, New post. Inner pages: Back
// and the page name. The menu slides the side menu in from the left (the
// same menu as on desktop), glides, no bounce.

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const ease = Easing.out(Easing.cubic);

function IconButton({ onPress, label, children }: { onPress: () => void; label: string; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={({ pressed }) => [styles.iconBtn, pointer, pressed && { transform: [{ scale: 0.94 }] }]}>
      {children}
    </Pressable>
  );
}

export function MobileWebBar({
  persona,
  tier,
  title,
  onBack,
  onNewPost,
  menu,
}: {
  persona: 'new' | 'returning';
  tier: 'free' | 'pro';
  /** Inner pages: the page name next to Back */
  title?: string;
  onBack?: () => void;
  onNewPost?: () => void;
  /** The side menu to show in the drawer; it's given a close() callback */
  menu: (close: () => void) => React.ReactNode;
}) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const unread = useUnreadNotifications(persona, tier);
  // Small phones: just the word, so the mascot and buttons fit beside it
  const narrow = useWindowDimensions().width < 380;

  return (
    <View style={styles.root}>
      {onBack ? (
        <View style={styles.left}>
          <IconButton onPress={onBack} label="Back">
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M15 18l-6-6 6-6" stroke={ds.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </IconButton>
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.left}>
          <TourTarget id="menu-button">
            <IconButton onPress={() => setMenuOpen(true)} label="Open menu">
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M4 7h16M4 12h16M4 17h10" stroke={ds.ink} strokeWidth={2.4} strokeLinecap="round" />
              </Svg>
            </IconButton>
          </TourTarget>
          <BrandLogo size="sm" wordmarkOnly={narrow} />
        </View>
      )}

      <View style={styles.right}>
        <TourTarget id="ghost" style={{ zIndex: 50 }}>
          <LiveMascot size={40} bubble="under" bubbleWidth={220} />
        </TourTarget>
        <TourTarget id="bell">
          <BellButton unread={unread > 0} onPress={() => setNotesOpen(true)} />
        </TourTarget>
        {onNewPost ? (
          <Pressable onPress={onNewPost} accessibilityRole="button" accessibilityLabel="New post" style={({ pressed }) => [styles.newPost, pointer, pressed && { transform: [{ translateY: 2 }] }]}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" />
            </Svg>
          </Pressable>
        ) : null}
      </View>

      <NotificationsSheet visible={notesOpen} onClose={() => setNotesOpen(false)} persona={persona} tier={tier} />
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)}>
        {menu(() => setMenuOpen(false))}
      </MenuDrawer>
    </View>
  );
}

function MenuDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = useState(open);
  const p = useSharedValue(0);
  const w = Math.min(SIDEBAR_W + 24, width * 0.86);
  useEffect(() => {
    if (open) {
      setMounted(true);
      p.value = withTiming(1, { duration: 280, easing: ease });
    } else if (mounted) {
      p.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const scrim = useAnimatedStyle(() => ({ opacity: p.value }));
  const panel = useAnimatedStyle(() => ({ transform: [{ translateX: (p.value - 1) * w }] }));
  if (!mounted) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrim]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />
        </Animated.View>
        <Animated.View style={[styles.drawer, { width: w }, panel]}>{children}</Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(247, 245, 240, 0.75)',
    zIndex: 40,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' },
  title: { flex: 1, fontSize: 17, fontWeight: '800', letterSpacing: -0.3, color: ds.ink },
  newPost: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.purple, shadowColor: ds.purpleLedge, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 3 } },
  scrim: { backgroundColor: 'rgba(23, 20, 32, 0.32)' },
  drawer: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#F7F5F0', overflow: 'hidden' },
});
