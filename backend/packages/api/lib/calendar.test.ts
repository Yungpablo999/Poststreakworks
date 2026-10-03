import { describe, expect, it } from "vitest";
import { mergeCalendar, type ScheduledRow, type SyncedRow } from "../lib/calendar";

const scheduled = (over: Partial<ScheduledRow> = {}): ScheduledRow => ({
  id: "s1",
  content: "First line\nsecond line",
  target_platforms: ["tiktok"],
  scheduled_at: "2026-10-03T18:00:00Z",
  status: "scheduled",
  published_at: null,
  platform_post_ids: null,
  ...over,
});
const synced = (over: Partial<SyncedRow> = {}): SyncedRow => ({
  platform: "tiktok",
  platform_post_id: "v1",
  title: "A synced post",
  posted_at: "2026-10-02T10:00:00Z",
  share_url: "https://www.tiktok.com/@x/video/v1",
  ...over,
});

describe("the calendar", () => {
  it("lists what is planned and what was posted, in time order", () => {
    const items = mergeCalendar([scheduled()], [synced()]);
    expect(items.map((i) => [i.kind, i.status])).toEqual([
      ["synced", "posted"],
      ["scheduled", "scheduled"],
    ]);
    expect(items[1]!.title).toBe("First line");
  });

  it("shows a post once when a sync has found the one the creator published (same platform id)", () => {
    const items = mergeCalendar(
      [scheduled({ status: "published", published_at: "2026-10-02T09:00:00Z", platform_post_ids: { tiktok: { id: "v1" } } })],
      [synced({ posted_at: "2026-10-02T09:30:00Z" })],
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: "scheduled", status: "posted", url: "https://www.tiktok.com/@x/video/v1" });
  });

  it("shows a post the creator confirmed by hand once the database has linked it to the one the sync found", () => {
    const items = mergeCalendar(
      [scheduled({ status: "published", published_at: "2026-10-02T09:00:00Z", platform_post_ids: { tiktok: { status: "published", id: "v1", at: "2026-10-02T09:00:00Z" } } })],
      [synced({ posted_at: "2026-10-02T11:00:00Z" })],
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: "scheduled", at: "2026-10-02T11:00:00Z", url: "https://www.tiktok.com/@x/video/v1" });
  });

  it("does not guess: a confirmed post that is not linked stays apart from a post found nearby", () => {
    const confirmed = scheduled({ status: "published", published_at: "2026-10-02T09:00:00Z", platform_post_ids: { tiktok: { status: "published", at: "2026-10-02T09:00:00Z" } } });
    expect(mergeCalendar([confirmed], [synced({ posted_at: "2026-10-02T09:10:00Z" })])).toHaveLength(2);
    expect(mergeCalendar([confirmed], [synced({ posted_at: "2026-10-05T09:00:00Z" })])).toHaveLength(2);
    expect(mergeCalendar([confirmed], [synced({ platform: "instagram", platform_post_id: "v1", posted_at: "2026-10-02T09:10:00Z" })])).toHaveLength(2);
  });

  it("shows when the creator said they posted it, and the link they gave", () => {
    const [item] = mergeCalendar(
      [
        scheduled({
          status: "published",
          scheduled_at: "2026-10-02T08:00:00Z",
          published_at: "2026-10-02T09:00:00Z",
          platform_post_ids: { tiktok: { status: "published", url: "https://www.tiktok.com/@x/video/9", at: "2026-10-02T08:55:00Z" } },
        }),
      ],
      [],
    );
    expect(item).toMatchObject({ status: "posted", at: "2026-10-02T08:55:00Z", url: "https://www.tiktok.com/@x/video/9" });
  });

  it("shows each platform of a post where it stands: posted on one, still to post on the other", () => {
    const items = mergeCalendar(
      [
        scheduled({
          status: "pending_confirmation",
          target_platforms: ["tiktok", "instagram"],
          platform_post_ids: { tiktok: { status: "published", at: "2026-10-03T18:05:00Z" }, instagram: { status: "pending_confirmation" } },
        }),
      ],
      [],
    );
    // in time order: Instagram was due at 18:00, TikTok was posted at 18:05
    expect(items.map((i) => [i.platform, i.status])).toEqual([
      ["instagram", "ready"],
      ["tiktok", "posted"],
    ]);
  });

  it("shows a post that was posted early as posted, though its time hasn't come", () => {
    const [item] = mergeCalendar([scheduled({ platform_post_ids: { tiktok: { status: "published", at: "2026-10-03T07:00:00Z" } } })], []);
    expect(item).toMatchObject({ status: "posted", at: "2026-10-03T07:00:00Z" });
  });

  it("says a post is ready when it is time to post it by hand", () => {
    expect(mergeCalendar([scheduled({ status: "pending_confirmation" })], [])[0]!.status).toBe("ready");
  });

  it("leaves out posts that failed or were cancelled", () => {
    expect(mergeCalendar([scheduled({ status: "failed" })], [])).toEqual([]);
    expect(mergeCalendar([scheduled({ platform_post_ids: { tiktok: { status: "failed" } } })], [])).toEqual([]);
  });

  it("shows a post once per platform it targets", () => {
    expect(mergeCalendar([scheduled({ target_platforms: ["tiktok", "instagram"] })], [])).toHaveLength(2);
  });
});
