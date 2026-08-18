export interface CreatorEarningsData {
  currentBalance: number;
  pendingPayouts: number;
  lifetimeEarnings: number;
  trackedExternalEarnings: number;
  opportunityReadinessScore: number;
  activeMilestoneGoal: string;
  targetMilestoneAmount: number;
  campaignReadinessChecklist: {
    id: string;
    label: string;
    completed: boolean;
    required: boolean;
  }[];
  campaigns: {
    id: string;
    brandName: string;
    title: string;
    payout: number;
    locked: boolean;
    requirementsSummary: string;
  }[];
}
