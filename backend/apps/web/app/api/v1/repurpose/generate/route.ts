import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";
export const maxDuration = 60;

// { text, platforms, prefer? } -> { versions, usedThisWeek, weeklyLimit }. Uses one of the week's
// repurposes; a free plan with none left gets a 429 (code UPGRADE_REQUIRED). Nothing is used if Jarvis fails.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await readJsonBody(request);
    const caller = await getCaller(request);
    return caller.repurpose.generate(body as Parameters<typeof caller.repurpose.generate>[0]);
  });
}
