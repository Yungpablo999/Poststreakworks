import { beforeAll, describe, expect, it } from "vitest";
import { applyRemaining, asService, asUser, count, createDatabase, createUser, one, type Db } from "./db";

// Migration …24: Instagram, Threads, Facebook and YouTube join TikTok. Run as the real roles, so
// "a creator can't write this" is tested the way it is enforced.

let db: Db;

beforeAll(async () => {
  db = await createDatabase();
}, 120_000);

const PLATFORMS = ["tiktok", "instagram", "threads", "facebook", "youtube"] as const;

/** What the OAuth callback writes (server side). */
const connect = (userId: string, platform: string, accountId: string) =>
  db.query(
    `insert into platform_connections
       (user_id, platform, platform_user_id, access_token, account_name, status)
     values ($1, $2::platform_type, $3, 'v1.iv.tag.data', 'Amara', 'connected')`,
    [userId, platform, accountId],
  );

describe("one PostStreak account per platform account", () => {
  it.each(PLATFORMS)("on %s, until it is disconnected", async (platform) => {
    const [first, second] = [await createUser(db), await createUser(db)];
    const shared = `acct-${platform}-${first}`;
    await connect(first, platform, shared);
    await expect(connect(second, platform, shared)).rejects.toThrow(/duplicate key|uq_platform_connections_account/);

    await db.query("update platform_connections set disconnected_at = now() where user_id = $1", [first]);
    await connect(second, platform, shared);
    expect(await count(db, "select 1 from platform_connections where platform_user_id = $1 and disconnected_at is null", [shared])).toBe(1);
  });

  it("treats the same id on different platforms as different accounts", async () => {
    const [a, b] = [await createUser(db), await createUser(db)];
    await connect(a, "instagram", "12345");
    await connect(b, "threads", "12345"); // Instagram and Threads number their accounts in the same way
    expect(await count(db, "select 1 from platform_connections where platform_user_id = '12345'")).toBe(2);
  });

  it("lets one creator reconnect the same account", async () => {
    const id = await createUser(db);
    await connect(id, "youtube", "UCsame");
    await db.query("update platform_connections set disconnected_at = now(), platform_user_id = null where user_id = $1", [id]);
    await db.query("delete from platform_connections where user_id = $1", [id]);
    await connect(id, "youtube", "UCsame");
    expect(await count(db, "select 1 from platform_connections where user_id = $1", [id])).toBe(1);
  });
});

describe("who may write a connection", () => {
  it.each(PLATFORMS)("will not let a creator create, edit or remove a %s connection themselves", async (platform) => {
    const id = await createUser(db);
    // Faking "connected", or claiming someone else's account id first:
    await expect(
      asUser(db, id, () =>
        db.query("insert into platform_connections (user_id, platform, platform_user_id) values ($1, $2::platform_type, 'someone-elses-id')", [id, platform]),
      ),
    ).rejects.toThrow(/row-level security/);

    await connect(id, platform, `acct-${id}`);
    await asUser(db, id, () => db.query("update platform_connections set status = 'connected', account_name = 'Hacked' where platform = $1::platform_type", [platform]));
    await asUser(db, id, () => db.query("delete from platform_connections where platform = $1::platform_type", [platform]));
    const row = await one<{ account_name: string }>(db, "select account_name from platform_connections where user_id = $1", [id]);
    expect(row.account_name).toBe("Amara");
  });

  it("still lets a creator manage connections to platforms without real OAuth yet", async () => {
    const id = await createUser(db);
    await asUser(db, id, () =>
      db.query("insert into platform_connections (user_id, platform, platform_user_id, access_token) values ($1, 'twitter', 'x', 't')", [id]),
    );
    expect(await count(db, "select 1 from platform_connections where user_id = $1", [id])).toBe(1);
  });

  it("lets a creator see their own connection's details, never its tokens", async () => {
    const [id, other] = [await createUser(db), await createUser(db)];
    await connect(id, "instagram", `ig-${id}`);
    const own = await asUser(db, id, () => db.query("select platform, account_name, status from platform_connections"));
    expect(own.rows).toEqual([{ platform: "instagram", account_name: "Amara", status: "connected" }]);
    await expect(asUser(db, id, () => db.query("select access_token from platform_connections"))).rejects.toThrow(/permission denied/);
    expect((await asUser(db, other, () => db.query("select platform from platform_connections"))).rows).toEqual([]);
  });
});

describe("placeholders from before the real flows", () => {
  it("are retired on upgrade; real sealed connections are untouched", async () => {
    const old = await createDatabase({ through: "20260814000023" });
    const u = await createUser(old);
    await old.query(
      `insert into platform_connections (user_id, platform, platform_user_id, access_token) values
         ($1, 'instagram', 'my_handle', 'my_handle'),
         ($1, 'youtube',   'my_channel', 'plain-string'),
         ($1, 'threads',   'th-real',  'v1.iv.tag.data'),
         ($1, 'linkedin',  'li-user',  'real-linkedin-token')`,
      [u],
    );

    await applyRemaining(old, "20260814000023");

    const rows = await old.query<{ platform: string; access_token: string | null; disconnected: boolean; status: string }>(
      "select platform, access_token, disconnected_at is not null as disconnected, status from platform_connections where user_id = $1 order by platform::text",
      [u],
    );
    expect(rows.rows).toEqual([
      { platform: "instagram", access_token: null, disconnected: true, status: "needs_reauth" },
      { platform: "linkedin", access_token: "real-linkedin-token", disconnected: false, status: "connected" },
      { platform: "threads", access_token: "v1.iv.tag.data", disconnected: false, status: "connected" },
      { platform: "youtube", access_token: null, disconnected: true, status: "needs_reauth" },
    ]);
  }, 120_000);
});

