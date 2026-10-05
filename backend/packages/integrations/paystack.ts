import crypto from "crypto";

// Paystack: a one-off naira payment for a month of Pro. Ported from PostIT-web (v1). The webhook
// signature is an HMAC-SHA512 of the raw body with the secret key, compared in constant time; the key is
// read when used, so a server without one refuses webhooks instead of crashing on them.

function secretKey(): string | null {
  return process.env.PAYSTACK_SECRET_KEY?.trim() || null;
}

export function verifyPaystackSignature(body: string, signature: string): boolean {
  const secret = secretKey();
  if (!secret || !/^[0-9a-f]+$/i.test(signature)) return false;
  const expected = Buffer.from(crypto.createHmac("sha512", secret).update(body).digest("hex"));
  const given = Buffer.from(signature.toLowerCase());
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
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
      Authorization: `Bearer ${secretKey() ?? ""}`,
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
