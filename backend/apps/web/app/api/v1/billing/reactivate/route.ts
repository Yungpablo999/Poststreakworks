import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// POST → turns Pro's renewal back on (before the paid period ends).
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => (await getCaller(request)).billing.reactivateSubscription());
}
