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

  it("matches a post the creator confirmed by hand to the one the sync found, by platform and time", () => {
    const items = mergeCalendar([scheduled({ status: "published", published_at: "2026-10-02T09:00:00Z" })], [synced({ posted_at: "2026-10-02T11:00:00Z" })]);
    expect(items).toHaveLength(1);
  });

  it("keeps them apart when they are different times or platforms", () => {
    expect(mergeCalendar([scheduled({ status: "published", published_at: "2026-10-02T09:00:00Z" })], [synced({ posted_at: "2026-10-05T09:00:00Z" })])).toHaveLength(2);
    expect(mergeCalendar([scheduled({ status: "published", published_at: "2026-10-02T09:00:00Z" })], [synced({ platform: "instagram", posted_at: "2026-10-02T09:10:00Z" })])).toHaveLength(2);
  });

  it("says a post is ready when it is time to post it by hand", () => {
    expect(mergeCalendar([scheduled({ status: "pending_confirmation" })], [])[0]!.status).toBe("ready");
  });

  it("leaves out posts that failed or were cancelled", () => {
    expect(mergeCalendar([scheduled({ status: "failed" })], [])).toEqual([]);
  });

  it("shows a post once per platform it targets", () => {
    expect(mergeCalendar([scheduled({ target_platforms: ["tiktok", "instagram"] })], [])).toHaveLength(2);
  });
});
