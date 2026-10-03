import { describe, expect, it } from "vitest";
import { buildGrowthOverview, findPostPerf, type ConnectionInput, type PostInput, type SnapshotInput } from "./growth-overview";

// "Now" is Fri 2 Oct 2026, 12:00 UTC. Everything is in UTC unless a test says otherwise.
const NOW = new Date("2026-10-02T12:00:00Z");
const daysAgo = (n: number, hour = 12) => new Date(Date.UTC(2026, 9, 2 - n, hour, 0, 0));
const dayOf = (n: number) => daysAgo(n).toISOString().slice(0, 10);

const conn = (platform: string, over: Partial<ConnectionInput> = {}): ConnectionInput => ({
  platform, accountName: "Bayo", handle: null, avatarUrl: null, status: "connected", lastSyncedAt: daysAgo(0, 9), ...over,
});
/** One follower count per day, `history` days back to today, growing by `perDay`. */
const followers = (platform: string, history: number, end: number, perDay: number): SnapshotInput[] =>
  Array.from({ length: history + 1 }, (_, i) => ({ platform, day: dayOf(history - i), followers: Math.round(end - perDay * (history - i)) }));
const post = (platform: string, id: string, ago: number, views: number, over: Partial<PostInput> = {}): PostInput => ({
  platform, id, title: `Post ${id}`, postedAt: daysAgo(ago), coverUrl: null, shareUrl: null, durationSeconds: 20,
  views, likes: Math.round(views * 0.1), comments: Math.round(views * 0.01), shares: Math.round(views * 0.02), saves: null, ...over,
});
const overview = (input: { connections?: ConnectionInput[]; snapshots?: SnapshotInput[]; posts?: PostInput[]; timezone?: string }) =>
  buildGrowthOverview({ connections: [], snapshots: [], posts: [], timezone: "UTC", now: NOW, ...input });

describe("nothing connected, nothing read", () => {
  it("says so, with no invented numbers", () => {
    const o = overview({});
    expect(o).toMatchObject({ hasAccounts: false, hasData: false, connected: 0, needsReconnect: [], updatedAt: null });
    expect(o.totals).toMatchObject({ followers: null, change7: null, change30: null, posts30: 0, views30: 0 });
    expect(o.platforms).toEqual([]);
    expect(o.series).toEqual([]);
    expect(o.months).toEqual([]);
    expect(o.bestPost).toBeNull();
    expect(o.bestTime).toBeNull();
    expect(o.milestones).toEqual([]);
  });

  it("a connected account that hasn't been read yet has an account but no data", () => {
    const o = overview({ connections: [conn("tiktok", { lastSyncedAt: null })] });
    expect(o).toMatchObject({ hasAccounts: true, hasData: false, connected: 1, updatedAt: null });
    expect(o.platforms[0]).toMatchObject({ platform: "tiktok", followers: null, change7: null, change30: null, trackedSince: null, posts30: 0, avgViews30: null });
  });

  it("ignores data from platforms that aren't connected any more, and from platforms we don't read", () => {
    const o = overview({
      connections: [conn("tiktok")],
      snapshots: [...followers("instagram", 10, 5000, 10), ...followers("twitter", 10, 900, 1)],
      posts: [post("instagram", "x", 2, 9999), post("linkedin", "y", 1, 5)],
    });
    expect(o.hasData).toBe(false);
    expect(o.totals.followers).toBeNull();
    expect(o.platforms.map((p) => p.platform)).toEqual(["tiktok"]);
  });
});

