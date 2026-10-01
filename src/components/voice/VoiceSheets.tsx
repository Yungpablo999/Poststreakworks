import React, { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { JarvisOrb } from '../JarvisOrb';
import { ds, goldTokens } from '../../theme/colors';

// Voice Studio sheets: the voice library (browse, filter, preview, pick) and
// buying extra minutes. Both glide up from the bottom, no bounce.
// Sample voices and placeholder prices until the voice service is connected.

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

// ─── Voices ─────────────────────────────────────────────────────────────────
export type VoiceStyle = 'Calm' | 'Upbeat' | 'Deep' | 'Storytelling' | 'Conversational';

export interface LibraryVoice {
  id: string;
  name: string;
  feel: string;
  style: VoiceStyle;
  accent: string;
  colors: [string, string];
}

export const VOICES: LibraryVoice[] = [
  { id: 'ava', name: 'Ava', feel: 'Warm and clear', style: 'Storytelling', accent: 'American', colors: ['#8B7CF0', '#5B3EE8'] },
  { id: 'marcus', name: 'Marcus', feel: 'Deep and calm', style: 'Deep', accent: 'American', colors: ['#3F25BF', '#171420'] },
  { id: 'zara', name: 'Zara', feel: 'Bright and upbeat', style: 'Upbeat', accent: 'British', colors: ['#F59E0B', '#F472B6'] },
  { id: 'tunde', name: 'Tunde', feel: 'Confident and lively', style: 'Upbeat', accent: 'Nigerian', colors: ['#16A34A', '#0E7490'] },
  { id: 'mia', name: 'Mia', feel: 'Soft and friendly', style: 'Calm', accent: 'Australian', colors: ['#F9A8D4', '#A78BFA'] },
  { id: 'leo', name: 'Leo', feel: 'Easy, like talking to a friend', style: 'Conversational', accent: 'American', colors: ['#60A5FA', '#5B3EE8'] },
  { id: 'amara', name: 'Amara', feel: 'Clear, like a good teacher', style: 'Storytelling', accent: 'Nigerian', colors: ['#FB923C', '#E11D48'] },
  { id: 'kai', name: 'Kai', feel: 'Fast and hyped', style: 'Upbeat', accent: 'American', colors: ['#22D3EE', '#6366F1'] },
  { id: 'rosa', name: 'Rosa', feel: 'Calm and soothing', style: 'Calm', accent: 'Spanish', colors: ['#FCA5A5', '#F59E0B'] },
  { id: 'theo', name: 'Theo', feel: 'Rich, documentary style', style: 'Deep', accent: 'British', colors: ['#64748B', '#1E293B'] },
  { id: 'nia', name: 'Nia', feel: 'Playful and fun', style: 'Conversational', accent: 'American', colors: ['#C084FC', '#EC4899'] },
  { id: 'sam', name: 'Sam', feel: 'Even and easy to follow', style: 'Calm', accent: 'Canadian', colors: ['#94A3B8', '#5B3EE8'] },
];

const STYLES: ('All' | VoiceStyle)[] = ['All', 'Calm', 'Upbeat', 'Deep', 'Storytelling', 'Conversational'];

export function VoiceAvatar({ voice, size = 44 }: { voice: Pick<LibraryVoice, 'name' | 'colors'>; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: voice.colors[1] }]}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, backgroundColor: voice.colors[0], opacity: 0.55, transform: [{ translateX: -size * 0.18 }, { translateY: -size * 0.18 }] }]} />
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{voice.name.charAt(0)}</Text>
    </View>
  );
}

function MiniWave({ active }: { active: boolean }) {
  return (
    <View style={styles.miniWave}>
      {[0, 1, 2, 3, 4].map((i) => (
        <MiniBar key={i} i={i} active={active} />
      ))}
    </View>
  );
}
function MiniBar({ i, active }: { i: number; active: boolean }) {
  const t = useSharedValue(0.35);
  useEffect(() => {
    if (active) t.value = withDelay(i * 80, withRepeat(withTiming(1, { duration: 320, easing: Easing.inOut(Easing.sin) }), -1, true));
    else {
      cancelAnimation(t);
      t.value = withTiming(0.35, { duration: 160 });
    }
  }, [active, i, t]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: t.value }] }));
  return <Animated.View style={[styles.miniBar, style]} />;
}

