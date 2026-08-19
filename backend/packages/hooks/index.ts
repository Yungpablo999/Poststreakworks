export function useStreakState() {
  // TODO: wrap tRPC streak-gamification.getState
  return { data: null, isLoading: true };
}

export function useMissionToday() {
  // TODO: wrap tRPC missions.getToday
  return { data: null, isLoading: true };
}

export function useDiscoveryFeed() {
  // TODO: wrap tRPC creator-network discovery
  return { data: null, isLoading: true };
}

export function useVoiceWallet() {
  // TODO: wrap tRPC voice-studio.getWallet
  return { data: null, isLoading: true };
}

export function useSubscription() {
  // TODO: wrap tRPC billing.getSubscription
  return { data: null, isLoading: true };
}

export function useMyGrowth() {
  // TODO: wrap tRPC analytics.getMyGrowth
  return { data: null, isLoading: true };
}