describe("followers", () => {
  it("reports the latest count and what changed over a week and a month", () => {
    const o = overview({ connections: [conn("tiktok")], snapshots: followers("tiktok", 60, 12_000, 20) });
    const p = o.platforms[0]!;
    expect(p.followers).toBe(12_000);
    expect(p.change7).toBe(140);
    expect(p.change30).toBe(600);
    expect(p.trackedSince).toBe(dayOf(60));
    expect(o.totals).toMatchObject({ followers: 12_000, change7: 140, change30: 600, partial: false });
  });

  it("doesn't claim a month's change before there's a month of history", () => {
    const o = overview({ connections: [conn("tiktok")], snapshots: followers("tiktok", 10, 500, 5) });
    expect(o.platforms[0]).toMatchObject({ followers: 500, change7: 35, change30: null });
    expect(o.totals).toMatchObject({ change7: 35, change30: null });
  });

  it("has no change at all on the first day, only the count", () => {
    const o = overview({ connections: [conn("tiktok")], snapshots: followers("tiktok", 0, 214, 0) });
    expect(o.platforms[0]).toMatchObject({ followers: 214, change7: null, change30: null, trackedSince: dayOf(0) });
  });

  it("adds accounts up, and says when only some have the history", () => {
    const o = overview({
      connections: [conn("tiktok"), conn("instagram")],
      snapshots: [...followers("tiktok", 40, 10_000, 10), ...followers("instagram", 3, 800, 2)],
    });
    expect(o.totals.followers).toBe(10_800);
  });

  it("flags a partial change", () => {
    const o = overview({
      connections: [conn("tiktok"), conn("instagram")],
      snapshots: [...followers("tiktok", 40, 10_000, 10), ...followers("instagram", 3, 800, 2)],
    });
    expect(o.totals.partial).toBe(true);
    expect(o.totals.change7).toBe(70); // only TikTok has a week of history
  });

  it("can go down", () => {
    const o = overview({ connections: [conn("tiktok")], snapshots: followers("tiktok", 40, 9_000, -10) });
    expect(o.platforms[0]!.change30).toBe(-300);
  });

  it("skips accounts that have never reported a follower count", () => {
    const o = overview({
      connections: [conn("tiktok"), conn("youtube")],
      snapshots: [...followers("tiktok", 5, 100, 1), { platform: "youtube", day: dayOf(0), followers: null }],
    });
    expect(o.totals.followers).toBe(100);
    expect(o.platforms.find((p) => p.platform === "youtube")!.followers).toBeNull();
  });
});

describe("the follower chart", () => {
  it("covers today and the 30 days before it with the total of every account, so its ends are exactly 30 days apart", () => {
    const o = overview({
      connections: [conn("tiktok"), conn("instagram")],
      snapshots: [...followers("tiktok", 60, 10_000, 10), ...followers("instagram", 60, 2_000, 5)],
    });
    expect(o.series).toHaveLength(31);
    expect(o.series[0]).toEqual({ day: dayOf(30), followers: 10_000 - 300 + (2_000 - 150) });
    expect(o.series[30]).toEqual({ day: dayOf(0), followers: 12_000 });
    // the same change the headline reports for 30 days
    expect(o.series[30]!.followers - o.series[0]!.followers).toBe(o.totals.change30);
  });

  it("starts on the first day every account was being tracked, not before (no fake jump when one is added)", () => {
    const o = overview({
      connections: [conn("tiktok"), conn("instagram")],
      snapshots: [...followers("tiktok", 60, 10_000, 10), ...followers("instagram", 4, 2_000, 5)],
    });
    expect(o.series).toHaveLength(5);
    expect(o.series[0]!.day).toBe(dayOf(4));
  });

  it("carries a count forward over days nothing was read", () => {
    const o = overview({
      connections: [conn("tiktok")],
      snapshots: [{ platform: "tiktok", day: dayOf(5), followers: 100 }, { platform: "tiktok", day: dayOf(2), followers: 130 }],
    });
    expect(o.series.map((s) => s.followers)).toEqual([100, 100, 100, 130, 130, 130]);
  });
});

