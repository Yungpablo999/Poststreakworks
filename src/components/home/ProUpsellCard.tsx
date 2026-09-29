import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { JarvisOrb } from '../JarvisOrb';
import { ds, goldTokens } from '../../theme/colors';

// Free tier: a calm glass card for Jarvis Pro (Home, Quests…). Gold is used only here
// (Pro), as a faint glow, the tick marks and the button.

const BENEFITS = [
  'Voiceovers in your own voice',
  'Unlimited repurposing',
  'Deeper growth insights',
];

export function ProUpsellCard({
  onUpgrade,
  title = 'Unlock Jarvis Pro',
  benefits = BENEFITS,
  buttonTitle = 'Upgrade to Pro',
}: {
  onUpgrade: () => void;
  title?: string;
  benefits?: string[];
  buttonTitle?: string;
}) {
  return (
    <GlassCard strong radius={26} padding={20}>
      {/* Faint gold glow in the corner */}
      <View pointerEvents="none" style={styles.glow}>
        <Svg width={220} height={220}>
          <Defs>
            <RadialGradient id="proGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={ds.gold} stopOpacity={0.22} />
              <Stop offset="100%" stopColor={ds.gold} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={110} cy={110} r={110} fill="url(#proGlow)" />
        </Svg>
      </View>

      <View style={styles.headerRow}>
        <JarvisOrb size={34} />
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.proChip}>
          <Text style={styles.proChipText}>PRO</Text>
        </View>
      </View>

      <View style={styles.list}>
        {benefits.map((b) => (
          <View key={b} style={styles.item}>
            <View style={styles.tick}>
              <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                <Path d="M20 6L9 17l-5-5" stroke={goldTokens.dark} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={styles.itemText}>{b}</Text>
          </View>
        ))}
      </View>

      <AppButton title={buttonTitle} variant="gold" onPress={onUpgrade} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', top: -90, right: -80 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2 },
  proChip: {
    paddingHorizontal: 8,
    height: 22,
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: goldTokens.light,
    borderWidth: 1,
    borderColor: goldTokens.border,
  },
  proChipText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: goldTokens.dark },
  list: { gap: 10, marginTop: 14, marginBottom: 18 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tick: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: goldTokens.light,
  },
  itemText: { flex: 1, fontSize: 14, lineHeight: 19, fontWeight: '600', color: ds.text2 },
});
