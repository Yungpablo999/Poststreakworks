import { NextResponse } from "next/server";
import { verifyPaystackSignature } from "@poststreak/integrations";
import { applyPaystackEvent, createSupabaseBillingStore, type PaystackEvent } from "@poststreak/workflows";

export const runtime = "nodejs";

// Paystack's notice that a payment went through: a month of Pro (packages/workflows/billing.ts decides
// what it means, and applies each payment reference once). A plain route: the signature is over the raw
// body, and there is no creator session.
//
// Answers: 400 bad signature, 200 applied / not ours / seen before, 500 couldn't apply it right now
// (Paystack retries).
export async function POST(request: Request) {
  const body = await request.text();
  if (!verifyPaystackSignature(body, request.headers.get("x-paystack-signature") ?? "")) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(body) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: "Not JSON" }, { status: 400 });
  }

  try {
    const result = await applyPaystackEvent(createSupabaseBillingStore(), event);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error(`Paystack webhook ${event.event ?? "?"}:`, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Not applied yet" }, { status: 500 });
  }
}
