import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// GET → BillingOffer: the Pro plan's price, what each plan allows, and whether a payment can be taken here.
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => (await getCaller(request)).billing.offer());
}
