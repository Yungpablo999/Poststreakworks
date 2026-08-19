import crypto from "crypto";

// Ported as-is from PostIT-web (v1) src/app/api/payments/paystack/{initiate,webhook}/route.ts.
// This webhook signature check is the exact gap SYSTEM_DESIGN.md and
// OPEN_QUESTIONS.md flag as unsolved ("Real security gap if left unresolved
// before billing goes live") — it's already correct in v1, so this is a
// direct port, not new work.

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export function verifyPaystackSignature(body: string, signature: string): boolean {
  const hash = crypto.createHmac("sha512", PAYSTACK_SECRET).update(body).digest("hex");
  return hash === signature;
}

export async function initiatePaystackTransaction(params: {
  email: string;
  amountKobo: number;
  currency: "NGN";
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      currency: params.currency,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
      channels: ["card", "bank", "ussd", "bank_transfer"],
    }),
  });

  const data = await res.json();
  if (!data.status) {
    throw new Error(data.message || "Paystack error");
  }

  return { url: data.data.authorization_url as string, reference: data.data.reference as string };
}

export type PaystackWebhookEvent = {
  event: string;
  data: {
    metadata?: { user_id?: string; plan_id?: string };
    reference?: string;
    amount?: number;
  };
};
