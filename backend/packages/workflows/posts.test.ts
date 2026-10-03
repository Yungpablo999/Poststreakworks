import { describe, expect, it } from "vitest";
import {
  MAX_CAPTION_LENGTH,
  MAX_TAGS,
  PostError,
  cleanCaption,
  cleanFormat,
  cleanPlatforms,
  cleanPostUrl,
  cleanTags,
  cleanTime,
  planUpdate,
  toPost,
  validateNewPost,
  type PostRow,
} from "./posts";

const NOW = new Date("2026-10-03T12:00:00.000Z");
const at = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000).toISOString();

const row = (over: Partial<PostRow> = {}): PostRow => ({
  id: "p1",
  user_id: "u1",
  content: "Hello world",
  tags: ["#a"],
  format: "short_video",
  target_platforms: ["tiktok"],
  scheduled_at: at(60),
  status: "scheduled",
  published_at: null,
  platform_post_ids: {},
  error: null,
  created_at: at(-60),
  ...over,
});

const refusal = (fn: () => unknown): PostError => {
  try {
    fn();
  } catch (err) {
    if (err instanceof PostError) return err;
    throw err;
  }
  throw new Error("expected a refusal");
};

describe("a post as the app sees it", () => {
  it("maps the database's statuses to the ones creators see", () => {
    const state = (status: string) => toPost(row({ status })).state;
    expect(state("scheduled")).toBe("scheduled");
    expect(state("publishing")).toBe("scheduled");
    expect(state("pending_confirmation")).toBe("ready");
    expect(state("published")).toBe("posted");
    expect(state("failed")).toBe("failed");
    expect(state("draft")).toBe("draft");
  });

  it("shows each platform's own state", () => {
    const post = toPost(
      row({
        target_platforms: ["tiktok", "instagram", "youtube"],
        status: "pending_confirmation",
        platform_post_ids: {
          tiktok: { status: "published", url: "https://www.tiktok.com/@a/video/1", at: "2026-10-03T10:00:00Z" },
          instagram: { status: "pending_confirmation" },
        },
      }),
    );
    expect(post.state).toBe("ready");
    expect(post.platforms).toEqual([
      { platform: "tiktok", state: "posted", url: "https://www.tiktok.com/@a/video/1", postedAt: "2026-10-03T10:00:00Z" },
      { platform: "instagram", state: "ready" },
      { platform: "youtube", state: "ready" },
    ]);
  });

  it("shows platforms as waiting until the time comes", () => {
    expect(toPost(row({ target_platforms: ["tiktok", "threads"] })).platforms.map((p) => p.state)).toEqual(["waiting", "waiting"]);
  });

  it("treats every platform of an older published post as posted", () => {
    const post = toPost(row({ status: "published", published_at: at(-5), target_platforms: ["linkedin", "twitter"] }));
    expect(post.platforms).toEqual([
      { platform: "linkedin", state: "posted", postedAt: at(-5) },
      { platform: "twitter", state: "posted", postedAt: at(-5) },
    ]);
    expect(post.postedAt).toBe(at(-5));
  });

  it("carries the caption, tags and format, and copes with rows from before they existed", () => {
    const post = toPost(row({ tags: null, format: "nonsense" }));
    expect(post).toMatchObject({ id: "p1", caption: "Hello world", tags: [], format: null, at: at(60), error: null });
    expect(toPost(row({ format: "carousel" })).format).toBe("carousel");
  });

  it("passes on why a post failed", () => {
    expect(toPost(row({ status: "failed", error: "LinkedIn token expired" }))).toMatchObject({ state: "failed", error: "LinkedIn token expired" });
  });
});

