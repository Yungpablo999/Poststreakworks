import { API_ROUTES } from '../../frontend/shared/constants/apiRoutes';
import type { QuestBoard } from '../../frontend/shared/types/phase1';
import { api } from './api';
import { notify } from './notice';
import { createStore } from './store';

// Quests, XP and the weekly challenge, as the server sees them. The app never completes a
// quest: it reloads the board after the creator does something, and the server says what
// finished (QuestBoard.justCompleted).

export const questStore = createStore<QuestBoard | null>(null);
export const useQuestBoard = questStore.use;

let inFlight: Promise<QuestBoard | null> | null = null;

/** Reads the board (and lets the server pay anything just finished). Calls made together share one request. */
export function loadQuestBoard(): Promise<QuestBoard | null> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const res = await api.get<QuestBoard>(API_ROUTES.QUESTS.BOARD);
    if (!res.ok) return null;
    questStore.set(res.data);
    for (const q of res.data.justCompleted) notify(`Quest done: ${q.title}  +${q.xp} XP`, 4800);
    return res.data;
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export async function joinChallenge(): Promise<boolean> {
  const res = await api.post(API_ROUTES.QUESTS.JOIN_CHALLENGE);
  if (!res.ok) {
    notify('Couldn’t join the challenge. Please try again.');
    return false;
  }
  await loadQuestBoard();
  return true;
}

/** Saves the days (0 = Monday) to be reminded on. Returns the days the server kept, or null on failure. */
export async function saveChallengeReminders(days: number[]): Promise<number[] | null> {
  const res = await api.put<{ days: number[] }>(API_ROUTES.QUESTS.CHALLENGE_REMINDERS, { days });
  if (!res.ok) {
    notify('Couldn’t save your reminders. Please try again.');
    return null;
  }
  await loadQuestBoard();
  return res.data.days;
}

export function clearQuests(): void {
  questStore.set(null);
}
