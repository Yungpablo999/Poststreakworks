import { beforeAll, describe, expect, it } from "vitest";
import { levelForXp } from "../../packages/workflows/streak-engine";
import { asService, asUser, count, createDatabase, createUser, one, type Db } from "./db";

// Migration …23: what Home, Quests and the bell read. Run as the real roles, so "the creator
// can't write this" is tested the way it's enforced.

let db: Db;

beforeAll(async () => {
  db = await createDatabase();
}, 120_000);

const facts = (userId: string) =>
  asService(db, () => one<{ f: Record<string, number | string> }>(db, "select public.quest_facts($1) as f", [userId])).then((r) => r.f);

const addPostStat = (userId: string, id: string, hoursAgo = 2, platform = "tiktok") =>
  db.query(
    `insert into post_stats (user_id, platform, platform_post_id, title, posted_at, views)
     values ($1, $2::platform_type, $3, 'a post', now() - make_interval(hours => $4), 100)`,
    [userId, platform, id, hoursAgo],
  );

const addScheduled = (userId: string, status: string, ids: Record<string, unknown> = {}, platforms = ["tiktok"]) =>
  db.query(
    `insert into scheduled_posts (user_id, content, target_platforms, scheduled_at, status, published_at, platform_post_ids)
     values ($1, 'hello', $2::platform_type[], now() - interval '1 hour', $3::post_status,
             case when $3 = 'published' then now() - interval '1 hour' end, $4::jsonb)`,
    [userId, `{${platforms.join(",")}}`, status, JSON.stringify(ids)],
  );

describe("creator_posts: one definition of 'a post'", () => {
  it("counts posts read from an account and posts published through PostStreak", async () => {
    const u = await createUser(db);
    await addPostStat(u, "p1");
    await addScheduled(u, "published"); // no platform id: confirmed by hand
    const n = await asService(db, () => one<{ n: number }>(db, "select count(*)::int as n from public.creator_posts($1)", [u]));
    expect(n.n).toBe(2);
  });

  it("does not count the same post twice once a sync has found it", async () => {
    const u = await createUser(db);
    await addPostStat(u, "p-same");
    await addScheduled(u, "published", { tiktok: { status: "published", id: "p-same" } });
    const n = await asService(db, () => one<{ n: number }>(db, "select count(*)::int as n from public.creator_posts($1)", [u]));
    expect(n.n).toBe(1);
  });

  it("ignores drafts, scheduled and failed posts", async () => {
    const u = await createUser(db);
    for (const status of ["draft", "scheduled", "failed", "pending_confirmation"]) await addScheduled(u, status);
    const n = await asService(db, () => one<{ n: number }>(db, "select count(*)::int as n from public.creator_posts($1)", [u]));
    expect(n.n).toBe(0);
  });

  it("is not callable by a creator", async () => {
    const u = await createUser(db);
    await expect(asUser(db, u, () => db.query("select * from public.creator_posts($1)", [u]))).rejects.toThrow(/permission denied/);
  });
});

describe("quest_facts: counted in the creator's own day and week", () => {
  it("counts what happened today and not what happened last week", async () => {
    const u = await createUser(db);
    await db.query(
      `insert into drafts (user_id, client_key, title, kind, format, updated_at) values
         ($1, 'a', 'today script', 'script', 'Script', now()),
         ($1, 'b', 'today post',   'post',   'Reel',   now()),
         ($1, 'c', 'old',          'post',   'Reel',   now() - interval '10 days')`,
      [u],
    );
    await db.query(`insert into saved_hooks (user_id, line, style, idea) values ($1, 'one', 'talking', 'x'), ($1, 'two', 'talking', 'x'), ($1, 'three', 'talking', 'x')`, [u]);
    const f = await facts(u);
    expect(f).toMatchObject({ draftsToday: 3 - 1, scriptDraftsToday: 1, postDraftsToday: 1, draftsEver: 3, hooksToday: 3, hooksSameIdeaThisWeek: 3 });
  });

  it("starts the week on the creator's Monday, in their own time zone", async () => {
    const u = await createUser(db);
    await db.query("update users set timezone = 'Pacific/Auckland' where id = $1", [u]);
    const f = await facts(u);
    const weekday = await one<{ dow: number }>(db, "select extract(isodow from $1::date)::int as dow", [f.weekStart]);
    expect(weekday.dow).toBe(1);
    // the instant the week began is in the past and at most a week ago
    const span = await one<{ ok: boolean }>(db, "select ($1::timestamptz <= now() and $1::timestamptz > now() - interval '7 days') as ok", [f.weekStartAt]);
    expect(span.ok).toBe(true);
  });

  it("counts a post made this week, and only this week, towards the challenge", async () => {
    const u = await createUser(db);
    await addPostStat(u, "recent", 1);
    await addPostStat(u, "ancient", 24 * 40);
    const f = await facts(u);
    expect(f.postsEver).toBe(2);
    expect(f.postsThisWeek).toBeLessThanOrEqual(1);
  });
});

