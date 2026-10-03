import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/AppText';
import { ds } from '../../theme/colors';
import { useAccounts, useConnectablePlatforms } from '../../backend/accounts';
import { openPlace } from '../notifications/NotificationsSheet';
import { AccountRow } from './AccountRow';

// The platforms this server can connect, one row each. When a free account has reached its limit,
// say so right here (above the rows, where it can't be missed) and point at Pro.

export function AccountRows({ gap = 10 }: { gap?: number }) {
  const platforms = useConnectablePlatforms();
  const connectedCount = useAccounts().length;
  const [limit, setLimit] = useState<string | null>(null);

  // A slot opened up (or one was just used): the note is out of date
  useEffect(() => setLimit(null), [connectedCount]);

  if (platforms.length === 0) {
    return <Text style={styles.none}>Connecting accounts isn’t available yet. It will appear here as soon as it is.</Text>;
  }

  return (
    <View style={{ gap }}>
      {limit && (
        <View style={styles.limit} accessibilityRole="alert">
          <Text style={styles.limitText}>{limit}</Text>
          <Pressable onPress={() => openPlace('jarvis-pro')} accessibilityRole="button" accessibilityLabel="See Pro" hitSlop={8}>
            <Text style={styles.limitLink}>See Pro</Text>
          </Pressable>
        </View>
      )}
      {platforms.map((p) => (
        <AccountRow key={p} provider={p} onLimit={setLimit} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  none: { fontSize: 13.5, lineHeight: 20, color: ds.text2, textAlign: 'center', paddingVertical: 12 },
  limit: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: 'rgba(245, 243, 255, 0.95)' },
  limitText: { flex: 1, fontSize: 13, lineHeight: 18, color: ds.text2 },
  limitLink: { fontSize: 13.5, fontWeight: '800', color: ds.purple },
});
