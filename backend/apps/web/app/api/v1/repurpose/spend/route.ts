import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// Uses one repurpose. A free plan with none left is a 200 with allowed: false
// (and upgradeRequired: true), not an error.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.repurpose.spend();
  });
}