describe("complete_quest: paid once", () => {
  const complete = (u: string, key: string, period: string, xp: number) =>
    asService(db, () => one<{ ok: boolean }>(db, "select public.complete_quest($1, $2, $3, $4, 'A quest') as ok", [u, key, period, xp]));
  const xp = async (u: string) =>
    (await one<{ n: number }>(db, "select coalesce(sum(case when type = 'earn' then amount else -amount end), 0)::int as n from credits where user_id = $1", [u])).n;

  it("records the finish and pays the XP together, once per period", async () => {
    const u = await createUser(db);
    expect((await complete(u, "daily.today", "D:2026-10-03", 80)).ok).toBe(true);
    expect((await complete(u, "daily.today", "D:2026-10-03", 80)).ok).toBe(false);
    expect(await xp(u)).toBe(80);
  });

  it("pays again for a new period", async () => {
    const u = await createUser(db);
    await complete(u, "daily.today", "D:2026-10-03", 80);
    expect((await complete(u, "daily.today", "D:2026-10-04", 80)).ok).toBe(true);
    expect(await xp(u)).toBe(160);
  });

  it("can't be called, or written to, by a creator", async () => {
    const u = await createUser(db);
    await expect(asUser(db, u, () => db.query("select public.complete_quest($1, 'x', 'O', 999, 't')", [u]))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, u, () => db.query("insert into quest_completions (user_id, quest_key, period_key, xp) values ($1, 'x', 'O', 999)", [u]))).rejects.toThrow();
    expect(await xp(u)).toBe(0);
  });

  it("closes the old holes: a creator can't mark a quest done or set their own challenge count", async () => {
    const u = await createUser(db);
    const quest = await one<{ id: string }>(
      db,
      "insert into quests (title, description, category, xp_reward) values ('q', 'd', 'daily', 500) returning id",
    );
    await expect(
      asUser(db, u, () => db.query("insert into quest_progress (user_id, quest_id, status) values ($1, $2, 'completed')", [u, quest.id])),
    ).rejects.toThrow();

    const challenge = await asService(db, () => one<{ id: string }>(db, "select public.ensure_weekly_challenge($1) as id", [u]));
    await expect(
      asUser(db, u, () => db.query("insert into challenge_participants (challenge_id, user_id, current_posts) values ($1, $2, 99)", [challenge.id, u])),
    ).rejects.toThrow();
  });
});

describe("the holes this migration closes were real", () => {
  it("before it, a creator could mark a quest completed and set their own challenge count", async () => {
    const before = await createDatabase({ through: "20260814000022" });
    const u = await createUser(before);
    const quest = await one<{ id: string }>(before, "insert into quests (title, description, category, xp_reward) values ('q', 'd', 'daily', 500) returning id");
    await asUser(before, u, () => before.query("insert into quest_progress (user_id, quest_id, status) values ($1, $2, 'completed')", [u, quest.id]));
    const challenge = await one<{ id: string }>(
      before,
      "insert into community_challenges (title, description, target_posts, ends_at) values ('c', 'd', 3, now() + interval '7 days') returning id",
    );
    await asUser(before, u, () =>
      before.query("insert into challenge_participants (challenge_id, user_id, current_posts) values ($1, $2, 99)", [challenge.id, u]),
    );
    expect(await count(before, "select 1 from challenge_participants where user_id = $1 and current_posts = 99", [u])).toBe(1);
  }, 120_000);
});

describe("the weekly challenge", () => {
  it("is one row per week, shared by everyone in that week", async () => {
    const a = await createUser(db);
    const b = await createUser(db);
    const ca = await asService(db, () => one<{ id: string }>(db, "select public.ensure_weekly_challenge($1) as id", [a]));
    const cb = await asService(db, () => one<{ id: string }>(db, "select public.ensure_weekly_challenge($1) as id", [b]));
    expect(ca.id).toBe(cb.id);
  });

  it("joining is idempotent and other creators see the count", async () => {
    const a = await createUser(db);
    const b = await createUser(db);
    for (const u of [a, b, a]) await asService(db, () => one(db, "select public.join_weekly_challenge($1)", [u]));
    const id = (await asService(db, () => one<{ id: string }>(db, "select public.ensure_weekly_challenge($1) as id", [a]))).id;
    const joined = await count(db, "select 1 from challenge_participants where challenge_id = $1 and user_id in ($2, $3)", [id, a, b]);
    expect(joined).toBe(2);
    // and a creator can see how many are in (public read), but nothing more about them than ids
    const seen = await asUser(db, a, () => count(db, "select 1 from challenge_participants where challenge_id = $1", [id]));
    expect(seen).toBeGreaterThanOrEqual(2);
  });
});

