import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './ui/AppText';
import { AppButton } from './ui/AppButton';
import { GlassCard } from './glass/GlassCard';
import { ds } from '../theme/colors';
import { MIN_AGE } from '../compliance/age';

interface Props {
  onConfirm: () => Promise<boolean>;
  onDecline: () => void;
}

// Shown over the whole app when a signed-in account has no age confirmation
// (a first Google sign-in, or an account made before the check existed).
export function AgeGate({ onConfirm, onDecline }: Props) {
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const ok = await onConfirm();
    if (!ok) setFailed(true);
    setBusy(false);
  };

  return (
    <View style={styles.backdrop} accessibilityViewIsModal>
      <SafeAreaView style={styles.center}>
        <Animated.View entering={FadeIn.duration(350)} style={styles.card}>
          <GlassCard strong radius={22} padding={20}>
            <Text style={styles.title}>One quick thing</Text>
            <Text style={styles.body}>PostStreak is for people who are {MIN_AGE} or older. Please confirm that you are at least {MIN_AGE} years old to continue.</Text>
            {failed ? <Text style={styles.error}>We could not save that. Please try again.</Text> : null}
            <View style={styles.actions}>
              <AppButton title={`I am ${MIN_AGE} or older`} onPress={() => void confirm()} disabled={busy} />
              <AppButton title={`I am under ${MIN_AGE}`} variant="outline" onPress={onDecline} disabled={busy} />
            </View>
          </GlassCard>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: 'rgba(20, 16, 40, 0.55)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 440, paddingHorizontal: 16, ...(Platform.OS === 'web' ? ({ boxSizing: 'border-box' } as object) : {}) },
  title: { fontSize: 18, fontWeight: '800', color: ds.ink },
  body: { fontSize: 14, lineHeight: 20, color: ds.text2, marginTop: 8 },
  error: { fontSize: 13, color: '#c0392b', marginTop: 10 },
  actions: { gap: 10, marginTop: 16 },
});
