import { describe, expect, it } from "vitest";
import { V1_TABLES, count, createDatabase, one } from "./db";

// The two databases these migrations have to work on:
//   1. a brand-new one (a new dev / staging project, CI, a local Supabase), and
//   2. v1's live project, which already holds real creators, tokens, posts and
//      streaks that must all survive.
// Everything else in supabase/tests runs on (1); this file is (2), end to end.

describe("a brand-new database", () => {
  it("takes every migration, and signing up works straight away", async () => {
    const db = await createDatabase(); // no v1 tables beforehand
    const { id } = await one<{ id: string }>(db, "insert into auth.users (email) values ('first@example.com') returning id");

    expect(await count(db, "select 1 from users where id = $1", [id])).toBe(1);
    // the empty v1 tables the first migration created are locked down
    const locked = await db.query<{ relname: string; relrowsecurity: boolean }>(
      "select relname, relrowsecurity from pg_class where relname in ('user_plans','user_streaks','user_tokens','posts') and relkind = 'r' order by relname",
    );
    expect(locked.rows.map((r) => r.relrowsecurity)).toEqual([true, true, true, true]);
  }, 120_000);
});

describe("v1's live database", () => {
  const alice = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const bob = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  it("is adopted in place: every creator, token, post and streak carries over", async () => {
    const db = await createDatabase({
      beforeMigrations: async (d) => {
        await d.exec(V1_TABLES);
        await d.query(
          `insert into auth.users (id, email, raw_user_meta_data) values
             ($1, 'alice@example.com', '{"full_name":"Alice"}'),
             ($2, 'bob@example.com', '{}')`,
          [alice, bob],
        );
        await d.query(
          `insert into user_tokens (user_id, platform, access_token, refresh_token, expires_at) values
             ($1, 'x',        'x-access',  'x-refresh', now() + interval '1 day'),
             ($1, 'linkedin', 'li-access', null,        null)`,
          [alice],
        );
        await d.query(
          `insert into posts (user_id, content, platform, scheduled_at, posted_at, status, tweet_url, is_thread)
           values ($1, 'hello from v1', 'x', null, now() - interval '2 days', 'published', 'https://x.com/a/1', false)`,
          [alice],
        );
        await d.query(
          "insert into user_streaks (user_id, current_streak, longest_streak, last_post_date) values ($1, 4, 9, current_date - 1)",
          [alice],
        );
      },
    });

    // Creators with accounts before the signup trigger existed get a profile row.
    const users = await db.query<{ email: string; display_name: string | null }>("select email, display_name from users order by email");
    expect(users.rows).toEqual([
      { email: "alice@example.com", display_name: "Alice" },
      { email: "bob@example.com", display_name: null },
    ]);

    // Tokens move across; v1 called X "x", this schema calls it "twitter".
    const connections = await db.query<{ platform: string; access_token: string }>(
      "select platform, access_token from platform_connections where user_id = $1 order by platform",
      [alice],
    );
    expect(connections.rows).toEqual([
      { platform: "linkedin", access_token: "li-access" },
      { platform: "twitter", access_token: "x-access" },
    ]);

    // A post that was published immediately (no scheduled time) keeps its date.
    const posts = await db.query<{ content: string; status: string; target_platforms: string[]; has_time: boolean }>(
      "select content, status::text as status, target_platforms::text[] as target_platforms, scheduled_at is not null as has_time from scheduled_posts",
    );
    expect(posts.rows).toEqual([{ content: "hello from v1", status: "published", target_platforms: ["twitter"], has_time: true }]);

    // The streak carries over, and Phase 1 turns it into the check-in log so it keeps counting.
    expect((await one<{ current_streak: number; longest_streak: number }>(db, "select current_streak, longest_streak from streak_states where user_id = $1", [alice]))).toEqual({
      current_streak: 4,
      longest_streak: 9,
    });
    expect(await count(db, "select 1 from streak_events where user_id = $1", [alice])).toBe(4);
    const summary = await one<{ s: { currentDays: number } }>(db, "select public.get_check_in_summary($1) as s", [alice]);
    expect(summary.s.currentDays).toBe(4);

    // v1's own tables are left exactly as they were.
    expect(await count(db, "select 1 from user_tokens")).toBe(2);
    expect(await count(db, "select 1 from posts")).toBe(1);
  }, 120_000);
});