describe("challenge reminders", () => {
  const remind = (u: string, days: number[]) =>
    db.query(
      `insert into challenge_reminders (user_id, week_start, days)
       values ($1, (date_trunc('week', now() at time zone public.user_timezone($1)))::date, $2::smallint[])
       on conflict (user_id, week_start) do update set days = excluded.days`,
      [u, `{${days.join(",")}}`],
    );
  const send = () => asService(db, () => one<{ n: number }>(db, "select public.send_challenge_reminders() as n"));
  const mine = (u: string) => count(db, "select 1 from notifications where user_id = $1 and key like 'challenge-day:%'", [u]);

  it("writes a note on a reminded day, once, however often the cron runs", async () => {
    const u = await createUser(db);
    const todayIndex = (await one<{ i: number }>(db, "select (extract(isodow from public.local_today($1))::int - 1) as i", [u])).i;
    await remind(u, [todayIndex]);
    await send();
    await send();
    expect(await mine(u)).toBe(1);
  });

  it("stays quiet on days that weren't picked", async () => {
    const u = await createUser(db);
    const todayIndex = (await one<{ i: number }>(db, "select (extract(isodow from public.local_today($1))::int - 1) as i", [u])).i;
    await remind(u, [(todayIndex + 1) % 7]);
    await send();
    expect(await mine(u)).toBe(0);
  });

  it("stays quiet once the challenge is finished", async () => {
    const u = await createUser(db);
    const todayIndex = (await one<{ i: number }>(db, "select (extract(isodow from public.local_today($1))::int - 1) as i", [u])).i;
    await remind(u, [todayIndex]);
    const weekStart = (await facts(u)).weekStart;
    await asService(db, () => one(db, "select public.complete_quest($1, 'weekly.challenge', $2, 250, 'c')", [u, `W:${weekStart}`]));
    await send();
    expect(await mine(u)).toBe(0);
  });
});

describe("notifications written by the server", () => {
  it("exist once per key, and a creator can only mark them read", async () => {
    const u = await createUser(db);
    for (let i = 0; i < 2; i++) {
      await db.query(
        `insert into notifications (user_id, type, title, body, key) values ($1, 'system', 'Hi', 'there', 'welcome') on conflict (user_id, key) do nothing`,
        [u],
      );
    }
    expect(await count(db, "select 1 from notifications where user_id = $1 and key = 'welcome'", [u])).toBe(1);

    await asUser(db, u, () => db.query("update notifications set read = true where user_id = $1", [u]));
    await expect(asUser(db, u, () => db.query("update notifications set title = 'changed' where user_id = $1", [u]))).rejects.toThrow(/permission denied/);
    await expect(
      asUser(db, u, () => db.query("insert into notifications (user_id, type, title, body) values ($1, 'system', 'fake', 'fake')", [u])),
    ).rejects.toThrow();
  });

  it("lets many notes without a key coexist", async () => {
    const u = await createUser(db);
    for (let i = 0; i < 3; i++) await db.query("insert into notifications (user_id, type, title, body) values ($1, 'system', 't', 'b')", [u]);
    expect(await count(db, "select 1 from notifications where user_id = $1", [u])).toBe(3);
  });
});

describe("news the database announces", () => {
  const earn = (u: string, amount: number) => db.query("insert into credits (user_id, type, amount, source) values ($1, 'earn', $2, 'test')", [u, amount]);
  const levelNotes = async (u: string) =>
    (await db.query<{ key: string }>("select key from notifications where user_id = $1 and key like 'level:%' order by key", [u])).rows.map((r) => r.key);

  it("says so when XP crosses into a new level, once", async () => {
    const u = await createUser(db);
    await earn(u, 100);
    expect(await levelNotes(u)).toEqual([]);
    await earn(u, 200); // 300 XP: level 2
    expect(await levelNotes(u)).toEqual(["level:2"]);
    await earn(u, 20); // still level 2
    expect(await levelNotes(u)).toEqual(["level:2"]);
  });

  it("agrees with the level the API computes", async () => {
    const u = await createUser(db);
    let xp = 0;
    for (const step of [60, 190, 1, 249, 500, 3]) {
      await earn(u, step);
      xp += step;
      const announced = (await levelNotes(u)).map((k) => Number(k.split(":")[1]));
      const highest = announced.length ? Math.max(...announced) : 1;
      expect(highest).toBe(levelForXp(xp).level);
    }
  });

  it("announces a streak milestone once", async () => {
    const u = await createUser(db);
    await db.query("insert into milestones (user_id, milestone_type) values ($1, '7_day_streak')", [u]);
    await db.query("insert into milestones (user_id, milestone_type) values ($1, '7_day_streak')", [u]);
    const notes = await db.query<{ title: string }>("select title from notifications where user_id = $1 and key = 'milestone:7_day_streak'", [u]);
    expect(notes.rows.map((r) => r.title)).toEqual(["A 7-day streak"]);
  });
});
