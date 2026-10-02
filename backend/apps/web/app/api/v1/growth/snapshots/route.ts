import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// AccountSnapshot[] (src/data/index.ts) built from the creator's real synced
// posts. A platform with too few posts to say anything true is left out.
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.platformConnect.growthSnapshots();
  });
}
