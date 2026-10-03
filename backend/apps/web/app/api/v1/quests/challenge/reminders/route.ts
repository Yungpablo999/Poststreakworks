import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// Body: { days: number[] } — the days of this week (0 = Monday) to be reminded on; [] clears them.
// Returns { days } as saved (days that have passed are dropped).
export async function PUT(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await readJsonBody(request);
    const caller = await getCaller(request);
    return caller.quests.setReminders(body as Parameters<typeof caller.quests.setReminders>[0]);
  });
}
