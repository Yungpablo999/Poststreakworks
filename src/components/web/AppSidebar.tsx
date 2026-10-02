import React, { useEffect, useRef, useState } from 'react';
import { TourTarget } from '../tour/GhostTour';
import { LiveMascot } from '../mascot/LiveMascot';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { BrandLogo } from '../BrandLogo';
import { HomeNavIcon, CreateNavIcon, QuestsNavIcon, GrowthNavIcon } from '../FloatingTabBar';
import type { UserProfileData } from '../UserProfileModal';
import { ds, goldTokens } from '../../theme/colors';
import { SIDEBAR_W } from '../../hooks/useBreakpoint';
import { BACKEND } from '../../config/backend';

// Desktop side menu (the web app on big screens). Replaces the bottom tab
// bar: the four main pages, the studios, a Pro card for free creators and
// the creator's profile at the bottom. Frosted glass like the rest of the
// app; the highlight glides between items (no bounce).

export type SidebarId = 'home' | 'create' | 'quests' | 'growth' | 'schedule' | 'repurpose' | 'hook-studio' | 'voice-studio';

type Item = { id: SidebarId; label: string; icon: (c: string) => React.ReactNode; pro?: boolean };

const stroke = (c: string) => ({ stroke: c, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' });

const MAIN: Item[] = [
  { id: 'home', label: 'Home', icon: (c) => <HomeNavIcon color={c} /> },
  { id: 'create', label: 'Create', icon: (c) => <CreateNavIcon color={c} /> },
  { id: 'quests', label: 'Quests', icon: (c) => <QuestsNavIcon color={c} /> },
  { id: 'growth', label: 'Growth', icon: (c) => <GrowthNavIcon color={c} /> },
];

const STUDIOS: Item[] = [
  {
    id: 'schedule',
    label: 'Schedule',
    icon: (c) => (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Rect x="3.5" y="5" width="17" height="15.5" rx="3" {...stroke(c)} />
        <Path d="M3.5 10h17M8 3v4M16 3v4" {...stroke(c)} />
      </Svg>
    ),
  },
  {
    id: 'repurpose',
    label: 'Repurpose',
    icon: (c) => (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path d="M4 9a7 7 0 0112.5-3.5L19 8M20 15a7 7 0 01-12.5 3.5L5 16" {...stroke(c)} />
        <Path d="M19 3.5V8h-4.5M5 20.5V16h4.5" {...stroke(c)} />
      </Svg>
    ),
  },
  {
    id: 'hook-studio',
    label: 'Hook Studio',
    icon: (c) => (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path d="M12 3v9a4 4 0 11-4-4" {...stroke(c)} />
        <Circle cx="12" cy="3" r="0.6" {...stroke(c)} />
      </Svg>
    ),
  },
  {
    id: 'voice-studio',
    label: 'Voice Studio',
    pro: true,
    icon: (c) => (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Rect x="9" y="3" width="6" height="11" rx="3" {...stroke(c)} />
        <Path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" {...stroke(c)} />
      </Svg>
    ),
  },
];

const ITEM_H = 44;
const smooth = { duration: 280, easing: Easing.out(Easing.cubic) };
const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;

function NavItem({ item, on, onPress, onLayout }: { item: Item; on: boolean; onPress: () => void; onLayout: (y: number) => void }) {
  const [hover, setHover] = useState(false);
  const color = on ? '#FFFFFF' : hover ? ds.ink : ds.text2;
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      onLayout={(e) => onLayout(e.nativeEvent.layout.y)}
      accessibilityRole="link"
      accessibilityState={{ selected: on }}
      accessibilityLabel={item.label}
      style={({ pressed }) => [styles.item, pointer, !on && hover && styles.itemHover, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={styles.itemIcon}>{item.icon(color)}</View>
      <Text style={[styles.itemLabel, { color }]} numberOfLines={1}>
        {item.label}
      </Text>
      {item.pro ? (
        <View style={[styles.proTag, on && styles.proTagOn]}>
          <Text style={[styles.proTagText, on && { color: '#FFFFFF' }]}>PRO</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** A list of items with a purple highlight that glides to the active one */
function NavGroup({ items, active, onNavigate }: { items: Item[]; active: SidebarId | null; onNavigate: (id: SidebarId) => void }) {
  const ys = useRef<Record<string, number>>({});
  const [ready, setReady] = useState(false);
  const y = useSharedValue(0);
  const shown = useSharedValue(0);
  const idx = items.findIndex((i) => i.id === active);

  useEffect(() => {
    if (idx < 0) {
      shown.value = withTiming(0, smooth);
      return;
    }
    const target = ys.current[items[idx].id];
    if (target === undefined) return;
    if (shown.value === 0) y.value = target;
    else y.value = withTiming(target, smooth);
    shown.value = withTiming(1, smooth);
  }, [idx, ready, items, y, shown]);

  const pill = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ translateY: y.value }] }));

  return (
    <View>
      <Animated.View pointerEvents="none" style={[styles.pill, pill]} />
      {items.map((item) => (
        <NavItem
          key={item.id}
          item={item}
          on={item.id === active}
          onPress={() => onNavigate(item.id)}
          onLayout={(v) => {
            ys.current[item.id] = v;
            if (Object.keys(ys.current).length === items.length) setReady(true);
          }}
        />
      ))}
    </View>
  );
}

export function AppSidebar({
  active,
  profile,
  onNavigate,
  onOpenProfile,
  onOpenPro,
  persona,
  onToggleTier,
  onTogglePersona,
  fill = false,
}: {
  active: SidebarId | null;
  profile?: UserProfileData;
  onNavigate: (id: SidebarId) => void;
  onOpenProfile: () => void;
  onOpenPro: () => void;
  /** Preview switches (sample data): free/Pro and new/returning creator */
  persona: 'new' | 'returning';
  onToggleTier: () => void;
  onTogglePersona: () => void;
  /** Fill its container (the phone menu drawer) instead of the fixed desktop width */
  fill?: boolean;
}) {
  const isPro = profile?.tier === 'pro' || profile?.tier === 'founding';
  const avatar = profile?.customAvatarUri ? { uri: profile.customAvatarUri } : profile?.avatarId && profile.avatarId !== 'ghost' ? profile.avatarSource : null;

  return (
    <View style={[styles.root, fill && { width: '100%', borderRightWidth: 0 }]}>
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.fill]} />

      <View style={styles.brand}>
        <BrandLogo size="md" />
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TourTarget id="nav">
          <NavGroup items={MAIN} active={active} onNavigate={onNavigate} />
        </TourTarget>
        <TourTarget id="studios">
          <Text style={styles.section}>Studios</Text>
          <NavGroup items={STUDIOS} active={active} onNavigate={onNavigate} />
        </TourTarget>

        {!isPro ? (
          <Pressable onPress={onOpenPro} accessibilityRole="button" style={({ pressed }) => [styles.proCard, pointer, pressed && { transform: [{ scale: 0.98 }] }]}>
            <View style={styles.proCardHead}>
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path d="M12 3l2.6 5.6 6.1.7-4.5 4.1 1.2 6L12 16.4 6.6 19.4l1.2-6L3.3 9.3l6.1-.7L12 3z" fill={goldTokens.primary} />
              </Svg>
              <Text style={styles.proCardTitle}>Jarvis Pro</Text>
            </View>
            <Text style={styles.proCardBody}>Unlimited ideas, Repurpose and Voice Studio.</Text>
            <View style={styles.proBtn}>
              <Text style={styles.proBtnText}>See Pro</Text>
            </View>
          </Pressable>
        ) : null}
      </ScrollView>

      {/* Preview the four versions of the app (sample data for now) */}
      {/* The live mascot keeps you company, next to the preview switches */}
      <View style={styles.buddyRow}>
        <TourTarget id="ghost" style={styles.buddy}>
          <LiveMascot size={64} bubble="top" bubbleWidth={220} />
        </TourTarget>
        {/* Preview switches are for the sample-data build; a signed-in account's plan comes from the server */}
        {!BACKEND.enabled && (
          <View style={[styles.preview, styles.flex]}>
            <Text style={styles.previewLabel}>Preview as</Text>
            <View style={styles.previewRow}>
              <Segment options={['Free', 'Pro']} value={isPro ? 1 : 0} onChange={onToggleTier} />
              <Segment options={['New', 'Returning']} value={persona === 'returning' ? 1 : 0} onChange={onTogglePersona} />
            </View>
          </View>
        )}
      </View>

      <Pressable onPress={onOpenProfile} accessibilityRole="button" accessibilityLabel="Your profile" style={({ pressed }) => [styles.me, pointer, pressed && { opacity: 0.85 }]}>
        <View style={[styles.avatar, isPro && styles.avatarPro]}>
          {avatar ? (
            <Image source={avatar} style={styles.avatarImg} />
          ) : (
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Circle cx="12" cy="8" r="4" stroke={ds.purple} strokeWidth={2} fill="none" />
              <Path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" fill="none" />
            </Svg>
          )}
        </View>
        <View style={styles.flex}>
          <Text style={styles.meName} numberOfLines={1}>
            {profile?.name || 'Your profile'}
          </Text>
          <Text style={styles.meHandle} numberOfLines={1}>
            {profile?.handle || ''}
          </Text>
        </View>
        <View style={[styles.plan, isPro && styles.planPro]}>
          <Text style={[styles.planText, isPro && styles.planTextPro]}>{isPro ? 'PRO' : 'FREE'}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function Segment({ options, value, onChange }: { options: [string, string]; value: 0 | 1; onChange: () => void }) {
  return (
    <View style={styles.seg} accessibilityRole="radiogroup">
      {options.map((o, i) => {
        const on = i === value;
        return (
          <Pressable key={o} onPress={() => !on && onChange()} accessibilityRole="radio" accessibilityState={{ checked: on }} style={[styles.segBtn, on && styles.segOn, pointer]}>
            <Text style={[styles.segText, on && styles.segTextOn]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  preview: { marginLeft: 6, marginRight: 14, marginTop: 4 },
  previewLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', color: ds.text3, marginBottom: 6, marginLeft: 2 },
  previewRow: { gap: 6 },
  seg: { flex: 1, flexDirection: 'row', padding: 3, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' },
  segBtn: { flex: 1, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: ds.lavender },
  segText: { fontSize: 11, fontWeight: '800', color: ds.text3 },
  segTextOn: { color: ds.purple },
  root: {
    width: SIDEBAR_W,
    height: '100%',
    // visible so the mascot's speech bubble can pop out over the page
    overflow: 'visible',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#3F25BF',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 6, height: 0 },
    zIndex: 10,
  },
  fill: { backgroundColor: 'rgba(247, 245, 240, 0.72)' },
  buddyRow: { flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 10, zIndex: 30 },
  buddy: { marginBottom: 6, zIndex: 30 },
  brand: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 18 },
  scroll: { paddingHorizontal: 14, paddingBottom: 16 },
  section: { marginTop: 22, marginBottom: 6, marginLeft: 12, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: ds.text3 },
  pill: { position: 'absolute', left: 0, right: 0, top: 0, height: ITEM_H, borderRadius: 14, backgroundColor: ds.purple, shadowColor: ds.purple, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, height: ITEM_H, paddingHorizontal: 12, borderRadius: 14, marginBottom: 4 },
  itemHover: { backgroundColor: 'rgba(255, 255, 255, 0.75)' },
  itemIcon: { width: 22, alignItems: 'center' },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: '700' },
  proTag: { paddingHorizontal: 7, height: 20, borderRadius: 999, justifyContent: 'center', backgroundColor: goldTokens.light, borderWidth: 1, borderColor: goldTokens.border },
  proTagOn: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'transparent' },
  proTagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, color: goldTokens.dark },
  proCard: { marginTop: 22, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.72)', borderWidth: 1, borderColor: goldTokens.border },
  proCardHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  proCardTitle: { fontSize: 15, fontWeight: '800', color: ds.ink },
  proCardBody: { marginTop: 4, fontSize: 12.5, lineHeight: 17, color: ds.text2 },
  proBtn: { marginTop: 10, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.gold, shadowColor: ds.goldLedge, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 3 } },
  proBtnText: { fontSize: 14, fontWeight: '800', color: ds.goldInk },
  me: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 14, padding: 10, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.72)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: ds.lavenderSoft, borderWidth: 2, borderColor: ds.purple },
  avatarPro: { borderColor: ds.gold },
  avatarImg: { width: '100%', height: '100%' },
  meName: { fontSize: 14, fontWeight: '800', color: ds.ink },
  meHandle: { fontSize: 12, fontWeight: '600', color: ds.text3 },
  plan: { paddingHorizontal: 8, height: 22, borderRadius: 999, justifyContent: 'center', backgroundColor: ds.lavender },
  planPro: { backgroundColor: goldTokens.light, borderWidth: 1, borderColor: goldTokens.border },
  planText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: ds.purple },
  planTextPro: { color: goldTokens.dark },
});
