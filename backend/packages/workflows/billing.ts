import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceClient } from "./service-client";

// What a payment processor tells us, turned into what is true about a creator's plan.
//
// Stripe sells Pro as a monthly subscription. Its webhook sends, over the life of one subscription:
//   checkout.session.completed      the creator paid at checkout: Pro starts
//   invoice.paid                    a month was paid (the first one, and each renewal): Pro runs to the
//                                   end of that period
//   customer.subscription.updated   cancelled at the period end, reactivated, a failed renewal (past due)
//   customer.subscription.deleted   it ended: Pro stops
// Paystack (naira) is a one-off payment for a month: charge.success starts a month of Pro, which simply
// runs out (nothing renews it).
//
// Every event is applied once (payment_events, migration …27): Stripe and Paystack retry deliveries, and
// a replayed event must change nothing. A subscription whose paid period is over stops being active
// (expire_lapsed_subscriptions, run by the cron), so "status active" always means "paid for, now".

export type Processor = "stripe" | "paystack";
export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "trialing";

/** How long Pro outlives the end of a paid period while a renewal notice is on its way. Keep in step
 * with public.subscription_grace() (migration …27). */
export const ENTITLEMENT_GRACE_HOURS = 24;
const DAY_MS = 24 * 60 * 60 * 1000;
/** A one-off payment (Paystack), or a Stripe checkout before its first invoice arrives: one month. */
export const ONE_MONTH_MS = 31 * DAY_MS;

/** The latest end of a paid period that still counts as Pro at `now`. */
export function entitledAfter(now: Date = new Date()): string {
  return new Date(now.getTime() - ENTITLEMENT_GRACE_HOURS * 60 * 60 * 1000).toISOString();
}

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  processor: Processor;
  processor_subscription_id: string | null;
  current_period_end: string;
  cancel_at_period_end: boolean;
};

export type NewSubscription = Omit<SubscriptionRow, "id"> & { currency: "USD" | "NGN"; current_period_start: string };
export type SubscriptionPatch = Partial<Pick<SubscriptionRow, "status" | "current_period_end" | "cancel_at_period_end" | "plan_id" | "processor_subscription_id">>;
export type Transaction = {
  subscription_id: string | null;
  user_id: string;
  processor: Processor;
  processor_transaction_id: string;
  amount: number;
  currency: "USD" | "NGN";
  metadata: unknown;
};

/** Where billing reads and writes. The real one is the database (createSupabaseBillingStore). */
export interface BillingStore {
  /** Records that an event was applied. false = it had been applied already. */
  claimEvent(processor: Processor, eventId: string, type: string): Promise<boolean>;
  /** Forgets an event that could not be applied, so the processor's retry can apply it. */
  releaseEvent(processor: Processor, eventId: string): Promise<void>;
  findByProcessorId(processor: Processor, processorSubscriptionId: string): Promise<SubscriptionRow | null>;
  insert(row: NewSubscription): Promise<SubscriptionRow>;
  update(id: string, patch: SubscriptionPatch): Promise<void>;
  recordTransaction(tx: Transaction): Promise<void>;
}

// ─── Stripe ──────────────────────────────────────────────────────────────────

type Meta = { user_id?: string; plan_id?: string } | null | undefined;
type StripeObject = Record<string, unknown> & { id?: string; metadata?: Meta };
export type StripeEvent = { id?: string; type?: string; data?: { object?: StripeObject } };

/** What one Stripe event means for a plan. */
export type StripeChange =
  | { kind: "start"; subscriptionId: string; userId: string; planId: string; amount: number; sessionId: string }
  | { kind: "paid"; subscriptionId: string; periodEnd: Date; userId?: string; planId?: string; amount: number; invoiceId: string }
  | { kind: "update"; subscriptionId: string; status: SubscriptionStatus; cancelAtPeriodEnd: boolean; periodEnd?: Date }
  | { kind: "end"; subscriptionId: string }
  | { kind: "ignore"; reason: string };

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const seconds = (v: unknown): Date | undefined => {
  const n = num(v);
  return n === undefined ? undefined : new Date(n * 1000);
};
/** Stripe sends an expandable field either as an id or as the object itself. */
const idOf = (v: unknown): string | undefined => str(v) ?? (v && typeof v === "object" ? str((v as { id?: unknown }).id) : undefined);

