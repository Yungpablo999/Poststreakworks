import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// Home for creators who post: next post, week, audience, level, today's quest, challenge and (Pro) the brief.
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.home.summary();
  });
}
