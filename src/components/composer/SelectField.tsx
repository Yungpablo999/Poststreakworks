import React, { createElement, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { ds, dsRadius } from '../../theme/colors';

// A small dropdown. Web uses a real <select> (native keyboard + screen reader support);
// phones open a list in a bottom sheet. `value` '' shows the placeholder: there is no default.

export interface SelectOption {
  value: string;
  label: string;
  /** Shown after the label; the option can't be picked */
  disabledReason?: string | null;
}

export function SelectField({
  label,
  placeholder,
  value,
  options,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const text = (o: SelectOption) => (o.disabledReason ? `${o.label} (${o.disabledReason})` : o.label);
  const selected = options.find((o) => o.value === value);

  if (Platform.OS === 'web') {
    return createElement(
      'select',
      {
        'aria-label': label,
        value,
        onChange: (e: { target: { value: string } }) => onChange(e.target.value),
        style: {
          width: '100%',
          boxSizing: 'border-box',
          padding: '13px 14px',
          borderRadius: dsRadius.md,
          border: `1px solid ${ds.line}`,
          backgroundColor: ds.surface,
          color: value ? ds.ink : ds.text3,
          fontSize: 15,
          fontFamily: 'inherit',
        },
      },
      createElement('option', { value: '', disabled: true }, placeholder),
      ...options.map((o) => createElement('option', { key: o.value, value: o.value, disabled: !!o.disabledReason }, text(o))),
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected ? selected.label : placeholder }}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M6 9l6 6 6-6" stroke={ds.text2} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setOpen(false)} accessibilityLabel="Close" accessibilityRole="button" />
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text style={styles.sheetTitle}>{label}</Text>
          <ScrollView>
            {options.map((o) => {
              const disabled = !!o.disabledReason;
              return (
                <Pressable
                  key={o.value}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityState={{ selected: o.value === value, disabled }}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={[styles.option, o.value === value && styles.optionSelected]}
                >
                  <Text style={[styles.optionText, disabled && styles.optionDisabled, o.value === value && styles.optionTextSelected]}>
                    {text(o)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 48,
    borderRadius: dsRadius.md,
    borderWidth: 1,
    borderColor: ds.line,
    backgroundColor: ds.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pressed: { opacity: 0.8 },
  triggerText: { flex: 1, fontSize: 15, color: ds.ink },
  placeholder: { color: ds.text3 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(23,20,32,0.4)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '60%',
    backgroundColor: ds.surface,
    borderTopLeftRadius: dsRadius.lg,
    borderTopRightRadius: dsRadius.lg,
    padding: 18,
    paddingBottom: 32,
  },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: ds.ink, marginBottom: 8 },
  option: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: dsRadius.sm },
  optionSelected: { backgroundColor: ds.lavender },
  optionText: { fontSize: 15, color: ds.ink },
  optionTextSelected: { color: ds.purple, fontWeight: '700' },
  optionDisabled: { color: ds.text3 },
});
