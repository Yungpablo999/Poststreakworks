export { recordStreakEvent, getCheckInSummary, levelForXp, awardXp, getXpBalance } from "./streak-engine";
export type { StreakEventType, RecordStreakEventResult, CheckInSummary } from "./streak-engine";
export { getServiceClient } from "./service-client";
export {
  TikTokConnectError,
  completeTikTokConnect,
  createTikTokApi,
  disconnectTikTok,
  envTokenVault,
  startTikTokConnect,
  syncDueTikTokAccounts,
  syncTikTok,
} from "./tiktok-connect";
export type { ClientKind, ConnectedAccount, SyncBatchResult, SyncResult, TikTokDeps } from "./tiktok-connect";
export { createSupabaseTikTokStore, listConnectedAccounts, loadAccountSnapshots } from "./tiktok-store";
export type { ConnectedAccountSummary } from "./tiktok-store";
export { buildAccountSnapshot } from "./growth";
export type { AccountSnapshot } from "./growth";
export { notify } from "./notify";
export type { NewNotification, NoteKind, NoteTarget, NotificationType } from "./notify";
export {
  CHALLENGE_GOAL,
  creatorCalendar,
  evaluateList,
  getQuestBoard,
  joinWeeklyChallenge,
  loadQuestFacts,
  setChallengeReminders,
  todaySteps,
} from "./quests";
export type { ChallengeState, JustCompleted, Persona, PlanTier, Place, QuestBoard, QuestFacts, QuestItem, TodayStep } from "./quests";
export { audienceSummary, getBrief, getHomeSummary } from "./home";
export type { AudienceSummary, Brief, BriefStep, HomeSummary, NextPost } from "./home";
export { ensureEverydayNotes, refreshEverydayNotes, viewsMilestone } from "./everyday-notes";
export { countPosts, personaFor } from "./persona";
