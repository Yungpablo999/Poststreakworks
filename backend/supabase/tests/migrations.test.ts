import { beforeAll, describe, expect, it } from "vitest";
import { asService, asUser, count, createDatabase, createUser, one, type Db } from "./db";

// Runs every migration on a fresh database, then checks the Phase 1 features
// and the security boundary as the real `authenticated` / `service_role` roles.

let db: Db;

beforeAll(async () => {
  db = await createDatabase();
}, 120_000);

/** The creator's local date, as YYYY-MM-DD (same function the app's streak uses). */
const localToday = async (userId: string) =>
  (await one<{ d: string }>(db, "select public.local_today($1)::text as d", [userId])).d;

/** Seeds check-in history: one event per day, `daysAgo` days before the creator's today. */
const seedCheckIns = (userId: string, daysAgo: number[]) =>
  db.query(
    `insert into streak_events (user_id, event_type, event_date)
     select $1, 'check_in', public.local_today($1) - d from unnest($2::int[]) as d`,
    [userId, daysAgo],
  );

const recordCheckIn = (userId: string) =>
  asService(db, () =>
    one<{ r: { qualified: boolean; current_streak: number; longest_streak: number; is_milestone?: boolean; reason?: string } }>(
      db,
      "select public.record_qualifying_action($1, 'check_in') as r",
      [userId],
    ),
  ).then((row) => row.r);

const summary = (userId: string) =>
  asService(db, () =>
    one<{ s: { currentDays: number; week: boolean[]; todayIndex: number; checkedInToday: boolean; longestDays: number } }>(
      db,
      "select public.get_check_in_summary($1) as s",
      [userId],
    ),
  ).then((row) => row.s);

