import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// Current check-in streak: { currentDays, week[7], todayIndex, checkedInToday, longestDays, localDate }
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.streakGamification.getCheckIn();
  });
}

// Check in for the creator's local today. Idempotent.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.streakGamification.checkIn();
  });
}
