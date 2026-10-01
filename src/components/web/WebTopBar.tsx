import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { BellButton } from '../home/BellButton';
import { NotificationsSheet, useUnreadNotifications } from '../notifications/NotificationsSheet';
import type { UserProfileData } from '../UserProfileModal';
import { ds } from '../../theme/colors';

// Desktop web app: the bar across the top of every signed-in page. A
// greeting with today's date on the left (or Back on inner pages), and
// notifications plus the main action, New post, on the right. The phone
// header (preview switches, profile circle) isn't shown on desktop: the
// profile lives in the side menu.

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function WebTopBar({
  profile,
  persona,
  tier,
  title,
  onBack,
  onNewPost,
}: {
  profile?: UserProfileData;
  persona: 'new' | 'returning';
  tier: 'free' | 'pro';
  /** Inner pages show their name next to Back instead of the greeting */
  title?: string;
  onBack?: () => void;
  /** Leave out to hide New post (e.g. while already writing one) */
  onNewPost?: () => void;
}) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const unread = useUnreadNotifications(persona, tier);
  const firstName = (profile?.name || '').trim().split(' ')[0];
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={styles.root}>
      <View style={styles.left}>
        {onBack ? (
          <View style={styles.backRow}>
            <Pressable
              onPress={onBack}
              onHoverIn={() => setBackHover(true)}
              onHoverOut={() => setBackHover(false)}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={[styles.back, pointer, backHover && styles.backHover]}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M15 18l-6-6 6-6" stroke={ds.text2} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
            {title ? <Text style={styles.pageTitle}>{title}</Text> : null}
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(300).easing(Easing.out(Easing.cubic))}>
            <Text style={styles.hello}>
              {greeting()}
              {firstName ? <Text style={styles.name}>, {firstName}</Text> : null}
            </Text>
            <Text style={styles.date}>{date}</Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.right}>
        <BellButton unread={unread > 0} onPress={() => setNotesOpen(true)} />
        {onNewPost && (
        <View style={styles.newPost}>
        <AppButton
          title="New post"
          onPress={onNewPost}
          iconRight={
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" />
            </Svg>
          }
        />
        </View>
        )}
      </View>

      <NotificationsSheet visible={notesOpen} onClose={() => setNotesOpen(false)} persona={persona} tier={tier} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(247, 245, 240, 0.6)',
    zIndex: 5,
  },
  left: { flex: 1, minWidth: 0 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  newPost: { width: 150 },
  hello: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, color: ds.ink },
  name: { color: ds.purple },
  date: { fontSize: 13, fontWeight: '600', color: ds.text3, marginTop: 2 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 38, paddingLeft: 10, paddingRight: 14, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.75)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' },
  backHover: { backgroundColor: '#FFFFFF' },
  backText: { fontSize: 14, fontWeight: '700', color: ds.text2 },
  pageTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, color: ds.ink },
});
