import { beforeAll, describe, expect, it } from "vitest";
import { asService, asUser, count, createDatabase, createUser, one, type Db } from "./db";

// Migration …26: what Jarvis writes for a creator is counted by the server, atomically.

let db: Db;

beforeAll(async () => {
  db = await createDatabase();
}, 120_000);

type Spend = { allowed: boolean; used: number; limit: number | null; id?: string };
const spend = (userId: string, kind = "generate", tool = "script", limit: number | null = 3) =>
  asService(db, () => one<{ r: Spend }>(db, "select public.spend_ai($1, $2, $3, $4) as r", [userId, kind, tool, limit])).then((x) => x.r);
const usedToday = (userId: string, kind = "generate") =>
  asService(db, () => one<{ n: number }>(db, "select public.ai_used_today($1, $2) as n", [userId, kind])).then((x) => x.n);

describe("spend_ai: one more write, if today's allowance has room", () => {
  it("counts each write and stops at the limit", async () => {
    const u = await createUser(db);
    expect(await spend(u)).toMatchObject({ allowed: true, used: 1, limit: 3 });
    expect(await spend(u)).toMatchObject({ allowed: true, used: 2 });
    expect(await spend(u)).toMatchObject({ allowed: true, used: 3 });
    expect(await spend(u)).toEqual({ allowed: false, used: 3, limit: 3 });
    expect(await usedToday(u)).toBe(3);
  });

  it("is unlimited when there is no limit (Pro), and still keeps the count", async () => {
    const u = await createUser(db);
    for (let i = 0; i < 5; i++) expect((await spend(u, "generate", "hooks", null)).allowed).toBe(true);
    expect(await usedToday(u)).toBe(5);
  });

  it("counts new writing and small edits separately", async () => {
    const u = await createUser(db);
    await spend(u, "generate", "script", 1);
    expect((await spend(u, "generate", "script", 1)).allowed).toBe(false);
    expect((await spend(u, "edit", "script-part", 1)).allowed).toBe(true);
    expect((await spend(u, "edit", "script-part", 1)).allowed).toBe(false);
  });

  it("counts one creator's writes apart from everyone else's", async () => {
    const [a, b] = [await createUser(db), await createUser(db)];
    await spend(a, "generate", "script", 1);
    expect((await spend(a, "generate", "script", 1)).allowed).toBe(false);
    expect((await spend(b, "generate", "script", 1)).allowed).toBe(true);
  });

  it("lets nothing through that is asked for at the same moment as the last one", async () => {
    // (one connection here, so this checks the lock's logic rather than a race)
    const u = await createUser(db);
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await spend(u, "generate", "captions", 2));
    expect(results.filter((r) => r.allowed)).toHaveLength(2);
  });
});

describe("refund_ai: the model didn't deliver", () => {
  it("gives the write back", async () => {
    const u = await createUser(db);
    const first = await spend(u, "generate", "script", 1);
    expect((await spend(u, "generate", "script", 1)).allowed).toBe(false);
    await asService(db, () => db.query("select public.refund_ai($1, $2)", [u, first.id]));
    expect(await usedToday(u)).toBe(0);
    expect((await spend(u, "generate", "script", 1)).allowed).toBe(true);
  });

  it("only gives back the creator's own", async () => {
    const [a, b] = [await createUser(db), await createUser(db)];
    const mine = await spend(a, "generate", "script", 5);
    await asService(db, () => db.query("select public.refund_ai($1, $2)", [b, mine.id]));
    expect(await usedToday(a)).toBe(1);
  });
});

describe("the creator's own day", () => {
  it("does not count yesterday's writes", async () => {
    const u = await createUser(db);
    await db.query("insert into ai_usage (user_id, kind, tool, created_at) values ($1, 'generate', 'script', now() - interval '2 days')", [u]);
    expect(await usedToday(u)).toBe(0);
    expect(await spend(u, "generate", "script", 1)).toMatchObject({ allowed: true, used: 1 });
  });

  it("starts the day where the creator is, not where the server is", async () => {
    const u = await createUser(db);
    await db.query("update users set timezone = 'Pacific/Kiritimati' where id = $1", [u]); // UTC+14
    const start = await asService(db, () => one<{ s: Date }>(db, "select public.local_day_start($1) as s", [u]));
    const ahead = await one<{ ok: boolean }>(db, "select ($1::timestamptz <= now() and $1::timestamptz > now() - interval '25 hours') as ok", [start.s]);
    expect(ahead.ok).toBe(true);
    // 14 hours ahead of UTC: the day began at 10:00 UTC the day before, or 10:00 UTC today
    expect(start.s.getUTCHours()).toBe(10);
  });

  it("falls back to Lagos for a time zone that isn't one", async () => {
    const u = await createUser(db);
    await asService(db, () => db.query("update users set timezone = 'Mars/Olympus' where id = $1", [u])).catch(() => db.query("update users set timezone = 'Mars/Olympus' where id = $1", [u]));
    const start = await asService(db, () => one<{ s: Date }>(db, "select public.local_day_start($1) as s", [u]));
    expect(start.s.getUTCHours()).toBe(23); // Lagos is UTC+1: midnight there is 23:00 UTC
  });
});

describe("who may touch it", () => {
  it("lets a creator read their own usage and nothing else", async () => {
    const [a, b] = [await createUser(db), await createUser(db)];
    await spend(a);
    await spend(b);
    const own = await asUser(db, a, () => db.query("select tool from ai_usage"));
    expect(own.rows).toHaveLength(1);
  });

  it("refuses a creator who tries to reset or invent their own", async () => {
    const u = await createUser(db);
    await spend(u);
    await expect(asUser(db, u, () => db.query("delete from ai_usage where user_id = $1", [u]))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, u, () => db.query("update ai_usage set created_at = now() - interval '3 days' where user_id = $1", [u]))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, u, () => db.query("insert into ai_usage (user_id, kind, tool) values ($1, 'generate', 'x')", [u]))).rejects.toThrow(/permission denied/);
    expect(await count(db, "select 1 from ai_usage where user_id = $1", [u])).toBe(1);
  });

  it("can't be called by a creator", async () => {
    const u = await createUser(db);
    await expect(asUser(db, u, () => db.query("select public.spend_ai($1, 'generate', 'x', null)", [u]))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, u, () => db.query("select public.ai_used_today($1, 'generate')", [u]))).rejects.toThrow(/permission denied/);
  });
});
