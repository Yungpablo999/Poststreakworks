import { Linking, Platform } from 'react-native';
import { API_ROUTES } from '../../frontend/shared/constants/apiRoutes';
import type { BillingOffer, CheckoutResult, RenewalResult } from '../../frontend/shared/types/phase1';
import { api, type ApiResult } from './api';
import { createStore } from './store';
import { refreshAccount } from './sync';
import { planStore } from './account';

// Pro: what's on sale (price and limits, from the server), buying it at the payment provider's own page,
// and stopping or resuming the renewal. The app never makes anyone Pro: the provider's verified notice to
// the server does, and the app reads the result back.

export const offerStore = createStore<BillingOffer | null>(null);
export const useOffer = offerStore.use;

export async function loadOffer(): Promise<BillingOffer | null> {
  const res = await api.get<BillingOffer>(API_ROUTES.BILLING.OFFER);
  if (!res.ok) return null;
  offerStore.set(res.data);
  return res.data;
}

/**
 * Buying Pro happens on the web app, at the payment provider's page. The phone apps don't sell it: Apple
 * and Google require their own in-app purchase for subscriptions sold inside an app, and that isn't set up.
 */
export const canBuyHere = Platform.OS === 'web';

/** Opens the payment page (this tab: the provider sends the creator back to the app afterwards). */
export async function startCheckout(): Promise<ApiResult<CheckoutResult>> {
  const res = await api.post<CheckoutResult>(API_ROUTES.BILLING.CHECKOUT, { processor: 'stripe' });
  if (res.ok) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.assign(res.data.checkoutUrl);
    else await Linking.openURL(res.data.checkoutUrl);
  }
  return res;
}

async function renewal(path: string): Promise<ApiResult<RenewalResult>> {
  const res = await api.post<RenewalResult>(path);
  if (res.ok) {
    const plan = planStore.get();
    if (plan) planStore.set({ ...plan, cancelAtPeriodEnd: res.data.cancelAtPeriodEnd });
  }
  return res;
}
export const cancelRenewal = () => renewal(API_ROUTES.BILLING.CANCEL);
export const resumeRenewal = () => renewal(API_ROUTES.BILLING.REACTIVATE);

/**
 * Back from a successful payment: the provider's notice reaches the server a moment after the creator
 * does, so read the account again until it says Pro (up to about half a minute). true = Pro now.
 */
export async function waitForPro(tries = 10, gapMs = 3000): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    await refreshAccount();
    if (planStore.get()) return true;
    await new Promise((r) => setTimeout(r, gapMs));
  }
  return false;
}

/** "$9.99", or "₦15,000". */
export function formatPrice(minor: number, currency: 'USD' | 'NGN'): string {
  const major = minor / 100;
  if (currency === 'NGN') return `₦${major.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  return `$${major.toFixed(major % 1 === 0 ? 0 : 2)}`;
}
