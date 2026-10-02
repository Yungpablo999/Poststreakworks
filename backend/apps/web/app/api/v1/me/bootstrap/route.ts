import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// Everything the app needs at launch in one call: profile, plan, connected
// platforms, check-in streak, drafts, saved hooks, repurpose allowance, and
// tour / tip state. See backend/PHASE1_CONTRACT.md.
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.accounts.bootstrap();
  });
}
