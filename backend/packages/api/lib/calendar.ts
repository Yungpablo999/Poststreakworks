import { toAppPlatform } from "./platforms";

// The creator's calendar: what they planned (scheduled_posts) and what they posted (read from their
// connected accounts, post_stats), in one list. A post made through PostStreak that a sync has
// since found on the platform is one post, not two: the database links them by the platform's id
// when the sync finds it (migration …25), so here they are matched by that id and nothing is guessed.

export type CalendarStatus = "draft" | "scheduled" | "ready" | "posted";

export type CalendarItem = {
  id: string;
  /** Planned in PostStreak, or read from the creator's account. */
  kind: "scheduled" | "synced";
  title: string;
  platform: string;
  /** ISO time it goes (or went) out. */
  at: string;
  /** "ready" = it is time and the creator needs to post it and confirm (assisted platforms). */
  status: CalendarStatus;
  /** A link to the live post, when the platform gave one. */
  url?: string;
};

export const SAME_POST_WINDOW_MS = 6 * 3600_000;

const titleOf = (text: string): string => {
  const line = text.split("\n")[0]?.trim() ?? "";
  return line.length > 90 ? `${line.slice(0, 89).trimEnd()}…` : line || "Untitled post";
};

export type ScheduledRow = {
  id: string;
  content: string;
  target_platforms: string[];
  scheduled_at: string;
  status: string;
  published_at: string | null;
  platform_post_ids: Record<string, { status?: string; id?: string; url?: string; at?: string } | undefined> | null;
};
export type SyncedRow = { platform: string; platform_post_id: string; title: string; posted_at: string; share_url: string | null };

/**
 * Where one platform of a planned post stands. A post can be partly posted (TikTok done, Instagram
 * still to do), so the platform's own step decides first and the post's status is the fallback.
 * null = not shown (failed, or not a kind of post the calendar knows).
 */
function statusOf(rowStatus: string, stepStatus: string | undefined): CalendarStatus | null {
  if (stepStatus === "published" || rowStatus === "published") return "posted";
  if (stepStatus === "failed" || rowStatus === "failed") return null;
  if (rowStatus === "pending_confirmation") return "ready";
  if (rowStatus === "draft") return "draft";
  if (rowStatus === "scheduled" || rowStatus === "publishing") return "scheduled";
  return null;
}

/** The list the calendar shows. Pure, so the matching rules are tested without a database. */
export function mergeCalendar(scheduled: ScheduledRow[], synced: SyncedRow[]): CalendarItem[] {
  const items: CalendarItem[] = [];
  const claimed = new Set<string>(); // synced posts already shown as a scheduled one

  for (const row of scheduled) {
    for (const platform of row.target_platforms) {
      const app = toAppPlatform(platform);
      if (!app) continue;
      const step = row.platform_post_ids?.[platform];
      const status = statusOf(row.status, step?.status);
      if (!status) continue;
      const title = titleOf(row.content);

      if (status !== "posted") {
        items.push({ id: row.id, kind: "scheduled", title, platform: app, at: row.scheduled_at, status });
        continue;
      }
      const twin = step?.id ? synced.find((s) => s.platform === platform && s.platform_post_id === step.id) : undefined;
      if (twin) {
        // The platform's own record of it wins (it has the link); show it once, as posted
        claimed.add(`${twin.platform}:${twin.platform_post_id}`);
        const url = twin.share_url ?? step?.url;
        items.push({ id: row.id, kind: "scheduled", title, platform: app, at: twin.posted_at, status: "posted", ...(url && { url }) });
        continue;
      }
      items.push({
        id: row.id,
        kind: "scheduled",
        title,
        platform: app,
        at: step?.at ?? row.published_at ?? row.scheduled_at,
        status: "posted",
        ...(step?.url && { url: step.url }),
      });
    }
  }

  for (const s of synced) {
    if (claimed.has(`${s.platform}:${s.platform_post_id}`)) continue;
    const app = toAppPlatform(s.platform);
    if (!app) continue;
    items.push({ id: `${s.platform}:${s.platform_post_id}`, kind: "synced", title: titleOf(s.title || ""), platform: app, at: s.posted_at, status: "posted", ...(s.share_url && { url: s.share_url }) });
  }

  return items.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

