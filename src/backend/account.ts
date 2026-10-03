import type { Capabilities, PlanInfo } from '../../frontend/shared/types/phase1';
import { createStore } from './store';

// Facts about the signed-in creator's account and about the server they are talking to,
// as of the last time the app asked (GET /me/bootstrap). Screens read these to decide what
// to show: a feature the server can't deliver is hidden, never faked.

/** Nothing is assumed to work until the server says so. */
export const NO_CAPABILITIES: Capabilities = {
  ai: false,
  platforms: { tiktok: false, instagram: false, threads: false, facebook: false, youtube: false },
  tiktok: false,
  payments: false,
  voice: false,
  devLogin: false,
  autoPost: false,
  audienceDemographics: false,
};

export const capabilitiesStore = createStore<Capabilities>(NO_CAPABILITIES);
export const useCapabilities = capabilitiesStore.use;
export const getCapabilities = capabilitiesStore.get;

export const planStore = createStore<PlanInfo | null>(null);
export const usePlan = planStore.use;

/** Notifications not yet read: the bell's dot and count. */
export const unreadStore = createStore<number>(0);
export const useUnread = unreadStore.use;
