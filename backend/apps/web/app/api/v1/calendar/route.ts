import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// ?from=<ISO>&to=<ISO> — what the creator planned and what they posted in that window
// (from inclusive, to exclusive, at most 62 days): { items: CalendarItem[] }.
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const q = new URL(request.url).searchParams;
    const caller = await getCaller(request);
    return caller.calendar.items({ from: q.get("from") ?? "", to: q.get("to") ?? "" });
  });
}
