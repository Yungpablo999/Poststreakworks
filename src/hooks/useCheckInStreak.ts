import { useCallback, useSyncExternalStore } from 'react';
import { checkInToday, getCheckInStreak, subscribeToCheckIns } from '../data';

// Shared check-in state for any screen (Home, Quests…).
export function useCheckInStreak() {
  const streak = useSyncExternalStore(subscribeToCheckIns, getCheckInStreak, getCheckInStreak);
  const checkIn = useCallback(() => checkInToday(), []);
  return { streak, checkIn };
}
