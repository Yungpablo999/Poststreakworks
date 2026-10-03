import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// The Quests screen: level, today's quest, the list, the weekly challenge. Reading it also pays
// any quest the creator has just finished (once), and says which in `justCompleted`.
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.quests.board();
  });
}
