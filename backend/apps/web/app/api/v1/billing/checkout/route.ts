import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// POST { processor?: "stripe" | "paystack" } → { checkoutUrl, processor }: the payment page for Pro.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = ((await readJsonBody(request).catch(() => ({}))) ?? {}) as { processor?: unknown };
    const caller = await getCaller(request);
    return caller.billing.createCheckout({ processor: body.processor === "paystack" ? "paystack" : "stripe" });
  });
}
