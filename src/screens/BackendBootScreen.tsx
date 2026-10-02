import React from 'react';
import { ActivityIndicator, Image, Linking, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { ds } from '../theme/colors';

// A calm holding page with Ghost: shown while the app signs the creator back in
// at launch, while TikTok's "allow" round trip is being finished, and as the page
// that hands a phone creator back to the app after approving TikTok in a browser.

interface BackendBootScreenProps {
  message: string;
  /** Show the spinner (false once there is nothing left to wait for). */
  busy?: boolean;
  action?: { label: string; href: string };
}

export const BackendBootScreen: React.FC<BackendBootScreenProps> = ({ message, busy = true, action }) => (
  <View style={styles.root}>
    <GlassBackdrop />
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Image source={require('../../assets/images/jarvis-ghost-clean.png')} style={styles.ghost} resizeMode="contain" accessibilityIgnoresInvertColors />
        <Text style={styles.message} accessibilityRole="alert">{message}</Text>
        {busy ? <ActivityIndicator color={ds.purple} style={styles.spinner} /> : null}
        {action ? (
          <View style={styles.action}>
            <AppButton
              title={action.label}
              onPress={() => {
                if (Platform.OS === 'web') window.location.href = action.href;
                else Linking.openURL(action.href).catch(() => {});
              }}
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
  ghost: { width: 104, height: 104 },
  message: { fontSize: 17, lineHeight: 24, fontWeight: '700', color: ds.ink, textAlign: 'center', maxWidth: 360 },
  spinner: { marginTop: 4 },
  action: { marginTop: 10, width: '100%', maxWidth: 320 },
});