// Shared bottom-sheet frame
function Sheet({ visible, onClose, title, subtitle, children, footer }: { visible: boolean; onClose: () => void; title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, (d) => {
        if (d) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  const scrim = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * screenH * 0.8 }] }));
  if (!mounted) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrim]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View style={[styles.sheet, { maxHeight: screenH * 0.9, paddingBottom: insets.bottom + 16 }, sheet]}>
          <BlurView intensity={50} tint="light" style={[StyleSheet.absoluteFill, styles.sheetBlur]} />
          <View style={[StyleSheet.absoluteFill, styles.sheetFill]} />
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke={ds.ink} strokeWidth={2.4} strokeLinecap="round" />
              </Svg>
            </Pressable>
          </View>
          {children}
          {footer && <View style={styles.footer}>{footer}</View>}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Voice library ──────────────────────────────────────────────────────────
export function VoiceLibrarySheet({
  visible,
  onClose,
  selected,
  hasMyVoice,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  selected: string;
  hasMyVoice: boolean;
  onPick: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'All' | VoiceStyle>('All');
  const [playing, setPlaying] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  useEffect(() => {
    if (!visible) setPlaying(null);
  }, [visible]);

  const preview = (id: string) => {
    tick();
    if (timer.current) clearTimeout(timer.current);
    if (playing === id) {
      setPlaying(null);
      return;
    }
    setPlaying(id);
    timer.current = setTimeout(() => setPlaying(null), 3000);
  };

  const list = VOICES.filter((v) => filter === 'All' || v.style === filter);

  return (
    <Sheet visible={visible} onClose={onClose} title="Choose a voice" subtitle={`${VOICES.length + (hasMyVoice ? 1 : 0)} voices · tap play to hear one`}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filters}>
        {STYLES.map((s) => {
          const on = filter === s;
          return (
            <Pressable
              key={s}
              onPress={() => {
                tick();
                setFilter(s);
              }}
              style={({ pressed }) => [styles.filter, on && styles.filterOn, pressed && styles.pressed, pointer]}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.filterText, on && styles.filterTextOn]}>{s}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} bounces={false}>
        {hasMyVoice && filter === 'All' && (
          <VoiceRow
            name="My voice"
            feel="Your own voice, set up in Voice Studio"
            accent="You"
            avatar={<View style={styles.mineAvatar}><JarvisOrb size={30} /></View>}
            selected={selected === 'mine'}
            playing={playing === 'mine'}
            onPreview={() => preview('mine')}
            onPick={() => onPick('mine')}
          />
        )}
        {list.map((v) => (
          <Animated.View key={v.id} entering={FadeIn.duration(200)}>
            <VoiceRow
              name={v.name}
              feel={v.feel}
              accent={v.accent}
              avatar={<VoiceAvatar voice={v} />}
              selected={selected === v.id}
              playing={playing === v.id}
              onPreview={() => preview(v.id)}
              onPick={() => onPick(v.id)}
            />
          </Animated.View>
        ))}
      </ScrollView>
    </Sheet>
  );
}

function VoiceRow({
  name,
  feel,
  accent,
  avatar,
  selected,
  playing,
  onPreview,
  onPick,
}: {
  name: string;
  feel: string;
  accent: string;
  avatar: React.ReactNode;
  selected: boolean;
  playing: boolean;
  onPreview: () => void;
  onPick: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        tick();
        onPick();
      }}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${name}, ${feel}, ${accent} accent`}
      style={({ pressed }) => [styles.voiceRow, selected && styles.voiceRowOn, pressed && { transform: [{ scale: 0.98 }] }, pointer]}
    >
      {avatar}
      <View style={styles.flex}>
        <View style={styles.nameRow}>
          <Text style={styles.voiceName}>{name}</Text>
          <View style={styles.accent}>
            <Text style={styles.accentText}>{accent}</Text>
          </View>
        </View>
        <Text style={styles.voiceFeel} numberOfLines={1}>
          {feel}
        </Text>
      </View>
      <Pressable
        onPress={onPreview}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={playing ? `Stop ${name} preview` : `Play ${name} preview`}
        style={({ pressed }) => [styles.previewBtn, playing && styles.previewBtnOn, pressed && styles.pressed, pointer]}
      >
        {playing ? (
          <MiniWave active />
        ) : (
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path d="M8 5v14l11-7z" fill={ds.purple} />
          </Svg>
        )}
      </Pressable>
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected && (
          <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
            <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        )}
      </View>
    </Pressable>
  );
}

// ─── Buy more minutes ───────────────────────────────────────────────────────
// Placeholder prices — set the real ones before launch.
export const MINUTE_PACKS = [
  { minutes: 30, price: '$4.99' },
  { minutes: 60, price: '$8.99', note: 'Most picked' },
  { minutes: 150, price: '$19.99', note: 'Best value' },
];

export function BuyMinutesSheet({ visible, onClose, minutesLeft, onBuy }: { visible: boolean; onClose: () => void; minutesLeft: number; onBuy: (minutes: number) => void }) {
  const [pick, setPick] = useState(60);
  const [buying, setBuying] = useState(false);
  const pack = MINUTE_PACKS.find((p) => p.minutes === pick)!;
  useEffect(() => {
    if (visible) setBuying(false);
  }, [visible]);
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Get more minutes"
      subtitle={`You have ${minutesLeft} left this month`}
      footer={
        <>
          <AppButton
            title={buying ? 'Adding minutes…' : `Buy ${pack.minutes} minutes · ${pack.price}`}
            variant="gold"
            size="lg"
            disabled={buying}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setBuying(true);
              setTimeout(() => onBuy(pack.minutes), 900);
            }}
          />
          <Text style={styles.buyNote}>Extra minutes stay until you use them. Your monthly minutes still reset as usual.</Text>
        </>
      }
    >
      <View style={styles.packs}>
        {MINUTE_PACKS.map((p) => {
          const on = p.minutes === pick;
          return (
            <Pressable
              key={p.minutes}
              onPress={() => {
                tick();
                setPick(p.minutes);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={({ pressed }) => [styles.pack, on && styles.packOn, pressed && { transform: [{ scale: 0.98 }] }, pointer]}
            >
              <View style={styles.flex}>
                <View style={styles.nameRow}>
                  <Text style={styles.packMinutes}>{p.minutes} minutes</Text>
                  {p.note && (
                    <View style={styles.packNote}>
                      <Text style={styles.packNoteText}>{p.note}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.packSub}>About {Math.round(p.minutes * 4)} short voiceovers</Text>
              </View>
              <Text style={styles.packPrice}>{p.price}</Text>
              <View style={[styles.radio, on && styles.radioGold]}>
                {on && (
                  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  flex: { flex: 1 },
  pressed: { transform: [{ scale: 0.94 }] },
  scrim: { backgroundColor: 'rgba(23, 20, 32, 0.28)' },
  sheet: { width: '100%', maxWidth: 560, alignSelf: 'center', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(255, 255, 255, 0.95)' },
  sheetBlur: { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  sheetFill: { backgroundColor: 'rgba(247, 245, 240, 0.94)' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(23, 20, 32, 0.15)', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: ds.ink, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: ds.text3, marginTop: 2, fontWeight: '600' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.85)' },
  footer: { paddingHorizontal: 20, paddingTop: 12 },

  filterBar: { flexGrow: 0, flexShrink: 0, height: 52 },
  filters: { paddingHorizontal: 20, gap: 8, paddingVertical: 8, alignItems: 'center' },
  filter: { paddingHorizontal: 14, height: 36, borderRadius: 999, justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.85)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' },
  filterOn: { backgroundColor: ds.purple, borderColor: ds.purple },
  filterText: { fontSize: 13, fontWeight: '800', color: ds.text2 },
  filterTextOn: { color: '#FFFFFF' },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, gap: 8 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.85)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.95)' },
  voiceRowOn: { borderColor: ds.purple, backgroundColor: ds.lavenderSoft },
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText: { color: '#FFFFFF', fontWeight: '800' },
  mineAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  voiceName: { fontSize: 15, fontWeight: '800', color: ds.ink },
  accent: { paddingHorizontal: 6, height: 18, borderRadius: 999, justifyContent: 'center', backgroundColor: 'rgba(23, 20, 32, 0.06)' },
  accentText: { fontSize: 10.5, fontWeight: '800', color: ds.text3 },
  voiceFeel: { fontSize: 12.5, fontWeight: '600', color: ds.text2, marginTop: 2 },
  previewBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.lavender },
  previewBtnOn: { backgroundColor: ds.purple },
  miniWave: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 16 },
  miniBar: { width: 2.5, height: 16, borderRadius: 1.5, backgroundColor: '#FFFFFF' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#C4B5FD', alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: ds.purple, borderColor: ds.purple },
  radioGold: { backgroundColor: ds.gold, borderColor: ds.gold },

  packs: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  pack: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.85)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.95)' },
  packOn: { borderColor: ds.gold, backgroundColor: goldTokens.light },
  packMinutes: { fontSize: 16, fontWeight: '800', color: ds.ink },
  packNote: { paddingHorizontal: 7, height: 20, borderRadius: 999, justifyContent: 'center', backgroundColor: goldTokens.light, borderWidth: 1, borderColor: goldTokens.border },
  packNoteText: { fontSize: 10.5, fontWeight: '800', color: goldTokens.dark },
  packSub: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 2 },
  packPrice: { fontSize: 16, fontWeight: '800', color: ds.ink },
  buyNote: { fontSize: 12, lineHeight: 17, color: ds.text3, textAlign: 'center', marginTop: 10 },
});