describe("signup", () => {
  it("creates the users row and the v1 bootstrap rows", async () => {
    const id = await createUser(db);
    expect(await count(db, "select 1 from users where id = $1", [id])).toBe(1);
    expect(await count(db, "select 1 from user_plans where user_id = $1", [id])).toBe(1);
    const user = await one<{ timezone: string; tips_seen: string[]; tour_done_at: unknown }>(
      db,
      "select timezone, tips_seen, tour_done_at from users where id = $1",
      [id],
    );
    expect(user.timezone).toBe("Africa/Lagos");
    expect(user.tips_seen).toEqual([]);
    expect(user.tour_done_at).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("check-ins and the streak", () => {
  it("starts a streak at 1 and is idempotent within a local day", async () => {
    const id = await createUser(db);
    expect(await recordCheckIn(id)).toMatchObject({ qualified: true, current_streak: 1 });
    expect(await recordCheckIn(id)).toMatchObject({ qualified: false, reason: "already_qualified_today", current_streak: 1 });
    expect(await count(db, "select 1 from streak_events where user_id = $1", [id])).toBe(1);
  });

  it("extends a run and awards the 7-day milestone once", async () => {
    const id = await createUser(db);
    await seedCheckIns(id, [6, 5, 4, 3, 2, 1]);
    expect(await recordCheckIn(id)).toMatchObject({ qualified: true, current_streak: 7, is_milestone: true });

    const milestone = await one<{ n: number }>(
      db,
      "select count(*)::int as n from milestones where user_id = $1 and milestone_type = '7_day_streak'",
      [id],
    );
    expect(milestone.n).toBe(1);
    const credit = await one<{ amount: number }>(
      db,
      "select amount from credits where user_id = $1 and source = 'streak_milestone'",
      [id],
    );
    expect(credit.amount).toBe(14);
  });

  it("quietly starts a new run after a missed day (no freezes, no loss state)", async () => {
    const id = await createUser(db);
    await seedCheckIns(id, [5, 4, 3]); // missed yesterday and the day before
    expect(await recordCheckIn(id)).toMatchObject({ qualified: true, current_streak: 1 });
  });

  it("keeps the streak_states cache in step with the log", async () => {
    const id = await createUser(db);
    await seedCheckIns(id, [2, 1]);
    await recordCheckIn(id);
    const state = await one<{ current_streak: number; longest_streak: number }>(
      db,
      "select current_streak, longest_streak from streak_states where user_id = $1",
      [id],
    );
    expect(state).toEqual({ current_streak: 3, longest_streak: 3 });
  });

  describe("get_check_in_summary", () => {
    it("is empty for a new creator", async () => {
      const id = await createUser(db);
      expect(await summary(id)).toMatchObject({ currentDays: 0, checkedInToday: false, longestDays: 0 });
    });

    it("counts through yesterday until the creator checks in today", async () => {
      const id = await createUser(db);
      await seedCheckIns(id, [3, 2, 1]);
      expect(await summary(id)).toMatchObject({ currentDays: 3, checkedInToday: false });
      await recordCheckIn(id);
      expect(await summary(id)).toMatchObject({ currentDays: 4, checkedInToday: true });
    });

    it("reads 0 once a day has been missed", async () => {
      const id = await createUser(db);
      await seedCheckIns(id, [4, 3, 2]); // nothing yesterday
      expect(await summary(id)).toMatchObject({ currentDays: 0, checkedInToday: false });
    });

    it("returns a Monday-first week with today flagged", async () => {
      const id = await createUser(db);
      await recordCheckIn(id);
      const s = await summary(id);
      const { idx } = await one<{ idx: number }>(
        db,
        "select (extract(isodow from public.local_today($1))::int - 1) as idx",
        [id],
      );
      expect(s.week).toHaveLength(7);
      expect(s.todayIndex).toBe(idx);
      expect(s.week[idx]).toBe(true);
    });
  });

  describe("time zones", () => {
    it("uses the creator's own day, not the server's", async () => {
      const id = await createUser(db);
      await db.query("update users set timezone = 'Pacific/Kiritimati' where id = $1", [id]); // UTC+14
      const expected = await one<{ d: string }>(db, "select (now() at time zone 'Pacific/Kiritimati')::date::text as d");
      expect(await localToday(id)).toBe(expected.d);
    });

    it("falls back to Lagos for an unknown zone instead of failing", async () => {
      const id = await createUser(db);
      await db.query("update users set timezone = 'Not/AZone' where id = $1", [id]);
      const lagos = await one<{ d: string }>(db, "select (now() at time zone 'Africa/Lagos')::date::text as d");
      expect(await localToday(id)).toBe(lagos.d);
      expect(await recordCheckIn(id)).toMatchObject({ qualified: true });
    });

    it("starts the week on Monday 00:00 local", async () => {
      const id = await createUser(db);
      await db.query("update users set timezone = 'America/New_York' where id = $1", [id]);
      const w = await one<{ isodow: number; hour: number }>(
        db,
        `select extract(isodow from (public.local_week_start($1) at time zone 'America/New_York'))::int as isodow,
                extract(hour   from (public.local_week_start($1) at time zone 'America/New_York'))::int as hour`,
        [id],
      );
      expect(w).toEqual({ isodow: 1, hour: 0 });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("repurpose allowance", () => {
  const spend = (userId: string, limit: number | null) =>
    asService(db, () =>
      one<{ r: { allowed: boolean; used: number; limit: number | null; job_id?: string } }>(
        db,
        "select public.spend_repurpose($1, $2) as r",
        [userId, limit],
      ),
    ).then((row) => row.r);

  it("lets a free creator spend exactly the weekly limit", async () => {
    const id = await createUser(db);
    const first = await spend(id, 1);
    expect(first).toMatchObject({ allowed: true, used: 1, limit: 1 });
    expect(await spend(id, 1)).toEqual({ allowed: false, used: 1, limit: 1 });

    // Each allowed spend is a real job row (what the Repurpose feature will fill in).
    const jobs = await db.query<{ id: string }>("select id from repurpose_jobs where user_id = $1", [id]);
    expect(jobs.rows).toEqual([{ id: first.job_id }]);
  });

  it("is unlimited when the limit is null (Pro)", async () => {
    const id = await createUser(db);
    for (let i = 1; i <= 4; i++) {
      expect(await spend(id, null)).toMatchObject({ allowed: true, used: i, limit: null });
    }
  });

  it("resets at the start of the creator's week, not before", async () => {
    const id = await createUser(db);
    await db.query("insert into repurpose_jobs (user_id, created_at) values ($1, public.local_week_start($1) - interval '1 minute')", [id]);
    expect(await asService(db, () => one<{ n: number }>(db, "select public.repurpose_used_this_week($1) as n", [id]))).toEqual({ n: 0 });

    await db.query("insert into repurpose_jobs (user_id, created_at) values ($1, public.local_week_start($1) + interval '1 minute')", [id]);
    expect(await asService(db, () => one<{ n: number }>(db, "select public.repurpose_used_this_week($1) as n", [id]))).toEqual({ n: 1 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("drafts", () => {
  const insertDraft = (userId: string, key: string, title = "A draft") =>
    db.query(
      "insert into drafts (user_id, client_key, title, kind, format) values ($1, $2, $3, 'post', '30-second Reel')",
      [userId, key, title],
    );

  it("upserts on the app's own id, like PostgREST on-conflict", async () => {
    const id = await createUser(db);
    await asUser(db, id, () => insertDraft(id, "jarvis-My morning reset", "First title"));
    await asUser(db, id, () =>
      db.query(
        `insert into drafts (user_id, client_key, title, kind, format)
         values ($1, 'jarvis-My morning reset', 'New title', 'post', 'Carousel')
         on conflict (user_id, client_key) do update set title = excluded.title, format = excluded.format`,
        [id],
      ),
    );
    const rows = await asUser(db, id, () => db.query<{ title: string; format: string }>("select title, format from drafts"));
    expect(rows.rows).toEqual([{ title: "New title", format: "Carousel" }]);
  });

  it("is private to its owner", async () => {
    const alice = await createUser(db);
    const bob = await createUser(db);
    await asUser(db, alice, () => insertDraft(alice, "mine"));

    expect(await asUser(db, bob, () => db.query("select * from drafts"))).toMatchObject({ rows: [] });
    // Bob can neither write as Alice, nor edit or delete her row.
    await expect(asUser(db, bob, () => insertDraft(alice, "forged"))).rejects.toThrow(/row-level security/);
    await asUser(db, bob, () => db.query("update drafts set title = 'hijacked'"));
    await asUser(db, bob, () => db.query("delete from drafts"));
    expect((await one<{ title: string }>(db, "select title from drafts where user_id = $1", [alice])).title).toBe("A draft");
  });

  it("cannot be re-assigned to another user by an update", async () => {
    const alice = await createUser(db);
    const bob = await createUser(db);
    await asUser(db, alice, () => insertDraft(alice, "mine"));
    await expect(
      asUser(db, alice, () => db.query("update drafts set user_id = $1", [bob])),
    ).rejects.toThrow(/row-level security/);
  });

  it("stops a runaway client at 500 drafts, but never blocks editing one", async () => {
    const id = await createUser(db);
    await db.query(
      `insert into drafts (user_id, client_key, title, kind, format)
       select $1, 'k' || g, 't', 'post', 'f' from generate_series(1, 500) g`,
      [id],
    );
    await expect(asUser(db, id, () => insertDraft(id, "one-too-many"))).rejects.toThrow(/row_cap_exceeded/);
    expect(await count(db, "select 1 from drafts where user_id = $1", [id])).toBe(500);

    // The app saves with "insert … on conflict do update". At the cap that must
    // still work for a draft that already exists.
    await asUser(db, id, () =>
      db.query(
        `insert into drafts (user_id, client_key, title, kind, format) values ($1, 'k7', 'Edited at the cap', 'post', 'f')
         on conflict (user_id, client_key) do update set title = excluded.title`,
        [id],
      ),
    );
    expect((await one<{ title: string }>(db, "select title from drafts where user_id = $1 and client_key = 'k7'", [id])).title).toBe(
      "Edited at the cap",
    );
  });
});

describe("saved hooks", () => {
  const save = (userId: string, line: string, style = "talking") =>
    db.query("insert into saved_hooks (user_id, line, style, idea) values ($1, $2, $3, '')", [userId, line, style]);

  it("keeps one row per (creator, line)", async () => {
    const id = await createUser(db);
    await asUser(db, id, () => save(id, "Stop scrolling if this is you"));
    await expect(asUser(db, id, () => save(id, "Stop scrolling if this is you"))).rejects.toThrow(/duplicate key/);
    // The same line is fine for a different creator.
    const other = await createUser(db);
    await asUser(db, other, () => save(other, "Stop scrolling if this is you"));
  });

  it("only accepts the four video styles", async () => {
    const id = await createUser(db);
    await expect(asUser(db, id, () => save(id, "x", "podcast"))).rejects.toThrow(/check constraint/);
  });

  it("is private to its owner", async () => {
    const alice = await createUser(db);
    const bob = await createUser(db);
    await asUser(db, alice, () => save(alice, "alice only"));
    expect((await asUser(db, bob, () => db.query("select * from saved_hooks"))).rows).toEqual([]);
  });
});

describe("profile and onboarding state", () => {
  it("lets a creator edit their own profile and onboarding fields", async () => {
    const id = await createUser(db);
    await asUser(db, id, () =>
      db.query(
        "update users set display_name = 'Amara', timezone = 'Africa/Accra', tour_done_at = now(), onboarding_completed = true where id = $1",
        [id],
      ),
    );
    const user = await one<{ display_name: string; timezone: string; tour_done_at: unknown }>(
      db,
      "select display_name, timezone, tour_done_at from users where id = $1",
      [id],
    );
    expect(user.display_name).toBe("Amara");
    expect(user.timezone).toBe("Africa/Accra");
    expect(user.tour_done_at).not.toBeNull();
  });

  describe("mark_tip_seen", () => {
    const markTip = (userId: string, key: string) =>
      asUser(db, userId, () => one<{ t: string[] }>(db, "select public.mark_tip_seen($1) as t", [key])).then((r) => r.t);

    it("records a tip once, however many times it is shown", async () => {
      const id = await createUser(db);
      expect(await markTip(id, "dashboard")).toEqual(["dashboard"]);
      expect(await markTip(id, "dashboard")).toEqual(["dashboard"]);
      expect(await markTip(id, "hook-studio")).toEqual(["dashboard", "hook-studio"]);
    });

    it("only ever touches the caller's own row", async () => {
      const alice = await createUser(db);
      const bob = await createUser(db);
      await markTip(alice, "dashboard");
      expect((await one<{ tips_seen: string[] }>(db, "select tips_seen from users where id = $1", [bob])).tips_seen).toEqual([]);
    });

    it("rejects keys that are not plain identifiers", async () => {
      const id = await createUser(db);
      await expect(markTip(id, "Bad Key!")).rejects.toThrow(/invalid_tip_key/);
    });
  });

  it("accepts the platforms the app connects", async () => {
    const id = await createUser(db);
    await asUser(db, id, () =>
      db.query(
        `insert into scheduled_posts (user_id, content, target_platforms, scheduled_at, status)
         values ($1, 'hello', '{instagram,threads,youtube,facebook}', now() + interval '1 day', 'scheduled')`,
        [id],
      ),
    );
    expect(await count(db, "select 1 from scheduled_posts where user_id = $1", [id])).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("security boundary (signed-in creator, direct database access)", () => {
  it("cannot promote themselves or lift a suspension", async () => {
    const id = await createUser(db);
    await expect(asUser(db, id, () => db.query("update users set role = 'staff_admin' where id = $1", [id]))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, id, () => db.query("update users set account_status = 'active' where id = $1", [id]))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, id, () => db.query("update users set closed_at = null where id = $1", [id]))).rejects.toThrow(/permission denied/);
  });

  it.each([
    ["credits", "insert into credits (user_id, type, amount, source) values ($1, 'earn', 1000000, 'x')"],
    ["milestones", "insert into milestones (user_id, milestone_type) values ($1, '365_day_streak')"],
    ["streak_events", "insert into streak_events (user_id, event_type, event_date) values ($1, 'check_in', current_date)"],
    ["voice_minutes_ledger", "insert into voice_minutes_ledger (user_id, type, minutes, source) values ($1, 'credit', 9999, 'x')"],
    ["voice_topups", "insert into voice_topups (user_id, minutes_purchased, amount_paid) values ($1, 9999, 0)"],
    ["payment_transactions", "insert into payment_transactions (user_id, processor, amount) values ($1, 'paystack', 1)"],
    ["analytics_events", "insert into analytics_events (user_id, event_name) values ($1, 'ai_idea_builder_used')"],
    ["repurpose_jobs", "insert into repurpose_jobs (user_id) values ($1)"],
  ])("cannot write %s directly", async (_table, sql) => {
    const id = await createUser(db);
    await expect(asUser(db, id, () => db.query(sql, [id]))).rejects.toThrow(/row-level security/);
  });

  it("cannot grant themselves a subscription (free Pro)", async () => {
    const id = await createUser(db);
    const plan = await one<{ id: string }>(db, "insert into subscription_plans (name, slug) values ('Pro', $1) returning id", [`pro-${id}`]);
    await expect(
      asUser(db, id, () =>
        db.query(
          `insert into subscriptions (user_id, plan_id, status, processor, current_period_end)
           values ($1, $2, 'active', 'stripe', now() + interval '10 years')`,
          [id, plan.id],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("cannot edit the streak cache or reset their repurpose count", async () => {
    const id = await createUser(db);
    await recordCheckIn(id);
    await asUser(db, id, () => db.query("update streak_states set current_streak = 9999"));
    expect((await one<{ current_streak: number }>(db, "select current_streak from streak_states where user_id = $1", [id])).current_streak).toBe(1);

    await db.query("insert into repurpose_jobs (user_id) values ($1)", [id]);
    await asUser(db, id, () => db.query("delete from repurpose_jobs"));
    expect(await count(db, "select 1 from repurpose_jobs where user_id = $1", [id])).toBe(1);
  });

  it("cannot call the server-only functions", async () => {
    const id = await createUser(db);
    for (const sql of [
      "select public.record_qualifying_action($1, 'check_in')",
      "select public.get_check_in_summary($1)",
      "select public.spend_repurpose($1, 1)",
      "select public.repurpose_used_this_week($1)",
      "select public.local_today($1)",
    ]) {
      await expect(asUser(db, id, () => db.query(sql, [id]))).rejects.toThrow(/permission denied/);
    }
  });

  it("cannot read OAuth tokens back, but can still connect a platform and see it", async () => {
    const id = await createUser(db);
    await asUser(db, id, () =>
      db.query(
        "insert into platform_connections (user_id, platform, platform_user_id, access_token, refresh_token) values ($1, 'linkedin', 'abc', 'secret-access', 'secret-refresh')",
        [id],
      ),
    );

    const visible = await asUser(db, id, () => db.query("select platform, platform_user_id, publish_mode from platform_connections"));
    expect(visible.rows).toEqual([{ platform: "linkedin", platform_user_id: "abc", publish_mode: "assisted" }]);

    await expect(asUser(db, id, () => db.query("select access_token from platform_connections"))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, id, () => db.query("select refresh_token from platform_connections"))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, id, () => db.query("select * from platform_connections"))).rejects.toThrow(/permission denied/);

    // The server (publisher / token refresh) still can.
    const server = await asService(db, () => one<{ access_token: string }>(db, "select access_token from platform_connections where user_id = $1", [id]));
    expect(server.access_token).toBe("secret-access");
  });

  it("can mark notifications read but not rewrite them", async () => {
    const id = await createUser(db);
    await db.query("insert into notifications (user_id, title, body) values ($1, 'Stats ready', 'Open Growth')", [id]);
    await asUser(db, id, () => db.query("update notifications set read = true"));
    await expect(asUser(db, id, () => db.query("update notifications set title = 'Win a prize'"))).rejects.toThrow(/permission denied/);
  });

  describe("messaging and squads", () => {
    it("only lets conversation participants post messages", async () => {
      const [alice, bob, mallory] = [await createUser(db), await createUser(db), await createUser(db)];
      const pa = await one<{ id: string }>(db, "insert into creator_profiles (user_id) values ($1) returning id", [alice]);
      const pb = await one<{ id: string }>(db, "insert into creator_profiles (user_id) values ($1) returning id", [bob]);
      const match = await one<{ id: string }>(db, "insert into matches (user_a_id, user_b_id, status) values ($1, $2, 'active') returning id", [pa.id, pb.id]);
      const convo = await one<{ id: string }>(db, "insert into conversations (match_id) values ($1) returning id", [match.id]);
      const send = (sender: string, text: string) =>
        asUser(db, sender, () => db.query("insert into messages (conversation_id, sender_id, content) values ($1, $2, $3)", [convo.id, sender, text]));

      await send(alice, "hi");
      await send(bob, "hello");
      await expect(send(mallory, "spam")).rejects.toThrow(/row-level security/);
    });

    it("only lets a brief's creator add tasks to it", async () => {
      const [owner, outsider] = [await createUser(db), await createUser(db)];
      const brief = await one<{ id: string }>(
        db,
        "insert into collaboration_briefs (created_by, concept) values ($1, 'A duet series') returning id",
        [owner],
      );
      const addTask = (user: string) =>
        asUser(db, user, () =>
          db.query("insert into collaboration_tasks (brief_id, assigned_to, title) values ($1, $2, 'Film the intro')", [brief.id, user]),
        );

      await addTask(owner);
      await expect(addTask(outsider)).rejects.toThrow(/row-level security/);
    });

    it("only lets a squad's creator hold the leader role", async () => {
      const [owner, joiner] = [await createUser(db), await createUser(db)];
      const squad = await one<{ id: string }>(
        db,
        "insert into squads (name, type, created_by) values ('Lagos creators', 'city', $1) returning id",
        [owner],
      );
      const join = (user: string, role: string) =>
        asUser(db, user, () => db.query("insert into squad_members (squad_id, user_id, role) values ($1, $2, $3)", [squad.id, user, role]));

      await join(joiner, "member");
      await expect(join(await createUser(db), "leader")).rejects.toThrow(/row-level security/);
      await join(owner, "leader");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("analytics_events: the server writes, the creator reads", () => {
  it("lets the service role record an event the creator can then read", async () => {
    const id = await createUser(db);
    await asService(db, () => db.query("insert into analytics_events (user_id, event_name) values ($1, 'check_in')", [id]));
    const rows = await asUser(db, id, () => db.query<{ event_name: string }>("select event_name from analytics_events"));
    expect(rows.rows).toEqual([{ event_name: "check_in" }]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// The hardening migration, proved by running each attack before and after it.
describe("RLS hardening: before and after", () => {
  const HARDENING = "20260814000021";
  const PRE_HARDENING = "20260814000020";

  const attacks: [string, (db: Db, id: string) => Promise<unknown>][] = [
    ["become staff_admin", (d, id) => asUser(d, id, () => d.query("update users set role = 'staff_admin' where id = $1", [id]))],
    ["mint credits", (d, id) => asUser(d, id, () => d.query("insert into credits (user_id, type, amount, source) values ($1, 'earn', 1000000, 'x')", [id]))],
    ["set a streak", (d, id) => asUser(d, id, () => d.query("insert into milestones (user_id, milestone_type) values ($1, '365_day_streak')", [id]))],
    [
      "read their stored social-account tokens",
      async (d, id) => {
        await d.query("insert into platform_connections (user_id, platform, access_token) values ($1, 'linkedin', 'secret')", [id]);
        return asUser(d, id, () => d.query("select access_token from platform_connections"));
      },
    ],
    [
      "grant themselves Pro",
      async (d, id) => {
        const plan = await one<{ id: string }>(d, "insert into subscription_plans (name, slug) values ('Pro', 'pro-attack') returning id");
        return asUser(d, id, () =>
          d.query(
            "insert into subscriptions (user_id, plan_id, status, processor, current_period_end) values ($1, $2, 'active', 'stripe', now() + interval '10 years')",
            [id, plan.id],
          ),
        );
      },
    ],
  ];

  it("every attack succeeds against the database as it was before the migration", async () => {
    const before = await createDatabase({ through: PRE_HARDENING });
    for (const [name, attack] of attacks) {
      const id = await createUser(before);
      await expect(attack(before, id), `attack should have worked before hardening: ${name}`).resolves.toBeDefined();
    }
  }, 120_000);

  it("every attack is refused after the migration", async () => {
    const after = await createDatabase({ through: HARDENING });
    for (const [name, attack] of attacks) {
      const id = await createUser(after);
      await expect(attack(after, id), `attack should be refused after hardening: ${name}`).rejects.toThrow(/permission denied|row-level security/);
    }
  }, 120_000);
});
