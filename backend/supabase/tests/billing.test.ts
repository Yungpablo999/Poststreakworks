import { beforeAll, describe, expect, it } from "vitest";
import { asService, asUser, count, createDatabase, createUser, one, type Db } from "./db";

// Migration …27: a subscription says what is true (a paid period that is over stops being active), and a
// payment event is applied once.

let db: Db;
let planId: string;

beforeAll(async () => {
  db = await createDatabase();
  planId = (await one<{ id: string }>(db, "insert into subscription_plans (name, slug, price_usd) values ('Jarvis Pro', 'pro-test', 999) returning id")).id;
}, 120_000);

const subscribe = (userId: string, periodEnd: string, status = "active") =>
  one<{ id: string }>(
    db,
    `insert into subscriptions (user_id, plan_id, status, processor, processor_subscription_id, currency, current_period_end)
     values ($1, $2, $3, 'stripe', 'sub_' || gen_random_uuid(), 'USD', $4) returning id`,
    [userId, planId, status, periodEnd],
  );
const statusOf = (id: string) => one<{ status: string }>(db, "select status from subscriptions where id = $1", [id]).then((r) => r.status);
const expire = (at: string) => asService(db, () => one<{ n: number }>(db, "select public.expire_lapsed_subscriptions($1) as n", [at])).then((r) => r.n);

describe("expire_lapsed_subscriptions", () => {
  it("ends a subscription once its paid period and the day's grace are over, and nothing earlier", async () => {
    const u = await createUser(db);
    const sub = (await subscribe(u, "2026-10-01T00:00:00Z")).id;
    await expire("2026-10-01T23:00:00Z"); // within the grace
    expect(await statusOf(sub)).toBe("active");
    await expire("2026-10-02T00:00:01Z");
    expect(await statusOf(sub)).toBe("cancelled");
  });

  it("leaves paid-up, past-due and already-ended subscriptions as they are", async () => {
    const u = await createUser(db);
    const paid = (await subscribe(u, "2099-01-01T00:00:00Z")).id;
    const pastDue = (await subscribe(u, "2026-01-01T00:00:00Z", "past_due")).id;
    await expire("2026-10-05T00:00:00Z");
    expect(await statusOf(paid)).toBe("active");
    expect(await statusOf(pastDue)).toBe("past_due");
  });

  it("can't be run by a creator", async () => {
    const u = await createUser(db);
    await expect(asUser(db, u, () => db.query("select public.expire_lapsed_subscriptions(now())"))).rejects.toThrow(/permission denied/);
  });
});

describe("payment_events", () => {
  it("takes each processor's event id once", async () => {
    await asService(db, () => db.query("insert into payment_events (processor, event_id, type) values ('stripe', 'evt_1', 'invoice.paid')"));
    await expect(asService(db, () => db.query("insert into payment_events (processor, event_id, type) values ('stripe', 'evt_1', 'invoice.paid')"))).rejects.toThrow(/duplicate key/);
    // the same id from the other processor is a different event
    await asService(db, () => db.query("insert into payment_events (processor, event_id, type) values ('paystack', 'evt_1', 'charge.success')"));
    expect(await count(db, "select * from payment_events where event_id = 'evt_1'")).toBe(2);
  });

  it("is invisible and untouchable for creators", async () => {
    const u = await createUser(db);
    await expect(asUser(db, u, () => db.query("select * from payment_events"))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, u, () => db.query("insert into payment_events (processor, event_id, type) values ('stripe', 'evt_me', 'x')"))).rejects.toThrow(/permission denied/);
  });
});
