import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// POST → stops Pro's renewal at the payment provider; Pro stays until the end of the paid period.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => (await getCaller(request)).billing.cancelSubscription());
}