/** Stripe's subscription statuses, in ours. */
export function fromStripeStatus(status: unknown): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    default:
      // canceled, incomplete, incomplete_expired, paused, anything new: not paid for
      return "cancelled";
  }
}

export function interpretStripeEvent(event: StripeEvent): StripeChange {
  const obj = event.data?.object ?? {};
  switch (event.type) {
    case "checkout.session.completed": {
      if (obj.mode !== "subscription") return { kind: "ignore", reason: "not a subscription checkout" };
      if (obj.payment_status !== undefined && obj.payment_status !== "paid") return { kind: "ignore", reason: "not paid" };
      const subscriptionId = idOf(obj.subscription);
      const userId = str(obj.metadata?.user_id);
      const planId = str(obj.metadata?.plan_id);
      if (!subscriptionId || !userId || !planId) return { kind: "ignore", reason: "missing subscription, user or plan" };
      return { kind: "start", subscriptionId, userId, planId, amount: num(obj.amount_total) ?? 0, sessionId: str(obj.id) ?? subscriptionId };
    }
    case "invoice.paid":
    case "invoice.payment_succeeded": {
      // Newer API versions put the subscription under parent.subscription_details
      const parent = obj.parent as { subscription_details?: { subscription?: unknown; metadata?: Meta } } | undefined;
      const details = (obj.subscription_details as { metadata?: Meta } | undefined) ?? parent?.subscription_details;
      const subscriptionId = idOf(obj.subscription) ?? idOf(parent?.subscription_details?.subscription);
      if (!subscriptionId) return { kind: "ignore", reason: "not a subscription invoice" };
      const lines = (obj.lines as { data?: { period?: { end?: unknown } }[] } | undefined)?.data ?? [];
      const periodEnd = seconds(lines[0]?.period?.end) ?? seconds(obj.period_end);
      if (!periodEnd) return { kind: "ignore", reason: "no period end" };
      const meta = details?.metadata ?? obj.metadata;
      return {
        kind: "paid",
        subscriptionId,
        periodEnd,
        userId: str(meta?.user_id),
        planId: str(meta?.plan_id),
        amount: num(obj.amount_paid) ?? 0,
        invoiceId: str(obj.id) ?? subscriptionId,
      };
    }
    case "customer.subscription.updated": {
      const subscriptionId = str(obj.id);
      if (!subscriptionId) return { kind: "ignore", reason: "no subscription id" };
      // The period moved to the subscription item in newer API versions
      const items = (obj.items as { data?: { current_period_end?: unknown }[] } | undefined)?.data ?? [];
      return {
        kind: "update",
        subscriptionId,
        status: fromStripeStatus(obj.status),
        cancelAtPeriodEnd: obj.cancel_at_period_end === true || num(obj.cancel_at) !== undefined,
        periodEnd: seconds(obj.current_period_end) ?? seconds(items[0]?.current_period_end),
      };
    }
    case "customer.subscription.deleted": {
      const subscriptionId = str(obj.id);
      return subscriptionId ? { kind: "end", subscriptionId } : { kind: "ignore", reason: "no subscription id" };
    }
    default:
      return { kind: "ignore", reason: `not used: ${event.type ?? "no type"}` };
  }
}

export type ApplyResult = { applied: boolean; change: StripeChange["kind"] | "duplicate" | PaystackChange["kind"] };

/** Applies one verified Stripe event. Safe to call again with the same event. */
export async function applyStripeEvent(store: BillingStore, event: StripeEvent, now: Date = new Date()): Promise<ApplyResult> {
  const change = interpretStripeEvent(event);
  if (change.kind === "ignore") return { applied: false, change: "ignore" };
  const eventId = str(event.id);
  if (!eventId) return { applied: false, change: "ignore" };
  if (!(await store.claimEvent("stripe", eventId, event.type ?? "unknown"))) return { applied: false, change: "duplicate" };

  try {
    await applyStripeChange(store, change, now);
    return { applied: true, change: change.kind };
  } catch (err) {
    // Not applied: let Stripe's retry try again
    await store.releaseEvent("stripe", eventId);
    throw err;
  }
}