describe("what a creator may send", () => {
  it("needs a caption, within the limit", () => {
    expect(cleanCaption("  Hello\r\nworld  ")).toBe("Hello\nworld");
    expect(refusal(() => cleanCaption("   ")).code).toBe("invalid");
    expect(refusal(() => cleanCaption(undefined)).code).toBe("invalid");
    expect(cleanCaption("x".repeat(MAX_CAPTION_LENGTH)).length).toBe(MAX_CAPTION_LENGTH);
    expect(refusal(() => cleanCaption("x".repeat(MAX_CAPTION_LENGTH + 1))).message).toMatch(/5,000/);
  });

  it("tidies tags: one # in front, no spaces, no repeats in any case", () => {
    expect(cleanTags(["habits", "#Habits", " # Daily Habits ", "##x", "", "#", "#X"])).toEqual(["#habits", "#DailyHabits", "#x"]);
    expect(cleanTags(undefined)).toEqual([]);
    expect(refusal(() => cleanTags("nope")).code).toBe("invalid");
    expect(refusal(() => cleanTags([3])).code).toBe("invalid");
    expect(refusal(() => cleanTags(["a".repeat(101)])).code).toBe("invalid");
    expect(refusal(() => cleanTags(Array.from({ length: MAX_TAGS + 1 }, (_, i) => `t${i}`))).message).toMatch(/30 tags/);
    expect(cleanTags(Array.from({ length: MAX_TAGS }, (_, i) => `t${i}`))).toHaveLength(MAX_TAGS);
  });

  it("takes only the five platforms, once each", () => {
    expect(cleanPlatforms(["tiktok", "instagram", "tiktok"])).toEqual(["tiktok", "instagram"]);
    for (const bad of [[], "tiktok", ["linkedin"], ["tiktok", "pinterest"], [3], undefined]) {
      expect(refusal(() => cleanPlatforms(bad)).code).toBe("invalid");
    }
  });

  it("knows the formats the composer offers", () => {
    for (const f of ["short_video", "carousel", "image", "text", "long_video"]) expect(cleanFormat(f)).toBe(f);
    expect(cleanFormat(undefined)).toBeNull();
    expect(cleanFormat(null)).toBeNull();
    expect(cleanFormat("")).toBeNull();
    expect(refusal(() => cleanFormat("podcast")).code).toBe("invalid");
  });

  it("plans only for a time in the future and within a year", () => {
    expect(cleanTime(at(1), NOW).toISOString()).toBe(at(1));
    expect(refusal(() => cleanTime(at(0), NOW)).message).toMatch(/already passed/);
    expect(refusal(() => cleanTime(at(-5), NOW)).message).toMatch(/already passed/);
    expect(refusal(() => cleanTime("tomorrow-ish", NOW)).message).toMatch(/day and time/);
    expect(refusal(() => cleanTime(undefined, NOW)).message).toMatch(/day and time/);
    expect(cleanTime(at(364 * 24 * 60), NOW)).toBeInstanceOf(Date);
    expect(refusal(() => cleanTime(at(366 * 24 * 60), NOW)).message).toMatch(/year/);
  });
});

describe("a new post", () => {
  const input = { caption: " Hi ", tags: ["x"], platforms: ["tiktok"], format: "text", when: "schedule" as const, at: at(30) };

  it("is checked as a whole", () => {
    expect(validateNewPost(input, NOW)).toEqual({ caption: "Hi", tags: ["#x"], platforms: ["tiktok"], format: "text", when: "schedule", at: new Date(at(30)) });
  });

  it("is ready this moment when posted now, whatever time came with it", () => {
    const v = validateNewPost({ ...input, when: "now", at: at(-500) }, NOW);
    expect(v.when).toBe("now");
    expect(v.at).toBe(NOW);
  });

  it("needs a time to be planned for a time", () => {
    expect(refusal(() => validateNewPost({ ...input, at: undefined }, NOW)).message).toMatch(/day and time/);
    expect(refusal(() => validateNewPost({ ...input, at: at(-1) }, NOW)).message).toMatch(/already passed/);
  });

  it("says which of the two it is", () => {
    expect(refusal(() => validateNewPost({ ...input, when: "later" as never }, NOW)).code).toBe("invalid");
  });
});

describe("the link to a post", () => {
  it.each([
    ["tiktok", "https://www.tiktok.com/@amara/video/7001"],
    ["tiktok", "https://vm.tiktok.com/ZMabc/"],
    ["instagram", "https://www.instagram.com/reel/Cabc123/"],
    ["instagram", "https://instagr.am/p/abc/"],
    ["youtube", "https://www.youtube.com/shorts/abc"],
    ["youtube", "https://youtu.be/abc"],
    ["threads", "https://www.threads.net/@amara/post/abc"],
    ["threads", "https://www.threads.com/@amara/post/abc"],
    ["facebook", "https://www.facebook.com/reel/123"],
    ["facebook", "https://fb.watch/abc/"],
  ] as const)("accepts a %s link: %s", (platform, link) => {
    expect(cleanPostUrl(platform, link)).toBe(new URL(link).toString());
  });

  it("treats no link as no link", () => {
    expect(cleanPostUrl("tiktok", undefined)).toBeNull();
    expect(cleanPostUrl("tiktok", null)).toBeNull();
    expect(cleanPostUrl("tiktok", "   ")).toBeNull();
  });

  it.each([
    ["tiktok", "https://www.instagram.com/reel/abc/"],
    ["tiktok", "https://nottiktok.com/video/1"],
    ["tiktok", "https://tiktok.com.evil.example/video/1"],
    ["tiktok", "http://www.tiktok.com/@a/video/1"],
    ["tiktok", "javascript:alert(1)"],
    ["tiktok", "not a link"],
    ["youtube", "https://youtube.com@evil.example/"],
    ["facebook", "https://fb.watch.evil.example/abc"],
  ] as const)("refuses a %s link that is not one: %s", (platform, link) => {
    expect(refusal(() => cleanPostUrl(platform, link)).code).toBe("invalid");
  });

  it("refuses a very long one, and anything that is not text", () => {
    expect(refusal(() => cleanPostUrl("tiktok", `https://www.tiktok.com/${"a".repeat(600)}`)).code).toBe("invalid");
    expect(refusal(() => cleanPostUrl("tiktok", 42)).code).toBe("invalid");
  });

  it("names the platform in the message", () => {
    expect(refusal(() => cleanPostUrl("youtube", "https://www.tiktok.com/@a/video/1")).message).toBe("That isn't a YouTube link.");
  });
});

