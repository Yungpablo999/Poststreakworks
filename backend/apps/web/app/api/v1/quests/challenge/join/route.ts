import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// "Join the challenge" for this week. Idempotent.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.quests.joinChallenge();
  });
}