describe("each account's own chart", () => {
  it("has one point a day from the first day that account was tracked", () => {
    const o = overview({
      connections: [conn("tiktok"), conn("instagram")],
      snapshots: [...followers("tiktok", 60, 10_000, 10), ...followers("instagram", 4, 2_000, 5)],
    });
    expect(o.platforms.find((p) => p.platform === "tiktok")!.series).toHaveLength(31);
    const ig = o.platforms.find((p) => p.platform === "instagram")!.series;
    expect(ig).toHaveLength(5);
    expect(ig[ig.length - 1]).toEqual({ day: dayOf(0), followers: 2_000 });
  });

  it("is empty for an account that hasn't been read yet", () => {
    expect(overview({ connections: [conn("tiktok")] }).platforms[0]!.series).toEqual([]);
  });
});

describe("each account's own posts", () => {
  it("lists that account's newest posts, at most five", () => {
    const o = overview({
      connections: [conn("tiktok"), conn("instagram")],
      posts: [...Array.from({ length: 7 }, (_, i) => post("tiktok", `t${i}`, i + 1, 100)), post("instagram", "i0", 2, 50)],
    });
    expect(o.platforms.find((p) => p.platform === "tiktok")!.recentPosts.map((p) => p.key)).toEqual(["tiktok:t0", "tiktok:t1", "tiktok:t2", "tiktok:t3", "tiktok:t4"]);
    expect(o.platforms.find((p) => p.platform === "instagram")!.recentPosts.map((p) => p.key)).toEqual(["instagram:i0"]);
  });
});

describe("month by month", () => {
  const monthly = (platform: string, points: [string, number][]): SnapshotInput[] => points.map(([day, f]) => ({ platform, day, followers: f }));

  it("gains are measured between the last count of one month and the last of the next", () => {
    const o = overview({
      connections: [conn("tiktok")],
      snapshots: monthly("tiktok", [["2026-07-10", 1000], ["2026-07-30", 1200], ["2026-08-15", 1500], ["2026-08-30", 1700], ["2026-09-30", 2400], ["2026-10-01", 2450]]),
    });
    expect(o.months).toEqual([
      { month: "2026-07", gain: 200 }, // first month: from its first count
      { month: "2026-08", gain: 500 },
      { month: "2026-09", gain: 700 },
      { month: "2026-10", gain: 50 },
    ]);
  });

  it("adds accounts together and shows at most six months", () => {
    const a = Array.from({ length: 9 }, (_, i): [string, number] => [`2026-0${i + 1}-15`, 1000 + i * 100]);
    const o = overview({
      connections: [conn("tiktok"), conn("instagram")],
      snapshots: [...monthly("tiktok", a), ...monthly("instagram", a.map(([d, f]) => [d, f / 2] as [string, number]))],
    });
    expect(o.months).toHaveLength(6);
    expect(o.months[5]).toEqual({ month: "2026-09", gain: 100 + 50 });
  });

  it("is empty with no history", () => {
    expect(overview({ connections: [conn("tiktok")] }).months).toEqual([]);
  });
});

