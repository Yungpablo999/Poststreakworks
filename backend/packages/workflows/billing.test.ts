import { beforeEach, describe, expect, it } from "vitest";
import {
  ENTITLEMENT_GRACE_HOURS,
  ONE_MONTH_MS,
  applyPaystackEvent,
  applyStripeEvent,
  entitledAfter,
  fromStripeStatus,
  interpretStripeEvent,
  type BillingStore,
  type NewSubscription,
  type Processor,
  type SubscriptionRow,
  type Transaction,
} from "./billing";

// An in-memory store with the same rules as the database: an event id is taken once.
function memoryStore() {
  const events = new Set<string>();
  const rows: SubscriptionRow[] = [];
  const txs: Transaction[] = [];
  let failNextUpdate = false;
  const store: BillingStore = {
    async claimEvent(p: Processor, id: string) {
      const k = `${p}:${id}`;
      if (events.has(k)) return false;
      events.add(k);
      return true;
    },
    async releaseEvent(p: Processor, id: string) {
      events.delete(`${p}:${id}`);
    },
    async findByProcessorId(p, id) {
      return rows.filter((r) => r.processor === p && r.processor_subscription_id === id).at(-1) ?? null;
    },
    async insert(row: NewSubscription) {
      const saved: SubscriptionRow = { id: `sub-${rows.length + 1}`, user_id: row.user_id, plan_id: row.plan_id, status: row.status, processor: row.processor, processor_subscription_id: row.processor_subscription_id, current_period_end: row.current_period_end, cancel_at_period_end: row.cancel_at_period_end };
      rows.push(saved);
      return saved;
    },
    async update(id, patch) {
      if (failNextUpdate) {
        failNextUpdate = false;
        throw new Error("database down");
      }
      Object.assign(rows.find((r) => r.id === id)!, patch);
    },
    async recordTransaction(tx) {
      txs.push(tx);
    },
  };
  return { store, rows, txs, events, failOnce: () => (failNextUpdate = true) };
}

const NOW = new Date("2026-10-05T12:00:00Z");
const s = (iso: string) => Math.floor(Date.parse(iso) / 1000);

const checkout = (over: Record<string, unknown> = {}) => ({
  id: "evt_checkout",
  type: "checkout.session.completed",
  data: { object: { id: "cs_1", mode: "subscription", payment_status: "paid", subscription: "sub_A", amount_total: 999, metadata: { user_id: "u1", plan_id: "pro-plan" }, ...over } },
});
const invoice = (id: string, periodEnd: string, over: Record<string, unknown> = {}) => ({
  id,
  type: "invoice.paid",
  data: { object: { id: `in_${id}`, subscription: "sub_A", amount_paid: 999, lines: { data: [{ period: { end: s(periodEnd) } }] }, ...over } },
});
const subUpdated = (id: string, obj: Record<string, unknown>) => ({ id, type: "customer.subscription.updated", data: { object: { id: "sub_A", ...obj } } });

let m: ReturnType<typeof memoryStore>;
beforeEach(() => {
  m = memoryStore();
});