describe("changing a post", () => {
  it("changes only what was sent", () => {
    expect(planUpdate(row(), { caption: "New words" }, NOW)).toEqual({ content: "New words" });
    expect(planUpdate(row(), { tags: ["b", "#B", "c"] }, NOW)).toEqual({ tags: ["#b", "#c"] });
    expect(planUpdate(row(), { format: "carousel" }, NOW)).toEqual({ format: "carousel" });
    expect(planUpdate(row(), { format: null }, NOW)).toEqual({ format: null });
  });

  it("does nothing when nothing was sent", () => {
    expect(planUpdate(row(), {}, NOW)).toBeNull();
  });

  it("moves a waiting post to a new time", () => {
    expect(planUpdate(row(), { at: at(300) }, NOW)).toEqual({ scheduled_at: at(300), status: "scheduled", platform_post_ids: {} });
  });

  it("sends a ready post back to waiting for its new time, keeping what was already posted", () => {
    const ready = row({
      status: "pending_confirmation",
      target_platforms: ["tiktok", "instagram"],
      platform_post_ids: { tiktok: { status: "published", at: at(-30) }, instagram: { status: "pending_confirmation" } },
    });
    expect(planUpdate(ready, { at: at(120) }, NOW)).toEqual({
      scheduled_at: at(120),
      status: "scheduled",
      platform_post_ids: { tiktok: { status: "published", at: at(-30) } },
    });
  });

  it("refuses a time that has passed", () => {
    expect(refusal(() => planUpdate(row(), { at: at(-1) }, NOW)).message).toMatch(/already passed/);
  });

  it("gives new platforms of a ready post their own 'ready' step", () => {
    const ready = row({ status: "pending_confirmation", platform_post_ids: { tiktok: { status: "pending_confirmation" } } });
    expect(planUpdate(ready, { platforms: ["tiktok", "youtube"] }, NOW)).toEqual({
      target_platforms: ["tiktok", "youtube"],
      platform_post_ids: { tiktok: { status: "pending_confirmation" }, youtube: { status: "pending_confirmation" } },
    });
  });

  it("changes the platforms of a waiting post without a per-platform record", () => {
    expect(planUpdate(row(), { platforms: ["instagram"] }, NOW)).toEqual({ target_platforms: ["instagram"], platform_post_ids: {} });
  });

  it("will not change the platforms once one has been posted, but allows adding none and removing none", () => {
    const part = row({
      status: "pending_confirmation",
      target_platforms: ["tiktok", "instagram"],
      platform_post_ids: { tiktok: { status: "published", at: at(-5) }, instagram: { status: "pending_confirmation" } },
    });
    expect(refusal(() => planUpdate(part, { platforms: ["tiktok"] }, NOW)).code).toBe("conflict");
    expect(refusal(() => planUpdate(part, { platforms: ["tiktok", "instagram", "youtube"] }, NOW)).code).toBe("conflict");
    // the same platforms, in another order, is no change
    expect(planUpdate(part, { platforms: ["instagram", "tiktok"] }, NOW)).toMatchObject({
      platform_post_ids: { instagram: { status: "pending_confirmation" }, tiktok: { status: "published", at: at(-5) } },
    });
  });

  it.each(["published", "failed", "draft", "publishing"])("will not change a post that is %s", (status) => {
    expect(refusal(() => planUpdate(row({ status }), { caption: "x" }, NOW)).code).toBe("conflict");
  });

  it("explains a refusal for a post that has been posted", () => {
    expect(refusal(() => planUpdate(row({ status: "published" }), { caption: "x" }, NOW)).message).toMatch(/has been posted/);
  });

  it("checks what it is given before changing anything", () => {
    expect(refusal(() => planUpdate(row(), { caption: " " }, NOW)).code).toBe("invalid");
    expect(refusal(() => planUpdate(row(), { platforms: ["myspace"] }, NOW)).code).toBe("invalid");
  });
});