async function applyStripeChange(store: BillingStore, change: Exclude<StripeChange, { kind: "ignore" }>, now: Date): Promise<void> {
  const existing = await store.findByProcessorId("stripe", change.subscriptionId);
  switch (change.kind) {
    case "start": {
      // The first invoice may already have set the period; otherwise a month, until it arrives
      const periodEnd = existing && Date.parse(existing.current_period_end) > now.getTime() ? existing.current_period_end : new Date(now.getTime() + ONE_MONTH_MS).toISOString();
      const row = existing
        ? (await store.update(existing.id, { status: "active", plan_id: change.planId, current_period_end: periodEnd, cancel_at_period_end: false }), existing)
        : await store.insert({
            user_id: change.userId,
            plan_id: change.planId,
            status: "active",
            processor: "stripe",
            processor_subscription_id: change.subscriptionId,
            currency: "USD",
            current_period_start: now.toISOString(),
            current_period_end: periodEnd,
            cancel_at_period_end: false,
          });
      await store.recordTransaction({ subscription_id: row.id, user_id: change.userId, processor: "stripe", processor_transaction_id: change.sessionId, amount: change.amount, currency: "USD", metadata: { kind: "checkout" } });
      return;
    }
    case "paid": {
      if (existing) {
        await store.update(existing.id, { status: "active", current_period_end: change.periodEnd.toISOString() });
        if (change.amount > 0) await store.recordTransaction({ subscription_id: existing.id, user_id: existing.user_id, processor: "stripe", processor_transaction_id: change.invoiceId, amount: change.amount, currency: "USD", metadata: { kind: "invoice" } });
        return;
      }
      // The invoice arrived before the checkout notice: start it from the invoice's own details
      if (!change.userId || !change.planId) throw new Error(`Stripe subscription ${change.subscriptionId} is unknown and the invoice doesn't say whose it is`);
      const row = await store.insert({
        user_id: change.userId,
        plan_id: change.planId,
        status: "active",
        processor: "stripe",
        processor_subscription_id: change.subscriptionId,
        currency: "USD",
        current_period_start: now.toISOString(),
        current_period_end: change.periodEnd.toISOString(),
        cancel_at_period_end: false,
      });
      if (change.amount > 0) await store.recordTransaction({ subscription_id: row.id, user_id: change.userId, processor: "stripe", processor_transaction_id: change.invoiceId, amount: change.amount, currency: "USD", metadata: { kind: "invoice" } });
      return;
    }
    case "update": {
      if (!existing) throw new Error(`Stripe subscription ${change.subscriptionId} is unknown`);
      await store.update(existing.id, {
        status: change.status,
        cancel_at_period_end: change.cancelAtPeriodEnd,
        ...(change.periodEnd ? { current_period_end: change.periodEnd.toISOString() } : {}),
      });
      return;
    }
    case "end": {
      if (!existing) return; // nothing of ours to end
      await store.update(existing.id, { status: "cancelled", cancel_at_period_end: false });
      return;
    }
  }
}

// ─── Paystack ────────────────────────────────────────────────────────────────

export type PaystackEvent = { event?: string; data?: Record<string, unknown> & { metadata?: Meta } };
export type PaystackChange =
  | { kind: "month"; userId: string; planId: string; reference: string; amount: number; currency: "NGN" | "USD" }
  | { kind: "ignore"; reason: string };

export function interpretPaystackEvent(event: PaystackEvent): PaystackChange {
  if (event.event !== "charge.success") return { kind: "ignore", reason: `not used: ${event.event ?? "no event"}` };
  const data = event.data ?? {};
  const userId = str(data.metadata?.user_id);
  const planId = str(data.metadata?.plan_id);
  const reference = str(data.reference);
  if (!userId || !planId || !reference) return { kind: "ignore", reason: "missing user, plan or reference" };
  if (data.status !== undefined && data.status !== "success") return { kind: "ignore", reason: "not a successful charge" };
  return { kind: "month", userId, planId, reference, amount: num(data.amount) ?? 0, currency: data.currency === "USD" ? "USD" : "NGN" };
}

