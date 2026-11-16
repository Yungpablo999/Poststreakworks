import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './ui/AppText';
import { AppButton } from './ui/AppButton';
import { Badge } from './ui/Badge';
import { ds, dsRadius, dsSpace } from '../theme/colors';

// The screen underneath is left exactly as it was; this sits on top, blocks taps on the sample
// data, and leaves the bottom tab bar free so the creator can always move on.
const TAB_BAR_CLEARANCE = Platform.OS === 'web' ? 0 : 96;

export function ComingSoon({ title, onBack }: { title?: string; onBack?: () => void }) {
  return (
    <View style={styles.cover} pointerEvents="box-none" testID="coming-soon">
      <Pressable style={StyleSheet.absoluteFill} accessible={false} />
      <View style={styles.card}>
        <Badge label="Coming soon" variant="purple" />
        <Text style={styles.title}>{title ?? 'This is on its way'}</Text>
        <Text style={styles.body}>We are still connecting this to your real numbers. It will show up here once it is ready.</Text>
        {onBack && <AppButton title="Back to home" variant="primary" onPress={onBack} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: TAB_BAR_CLEARANCE,
    backgroundColor: 'rgba(247, 245, 240, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: dsSpace[5],
    zIndex: 50,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: dsSpace[3],
    padding: dsSpace[5],
    borderRadius: dsRadius.lg,
    backgroundColor: ds.surface,
    borderWidth: 1,
    borderColor: ds.line,
  },
  title: { fontSize: 20, fontWeight: '800', color: ds.ink, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 20, color: ds.text2, textAlign: 'center' },
});