describe("Stripe: a subscription's life", () => {
  it("checkout starts Pro for a month, and records the payment", async () => {
    expect(await applyStripeEvent(m.store, checkout(), NOW)).toEqual({ applied: true, change: "start" });
    expect(m.rows).toHaveLength(1);
    expect(m.rows[0]).toMatchObject({ user_id: "u1", plan_id: "pro-plan", status: "active", processor: "stripe", processor_subscription_id: "sub_A", cancel_at_period_end: false });
    expect(Date.parse(m.rows[0]!.current_period_end)).toBe(NOW.getTime() + ONE_MONTH_MS);
    expect(m.txs).toEqual([expect.objectContaining({ user_id: "u1", amount: 999, currency: "USD", processor_transaction_id: "cs_1" })]);
  });

  it("each paid invoice moves the period to the invoice's end", async () => {
    await applyStripeEvent(m.store, checkout(), NOW);
    await applyStripeEvent(m.store, invoice("evt_i1", "2026-11-05T12:00:00Z"), NOW);
    expect(m.rows[0]!.current_period_end).toBe("2026-11-05T12:00:00.000Z");
    await applyStripeEvent(m.store, invoice("evt_i2", "2026-12-05T12:00:00Z"), NOW);
    expect(m.rows[0]!.current_period_end).toBe("2026-12-05T12:00:00.000Z");
    expect(m.rows).toHaveLength(1);
  });

  it("an invoice that arrives before the checkout notice starts the subscription from its own details", async () => {
    const early = invoice("evt_i0", "2026-11-05T12:00:00Z", { subscription_details: { metadata: { user_id: "u1", plan_id: "pro-plan" } } });
    expect(await applyStripeEvent(m.store, early, NOW)).toEqual({ applied: true, change: "paid" });
    // then the checkout notice: same row, and the invoice's period is kept
    await applyStripeEvent(m.store, checkout(), NOW);
    expect(m.rows).toHaveLength(1);
    expect(m.rows[0]!.current_period_end).toBe("2026-11-05T12:00:00.000Z");
  });

  it("reads the subscription from the newer invoice shape (parent.subscription_details)", () => {
    const change = interpretStripeEvent({
      id: "evt_new",
      type: "invoice.paid",
      data: { object: { id: "in_x", parent: { subscription_details: { subscription: "sub_B", metadata: { user_id: "u2", plan_id: "p" } } }, lines: { data: [{ period: { end: s("2026-11-01T00:00:00Z") } }] }, amount_paid: 999 } },
    });
    expect(change).toMatchObject({ kind: "paid", subscriptionId: "sub_B", userId: "u2", planId: "p" });
  });

  it("cancelling at the period end, then changing their mind", async () => {
    await applyStripeEvent(m.store, checkout(), NOW);
    await applyStripeEvent(m.store, subUpdated("evt_u1", { status: "active", cancel_at_period_end: true, current_period_end: s("2026-11-05T12:00:00Z") }), NOW);
    expect(m.rows[0]).toMatchObject({ status: "active", cancel_at_period_end: true, current_period_end: "2026-11-05T12:00:00.000Z" });
    await applyStripeEvent(m.store, subUpdated("evt_u2", { status: "active", cancel_at_period_end: false }), NOW);
    expect(m.rows[0]!.cancel_at_period_end).toBe(false);
  });

  it("the period moved to the subscription item in newer API versions", () => {
    const change = interpretStripeEvent(subUpdated("evt_u3", { status: "active", items: { data: [{ current_period_end: s("2026-11-05T12:00:00Z") }] } }));
    expect(change).toMatchObject({ kind: "update", periodEnd: new Date("2026-11-05T12:00:00Z") });
  });

  it("a failed renewal is past due (not Pro), and the end of the subscription ends it", async () => {
    await applyStripeEvent(m.store, checkout(), NOW);
    await applyStripeEvent(m.store, subUpdated("evt_u4", { status: "past_due" }), NOW);
    expect(m.rows[0]!.status).toBe("past_due");
    await applyStripeEvent(m.store, { id: "evt_d", type: "customer.subscription.deleted", data: { object: { id: "sub_A" } } }, NOW);
    expect(m.rows[0]).toMatchObject({ status: "cancelled", cancel_at_period_end: false });
  });

  it("maps every Stripe status, and anything unknown to not paid", () => {
    expect(fromStripeStatus("active")).toBe("active");
    expect(fromStripeStatus("trialing")).toBe("trialing");
    expect(fromStripeStatus("past_due")).toBe("past_due");
    expect(fromStripeStatus("unpaid")).toBe("past_due");
    for (const s of ["canceled", "incomplete", "incomplete_expired", "paused", "something_new", undefined]) expect(fromStripeStatus(s)).toBe("cancelled");
  });
});