/** Applies one verified Paystack event: a month of Pro from the payment. Safe to call again. */
export async function applyPaystackEvent(store: BillingStore, event: PaystackEvent, now: Date = new Date()): Promise<ApplyResult> {
  const change = interpretPaystackEvent(event);
  if (change.kind === "ignore") return { applied: false, change: "ignore" };
  // Paystack's own reference is unique per payment: it is the event's id
  if (!(await store.claimEvent("paystack", change.reference, event.event ?? "charge.success"))) return { applied: false, change: "duplicate" };
  try {
    const row = await store.insert({
      user_id: change.userId,
      plan_id: change.planId,
      status: "active",
      processor: "paystack",
      processor_subscription_id: change.reference,
      currency: change.currency,
      current_period_start: now.toISOString(),
      current_period_end: new Date(now.getTime() + ONE_MONTH_MS).toISOString(),
      cancel_at_period_end: true, // nothing renews a one-off payment
    });
    await store.recordTransaction({ subscription_id: row.id, user_id: change.userId, processor: "paystack", processor_transaction_id: change.reference, amount: change.amount, currency: change.currency, metadata: { kind: "charge" } });
    return { applied: true, change: "month" };
  } catch (err) {
    await store.releaseEvent("paystack", change.reference);
    throw err;
  }
}

// ─── The database ────────────────────────────────────────────────────────────

const COLUMNS = "id, user_id, plan_id, status, processor, processor_subscription_id, current_period_end, cancel_at_period_end";

export function createSupabaseBillingStore(db: SupabaseClient = getServiceClient()): BillingStore {
  return {
    async claimEvent(processor, eventId, type) {
      const { error } = await db.from("payment_events").insert({ processor, event_id: eventId, type: type.slice(0, 100) });
      if (!error) return true;
      if (error.code === "23505") return false; // seen before
      throw new Error(`Couldn't record payment event: ${error.message}`);
    },
    async releaseEvent(processor, eventId) {
      await db.from("payment_events").delete().eq("processor", processor).eq("event_id", eventId);
    },
    async findByProcessorId(processor, processorSubscriptionId) {
      const { data, error } = await db
        .from("subscriptions")
        .select(COLUMNS)
        .eq("processor", processor)
        .eq("processor_subscription_id", processorSubscriptionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(`Couldn't read the subscription: ${error.message}`);
      return (data as SubscriptionRow | null) ?? null;
    },
    async insert(row) {
      const { data, error } = await db.from("subscriptions").insert(row).select(COLUMNS).single();
      if (error || !data) throw new Error(`Couldn't save the subscription: ${error?.message}`);
      return data as SubscriptionRow;
    },
    async update(id, patch) {
      const { error } = await db.from("subscriptions").update(patch).eq("id", id);
      if (error) throw new Error(`Couldn't update the subscription: ${error.message}`);
    },
    async recordTransaction(tx) {
      const { error } = await db.from("payment_transactions").insert({ ...tx, status: "success" });
      if (error) throw new Error(`Couldn't record the payment: ${error.message}`);
    },
  };
}

/** The creator's current subscription (paid for, not past its period), or null. Service client: filter by id. */
export async function currentSubscription(userId: string, db: SupabaseClient = getServiceClient(), now: Date = new Date()): Promise<SubscriptionRow | null> {
  const { data, error } = await db
    .from("subscriptions")
    .select(COLUMNS)
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .gt("current_period_end", entitledAfter(now))
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Couldn't read the subscription: ${error.message}`);
  return (data as SubscriptionRow | null) ?? null;
}

/** Ends subscriptions whose paid period is over (run by the cron). Returns how many. */
export async function expireLapsedSubscriptions(db: SupabaseClient = getServiceClient(), now: Date = new Date()): Promise<number> {
  const { data, error } = await db.rpc("expire_lapsed_subscriptions", { p_now: now.toISOString() });
  if (error) throw new Error(`Couldn't expire subscriptions: ${error.message}`);
  return (data as number | null) ?? 0;
}
