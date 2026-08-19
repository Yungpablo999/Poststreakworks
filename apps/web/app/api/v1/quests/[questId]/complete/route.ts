import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ questId: string }> },
) {
  return withErrorHandling(async () => {
    const { questId } = await params;
    const caller = await getCaller(request);
    const result = await caller.quests.complete({ questId });
    const state = await caller.streakGamification.getState();
    return { xpGained: result.xpGained, streakCount: state.current_streak };
  });
}
