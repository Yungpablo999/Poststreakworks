import { NextResponse } from "next/server";
import { verifyStripeSignature } from "@poststreak/integrations";
import { applyStripeEvent, createSupabaseBillingStore, type StripeEvent } from "@poststreak/workflows";

export const runtime = "nodejs";

// Stripe's notices about Pro subscriptions: a plain route (the signature is over the raw body, and there
// is no creator session). What each event means is decided in packages/workflows/billing.ts, which also
// makes sure an event delivered twice is applied once.
//
// Answers: 400 bad signature (Stripe stops), 200 applied / not ours / seen before, 500 couldn't apply it
// right now (Stripe retries later, and the event is free to be applied then).
export async function POST(request: Request) {
  const body = await request.text();
  if (!verifyStripeSignature(body, request.headers.get("stripe-signature") ?? "")) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(body) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Not JSON" }, { status: 400 });
  }

  try {
    const result = await applyStripeEvent(createSupabaseBillingStore(), event);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error(`Stripe webhook ${event.type ?? "?"} ${event.id ?? "?"}:`, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Not applied yet" }, { status: 500 });
  }
}