describe("record_post_stats", () => {
  const record = (userId: string, platform: string, posts: unknown) =>
    asService(db, () => db.query("select public.record_post_stats($1, $2::platform_type, $3::jsonb)", [userId, platform, JSON.stringify(posts)]));
  const rows = (userId: string, platform = "instagram") =>
    db.query<{ platform_post_id: string; title: string; views: string; likes: string; comments: string; shares: string; saves: string | null; cover_url: string | null; posted_at: Date | null }>(
      "select platform_post_id, title, views, likes, comments, shares, saves, cover_url, posted_at from post_stats where user_id = $1 and platform = $2::platform_type order by platform_post_id",
      [userId, platform],
    ).then((r) => r.rows.map((x) => ({ ...x, views: Number(x.views), likes: Number(x.likes), comments: Number(x.comments), shares: Number(x.shares), saves: x.saves === null ? null : Number(x.saves) })));

  const post = (id: string, over: Record<string, unknown> = {}) => ({
    id, title: `Post ${id}`, postedAt: "2026-10-01T10:00:00Z", coverUrl: `https://c/${id}.jpg`, shareUrl: null, durationSeconds: null,
    views: 100, likes: 10, comments: 2, shares: 3, saves: 4, ...over,
  });

  it("stores new posts", async () => {
    const u = await createUser(db);
    await record(u, "instagram", [post("a"), post("b", { views: 7 })]);
    const got = await rows(u);
    expect(got.map((r) => [r.platform_post_id, r.views, r.likes, r.comments, r.shares, r.saves])).toEqual([
      ["a", 100, 10, 2, 3, 4],
      ["b", 7, 10, 2, 3, 4],
    ]);
  });

  it("starts a new post with no views reported at zero, and leaves an unreported save count empty", async () => {
    const u = await createUser(db);
    await record(u, "threads", [post("a", { views: null, shares: null, saves: null })]);
    expect((await rows(u, "threads"))[0]).toMatchObject({ views: 0, shares: 0, saves: null });
  });

  it("updates the numbers of a post it already has", async () => {
    const u = await createUser(db);
    await record(u, "instagram", [post("a")]);
    await record(u, "instagram", [post("a", { title: "Renamed", views: 500, likes: 60, comments: 9, shares: 11, saves: 12 })]);
    const got = await rows(u);
    expect(got).toHaveLength(1);
    expect(got[0]).toMatchObject({ title: "Renamed", views: 500, likes: 60, comments: 9, shares: 11, saves: 12 });
  });

  it("never lets a number the platform left out this time erase the one it already gave", async () => {
    const u = await createUser(db);
    await record(u, "instagram", [post("a", { views: 900, shares: 5, saves: 6 })]);
    // Instagram wouldn't give insights this time (a post past the newest, say): likes and comments still arrive
    await record(u, "instagram", [post("a", { views: null, shares: null, saves: null, coverUrl: null, postedAt: null, likes: 25, comments: 4 })]);
    const [r] = await rows(u);
    expect(r).toMatchObject({ views: 900, shares: 5, saves: 6, likes: 25, comments: 4 });
    expect(r!.cover_url).toBe("https://c/a.jpg");
    expect(r!.posted_at).not.toBeNull();
  });

  it("ignores entries without an id, and survives the same post twice in one batch", async () => {
    const u = await createUser(db);
    await record(u, "facebook", [post("a"), { title: "no id" }, { id: "" }, post("a", { views: 1 })]);
    expect(await rows(u, "facebook")).toHaveLength(1);
  });

  it("does nothing for an empty batch and refuses something that isn't a list", async () => {
    const u = await createUser(db);
    await record(u, "youtube", []);
    expect(await rows(u, "youtube")).toEqual([]);
    await expect(record(u, "youtube", { id: "a" })).rejects.toThrow(/array/);
  });

  it("keeps each creator's and each platform's posts apart", async () => {
    const [a, b] = [await createUser(db), await createUser(db)];
    await record(a, "instagram", [post("same", { views: 1 })]);
    await record(b, "instagram", [post("same", { views: 2 })]);
    await record(a, "threads", [post("same", { views: 3 })]);
    expect((await rows(a))[0]!.views).toBe(1);
    expect((await rows(b))[0]!.views).toBe(2);
    expect((await rows(a, "threads"))[0]!.views).toBe(3);
  });

  it("can't be called by a creator, who could otherwise mint the numbers Growth is built on", async () => {
    const u = await createUser(db);
    await expect(
      asUser(db, u, () => db.query("select public.record_post_stats($1, 'instagram', '[{\"id\":\"x\",\"views\":99999999}]')", [u])),
    ).rejects.toThrow(/permission denied/);
    expect(await count(db, "select 1 from post_stats where user_id = $1", [u])).toBe(0);
  });
});
