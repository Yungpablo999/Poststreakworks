import { describe, expect, it } from "vitest";
import { applyRemaining, count, createDatabase, createUser, one } from "./db";

// The live Supabase project is v1's database and already holds real creators.
// A migration that only works on an empty database is a migration that fails
// in production, so this seeds the shapes that actually exist there, applies
// the Phase 1 migrations on top, and checks nothing is lost or double counted.

const BEFORE_PHASE1 = "20260814000018";

describe("upgrading a database that already has creators", () => {
  it("carries existing streaks into the check-in log, removes duplicate days, and enforces one day per creator", async () => {
    const db = await createDatabase({ through: BEFORE_PHASE1 });

    const withStreak = await createUser(db); // a v1 creator on a 3-day streak, last active yesterday
    const withDuplicates = await createUser(db); // the old read-then-insert race left two rows for one day
    const noStreak = await createUser(db);
    const noLastDay = await createUser(db);
    const absurd = await createUser(db);

    await db.query(
      `insert into streak_states (user_id, current_streak, longest_streak, last_qualifying_day) values
         ($1, 3, 9, current_date - 1),
         ($2, 0, 0, null),
         ($3, 5, 5, null),
         ($4, 5000, 5000, current_date - 1)`,
      [withStreak, noStreak, noLastDay, absurd],
    );
    await db.query(
      `insert into streak_events (user_id, event_type, event_date, created_at) values
         ($1, 'publish',            current_date - 1, now() - interval '2 hours'),
         ($1, 'mission_completion', current_date - 1, now() - interval '1 hour')`,
      [withDuplicates],
    );

    await applyRemaining(db, BEFORE_PHASE1);

    // The 3-day streak became three check-ins on the three days it covered.
    const days = await db.query<{ d: string }>(
      "select event_date::text as d from streak_events where user_id = $1 order by event_date",
      [withStreak],
    );
    const expected = await db.query<{ d: string }>(
      "select (current_date - g)::text as d from generate_series(3, 1, -1) g",
    );
    expect(days.rows).toEqual(expected.rows);
    const flagged = await one<{ n: number }>(
      db,
      "select count(*)::int as n from streak_events where user_id = $1 and metadata ->> 'backfilled' = 'true'",
      [withStreak],
    );
    expect(flagged.n).toBe(3);

    // Duplicates collapsed to the earliest row.
    const remaining = await db.query<{ event_type: string }>("select event_type from streak_events where user_id = $1", [withDuplicates]);
    expect(remaining.rows).toEqual([{ event_type: "publish" }]);

    // Nothing invented for a zero streak, a streak with no last day, or an implausible one.
    for (const id of [noStreak, noLastDay, absurd]) {
      expect(await count(db, "select 1 from streak_events where user_id = $1", [id])).toBe(0);
    }

    // The database now enforces one qualifying day per creator.
    await expect(
      db.query("insert into streak_events (user_id, event_type, event_date) values ($1, 'check_in', current_date - 1)", [withStreak]),
    ).rejects.toThrow(/duplicate key|uq_streak_events_user_day/);
  }, 120_000);

  it("is safe to run when the Phase 1 backfill finds nothing to do", async () => {
    const db = await createDatabase({ through: BEFORE_PHASE1 });
    await applyRemaining(db, BEFORE_PHASE1);
    expect(await count(db, "select 1 from streak_events")).toBe(0);
  }, 120_000);
});
