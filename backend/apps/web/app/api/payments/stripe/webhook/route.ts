import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyStripeSignature } from "@poststreak/integrations";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function grantSubscription(
  userId: string,
  planId: string,
  processorSubscriptionId: string | undefined,
) {
  const periodEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();

  return supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan_id: planId,
        status: "active",
        processor: "stripe",
        processor_subscription_id: processorSubscriptionId,
        currency: "USD",
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd,
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();
}

export async function POST(request: Request) {
  const body = await request.text();
  const sigHeader = request.headers.get("stripe-signature") ?? "";

  if (!verifyStripeSignature(body, sigHeader)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.type === "checkout.session.completed") {
    const obj = event.data?.object ?? {};
    const userId = obj.metadata?.user_id as string | undefined;
    const planId = obj.metadata?.plan_id as string | undefined;

    if (userId && planId) {
      const { data: subscription } = await grantSubscription(userId, planId, obj.subscription);

      await supabase.from("payment_transactions").insert({
        subscription_id: subscription?.id ?? null,
        user_id: userId,
        processor: "stripe",
        processor_transaction_id: obj.id,
        amount: obj.amount_total ?? 0,
        currency: "USD",
        status: "success",
        metadata: obj,
      });
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const obj = event.data?.object ?? {};
    const userId = obj.metadata?.user_id as string | undefined;
    const planId = obj.metadata?.plan_id as string | undefined;
    if (userId && planId) {
      await grantSubscription(userId, planId, obj.subscription);
    }
  }

  return NextResponse.json({ ok: true });
}
