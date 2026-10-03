import { beforeAll, describe, expect, it } from "vitest";
import { applyRemaining, asService, asUser, count, createDatabase, createUser, one, type Db } from "./db";

// Migration …25: a creator's posts are written by the server only. Run as the real roles, so
// "a creator can't write this" is tested the way it is enforced.

let db: Db;

beforeAll(async () => {
  db = await createDatabase();
}, 120_000);

type Steps = Record<string, Record<string, unknown>>;

/** A post as the server writes it. `minutes` is how far from now it is due (negative = already due). */
async function addPost(
  userId: string,
  o: { platforms?: string[]; status?: string; minutes?: number; content?: string; steps?: Steps } = {},
): Promise<string> {
  const { platforms = ["tiktok"], status = "scheduled", minutes = -5, content = "Hello world", steps = {} } = o;
  const row = await one<{ id: string }>(
    db,
    `insert into scheduled_posts (user_id, content, target_platforms, scheduled_at, status, platform_post_ids)
     values ($1, $2, $3::platform_type[], now() + make_interval(mins => $4), $5::post_status, $6::jsonb)
     returning id`,
    [userId, content, `{${platforms.join(",")}}`, minutes, status, JSON.stringify(steps)],
  );
  return row.id;
}

const release = (now?: string) =>
  asService(db, () => one<{ n: number }>(db, "select public.release_due_posts($1::timestamptz) as n", [now ?? new Date().toISOString()])).then((r) => r.n);

type ConfirmResult = { result: string; allPosted?: boolean; status?: string };
const confirm = (userId: string, postId: string, platform: string, url: string | null = null, now?: string) =>
  asService(db, () =>
    one<{ r: ConfirmResult }>(db, "select public.confirm_post_platform($1, $2, $3::platform_type, $4, $5::timestamptz) as r", [
      userId,
      postId,
      platform,
      url,
      now ?? new Date().toISOString(),
    ]),
  ).then((r) => r.r);

const getPost = (id: string) =>
  one<{ status: string; published_at: Date | null; platform_post_ids: Steps; error: string | null }>(
    db,
    "select status::text as status, published_at, platform_post_ids, error from scheduled_posts where id = $1",
    [id],
  );

const postsMade = (userId: string) =>
  asService(db, () => one<{ n: number }>(db, "select count(*)::int as n from public.creator_posts($1)", [userId])).then((r) => r.n);

const addSynced = (userId: string, platform: string, id: string, minutesFromNow: number) =>
  db.query(
    `insert into post_stats (user_id, platform, platform_post_id, title, posted_at, views)
     values ($1, $2::platform_type, $3, 'a post', now() + make_interval(mins => $4), 10)`,
    [userId, platform, id, minutesFromNow],
  );

// ─────────────────────────────────────────────────────────────────────────────
describe("who may write a post", () => {
  it("lets a creator read their own posts and nobody else's", async () => {
    const [a, b] = [await createUser(db), await createUser(db)];
    await addPost(a, { content: "mine" });
    await addPost(b, { content: "theirs" });
    const seen = await asUser(db, a, () => db.query<{ content: string }>("select content from scheduled_posts"));
    expect(seen.rows).toEqual([{ content: "mine" }]);
  });

  it("will not let a creator create, edit or delete a post themselves", async () => {
    const id = await createUser(db);
    // Inventing a post that was "published", which would count towards quests, the challenge and the streak
    await expect(
      asUser(db, id, () =>
        db.query(
          `insert into scheduled_posts (user_id, content, target_platforms, scheduled_at, status, published_at)
           values ($1, 'never happened', '{tiktok}', now(), 'published', now())`,
          [id],
        ),
      ),
    ).rejects.toThrow(/permission denied/);

    const post = await addPost(id, { status: "scheduled", minutes: 60 });
    await expect(asUser(db, id, () => db.query("update scheduled_posts set status = 'published', published_at = now() where id = $1", [post]))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, id, () => db.query("update scheduled_posts set content = 'edited' where id = $1", [post]))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, id, () => db.query("delete from scheduled_posts where id = $1", [post]))).rejects.toThrow(/permission denied/);

    expect((await getPost(post)).status).toBe("scheduled");
    expect(await postsMade(id)).toBe(0);
  });

  it("closes the hole that let a creator mint a post (upgrade from migration …24)", async () => {
    const old = await createDatabase({ through: "20260814000024" });
    const u = await createUser(old);
    const mint = () =>
      asUser(old, u, () =>
        old.query(
          `insert into scheduled_posts (user_id, content, target_platforms, scheduled_at, status, published_at)
           values ($1, 'never happened', '{tiktok}', now(), 'published', now())`,
          [u],
        ),
      );
    const made = () => asService(old, () => one<{ n: number }>(old, "select count(*)::int as n from public.creator_posts($1)", [u])).then((r) => r.n);

    await mint(); // before: accepted, and it counts as a post made
    expect(await made()).toBe(1);

    await applyRemaining(old, "20260814000024");
    await expect(mint()).rejects.toThrow(/permission denied/);
  }, 120_000);
});

