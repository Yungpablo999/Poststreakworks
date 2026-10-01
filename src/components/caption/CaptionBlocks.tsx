import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { ds } from '../../theme/colors';
import type { CaptionOption } from '../../data';

// One of Jarvis's caption options: tap to use it. Selected = purple border.
export function CaptionOptionCard({ option, index, selected, onPress, fill }: { option: CaptionOption; index: number; selected: boolean; onPress: () => void; /** Desktop: share the row's width instead of a fixed card width */ fill?: boolean }) {
  return (
    <Animated.View entering={FadeInUp.delay(70 * index).duration(300)} style={fill ? { flex: 1, minWidth: 0 } : undefined}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.selectionAsync();
          onPress();
        }}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={`${option.label}. ${option.body}`}
        style={({ pressed }) => [
          styles.card,
          fill && { width: '100%', flex: 1 },
          selected && styles.cardOn,
          pressed && { transform: [{ scale: 0.98 }] },
          Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
        ]}
      >
        <View style={styles.top}>
          <View style={[styles.label, selected && styles.labelOn]}>
            <Text style={[styles.labelText, selected && { color: '#FFFFFF' }]}>{option.label}</Text>
          </View>
          <View style={[styles.radio, selected && styles.radioOn]}>{selected && <View style={styles.radioDot} />}</View>
        </View>
        <Text style={styles.body} numberOfLines={5}>
          {option.body}
        </Text>
        <Text style={styles.ending} numberOfLines={2}>
          {option.ending}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 232,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  cardOn: { borderColor: ds.purple, backgroundColor: 'rgba(237, 233, 254, 0.9)' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  label: { paddingHorizontal: 9, height: 24, justifyContent: 'center', borderRadius: 999, backgroundColor: ds.lavender },
  labelOn: { backgroundColor: ds.purple },
  labelText: { fontSize: 11.5, fontWeight: '800', color: ds.purple },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: ds.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  radioOn: { borderColor: ds.purple },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ds.purple },
  body: { fontSize: 13.5, lineHeight: 19, color: ds.ink, fontWeight: '600' },
  ending: { fontSize: 12.5, lineHeight: 17, color: ds.purple, fontWeight: '700', marginTop: 8 },
});
