import { TIER_LIMITS } from "./limits";

// What the Pro page shows, all of it the server's own truth: the price of the plan that is on sale, what
// each plan allows (the same numbers the server enforces), and whether a payment can really be taken
// here. The app shows nothing about Pro that isn't in here or in the server's capabilities.

export type Limit = number | null; // null = no limit

export interface PlanLimits {
  aiWritesPerDay: Limit;
  aiEditsPerDay: Limit;
  repurposesPerWeek: Limit;
  jarvisChatsPerDay: Limit;
  connectedPlatforms: Limit;
}

export type Processor = "stripe" | "paystack";

export interface BillingOffer {
  /** The Pro plan on sale, or null when none is. Prices in minor units (cents / kobo); null = not sold in that currency. */
  plan: { name: string; priceUsdCents: number | null; priceNgnKobo: number | null } | null;
  /** The ways a payment can be taken on this server right now (keys set and the plan priced in that currency). */
  processors: Processor[];
  limits: { free: PlanLimits; pro: PlanLimits };
}

const finite = (n: number | null): Limit => (n === null || !Number.isFinite(n) ? null : n);

function limitsFor(tier: "free" | "pro"): PlanLimits {
  const l = TIER_LIMITS[tier];
  return {
    aiWritesPerDay: finite(l.aiGenerationsPerDay),
    aiEditsPerDay: finite(l.aiEditsPerDay),
    repurposesPerWeek: finite(l.repurposesPerWeek),
    jarvisChatsPerDay: finite(l.jarvisChatPerDay),
    connectedPlatforms: finite(l.maxConnectedPlatforms),
  };
}

type PlanRow = { name: string; price_usd: number | null; price_ngn: number | null } | null;
type Env = Record<string, string | undefined>;

/** Stripe can take a payment when both its keys are set (the webhook secret is what turns a payment into Pro). */
export const stripeReady = (env: Env) => Boolean(env.STRIPE_SECRET_KEY?.trim() && env.STRIPE_WEBHOOK_SECRET?.trim());
export const paystackReady = (env: Env) => Boolean(env.PAYSTACK_SECRET_KEY?.trim());

export function buildOffer(plan: PlanRow, env: Env = process.env): BillingOffer {
  const processors: Processor[] = [];
  if (plan?.price_usd && stripeReady(env)) processors.push("stripe");
  if (plan?.price_ngn && paystackReady(env)) processors.push("paystack");
  return {
    plan: plan ? { name: plan.name, priceUsdCents: plan.price_usd || null, priceNgnKobo: plan.price_ngn || null } : null,
    processors,
    limits: { free: limitsFor("free"), pro: limitsFor("pro") },
  };
}

/** Where a checkout sends the creator back to: the app (not this API). */
export function appReturnUrl(result: "success" | "cancelled", env: Env = process.env): string {
  const base = (env.APP_WEB_URL?.trim() || "https://app.poststreak.app").replace(/\/+$/, "");
  return `${base}/?payment=${result}`;
}