describe("posts", () => {
  it("counts the posts of the last 30 days and the 30 before, and adds up their numbers", () => {
    const o = overview({
      connections: [conn("tiktok")],
      posts: [post("tiktok", "a", 2, 1000), post("tiktok", "b", 10, 500), post("tiktok", "c", 29, 100), post("tiktok", "d", 30, 9999), post("tiktok", "e", 45, 200), post("tiktok", "f", 70, 50)],
    });
    expect(o.totals).toMatchObject({ posts30: 3, postsPrev30: 2, views30: 1600 });
    expect(o.platforms[0]).toMatchObject({ posts30: 3, views30: 1600, avgViews30: 533, postsTotal: 6 });
  });

  it("uses the creator's own calendar days", () => {
    // 23:30 UTC on 1 Oct is already 2 Oct in Lagos (UTC+1)
    const late = post("tiktok", "late", 0, 100, { postedAt: new Date("2026-10-01T23:30:00Z") });
    const lagos = overview({ connections: [conn("tiktok")], posts: [late], timezone: "Africa/Lagos" });
    expect(lagos.week.postsThisWeek).toBe(1);
    const la = overview({ connections: [conn("tiktok")], posts: [late], timezone: "America/Los_Angeles" });
    expect(la.week.postsThisWeek).toBe(1);
  });

  it("compares this week with last week", () => {
    const o = overview({
      connections: [conn("tiktok")],
      posts: [post("tiktok", "1", 0, 10), post("tiktok", "2", 3, 10), post("tiktok", "3", 6, 10), post("tiktok", "4", 7, 10), post("tiktok", "5", 13, 10), post("tiktok", "6", 14, 10)],
    });
    expect(o.week).toMatchObject({ postsThisWeek: 3, postsLastWeek: 2 });
  });

  it("lists the newest first, with the platform's name", () => {
    const o = overview({ connections: [conn("tiktok"), conn("instagram")], posts: [post("tiktok", "old", 9, 10), post("instagram", "new", 1, 10)] });
    expect(o.recentPosts.map((p) => p.key)).toEqual(["instagram:new", "tiktok:old"]);
    expect(o.recentPosts[0]!.platformName).toBe("Instagram");
  });

  it("keeps posts without a date out of the periods", () => {
    const o = overview({ connections: [conn("tiktok")], posts: [post("tiktok", "x", 0, 500, { postedAt: null })] });
    expect(o.totals.posts30).toBe(0);
    expect(o.recentPosts).toEqual([]);
    expect(o.bestPost).toBeNull();
  });
});

describe("the best post", () => {
  const set = [post("tiktok", "mid", 3, 1000), post("tiktok", "hit", 5, 4000), post("tiktok", "low", 8, 400), post("tiktok", "avg", 12, 1000), post("tiktok", "meh", 20, 600)];

  it("is the one with the most views lately", () => {
    expect(overview({ connections: [conn("tiktok")], posts: set }).bestPost!.key).toBe("tiktok:hit");
  });

  it("falls back to older posts when nothing was posted lately", () => {
    const o = overview({ connections: [conn("tiktok")], posts: [post("tiktok", "a", 50, 100), post("tiktok", "b", 60, 900)] });
    expect(o.bestPost!.key).toBe("tiktok:b");
  });

  it("is compared with the account's other posts", () => {
    const best = overview({ connections: [conn("tiktok")], posts: set }).bestPost!;
    // the other four average (1000 + 400 + 1000 + 600) / 4 = 750
    expect(best.comparison).toEqual({ averageViews: 750, percent: 433 });
  });

  it("isn't compared when there are too few other posts to mean anything", () => {
    const best = overview({ connections: [conn("tiktok")], posts: [post("tiktok", "a", 1, 100), post("tiktok", "b", 2, 900), post("tiktok", "c", 3, 500)] }).bestPost!;
    expect(best.comparison).toBeNull();
    // nothing is said about how it compares (only, at most, when it was posted)
    expect(best.insights.filter((i) => !i.startsWith("You posted around"))).toEqual([]);
  });

  it("only compares a post with posts on the same platform", () => {
    const o = overview({
      connections: [conn("tiktok"), conn("instagram")],
      posts: [post("tiktok", "t1", 1, 50_000), post("instagram", "i1", 2, 100), post("instagram", "i2", 3, 100), post("instagram", "i3", 4, 100), post("instagram", "i4", 5, 300)],
    });
    expect(o.bestPost!.key).toBe("tiktok:t1");
    expect(o.bestPost!.comparison).toBeNull(); // no other TikTok posts
    expect(o.recentPosts.find((p) => p.key === "instagram:i4")!.comparison).toEqual({ averageViews: 100, percent: 200 });
  });

  it("explains itself with true statements only", () => {
    const best = overview({ connections: [conn("tiktok")], posts: set }).bestPost!;
    expect(best.insights.some((i) => i.startsWith("Got 5.3×"))).toBe(true);
    expect(best.insights.every((i) => !/viral|top \d+%|trending/i.test(i))).toBe(true);
  });

  it("notices a post that people reacted to more than usual", () => {
    const posts = [
      post("tiktok", "a", 1, 1000, { likes: 100, comments: 10, shares: 20 }),
      post("tiktok", "b", 2, 1000, { likes: 100, comments: 10, shares: 20 }),
      post("tiktok", "c", 3, 1000, { likes: 100, comments: 10, shares: 20 }),
      post("tiktok", "d", 4, 1000, { likes: 100, comments: 10, shares: 20 }),
      post("tiktok", "star", 5, 1000, { likes: 400, comments: 80, shares: 150 }),
    ];
    const star = overview({ connections: [conn("tiktok")], posts }).recentPosts.find((p) => p.key === "tiktok:star")!;
    expect(star.insights).toContain("People reacted more than usual: more likes, comments and shares for every view.");
    expect(star.insights).toContain("It was shared more than your usual posts.");
    expect(star.insights).toContain("It got more comments than usual, so people had something to say.");
    expect(star.engagementRate).toBeCloseTo(0.63, 2);
  });

  it("says when a post went out around the hour their posts do best", () => {
    const hour = (n: number, h: number) => new Date(Date.UTC(2026, 9, 2 - n, h, 15, 0));
    const posts = [
      post("tiktok", "e1", 1, 3000, { postedAt: hour(1, 19) }),
      post("tiktok", "e2", 3, 2800, { postedAt: hour(3, 19) }),
      post("tiktok", "e3", 5, 3200, { postedAt: hour(5, 19) }),
      post("tiktok", "m1", 2, 300, { postedAt: hour(2, 8) }),
      post("tiktok", "m2", 4, 250, { postedAt: hour(4, 8) }),
    ];
    const o = overview({ connections: [conn("tiktok")], posts });
    expect(o.bestTime).toEqual({ label: "7 PM", hour: 19, postsAtBestTime: 3 });
    const evening = o.recentPosts.find((p) => p.key === "tiktok:e1")!;
    expect(evening.insights).toContain("You posted around 7 PM, when your posts do best.");
    expect(o.recentPosts.find((p) => p.key === "tiktok:m1")!.insights).not.toContain("You posted around 7 PM, when your posts do best.");
  });
});

