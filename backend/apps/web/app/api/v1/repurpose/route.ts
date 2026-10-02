import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// { usedThisWeek, weeklyLimit }  — weeklyLimit is null for Pro (unlimited)
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.repurpose.allowance();
  });
}
