import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyPaystackSignature } from "@poststreak/integrations";

export const runtime = "nodejs";

// Deliberately a plain route handler, not a tRPC procedure — the signature
// check needs the raw request body, and this call has no user session
// (SYSTEM_DESIGN.md §2's own note: "routers/billing.ts notes webhooks are
// handled separately from tRPC procedures"). Service-role client: this
// writes subscriptions/payment_transactions for a user who isn't making the
// request.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";

  if (!verifyPaystackSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const userId = event.data?.metadata?.user_id as string | undefined;
    const planId = event.data?.metadata?.plan_id as string | undefined;
    const reference = event.data?.reference as string | undefined;
    const amount = event.data?.amount as number | undefined;

    if (!userId || !planId) {
      return NextResponse.json({ ok: true });
    }

    const periodEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();

    const { data: subscription } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan_id: planId,
          status: "active",
          processor: "paystack",
          processor_subscription_id: reference,
          currency: "NGN",
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd,
        },
        { onConflict: "user_id" },
      )
      .select("id")
      .single();

    await supabase.from("payment_transactions").insert({
      subscription_id: subscription?.id ?? null,
      user_id: userId,
      processor: "paystack",
      processor_transaction_id: reference,
      amount: amount ?? 0,
      currency: "NGN",
      status: "success",
      metadata: event.data,
    });
  }

  return NextResponse.json({ ok: true });
}
