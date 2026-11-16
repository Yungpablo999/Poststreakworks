import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { ds } from '../../theme/colors';
import { consentStore, useConsent } from '../../consent/consentStore';

// Asks once, at the bottom of the screen, whether PostStreak may measure how the app is used.
// Both answers are equally easy. Until someone says yes, no analytics runs.
export function ConsentBanner() {
  const { state, loaded } = useConsent();
  if (!loaded || state !== 'unset') return null;
  return (
    <SafeAreaView edges={['bottom']} style={styles.wrap} pointerEvents="box-none">
      <Animated.View entering={FadeInUp.duration(400)} style={styles.card}>
        <GlassCard strong radius={22} padding={16}>
          <Text style={styles.title}>Help us improve PostStreak?</Text>
          <Text style={styles.body}>
            With your OK we measure which screens get used, so we can fix what's confusing. We never collect your posts or your email for this. You can change your mind any time in Settings.
          </Text>
          <View style={styles.row}>
            <View style={styles.cell}>
              <AppButton title="No thanks" variant="outline" onPress={() => void consentStore.set('denied')} />
            </View>
            <View style={styles.cell}>
              <AppButton title="Allow" onPress={() => void consentStore.set('granted')} />
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50, alignItems: 'center' },
  card: { width: '100%', maxWidth: 520, paddingHorizontal: 16, paddingBottom: 12, ...(Platform.OS === 'web' ? ({ boxSizing: 'border-box' } as object) : {}) },
  title: { fontSize: 16, fontWeight: '800', color: ds.ink },
  body: { fontSize: 13, lineHeight: 19, color: ds.text2, marginTop: 6 },
  row: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cell: { flex: 1 },
});
