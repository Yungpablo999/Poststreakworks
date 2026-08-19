import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// Referenced by architecture/FRONTEND_BACKEND_WIRING_MAP.md (JarvisProScreen's
// "Upgrade to Pro" button) and architecture/SUBSCRIPTION_AND_DUAL_TIER_ROUTING.md's
// upsell payloads (requirePro() in context.ts points here), but not present
// in frontend/shared/constants/apiRoutes.ts's API_ROUTES — a real gap in
// that file, not something to silently work around. JarvisProScreen shows
// one flat plan with no picker, so defaults to the seeded 'pro' plan slug
// and stripe (USD checkout) if the caller doesn't specify otherwise.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json().catch(() => ({}));
    const caller = await getCaller(request);

    const plans = await caller.billing.getPlans();
    const plan = plans?.find((p) => p.slug === (body.planSlug ?? "pro"));
    if (!plan) {
      throw new Error(`Plan '${body.planSlug ?? "pro"}' not found or inactive`);
    }

    return caller.billing.createCheckout({
      planId: plan.id,
      processor: body.processor === "paystack" ? "paystack" : "stripe",
    });
  });
}