describe("Stripe: delivered twice, out of order, or not ours", () => {
  it("a repeated event changes nothing the second time", async () => {
    await applyStripeEvent(m.store, checkout(), NOW);
    expect(await applyStripeEvent(m.store, checkout(), NOW)).toEqual({ applied: false, change: "duplicate" });
    expect(m.rows).toHaveLength(1);
    expect(m.txs).toHaveLength(1);
  });

  it("an event that fails to apply is released, so Stripe's retry applies it", async () => {
    await applyStripeEvent(m.store, checkout(), NOW);
    m.failOnce();
    await expect(applyStripeEvent(m.store, invoice("evt_i9", "2026-11-05T12:00:00Z"), NOW)).rejects.toThrow("database down");
    expect(await applyStripeEvent(m.store, invoice("evt_i9", "2026-11-05T12:00:00Z"), NOW)).toEqual({ applied: true, change: "paid" });
    expect(m.rows[0]!.current_period_end).toBe("2026-11-05T12:00:00.000Z");
  });

  it("an update for a subscription we never saw fails (and is retried later), rather than inventing one", async () => {
    await expect(applyStripeEvent(m.store, subUpdated("evt_u9", { status: "active" }), NOW)).rejects.toThrow("unknown");
    expect(m.events.size).toBe(0);
  });

  it("ignores checkouts that aren't paid subscriptions, events without an id, and events we don't use", async () => {
    expect(await applyStripeEvent(m.store, checkout({ mode: "payment" }), NOW)).toEqual({ applied: false, change: "ignore" });
    expect(await applyStripeEvent(m.store, checkout({ payment_status: "unpaid" }), NOW)).toEqual({ applied: false, change: "ignore" });
    expect(await applyStripeEvent(m.store, checkout({ metadata: {} }), NOW)).toEqual({ applied: false, change: "ignore" });
    expect(await applyStripeEvent(m.store, { ...checkout(), id: undefined }, NOW)).toEqual({ applied: false, change: "ignore" });
    expect(await applyStripeEvent(m.store, { id: "evt_x", type: "customer.created", data: { object: {} } }, NOW)).toEqual({ applied: false, change: "ignore" });
    expect(m.rows).toHaveLength(0);
  });
});

describe("Paystack: a month of Pro per payment", () => {
  const charge = (reference: string, over: Record<string, unknown> = {}) => ({
    event: "charge.success",
    data: { reference, status: "success", amount: 1_500_000, currency: "NGN", metadata: { user_id: "u1", plan_id: "pro-plan" }, ...over },
  });

  it("starts a month that nothing renews, and records the payment", async () => {
    expect(await applyPaystackEvent(m.store, charge("ref_1"), NOW)).toEqual({ applied: true, change: "month" });
    expect(m.rows[0]).toMatchObject({ status: "active", processor: "paystack", cancel_at_period_end: true });
    expect(Date.parse(m.rows[0]!.current_period_end)).toBe(NOW.getTime() + ONE_MONTH_MS);
    expect(m.txs[0]).toMatchObject({ amount: 1_500_000, currency: "NGN", processor_transaction_id: "ref_1" });
  });

  it("the same payment reference is applied once", async () => {
    await applyPaystackEvent(m.store, charge("ref_2"), NOW);
    expect(await applyPaystackEvent(m.store, charge("ref_2"), NOW)).toEqual({ applied: false, change: "duplicate" });
    expect(m.rows).toHaveLength(1);
  });

  it("ignores other events and charges that aren't ours or didn't succeed", async () => {
    expect(await applyPaystackEvent(m.store, { event: "transfer.success", data: {} }, NOW)).toEqual({ applied: false, change: "ignore" });
    expect(await applyPaystackEvent(m.store, charge("ref_3", { metadata: {} }), NOW)).toEqual({ applied: false, change: "ignore" });
    expect(await applyPaystackEvent(m.store, charge("ref_4", { status: "failed" }), NOW)).toEqual({ applied: false, change: "ignore" });
    expect(m.rows).toHaveLength(0);
  });
});

describe("entitlement", () => {
  it("counts a period as Pro until the grace after its end has passed", () => {
    expect(Date.parse(entitledAfter(NOW))).toBe(NOW.getTime() - ENTITLEMENT_GRACE_HOURS * 3_600_000);
  });
});
