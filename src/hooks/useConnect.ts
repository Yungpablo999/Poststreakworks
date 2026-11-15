import { useCallback, useEffect, useRef, useState } from 'react';
import { connectPlatform, CONNECT_MESSAGES, type ConnectResult } from '../api/connect';
import { platformsStore } from './usePlatforms';

// Tap handler for a platform's toggle: connected -> disconnect, otherwise start the connect flow.
// `message` is plain text for the app's existing toast (BrandToast); it clears itself.

export type ToggleOutcome = 'connected' | 'disconnected' | 'none';

const TOAST_MS = 3200;

export function useConnect(isConnected: (id: string) => boolean, onConnected?: () => void) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const busyRef = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const say = useCallback((text: string) => {
    setMessage(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), TOAST_MS);
  }, []);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const toggle = useCallback(
    async (id: string): Promise<ToggleOutcome> => {
      if (busyRef.current) return 'none'; // one action at a time
      busyRef.current = id;
      setBusy(id);
      try {
        if (isConnected(id)) {
          const ok = await platformsStore.disconnect(id);
          if (!ok) say('Could not disconnect. Please try again.');
          return ok ? 'disconnected' : 'none';
        }
        const result: ConnectResult = await connectPlatform(id, undefined);
        switch (result.status) {
          case 'connected':
            await platformsStore.refresh();
            onConnected?.();
            return 'connected';
          case 'disabled':
            say(CONNECT_MESSAGES.disabled);
            return 'none';
          case 'error':
            say(result.message);
            return 'none';
          default:
            return 'none'; // cancelled, or the web page is leaving for the provider
        }
      } finally {
        busyRef.current = null;
        setBusy(null);
      }
    },
    [isConnected, onConnected, say],
  );

  return { toggle, message, busy };
}
