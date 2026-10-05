import { Platform } from 'react-native';

// What the address the web app was opened with asks for, beyond ?start (App.tsx reads that one):
//   ?plan=pro                 the website's "Upgrade to Pro": show Pro once they're signed in
//   ?payment=success|cancelled back from the payment page
// Read once at launch; the payment part is then taken off the address, so a refresh doesn't repeat it.

export interface Landing {
  wantsPro: boolean;
  payment: 'success' | 'cancelled' | null;
}

export function readLanding(): Landing {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return { wantsPro: false, payment: null };
  const q = new URLSearchParams(window.location.search);
  const payment = q.get('payment');
  return { wantsPro: q.get('plan') === 'pro', payment: payment === 'success' || payment === 'cancelled' ? payment : null };
}

/** Removes ?payment and ?plan from the address bar without reloading. */
export function clearLanding(): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('payment');
    url.searchParams.delete('plan');
    window.history.replaceState(window.history.state, '', url.pathname + (url.search ? url.search : '') + url.hash);
  } catch {
    // an address we can't rewrite: leave it
  }
}
