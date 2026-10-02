import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// ?year=2026&month=9  (month is 0-based, like JavaScript's Date)
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const url = new URL(request.url);
    const caller = await getCaller(request);
    return caller.streakGamification.getCheckInMonth({
      year: Number(url.searchParams.get("year")),
      month: Number(url.searchParams.get("month")),
    });
  });
}
