import React, { useEffect } from 'react';
import { View, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text, TextInput } from '../ui/AppText';
import { GlassCard } from '../glass/GlassCard';
import { JarvisOrb } from '../JarvisOrb';
import { ds } from '../../theme/colors';

// Building blocks for the Script page: a timeline of how long each part takes
// to say, one card per part (edit, free swaps, Jarvis rewrite) and a
// read-through. Calm, eased motion; no emoji.

export type PartKey = 'hook' | 'body' | 'lesson' | 'cta';

/** Roughly how long a line takes to say out loud (about 2.6 words a second). */
export const secondsFor = (text: string) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return words === 0 ? 0 : Math.max(1, Math.round(words / 2.6));
};

const PART_COLORS: Record<PartKey, string> = {
  hook: ds.purple,
  body: '#8B72F5',
  lesson: '#B7A7FB',
  cta: '#D9D0FD',
};

const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

// ─── Timeline ───────────────────────────────────────────────────────────────
function Segment({ flex, color, onPress, label }: { flex: number; color: string; onPress: () => void; label: string }) {
  const f = useSharedValue(0);
  useEffect(() => {
    f.value = withTiming(flex, { duration: 450, easing: Easing.out(Easing.cubic) });
  }, [flex, f]);
  const style = useAnimatedStyle(() => ({ flexGrow: Math.max(0.001, f.value) }));
  return (
    <Animated.View style={[styles.segWrap, style]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[styles.seg, { backgroundColor: color }]} />
    </Animated.View>
  );
}

export function ScriptTimeline({
  parts,
  onJump,
}: {
  parts: { key: PartKey; label: string; seconds: number }[];
  onJump: (k: PartKey) => void;
}) {
  const total = parts.reduce((s, p) => s + p.seconds, 0);
  return (
    <GlassCard strong radius={22} padding={16}>
      <View style={styles.tlHead}>
        <Text style={styles.tlTitle}>Your script</Text>
        <Animated.View key={total} entering={FadeIn.duration(200)}>
          <Text style={styles.tlTotal}>About {total} seconds</Text>
        </Animated.View>
      </View>
      <View style={styles.segs}>
        {parts.map((p) => (
          <Segment key={p.key} flex={p.seconds} color={PART_COLORS[p.key]} label={`${p.label}, about ${p.seconds} seconds`} onPress={() => onJump(p.key)} />
        ))}
      </View>
      <View style={styles.legend}>
        {parts.map((p) => (
          <Pressable key={p.key} onPress={() => onJump(p.key)} hitSlop={6} style={styles.legendItem} accessibilityRole="button">
            <View style={[styles.legendDot, { backgroundColor: PART_COLORS[p.key] }]} />
            <Text style={styles.legendText}>
              {p.label} <Text style={styles.legendSec}>{p.seconds}s</Text>
            </Text>
          </Pressable>
        ))}
      </View>
    </GlassCard>
  );
}

