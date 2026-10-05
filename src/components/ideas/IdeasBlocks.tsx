import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import Animated, { Easing, FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { PressableCard } from '../ui/PressableCard';
import { JarvisOrb } from '../JarvisOrb';
import { ds, goldTokens } from '../../theme/colors';
import { TextInput } from '../ui/AppText';
import type { FeedIdea } from '../../../frontend/shared/types/phase1';

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
  saved,
  onAnother,
  onUse,
  onSave,
}: {
  idea: FeedIdea;
  saved: boolean;
  /** Absent when there is no other idea to show. */
  onAnother?: () => void;
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
        {onAnother && (
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
        )}
      </View>

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
          </View>
        </Animated.View>

      <View style={styles.pickActions}>
        <View style={styles.flex}>
          <AppButton
            title="Use this idea"
            size="lg"
            onPress={onUse}
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
  // The save button sits over the card rather than inside it: a button can't hold another button on the web
  return (
    <View>
      <PressableCard onPress={onUse} accessibilityLabel={`${idea.title}. ${idea.format}. Use this idea`}>
        {(hover) => <IdeaRowInner idea={idea} hover={hover} />}
      </PressableCard>
      <View style={styles.saveTopRight}>
        <SaveButton saved={saved} onPress={onSave} />
      </View>
    </View>
  );
}

function IdeaRowInner({ idea, hover }: { idea: FeedIdea; hover: { value: number } }) {
  const arrow = useAnimatedStyle(() => ({ transform: [{ translateX: 3 * hover.value }] }));
  return (
    <GlassCard strong radius={20} padding={14}>
      <View style={[styles.row, styles.rowTop]}>
        <View style={styles.flex}>
          <Text style={styles.rowTitle}>{idea.title}</Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {idea.format}
          </Text>
        </View>
        {/* room for the save button laid over this corner */}
        <View style={styles.saveRoom} />
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

// ─── Pro: ideas about your own topic ───────────────────────────────────────
export function TopicIdeasCard({
  busy,
  onAsk,
  goalLabel,
  results,
  isSaved,
  onUse,
  onSave,
}: {
  busy: boolean;
  onAsk: (topic: string) => void;
  goalLabel: string;
  results: FeedIdea[];
  isSaved: (id: string) => boolean;
  onUse: (idea: FeedIdea) => void;
  onSave: (idea: FeedIdea) => void;
}) {
  const [topic, setTopic] = useState('');
  const [focused, setFocused] = useState(false);
  const ask = () => {
    if (!topic.trim() || busy) return;
    onAsk(topic.trim());
  };
  return (
    <GlassCard strong radius={22} padding={16}>
      <View style={styles.topicHead}>
        <JarvisOrb size={26} />
        <Text style={styles.topicTitle}>Ideas about your own topic</Text>
        <View style={styles.proTag}>
          <Text style={styles.proTagText}>PRO</Text>
        </View>
      </View>
      <View style={[styles.topicField, focused && styles.topicFieldOn]}>
        <TextInput
          value={topic}
          onChangeText={setTopic}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={ask}
          returnKeyType="go"
          placeholder="e.g. morning routines"
          placeholderTextColor={ds.text3}
          selectionColor={ds.purple}
          style={styles.topicInput}
          accessibilityLabel="Your topic"
        />
      </View>
      <Text style={styles.topicGoal}>
        Ideas made to <Text style={styles.topicGoalBold}>{goalLabel.toLowerCase()}</Text>
      </Text>
      <View style={styles.topicBtn}>
        <AppButton title={busy ? 'Thinking…' : results.length ? 'Get 3 more' : 'Get 3 ideas'} onPress={ask} disabled={busy || !topic.trim()} />
      </View>
      {busy && (
        <View style={styles.topicResults}>
          <IdeaRowSkeleton />
        </View>
      )}
      {!busy && results.length > 0 && (
        <View style={styles.topicResults}>
          <Text style={styles.topicWhy}>{results[0].why}</Text>
          {results.map((idea, i) => (
            <Animated.View key={idea.id} entering={FadeInUp.delay(i * 90).duration(320).easing(Easing.out(Easing.cubic))}>
              <View style={styles.topicIdea}>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>{idea.title}</Text>
                  <Text style={styles.topicHook}>“{idea.hook}”</Text>
                  <Pressable onPress={() => onUse(idea)} hitSlop={6} accessibilityRole="button" style={styles.topicUse}>
                    <Text style={styles.useText}>Use this idea</Text>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path d="M5 12h14M13 6l6 6-6 6" stroke={ds.purple} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </Pressable>
                </View>
                <SaveButton saved={isSaved(idea.id)} onPress={() => onSave(idea)} />
              </View>
            </Animated.View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}

// ─── Saved row ──────────────────────────────────────────────────────────────
export function SavedRow({ title, meta, onPress, onUnsave }: { title: string; meta: string; onPress: () => void; onUnsave: () => void }) {
  return (
    <View>
    <PressableCard onPress={onPress} accessibilityLabel={`${title}. ${meta}`}>
      <GlassCard strong radius={18} padding={12}>
        <View style={styles.row}>
          {/* room for the bookmark laid over this side (a button can't hold another button on the web) */}
          <View style={styles.savedRoom} />
          <View style={styles.flex}>
            <Text style={styles.savedTitle} numberOfLines={2}>
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
      {/* Filled bookmark: tap to unsave */}
      <View style={styles.saveLeft}>
        <SaveButton saved onPress={onUnsave} size={36} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowTop: { alignItems: 'flex-start' },
  saveRoom: { width: 40, height: 40 },
  saveTopRight: { position: 'absolute', top: 14, right: 14 },
  savedRoom: { width: 36, height: 36 },
  saveLeft: { position: 'absolute', top: 0, bottom: 0, left: 12, justifyContent: 'center' },
  proTag: { paddingHorizontal: 7, height: 20, borderRadius: 999, justifyContent: 'center', backgroundColor: goldTokens.light, borderWidth: 1, borderColor: goldTokens.border },
  proTagText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: goldTokens.dark },
  topicHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topicTitle: { flex: 1, fontSize: 15.5, fontWeight: '800', color: ds.ink },
  topicField: { marginTop: 12, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.95)', backgroundColor: 'rgba(255, 255, 255, 0.85)', paddingHorizontal: 14, height: 48, justifyContent: 'center' },
  topicFieldOn: { borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  topicInput: { fontSize: 15, fontWeight: '600', color: ds.ink, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}) },
  topicBtn: { marginTop: 12 },
  topicGoal: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 8 },
  topicGoalBold: { fontWeight: '800', color: ds.purple },
  topicResults: { marginTop: 14, gap: 8 },
  topicWhy: { fontSize: 12.5, fontWeight: '700', color: ds.text2 },
  topicIdea: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(245, 243, 255, 0.9)' },
  topicHook: { fontSize: 13, lineHeight: 18, color: ds.text2, marginTop: 4, fontStyle: 'italic' },
  topicUse: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-start' },
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
  savedTitle: { fontSize: 14.5, fontWeight: '800', color: ds.ink },
});
