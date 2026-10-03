import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PlatformRow } from '../onboarding/PlatformRow';
import { connectAccount, disconnectAccount, platformName, useAccounts } from '../../backend/accounts';
import { notify } from '../../backend/notice';
import { compactCount } from '../../utils/format';
import type { ConnectablePlatform } from '../../../frontend/shared/types/phase1';
import { useCapabilities } from '../../backend/account';

// One platform the creator can connect: the platform's own sign-in does the connecting, the row
// shows who is connected ("@amara · 1.2K followers"), asks before disconnecting, and says when
// the platform wants the creator to approve PostStreak again. Everything here is real: a platform
// this server isn't set up for isn't listed at all.

/** Asks before removing a real connection. */
function confirmDisconnect(name: string): Promise<boolean> {
  const message = `PostStreak will stop reading your ${name} stats and delete the numbers it saved. You can connect again any time.`;
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`Disconnect ${name}?\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(
      `Disconnect ${name}?`,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Disconnect', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}

interface AccountRowProps {
  provider: ConnectablePlatform;
  /** The free plan's limit was reached while connecting. */
  onLimit?: (message: string) => void;
}

export function AccountRow({ provider, onLimit }: AccountRowProps) {
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const name = platformName(provider);
  const account = useAccounts().find((a) => a.platform === provider);
  const available = useCapabilities().platforms[provider];
  // This server can't connect it and there is nothing connected to manage: don't offer it
  if (!account && !available) return null;

  const needsReauth = account?.status === 'needs_reauth';
  const who = account ? (account.handle ? `@${account.handle}` : account.name ?? 'Connected') : null;
  const description = !account
    ? `Sign in with ${name}`
    : needsReauth
      ? 'Connect again to keep your stats fresh'
      : `${who}${account.followers != null ? ` · ${compactCount(account.followers)} followers` : ''}${account.status === 'error' ? ' · will try again tonight' : ''}`;

  const press = async () => {
    if (busy) return;
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBusy(true);
    try {
      if (account && !needsReauth) {
        if (await confirmDisconnect(name)) {
          const r = await disconnectAccount(provider);
          notify(r.ok ? `${name} disconnected` : r.message);
        }
      } else {
        // Reconnecting and first-time connecting are the same trip to the platform.
        const r = await connectAccount(provider);
        if (!r.ok) {
          notify(r.message);
          if (r.upgrade) onLimit?.(r.message);
        }
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  return (
    <PlatformRow
      name={name}
      logo={provider}
      description={description}
      state={!account ? 'idle' : needsReauth ? 'reconnect' : 'connected'}
      busy={busy}
      onPress={() => void press()}
    />
  );
}