// ─── One script part ────────────────────────────────────────────────────────
export function PartCard({
  n,
  partKey,
  title,
  hint,
  optional,
  value,
  onChange,
  options,
  onPickOption,
  rewriting,
  editsLeft,
  onRewrite,
  viewRef,
}: {
  n: number;
  partKey: PartKey;
  title: string;
  hint: string;
  optional?: boolean;
  value: string;
  onChange: (t: string) => void;
  options: { label: string; text: string }[];
  onPickOption: (text: string) => void;
  rewriting: boolean;
  editsLeft: number;
  onRewrite: () => void;
  viewRef?: (v: View | null) => void;
}) {
  const [focused, setFocused] = React.useState(false);
  // The box grows with its text, so nothing hides behind a scroll bar
  const [inputH, setInputH] = React.useState(50);
  return (
    <View ref={viewRef}>
      <GlassCard strong radius={24} padding={16}>
        <View style={styles.partHead}>
          <View style={[styles.num, { backgroundColor: PART_COLORS[partKey] }]}>
            <Text style={[styles.numText, partKey === 'cta' || partKey === 'lesson' ? { color: ds.purple } : null]}>{n}</Text>
          </View>
          <View style={styles.flex}>
            <View style={styles.titleRow}>
              <Text style={styles.partTitle}>{title}</Text>
              {optional && (
                <View style={styles.optional}>
                  <Text style={styles.optionalText}>Optional</Text>
                </View>
              )}
            </View>
            <Text style={styles.partHint}>{hint}</Text>
          </View>
          <Text style={styles.partSec}>{secondsFor(value)}s</Text>
        </View>

        <View style={[styles.field, focused && styles.fieldOn]}>
          {rewriting ? (
            <Animated.View entering={FadeIn.duration(120)} style={styles.rewriting}>
              <JarvisOrb size={22} />
              <Text style={styles.rewritingText}>Jarvis is rewriting…</Text>
            </Animated.View>
          ) : (
            <Animated.View key={value.slice(0, 24)} entering={FadeIn.duration(250)} style={styles.inputWrap}>
              <TextInput
                value={value}
                onChangeText={onChange}
                multiline
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                // Web textareas don't grow on their own, so size them from their
                // content; iPhone / Android multiline inputs grow by themselves
                // (forcing a height there stopped the text wrapping).
                onContentSizeChange={
                  Platform.OS === 'web' ? (e) => setInputH(Math.max(50, Math.ceil(e.nativeEvent.contentSize.height))) : undefined
                }
                scrollEnabled={Platform.OS !== 'web'}
                placeholder={optional ? 'Add one line people can remember (optional)' : 'Write this part…'}
                placeholderTextColor={ds.text3}
                style={[styles.input, Platform.OS === 'web' && { height: inputH }]}
                selectionColor={ds.purple}
              />
            </Animated.View>
          )}
        </View>

        <View style={styles.swapHead}>
          <Text style={styles.swapLabel}>Swap in, free</Text>
          <Pressable
            onPress={() => {
              tick();
              onRewrite();
            }}
            disabled={rewriting}
            accessibilityRole="button"
            accessibilityLabel={editsLeft === Infinity ? 'Rewrite with Jarvis' : editsLeft > 0 ? `Rewrite with Jarvis. ${editsLeft} ${editsLeft === 1 ? "edit" : "edits"} left` : 'Out of Jarvis edits. See Pro'}
            style={({ pressed }) => [styles.rewrite, pressed && { transform: [{ scale: 0.96 }] }, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
          >
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill={ds.purple} />
            </Svg>
            <Text style={styles.rewriteText}>{editsLeft === Infinity ? 'Rewrite' : editsLeft > 0 ? `Rewrite · ${editsLeft} left` : 'More with Pro'}</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.options}>
          {options.map((o) => {
            const on = o.text === value;
            return (
              <Pressable
                key={o.label}
                onPress={() => {
                  tick();
                  onPickOption(o.text);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${o.label}: ${o.text}`}
                style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && { transform: [{ scale: 0.97 }] }]}
              >
                <Text style={[styles.optionLabel, on && { color: ds.purple }]}>{o.label}</Text>
                <Text style={styles.optionText} numberOfLines={3}>
                  {o.text}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </GlassCard>
    </View>
  );
}

// ─── Read-through ───────────────────────────────────────────────────────────
export function ReadThrough({
  parts,
  onCopy,
}: {
  parts: { label: string; text: string }[];
  onCopy: () => void;
}) {
  return (
    <GlassCard strong radius={24} padding={16}>
      <View style={styles.tlHead}>
        <Text style={styles.tlTitle}>Read it through</Text>
        <Pressable
          onPress={() => {
            tick();
            onCopy();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Copy the full script"
          style={({ pressed }) => [styles.copy, pressed && { transform: [{ scale: 0.95 }] }]}
        >
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <Rect x="8" y="8" width="12" height="12" rx="2.5" stroke={ds.purple} strokeWidth={2.2} />
            <Path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke={ds.purple} strokeWidth={2.2} />
          </Svg>
          <Text style={styles.copyText}>Copy script</Text>
        </Pressable>
      </View>
      <View style={styles.read}>
        {parts
          .filter((p) => p.text.trim())
          .map((p) => (
            <Text key={p.label} style={styles.readLine}>
              <Text style={styles.readLabel}>{p.label}: </Text>
              {p.text.trim()}
            </Text>
          ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tlHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tlTitle: { fontSize: 16, fontWeight: '800', color: ds.ink },
  tlTotal: { fontSize: 13, fontWeight: '800', color: ds.purple },
  segs: { flexDirection: 'row', gap: 4, height: 12, marginTop: 12 },
  segWrap: { flexBasis: 0, minWidth: 8 },
  seg: { flex: 1, borderRadius: 6 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12.5, fontWeight: '700', color: ds.text2 },
  legendSec: { color: ds.text3 },
  partHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  num: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  partTitle: { fontSize: 16.5, fontWeight: '800', color: ds.ink },
  optional: { paddingHorizontal: 7, height: 20, justifyContent: 'center', borderRadius: 999, backgroundColor: 'rgba(23, 20, 32, 0.05)' },
  optionalText: { fontSize: 10.5, fontWeight: '700', color: ds.text3 },
  partHint: { fontSize: 12.5, color: ds.text3, marginTop: 1 },
  partSec: { fontSize: 12.5, fontWeight: '800', color: ds.text3 },
  field: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 12,
    minHeight: 76,
  },
  fieldOn: { borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  inputWrap: { alignSelf: 'stretch', width: '100%' },
  input: {
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '600',
    color: ds.ink,
    minHeight: 50,
    width: '100%',
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  rewriting: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 50 },
  rewritingText: { fontSize: 13.5, fontWeight: '700', color: ds.purple },
  swapHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 8 },
  swapLabel: { fontSize: 12.5, fontWeight: '800', color: ds.text2 },
  rewrite: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 28, paddingHorizontal: 10, borderRadius: 999, backgroundColor: ds.lavender },
  rewriteText: { fontSize: 12, fontWeight: '800', color: ds.purple },
  options: { gap: 8, paddingRight: 8 },
  option: {
    width: 190,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  optionOn: { borderColor: ds.purple, backgroundColor: 'rgba(237, 233, 254, 0.9)' },
  optionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, color: ds.text3, marginBottom: 4 },
  optionText: { fontSize: 13, lineHeight: 18, color: ds.ink, fontWeight: '600' },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 30, paddingHorizontal: 10, borderRadius: 999, backgroundColor: ds.lavender },
  copyText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  read: { marginTop: 12, gap: 10, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.85)' },
  readLine: { fontSize: 14.5, lineHeight: 21, color: ds.text2 },
  readLabel: { fontWeight: '800', color: ds.ink },
});