// ─────────────────────────────────────────────────────────────────────────────
describe("release_due_posts: a scheduled post whose time has come is ready to post", () => {
  it("releases what is due, on each of the five platforms, and leaves the rest", async () => {
    const u = await createUser(db);
    const due = await addPost(u, { platforms: ["tiktok", "instagram"], minutes: -1 });
    const later = await addPost(u, { minutes: 60 });
    const draft = await addPost(u, { status: "draft", minutes: -10 });
    const done = await addPost(u, { status: "published", minutes: -10 });
    const older = await addPost(u, { platforms: ["linkedin"], minutes: -10 }); // the publisher in packages/jobs owns this one

    expect(await release()).toBeGreaterThanOrEqual(1);

    const released = await getPost(due);
    expect(released.status).toBe("pending_confirmation");
    expect(released.platform_post_ids).toEqual({ tiktok: { status: "pending_confirmation" }, instagram: { status: "pending_confirmation" } });
    expect((await getPost(later)).status).toBe("scheduled");
    expect((await getPost(draft)).status).toBe("draft");
    expect((await getPost(done)).status).toBe("published");
    expect((await getPost(older)).status).toBe("scheduled");
  });

  it.each(["tiktok", "instagram", "youtube", "threads", "facebook"])("is ready on %s", async (platform) => {
    const u = await createUser(db);
    const p = await addPost(u, { platforms: [platform] });
    await release();
    expect((await getPost(p)).status).toBe("pending_confirmation");
  });

  it("is idempotent: a second run releases nothing and writes no second note", async () => {
    const u = await createUser(db);
    await addPost(u, { content: "Only once" });
    await release();
    const again = await release();
    expect(again).toBe(0);
    expect(await count(db, "select 1 from notifications where user_id = $1", [u])).toBe(1);
  });

  it("tells the creator once, in words that name the post and where to post it", async () => {
    const u = await createUser(db);
    const one1 = await addPost(u, { platforms: ["tiktok"], content: "My morning reset\nsecond line that is not shown" });
    const many = await addPost(u, { platforms: ["tiktok", "instagram", "youtube"], content: "Three at once" });
    await release();

    const notes = await db.query<{ title: string; body: string; action_text: string; key: string; type: string; metadata: Record<string, unknown> }>(
      "select title, body, action_text, key, type::text as type, metadata from notifications where user_id = $1 order by key",
      [u],
    );
    const byPost = Object.fromEntries(notes.rows.map((n) => [n.key.split(":")[1], n]));
    expect(notes.rows).toHaveLength(2);

    expect(byPost[one1]).toMatchObject({
      title: "Time to post",
      body: 'Your TikTok post "My morning reset" is ready. Open it to copy the caption and post.',
      action_text: "Open post",
      type: "system",
      metadata: { kind: "clock", target: "schedule", postId: one1 },
    });
    expect(byPost[many]!.body).toBe('Your post "Three at once" is ready for TikTok, Instagram and YouTube. Open it to copy the caption and post.');
  });

  it("reminds again when a post is moved to a later time and comes due again", async () => {
    const u = await createUser(db);
    const p = await addPost(u, { content: "Remind me later" });
    await release();
    expect(await count(db, "select 1 from notifications where user_id = $1", [u])).toBe(1);

    // "Not now": the server moves it to a new time (workflows/posts.ts)
    await db.query(
      "update scheduled_posts set status = 'scheduled', scheduled_at = now() + interval '1 hour', platform_post_ids = '{}' where id = $1",
      [p],
    );
    await release(new Date(Date.now() + 2 * 3600_000).toISOString());
    expect((await getPost(p)).status).toBe("pending_confirmation");
    const keys = await db.query<{ key: string }>("select key from notifications where user_id = $1 order by created_at", [u]);
    expect(keys.rows).toHaveLength(2);
    expect(new Set(keys.rows.map((k) => k.key)).size).toBe(2);
  });

  it("shortens a long first line", async () => {
    const u = await createUser(db);
    await addPost(u, { content: "x".repeat(100) });
    await release();
    const note = await one<{ body: string }>(db, "select body from notifications where user_id = $1", [u]);
    expect(note.body).toBe(`Your TikTok post "${"x".repeat(59)}..." is ready. Open it to copy the caption and post.`);
  });

  it("keeps a platform the creator already posted to early, and does not name it", async () => {
    const u = await createUser(db);
    const p = await addPost(u, {
      platforms: ["tiktok", "instagram"],
      steps: { tiktok: { status: "published", at: "2026-10-03T08:00:00Z" } },
    });
    await release();
    const row = await getPost(p);
    expect(row.status).toBe("pending_confirmation");
    expect(row.platform_post_ids).toEqual({
      tiktok: { status: "published", at: "2026-10-03T08:00:00Z" },
      instagram: { status: "pending_confirmation" },
    });
    const note = await one<{ body: string }>(db, "select body from notifications where user_id = $1", [u]);
    expect(note.body).toBe('Your Instagram post "Hello world" is ready. Open it to copy the caption and post.');
  });

  it("can be told what time it is, so a test (or a catch-up) is exact", async () => {
    const u = await createUser(db);
    // (other tests share this database, so look at this post, not at how many were released)
    const p = await addPost(u, { minutes: 1000 });
    await release(new Date(Date.now() + 500 * 60_000).toISOString());
    expect((await getPost(p)).status).toBe("scheduled");
    await release(new Date(Date.now() + 1100 * 60_000).toISOString());
    expect((await getPost(p)).status).toBe("pending_confirmation");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("confirm_post_platform: 'I posted it'", () => {
  it("posts a single-platform post and keeps the link and the time", async () => {
    const u = await createUser(db);
    const p = await addPost(u, { status: "pending_confirmation", steps: { tiktok: { status: "pending_confirmation" } } });
    const r = await confirm(u, p, "tiktok", "https://www.tiktok.com/@amara/video/1", "2026-10-03T10:00:00Z");
    expect(r).toEqual({ result: "ok", allPosted: true });

    const row = await getPost(p);
    expect(row.status).toBe("published");
    expect(row.published_at?.toISOString()).toBe("2026-10-03T10:00:00.000Z");
    expect(row.platform_post_ids).toEqual({ tiktok: { status: "published", url: "https://www.tiktok.com/@amara/video/1", at: "2026-10-03T10:00:00Z" } });
    expect(await postsMade(u)).toBe(1);
  });

  it("waits for every platform before the post is posted, and counts each one as it is", async () => {
    const u = await createUser(db);
    const p = await addPost(u, {
      platforms: ["tiktok", "instagram"],
      status: "pending_confirmation",
      steps: { tiktok: { status: "pending_confirmation" }, instagram: { status: "pending_confirmation" } },
    });
    expect(await confirm(u, p, "tiktok")).toEqual({ result: "ok", allPosted: false });
    expect((await getPost(p)).status).toBe("pending_confirmation");
    expect(await postsMade(u)).toBe(1); // TikTok is a post made even though Instagram is not yet

    expect(await confirm(u, p, "instagram")).toEqual({ result: "ok", allPosted: true });
    expect((await getPost(p)).status).toBe("published");
    expect(await postsMade(u)).toBe(2);
  });

  it("is idempotent: the same platform twice changes nothing", async () => {
    const u = await createUser(db);
    const p = await addPost(u, { platforms: ["tiktok", "instagram"], status: "pending_confirmation" });
    await confirm(u, p, "tiktok", "https://www.tiktok.com/@a/video/1", "2026-10-03T10:00:00Z");
    const again = await confirm(u, p, "tiktok", "https://www.tiktok.com/@a/video/2", "2026-10-03T11:00:00Z");
    expect(again).toEqual({ result: "already_posted", allPosted: false });
    expect((await getPost(p)).platform_post_ids.tiktok).toEqual({ status: "published", url: "https://www.tiktok.com/@a/video/1", at: "2026-10-03T10:00:00Z" });
    expect(await postsMade(u)).toBe(1);
  });

  it("will not confirm someone else's post, a platform it was not meant for, or one that is not open", async () => {
    const [u, other] = [await createUser(db), await createUser(db)];
    const p = await addPost(u, { status: "pending_confirmation" });
    expect(await confirm(other, p, "tiktok")).toEqual({ result: "not_found" });
    expect(await confirm(u, p, "youtube")).toEqual({ result: "wrong_platform" });
    expect((await getPost(p)).status).toBe("pending_confirmation");

    for (const status of ["draft", "failed", "publishing"]) {
      const closed = await addPost(u, { status });
      expect(await confirm(u, closed, "tiktok")).toEqual({ result: "not_open", status });
    }
    expect(await postsMade(u)).toBe(0);
  });

  it("accepts a creator who posted early: it is theirs to confirm before the time comes", async () => {
    const u = await createUser(db);
    const p = await addPost(u, { platforms: ["tiktok", "instagram"], minutes: 120 });
    expect(await confirm(u, p, "tiktok")).toEqual({ result: "ok", allPosted: false });
    expect((await getPost(p)).status).toBe("scheduled");

    const q = await addPost(u, { minutes: 120 });
    expect(await confirm(u, q, "tiktok")).toEqual({ result: "ok", allPosted: true });
    expect((await getPost(q)).status).toBe("published");
  });

  it("clears a failure note once the creator has posted", async () => {
    const u = await createUser(db);
    const p = await addPost(u, { status: "pending_confirmation" });
    await db.query("update scheduled_posts set error = 'earlier problem' where id = $1", [p]);
    await confirm(u, p, "tiktok");
    expect((await getPost(p)).error).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("one post, not two: confirmed by hand, then found by a sync", () => {
  const confirmed = (u: string, platform = "tiktok") =>
    addPost(u, { platforms: [platform], status: "pending_confirmation" });

  it("links a post the sync finds to the one the creator confirmed", async () => {
    const u = await createUser(db);
    const p = await confirmed(u);
    await confirm(u, p, "tiktok");
    expect(await postsMade(u)).toBe(1);

    await addSynced(u, "tiktok", "7001", 20); // the platform's own record, a few minutes after they said they posted
    expect((await getPost(p)).platform_post_ids.tiktok).toMatchObject({ status: "published", id: "7001" });
    expect(await postsMade(u)).toBe(1); // still one post
  });

  it("links when the sync ran before the creator confirmed", async () => {
    const u = await createUser(db);
    const p = await confirmed(u);
    await addSynced(u, "tiktok", "7002", -30);
    await confirm(u, p, "tiktok");
    expect((await getPost(p)).platform_post_ids.tiktok).toMatchObject({ id: "7002" });
    expect(await postsMade(u)).toBe(1);
  });

  it("does not link a post made many hours away: those are two posts", async () => {
    const u = await createUser(db);
    const p = await confirmed(u);
    await confirm(u, p, "tiktok");
    await addSynced(u, "tiktok", "7003", 60 * 12);
    expect((await getPost(p)).platform_post_ids.tiktok).not.toHaveProperty("id");
    expect(await postsMade(u)).toBe(2);
  });

  it("does not link across platforms or across creators", async () => {
    const [u, other] = [await createUser(db), await createUser(db)];
    const p = await confirmed(u);
    await confirm(u, p, "tiktok");
    await addSynced(u, "instagram", "7004", 5);
    await addSynced(other, "tiktok", "7005", 5);
    expect((await getPost(p)).platform_post_ids.tiktok).not.toHaveProperty("id");
  });

  it("links each post once, to the nearest, however many are found", async () => {
    const u = await createUser(db);
    const first = await confirmed(u);
    const second = await confirmed(u);
    await confirm(u, first, "tiktok", null, new Date(Date.now() - 60 * 60_000).toISOString());
    await confirm(u, second, "tiktok", null, new Date().toISOString());

    await addSynced(u, "tiktok", "A", 1); // closest to `second`
    await addSynced(u, "tiktok", "B", -58); // closest to `first`
    expect((await getPost(first)).platform_post_ids.tiktok).toMatchObject({ id: "B" });
    expect((await getPost(second)).platform_post_ids.tiktok).toMatchObject({ id: "A" });
    expect(await postsMade(u)).toBe(2);

    await addSynced(u, "tiktok", "C", 2); // nothing left for it to link to
    expect(await postsMade(u)).toBe(3);
  });

  it("does not take an id that already belongs to another post", async () => {
    const u = await createUser(db);
    const p = await confirmed(u);
    await confirm(u, p, "tiktok");
    await addSynced(u, "tiktok", "D", 5);
    const q = await confirmed(u);
    await confirm(u, q, "tiktok"); // D is already taken by p
    expect((await getPost(q)).platform_post_ids.tiktok).not.toHaveProperty("id");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("creator_posts", () => {
  it("counts an older published post once for each platform it went to", async () => {
    const u = await createUser(db);
    await addPost(u, { platforms: ["linkedin", "twitter"], status: "published", minutes: -120 }); // no per-platform record: from before this
    expect(await postsMade(u)).toBe(2);
  });

  it("counts a platform by the time the creator said they posted to it", async () => {
    const u = await createUser(db);
    const p = await addPost(u, { status: "pending_confirmation" });
    await confirm(u, p, "tiktok", null, "2026-10-01T09:30:00Z");
    const row = await asService(db, () => one<{ posted_at: Date; source: string }>(db, "select posted_at, source from public.creator_posts($1)", [u]));
    expect(row.posted_at.toISOString()).toBe("2026-10-01T09:30:00.000Z");
    expect(row.source).toBe("published");
  });

  it("does not count a post that is only planned, ready, failed or a draft", async () => {
    const u = await createUser(db);
    for (const status of ["scheduled", "pending_confirmation", "failed", "draft"]) await addPost(u, { status });
    expect(await postsMade(u)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("what only the server may call", () => {
  it("is not callable by a creator", async () => {
    const u = await createUser(db);
    const p = await addPost(u, { status: "pending_confirmation" });
    await expect(asUser(db, u, () => db.query("select public.release_due_posts()"))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, u, () => db.query("select public.confirm_post_platform($1, $2, 'tiktok')", [u, p]))).rejects.toThrow(/permission denied/);
    expect((await getPost(p)).status).toBe("pending_confirmation");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("what a post carries", () => {
  it("keeps tags and a format, within limits", async () => {
    const u = await createUser(db);
    await db.query(
      "insert into scheduled_posts (user_id, content, target_platforms, scheduled_at, tags, format) values ($1, 'c', '{tiktok}', now(), '{#a,#b}', 'short_video')",
      [u],
    );
    const row = await one<{ tags: string[]; format: string }>(db, "select tags, format from scheduled_posts where user_id = $1", [u]);
    expect(row).toEqual({ tags: ["#a", "#b"], format: "short_video" });

    const tooMany = `{${Array.from({ length: 31 }, (_, i) => `#t${i}`).join(",")}}`;
    await expect(
      db.query("insert into scheduled_posts (user_id, content, target_platforms, scheduled_at, tags) values ($1, 'c', '{tiktok}', now(), $2)", [u, tooMany]),
    ).rejects.toThrow(/scheduled_posts_tags_cap/);
  });
});
