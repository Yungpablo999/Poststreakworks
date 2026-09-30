import React, { useEffect } from 'react';
import { View, Pressable, ScrollView, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { PressableCard } from '../ui/PressableCard';
import { JarvisOrb } from '../JarvisOrb';
import { ds } from '../../theme/colors';
import type { FeedIdea } from '../../data';

// Building blocks for the Ideas page. Calm motion (eased, no bounce), no
// streak language, gold only for the Pro upgrade line.

const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

// ─── Chip rows ──────────────────────────────────────────────────────────────
export function ChipRow({
  items,
  selected,
  onToggle,
  label,
}: {
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  label: string;
}) {
  return (
    <View>
      <Text style={styles.rowLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {items.map((it) => {
          const on = selected.includes(it.id);
          return (
            <Pressable
              key={it.id}
              onPress={() => {
                tick();
                onToggle(it.id);
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={({ pressed }) => [
                styles.chip,
                on && styles.chipOn,
                pressed && { transform: [{ scale: 0.96 }] },
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              ]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{it.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Save (bookmark) button ─────────────────────────────────────────────────
export function SaveButton({ saved, onPress, size = 40 }: { saved: boolean; onPress: () => void; size?: number }) {
  const s = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      onPress={() => {
        tick();
        s.value = 0.85;
        s.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
        onPress();
      }}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Saved. Tap to remove' : 'Save idea'}
      style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : undefined}
    >
      <Animated.View style={[styles.save, { width: size, height: size, borderRadius: size / 2.8 }, saved && styles.saveOn, style]}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill={saved ? '#FFFFFF' : 'none'}>
          <Path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" stroke={saved ? '#FFFFFF' : ds.purple} strokeWidth={2.2} strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

// ─── Top pick ───────────────────────────────────────────────────────────────
export function TopPickCard({
  idea,
  thinking,
  saved,
  onAnother,
  onUse,
  onSave,
}: {
  idea: FeedIdea;
  thinking: boolean;
  saved: boolean;
  onAnother: () => void;
  onUse: () => void;
  onSave: () => void;
}) {
  const spin = useSharedValue(0);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  return (
    <GlassCard strong radius={26} padding={20}>
      <View style={styles.topRow}>
        <JarvisOrb size={26} />
        <Text style={styles.eyebrow} numberOfLines={1}>TOP PICK</Text>
        <Pressable
          onPress={() => {
            tick();
            spin.value = withTiming(spin.value + 1, { duration: 500, easing: Easing.out(Easing.cubic) });
            onAnother();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Show me another idea"
          style={({ pressed }) => [styles.another, pressed && { transform: [{ scale: 0.94 }] }]}
        >
          <Animated.View style={spinStyle}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M4 12a8 8 0 0113.7-5.7L20 8M20 3v5h-5M20 12a8 8 0 01-13.7 5.7L4 16M4 21v-5h5" stroke={ds.purple} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Animated.View>
          <Text style={styles.anotherText}>Another</Text>
        </Pressable>
      </View>

      {thinking ? (
        <Animated.View entering={FadeIn.duration(120)} style={styles.thinking}>
          <ActivityIndicator color={ds.purple} />
          <Text style={styles.thinkingText}>Jarvis is picking…</Text>
        </Animated.View>
      ) : (
        <Animated.View key={idea.id} entering={FadeInUp.duration(320)} style={styles.pickBody}>
          <Text style={styles.pickTitle}>“{idea.title}”</Text>
          <Text style={styles.pickHook}>{idea.hook}</Text>
          <View style={styles.why}>
            <Text style={styles.whyLabel}>WHY IT WORKS</Text>
            <Text style={styles.whyText}>{idea.why}</Text>
          </View>
          <View style={styles.meta}>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>{idea.format}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>Best at {idea.bestTime}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      <View style={styles.pickActions}>
        <View style={styles.flex}>
          <AppButton
            title="Use this idea"
            size="lg"
            onPress={onUse}
            disabled={thinking}
            iconRight={
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            }
          />
        </View>
        <SaveButton saved={saved} onPress={onSave} size={56} />
      </View>
    </GlassCard>
  );
}

// ─── Idea row ───────────────────────────────────────────────────────────────
export function IdeaRow({ idea, saved, onUse, onSave }: { idea: FeedIdea; saved: boolean; onUse: () => void; onSave: () => void }) {
  return (
    <PressableCard onPress={onUse} accessibilityLabel={`${idea.title}. ${idea.format}. Use this idea`}>
      {(hover) => <IdeaRowInner idea={idea} saved={saved} onSave={onSave} hover={hover} />}
    </PressableCard>
  );
}

function IdeaRowInner({ idea, saved, onSave, hover }: { idea: FeedIdea; saved: boolean; onSave: () => void; hover: { value: number } }) {
  const arrow = useAnimatedStyle(() => ({ transform: [{ translateX: 3 * hover.value }] }));
  return (
    <GlassCard strong radius={20} padding={14}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.rowTitle}>{idea.title}</Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {idea.format} · {idea.bestTime}
          </Text>
        </View>
        <SaveButton saved={saved} onPress={onSave} />
      </View>
      <View style={styles.useRow}>
        <Text style={styles.useText}>Use this idea</Text>
        <Animated.View style={arrow}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12h14M13 6l6 6-6 6" stroke={ds.purple} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      </View>
    </GlassCard>
  );
}

export function IdeaRowSkeleton() {
  const t = useSharedValue(0.5);
  useEffect(() => {
    t.value = withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) });
  }, [t]);
  const style = useAnimatedStyle(() => ({ opacity: t.value }));
  return (
    <Animated.View style={style}>
      <GlassCard strong radius={20} padding={14}>
        <View style={styles.row}>
          <JarvisOrb size={22} />
          <Text style={styles.thinkingText}>Jarvis is thinking up new ideas…</Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Daily ideas meter ──────────────────────────────────────────────────────
export function QuotaCard({
  used,
  limit,
  generating,
  onGenerate,
  onPro,
}: {
  used: number;
  limit: number;
  generating: boolean;
  onGenerate: () => void;
  onPro: () => void;
}) {
  const left = Math.max(0, limit - used);
  return (
    <GlassCard strong radius={22} padding={16}>
      <View style={styles.quotaHead}>
        <Text style={styles.quotaTitle}>New ideas today</Text>
        <Text style={styles.quotaCount}>
          {used} of {limit}
        </Text>
      </View>
      <View style={styles.quotaBars}>
        {Array.from({ length: limit }).map((_, i) => (
          <View key={i} style={[styles.quotaBar, i < used && styles.quotaBarOn]} />
        ))}
      </View>
      <View style={styles.quotaBtn}>
        {left > 0 ? (
          <AppButton title={generating ? 'Thinking…' : 'Generate new ideas'} variant="quiet" onPress={onGenerate} disabled={generating} />
        ) : (
          <>
            <Text style={styles.quotaDone}>That's today's free ideas. More tomorrow.</Text>
            <Pressable onPress={onPro} hitSlop={6} accessibilityRole="button">
              <Text style={styles.proLink}>Pro gives you unlimited ideas</Text>
            </Pressable>
          </>
        )}
      </View>
    </GlassCard>
  );
}

// ─── Saved row ──────────────────────────────────────────────────────────────
export function SavedRow({ title, meta, onPress }: { title: string; meta: string; onPress: () => void }) {
  return (
    <PressableCard onPress={onPress} accessibilityLabel={`${title}. ${meta}`}>
      <GlassCard strong radius={18} padding={12}>
        <View style={styles.row}>
          <View style={styles.savedIcon}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill={ds.purple}>
              <Path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" />
            </Svg>
          </View>
          <View style={styles.flex}>
            <Text style={styles.savedTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.rowMeta} numberOfLines={1}>
              {meta}
            </Text>
          </View>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M9 6l6 6-6 6" stroke={ds.text3} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      </GlassCard>
    </PressableCard>
  );
}


const styles = StyleSheet.create({
  flex: { flex: 1 },
  rowLabel: { fontSize: 13, fontWeight: '800', color: ds.text2, marginBottom: 8 },
  chips: { gap: 8, paddingRight: 20 },
  chip: {
    height: 38,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  chipOn: { backgroundColor: ds.purple, borderColor: ds.purple },
  chipText: { fontSize: 13.5, fontWeight: '800', color: ds.text2 },
  chipTextOn: { color: '#FFFFFF' },
  save: { alignItems: 'center', justifyContent: 'center', backgroundColor: ds.lavender },
  saveOn: { backgroundColor: ds.purple },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  another: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(237, 233, 254, 0.9)',
  },
  anotherText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  thinking: { minHeight: 170, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  thinkingText: { fontSize: 13, fontWeight: '700', color: ds.text3 },
  pickBody: { minHeight: 170, marginTop: 12 },
  pickTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: ds.ink, letterSpacing: -0.5 },
  pickHook: { fontSize: 14.5, lineHeight: 21, color: ds.text2, marginTop: 6 },
  why: { marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: 'rgba(237, 233, 254, 0.6)' },
  whyLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  whyText: { fontSize: 13.5, lineHeight: 19, color: ds.ink, marginTop: 3, fontWeight: '600' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  metaChip: { paddingHorizontal: 10, height: 26, justifyContent: 'center', borderRadius: 999, backgroundColor: 'rgba(23, 20, 32, 0.05)' },
  metaText: { fontSize: 12, fontWeight: '700', color: ds.text2 },
  pickActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 15, lineHeight: 20, fontWeight: '800', color: ds.ink },
  rowMeta: { fontSize: 12.5, color: ds.text3, marginTop: 3, fontWeight: '600' },
  useRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(23, 20, 32, 0.1)',
  },
  useText: { fontSize: 13.5, fontWeight: '800', color: ds.purple },
  quotaHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quotaTitle: { fontSize: 15, fontWeight: '800', color: ds.ink },
  quotaCount: { fontSize: 13, fontWeight: '800', color: ds.purple },
  quotaBars: { flexDirection: 'row', gap: 5, marginTop: 10 },
  quotaBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(91, 62, 232, 0.14)' },
  quotaBarOn: { backgroundColor: ds.purple },
  quotaBtn: { marginTop: 14 },
  quotaDone: { fontSize: 13, color: ds.text2, textAlign: 'center' },
  proLink: { fontSize: 13.5, fontWeight: '800', color: ds.goldLedge, textAlign: 'center', marginTop: 6 },
  savedIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.lavender },
  savedTitle: { fontSize: 14.5, fontWeight: '800', color: ds.ink },
});
