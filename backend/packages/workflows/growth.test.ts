import { describe, expect, it } from "vitest";
import { MIN_POSTS_FOR_SNAPSHOT, buildAccountSnapshot, formatCompactCount, formatHour, type PostForSnapshot } from "./growth";

// "Now" is Fri 2 Oct 2026, 12:00 UTC = 13:00 in Lagos.
const NOW = new Date("2026-10-02T12:00:00Z");
const at = (iso: string, views: number): PostForSnapshot => ({ postedAt: new Date(iso), views });
const snap = (posts: PostForSnapshot[], timezone = "UTC") =>
  buildAccountSnapshot({ platform: "tiktok", posts, timezone, now: NOW, topFormat: "Short videos" });

describe("formatting", () => {
  it("shortens big counts the way the app's sample data does", () => {
    expect(formatCompactCount(0)).toBe("0");
    expect(formatCompactCount(640)).toBe("640");
    expect(formatCompactCount(999)).toBe("999");
    expect(formatCompactCount(1000)).toBe("1K");
    expect(formatCompactCount(1234)).toBe("1.2K");
    expect(formatCompactCount(15_000)).toBe("15K");
    expect(formatCompactCount(158_000)).toBe("158K");
    expect(formatCompactCount(1_500_000)).toBe("1.5M");
    expect(formatCompactCount(-5)).toBe("0");
  });

  it("writes hours the way creators say them", () => {
    expect(formatHour(0)).toBe("12 AM");
    expect(formatHour(7)).toBe("7 AM");
    expect(formatHour(12)).toBe("12 PM");
    expect(formatHour(19)).toBe("7 PM");
    expect(formatHour(23)).toBe("11 PM");
  });
});

describe("buildAccountSnapshot", () => {
  const evenings = [
    at("2026-09-30T19:10:00Z", 1000),
    at("2026-09-27T19:40:00Z", 1400),
    at("2026-09-24T19:05:00Z", 1200),
    at("2026-09-20T08:00:00Z", 300),
  ];

  it("needs a few posts before it says anything about someone's best time", () => {
    expect(snap([])).toBeNull();
    expect(snap(evenings.slice(0, MIN_POSTS_FOR_SNAPSHOT - 1))).toBeNull();
    expect(snap(evenings.slice(0, MIN_POSTS_FOR_SNAPSHOT))).not.toBeNull();
  });

  it("describes how often they post and what happens", () => {
    const s = snap(evenings)!;
    expect(s).toMatchObject({
      platform: "tiktok",
      isSample: false,
      postingDaysLast30: 4,
      recentPosts: 4,
      topFormat: "Short videos",
      avgViews: "975", // (1000 + 1400 + 1200 + 300) / 4
    });
  });

  it("finds the hour their posts do best, and how many posts went out near it", () => {
    const s = snap(evenings)!;
    expect(s.bestTime).toBe("7 PM");
    expect(s.postsAtBestTime).toBe(3); // the 08:00 post is nowhere near
  });

  it("marks the days they posted on, today last", () => {
    const s = snap([...evenings, at("2026-10-02T09:00:00Z", 100)])!;
    expect(s.postedDays).toHaveLength(30);
    expect(s.postedDays[29]).toBe(true); // today, 2 Oct
    expect(s.postedDays[28]).toBe(false); // 1 Oct
    expect(s.postedDays[27]).toBe(true); // 30 Sep
    expect(s.postedDays.filter(Boolean)).toHaveLength(s.postingDaysLast30);
  });

  it("counts only the last 30 days for the monthly numbers, but looks further back for best time", () => {
    const old = [at("2026-07-15T06:00:00Z", 50_000), at("2026-07-16T06:00:00Z", 60_000)]; // > 30 days, < 90 days
    const s = snap([...evenings, ...old])!;
    expect(s.recentPosts).toBe(4);
    expect(s.avgViews).toBe("975");
    expect(s.bestTime).toBe("6 AM"); // those older posts did far better, and there are 2 at that hour
  });

  it("ignores posts older than 90 days when judging best time", () => {
    const ancient = [at("2026-03-01T06:00:00Z", 999_999), at("2026-03-02T06:00:00Z", 999_999)];
    expect(snap([...evenings, ...ancient])!.bestTime).toBe("7 PM");
  });

  it("doesn't let a single lucky post decide best time once there is real data", () => {
    const posts = [
      at("2026-09-30T19:00:00Z", 1000),
      at("2026-09-29T19:00:00Z", 1100),
      at("2026-09-28T03:00:00Z", 90_000), // one viral post at 3 AM
    ];
    expect(snap(posts)!.bestTime).toBe("7 PM");
  });

  it("falls back to the single best post when no hour repeats", () => {
    const posts = [at("2026-09-30T07:00:00Z", 100), at("2026-09-29T13:00:00Z", 900), at("2026-09-28T20:00:00Z", 300)];
    expect(snap(posts)!.bestTime).toBe("1 PM");
  });

  it("treats near-midnight hours as neighbours", () => {
    const posts = [at("2026-09-30T23:30:00Z", 500), at("2026-09-29T00:20:00Z", 450), at("2026-09-28T23:10:00Z", 480)];
    const s = snap(posts)!;
    expect(s.postsAtBestTime).toBe(3); // 11 PM and 12 AM are within an hour of each other
  });

  describe("in the creator's own time zone", () => {
    // 23:30 UTC on 1 Oct is 00:30 on 2 Oct in Lagos (UTC+1).
    const lateNight = [at("2026-10-01T23:30:00Z", 100), at("2026-09-30T23:35:00Z", 100), at("2026-09-29T23:40:00Z", 100)];

    it("assigns posts to the creator's day, not the server's", () => {
      const lagos = snap(lateNight, "Africa/Lagos")!;
      expect(lagos.postedDays[29]).toBe(true); // 00:30 on 2 Oct is today for them
      const utc = snap(lateNight, "UTC")!;
      expect(utc.postedDays[29]).toBe(false); // but yesterday in UTC
    });

    it("reports the best time on their clock", () => {
      expect(snap(lateNight, "Africa/Lagos")!.bestTime).toBe("12 AM");
      expect(snap(lateNight, "UTC")!.bestTime).toBe("11 PM");
    });

    it("falls back to Lagos for a time zone it doesn't know", () => {
      expect(snap(lateNight, "Not/AZone")).toEqual(snap(lateNight, "Africa/Lagos"));
    });
  });

  it("skips posts without a date", () => {
    const posts = [...evenings.slice(0, 2), { postedAt: null, views: 5 }, at("not a date", 5)];
    expect(snap(posts)).toBeNull(); // only two usable posts
  });

  it("handles a creator whose last post was more than 30 days ago", () => {
    const stale = [at("2026-08-01T10:00:00Z", 100), at("2026-07-30T10:00:00Z", 120), at("2026-07-28T10:00:00Z", 90)];
    const s = snap(stale)!;
    expect(s).toMatchObject({ postingDaysLast30: 0, recentPosts: 0, postsAtBestTime: 0, avgViews: "0" });
    expect(s.postedDays.every((d) => d === false)).toBe(true);
  });
});