describe("the best time to post", () => {
  it("needs a few posts", () => {
    expect(overview({ connections: [conn("tiktok")], posts: [post("tiktok", "a", 1, 100), post("tiktok", "b", 2, 100)] }).bestTime).toBeNull();
  });

  it("won't name a best time on the strength of one lucky post", () => {
    const at = (id: string, ago: number, hour: number, views: number) => post("tiktok", id, ago, views, { postedAt: new Date(Date.UTC(2026, 9, 2 - ago, hour, 10, 0)) });
    // three posts, all at different hours: nothing repeats, so nothing is a pattern
    const o = overview({ connections: [conn("tiktok")], posts: [at("a", 1, 7, 9000), at("b", 2, 13, 400), at("c", 3, 21, 300)] });
    expect(o.bestTime).toBeNull();
    expect(o.recentPosts.every((p) => p.insights.every((i) => !i.startsWith("You posted around")))).toBe(true);
  });

  it("doesn't let a big account decide for a small one: each post counts against its own account's average", () => {
    const at = (platform: string, id: string, ago: number, hour: number, views: number) => post(platform, id, ago, views, { postedAt: new Date(Date.UTC(2026, 9, 2 - ago, hour, 10, 0)) });
    const o = overview({
      connections: [conn("tiktok"), conn("threads")],
      posts: [
        // TikTok: 100x the views of Threads, best at 8 AM
        at("tiktok", "t1", 1, 8, 100_000), at("tiktok", "t2", 3, 8, 90_000), at("tiktok", "t3", 5, 20, 10_000),
        // Threads: best at 8 AM too, but tiny numbers
        at("threads", "h1", 2, 8, 1_000), at("threads", "h2", 4, 8, 900), at("threads", "h3", 6, 20, 100),
      ],
    });
    expect(o.bestTime!.label).toBe("8 AM");
  });
});

