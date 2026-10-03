import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// Everything the Growth screens show, from the numbers the creator's connected accounts have
// reported: followers and how they moved, the last 30 days' posts, the best post, the best time.
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.growth.overview();
  });
}
