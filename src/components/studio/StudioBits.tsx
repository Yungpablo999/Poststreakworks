import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { LiveMascot } from '../mascot/LiveMascot';
import { ds, goldTokens } from '../../theme/colors';
import { useCapabilities } from '../../backend/account';
import { loadStudioUsage, useStudioUsage, usageStore } from '../../backend/studio';

// Small pieces every writing tool shares, so they say the same things in the same way.

/** Local testing only: the words on the page come from a stand-in, not an AI. Nothing shows on a real server. */
export function StandInNote() {
  const { aiStandIn } = useCapabilities();
  if (!aiStandIn) return null;
  return (
    <View style={styles.standIn} accessibilityRole="alert">
      <Text style={styles.standInText}>
        <Text style={styles.standInBold}>Test mode.</Text> A stand-in on this computer is writing these words, not a real AI. They are placeholders.
      </Text>
    </View>
  );
}

/** "2 of 3 writes left today": the server's count. Nothing for Pro, who have no limit. */
export function UsageLine({ kind = 'generate' }: { kind?: 'generate' | 'edit' }) {
  const usage = useStudioUsage();
  useEffect(() => {
    if (!usageStore.get()) void loadStudioUsage();
  }, []);
  const u = usage?.[kind];
  if (!u || u.limit === null) return null;
  const left = Math.max(0, u.limit - u.used);
  return (
    <Text style={[styles.usage, left === 0 && styles.usageOut]} accessibilityLiveRegion="polite">
      {left} of {u.limit} {kind === 'generate' ? 'writes' : 'quick edits'} left today
    </Text>
  );
}

/** Something went wrong: say so plainly, and offer Pro when Pro is the way forward. */
export function Problem({ message, upgrade, onUpgrade }: { message: string; upgrade?: boolean; onUpgrade?: () => void }) {
  return (
    <View style={styles.problem} accessibilityRole="alert">
      <View style={styles.problemRow}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M12 8v5M12 17h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" stroke={ds.text2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <Text style={styles.problemText}>{message}</Text>
      </View>
      {upgrade && onUpgrade ? (
        <View style={styles.problemBtn}>
          <AppButton title="See what Pro adds" variant="gold" onPress={onUpgrade} />
        </View>
      ) : null}
    </View>
  );
}

/** Pick one of a few: the kind of video, how long, the tone. */
export function ChoiceRow<T extends string | number>({
  label,
  items,
  value,
  onChange,
  disabled,
}: {
  label: string;
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  disabled?: boolean;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label || undefined}>
      {label ? <Text style={styles.choiceLabel}>{label}</Text> : null}
      <View style={styles.choices}>
        {items.map((it) => {
          const on = it.id === value;
          return (
            <Pressable
              key={String(it.id)}
              disabled={disabled}
              onPress={() => {
                if (Platform.OS !== 'web') void Haptics.selectionAsync();
                onChange(it.id);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled }}
              style={({ pressed }) => [
                styles.choice,
                on && styles.choiceOn,
                disabled && !on && { opacity: 0.5 },
                pressed && { transform: [{ scale: 0.96 }] },
                Platform.OS === 'web' && ({ cursor: disabled ? 'default' : 'pointer' } as object),
              ]}
            >
              <Text style={[styles.choiceText, on && styles.choiceTextOn]} numberOfLines={1}>
                {it.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** The tool needs a model and this server has none switched on. It is hidden from the menus; this is for a link that still leads here. */
export function NeedsJarvis({ tool }: { tool: string }) {
  return (
    <GlassCard strong radius={24} padding={20}>
      <View style={styles.needs}>
        <LiveMascot size={72} emotion="calm" />
        <Text style={styles.needsTitle}>{tool} isn’t switched on yet</Text>
        <Text style={styles.needsText}>Jarvis, who writes this, hasn’t been set up on this server. It will appear here by itself once it is.</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  standIn: { padding: 12, borderRadius: 14, backgroundColor: goldTokens.light, borderWidth: 1, borderColor: goldTokens.border },
  standInText: { fontSize: 12.5, lineHeight: 18, color: goldTokens.dark },
  standInBold: { fontWeight: '800' },
  usage: { fontSize: 12.5, fontWeight: '700', color: ds.text3 },
  usageOut: { color: ds.text2 },
  problem: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderWidth: 1, borderColor: ds.line, gap: 10 },
  problemRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  problemText: { flex: 1, fontSize: 14, lineHeight: 20, color: ds.ink },
  problemBtn: {},
  choiceLabel: { fontSize: 13, fontWeight: '800', color: ds.text2, marginBottom: 8 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  choice: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 999,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: ds.line,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  choiceOn: { borderColor: ds.purple, backgroundColor: ds.purple },
  choiceText: { fontSize: 12.5, fontWeight: '800', color: ds.text2 },
  choiceTextOn: { color: '#FFFFFF' },
  needs: { alignItems: 'center', gap: 8 },
  needsTitle: { fontSize: 18, fontWeight: '800', color: ds.ink, textAlign: 'center' },
  needsText: { fontSize: 14, lineHeight: 20, color: ds.text2, textAlign: 'center' },
});