describe("accounts that need attention", () => {
  it("lists the ones that need reconnecting, and counts the rest as connected", () => {
    const o = overview({ connections: [conn("tiktok"), conn("instagram", { status: "needs_reauth" }), conn("youtube", { status: "error" })] });
    expect(o).toMatchObject({ connected: 2, needsReconnect: ["instagram"] });
  });

  it("reports when the numbers were last refreshed: the most recent sync", () => {
    const o = overview({ connections: [conn("tiktok", { lastSyncedAt: daysAgo(2) }), conn("instagram", { lastSyncedAt: daysAgo(0, 8) })] });
    expect(o.updatedAt).toBe(daysAgo(0, 8).toISOString());
  });
});

describe("milestones", () => {
  it("picks the next round number for each account, the closest first", () => {
    const o = overview({
      connections: [conn("tiktok"), conn("instagram"), conn("youtube")],
      snapshots: [...followers("tiktok", 1, 14_200, 0), ...followers("instagram", 1, 480, 0), ...followers("youtube", 1, 2_100, 0)],
    });
    expect(o.milestones).toHaveLength(2);
    expect(o.milestones[0]).toMatchObject({ platform: "instagram", target: 500, current: 480, label: "500 followers on Instagram", note: "480 now · 20 to go" });
    expect(o.milestones[1]).toMatchObject({ platform: "youtube", target: 2_500 }); // TikTok is further from 25K
  });

  it("moves on to the next number once one is passed", () => {
    const o = overview({ connections: [conn("tiktok")], snapshots: followers("tiktok", 1, 1_000, 0) });
    expect(o.milestones[0]!.target).toBe(2_500);
  });
});

describe("one post by key", () => {
  const input = {
    connections: [conn("tiktok")],
    posts: [post("tiktok", "a", 1, 900), post("tiktok", "b", 2, 1000), post("tiktok", "c", 3, 1100), post("tiktok", "d", 4, 1000), post("tiktok", "old", 200, 5000)],
    timezone: "UTC",
    now: NOW,
  };

  it("finds a recent post", () => {
    expect(findPostPerf({ ...input, key: "tiktok:a" })).toMatchObject({ key: "tiktok:a", views: 900 });
  });

  it("finds an old one that isn't in the list, compared with the last 90 days only", () => {
    const p = findPostPerf({ ...input, key: "tiktok:old" })!;
    expect(p.views).toBe(5000);
    expect(p.comparison).toEqual({ averageViews: 1000, percent: 400 });
  });

  it("is null for anything it doesn't know", () => {
    expect(findPostPerf({ ...input, key: "tiktok:nope" })).toBeNull();
    expect(findPostPerf({ ...input, key: "instagram:a" })).toBeNull();
    expect(findPostPerf({ ...input, key: "garbage" })).toBeNull();
    expect(findPostPerf({ ...input, key: "myspace:a" })).toBeNull();
  });
});

describe("a day of data is a day of data", () => {
  it("builds from nothing but one count and one post", () => {
    const o = overview({ connections: [conn("tiktok")], snapshots: followers("tiktok", 0, 214, 0), posts: [post("tiktok", "only", 0, 280)] });
    expect(o.hasData).toBe(true);
    expect(o.totals).toMatchObject({ followers: 214, change7: null, posts30: 1 });
    expect(o.series).toEqual([{ day: dayOf(0), followers: 214 }]);
    expect(o.bestPost!.comparison).toBeNull();
    expect(o.months).toEqual([{ month: "2026-10", gain: 0 }]);
  });

  it("never divides by zero", () => {
    const o = overview({ connections: [conn("tiktok")], posts: [post("tiktok", "z", 1, 0), post("tiktok", "y", 2, 0), post("tiktok", "x", 3, 0), post("tiktok", "w", 4, 0)] });
    expect(o.bestPost!.comparison).toBeNull(); // an average of nothing is not a comparison
    expect(o.bestPost!.engagementRate).toBeNull();
  });
});
