import crypto from "crypto";

// Ported as-is from PostIT-web (v1) src/app/api/payments/stripe/{initiate,webhook}/route.ts.
// Same proven HMAC verification as paystack.ts — timestamp freshness (reject
// events older than 5 minutes, guards against replay) + timing-safe compare
// (guards against timing attacks on the signature check itself).

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export function verifyStripeSignature(body: string, sigHeader: string): boolean {
  const parts = sigHeader.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const payload = `${timestamp}.${body}`;
  const expected = crypto
    .createHmac("sha256", STRIPE_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    // length mismatch between expected/signature throws in timingSafeEqual
    return false;
  }
}

/**
 * Uses inline price_data rather than a pre-created Stripe Price ID —
 * subscription_plans has no stripe_price_id column, and pricing tiers are
 * still flagged unresolved (DATA_MODEL.md item A: Free/Pro/Growth names and
 * amounts differ between source docs). Inline pricing means checkout works
 * the moment a plan row has a price_usd, with no Stripe dashboard setup step
 * blocking it — worth revisiting once pricing is final and volume justifies
 * pre-created Price objects (clearer in the Stripe dashboard, required for
 * some reporting features).
 */
export async function createStripeCheckoutSession(params: {
  customerEmail: string;
  amountUsdCents: number;
  productName: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}) {
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      mode: "subscription",
      customer_email: params.customerEmail,
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": params.productName,
      "line_items[0][price_data][recurring][interval]": "month",
      "line_items[0][price_data][unit_amount]": String(params.amountUsdCents),
      "line_items[0][quantity]": "1",
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      ...Object.fromEntries(
        Object.entries(params.metadata).map(([k, v]) => [`metadata[${k}]`, v]),
      ),
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "Stripe error");

  return { url: data.url as string, sessionId: data.id as string };
}

export type StripeWebhookEvent = {
  type: string;
  data: {
    object: {
      metadata?: { user_id?: string; plan_id?: string };
      id?: string;
      amount_total?: number;
    };
  };
};
