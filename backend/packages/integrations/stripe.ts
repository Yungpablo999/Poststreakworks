import crypto from "crypto";
import { assertLocalOrigin } from "./providers/http";

// Stripe: Pro is a monthly subscription bought at Stripe's own checkout page.
//
// Webhook signatures are checked the way Stripe documents (HMAC-SHA256 of "<t>.<body>", timing-safe
// compare, events older than 5 minutes refused against replay; a header may carry more than one v1
// signature while a secret is being rolled). Keys are read when used, never at import, so a missing key
// fails one request clearly instead of every request mysteriously.
//
// Local testing: STRIPE_MOCK_ORIGIN points at a stand-in on this machine (backend/scripts/mocks/stripe.mjs)
// that speaks the same endpoints. The API refuses any non-localhost value for it.

const STRIPE_API = "https://api.stripe.com";

function apiBase(): string {
  const mock = process.env.STRIPE_MOCK_ORIGIN?.trim();
  return mock ? assertLocalOrigin(mock, "STRIPE_MOCK_ORIGIN") : STRIPE_API;
}

function secretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return key;
}

export function verifyStripeSignature(body: string, sigHeader: string, now: number = Date.now()): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return false;

  let timestamp: string | undefined;
  const signatures: string[] = [];
  for (const part of sigHeader.split(",")) {
    const i = part.indexOf("=");
    if (i < 1) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === "t") timestamp = v;
    else if (k === "v1" && v) signatures.push(v);
  }
  if (!timestamp || signatures.length === 0 || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(now / 1000 - Number(timestamp)) > 300) return false;

  const expected = Buffer.from(crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex"));
  return signatures.some((sig) => {
    const given = Buffer.from(sig);
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
}

/** The header Stripe would send for `body` (tests, and the local stand-in). */
export function signStripePayload(body: string, secret: string, timestamp: number = Math.floor(Date.now() / 1000)): string {
  return `t=${timestamp},v1=${crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
}

async function stripeRequest(path: string, form: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: { message?: string } };
  if (!res.ok) throw new Error(data.error?.message ?? `Stripe answered ${res.status}`);
  return data;
}

/**
 * A checkout page for a monthly subscription. Uses inline price_data rather than a pre-created Stripe
 * Price (subscription_plans has no stripe_price_id): checkout works as soon as a plan has a price_usd.
 * The creator and plan go on the session AND on the subscription, so every later invoice and
 * subscription event says whose it is.
 */
export async function createStripeCheckoutSession(params: {
  customerEmail: string;
  amountUsdCents: number;
  productName: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}): Promise<{ url: string; sessionId: string }> {
  const meta = Object.entries(params.metadata);
  const data = await stripeRequest("/v1/checkout/sessions", {
    mode: "subscription",
    customer_email: params.customerEmail,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][product_data][name]": params.productName,
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][price_data][unit_amount]": String(params.amountUsdCents),
    "line_items[0][quantity]": "1",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    ...Object.fromEntries(meta.map(([k, v]) => [`metadata[${k}]`, v])),
    ...Object.fromEntries(meta.map(([k, v]) => [`subscription_data[metadata][${k}]`, v])),
  });
  if (typeof data.url !== "string" || typeof data.id !== "string") throw new Error("Stripe didn't return a checkout page");
  return { url: data.url, sessionId: data.id };
}

/**
 * Stops (or resumes) the renewal of a subscription at Stripe. The creator keeps Pro to the end of the
 * period they paid for; Stripe then sends customer.subscription.updated, and later .deleted.
 */
export async function setStripeCancelAtPeriodEnd(subscriptionId: string, cancel: boolean): Promise<{ cancelAtPeriodEnd: boolean }> {
  if (!/^[A-Za-z0-9_]+$/.test(subscriptionId)) throw new Error("Not a Stripe subscription id");
  const data = await stripeRequest(`/v1/subscriptions/${subscriptionId}`, { cancel_at_period_end: String(cancel) });
  return { cancelAtPeriodEnd: data.cancel_at_period_end === true };
}

export type StripeWebhookEvent = {
  id?: string;
  type: string;
  data: { object: Record<string, unknown> & { metadata?: { user_id?: string; plan_id?: string }; id?: string } };
};
