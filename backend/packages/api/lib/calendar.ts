import { toAppPlatform } from "./platforms";

// The creator's calendar: what they planned (scheduled_posts) and what they posted (read from their
// connected accounts, post_stats), in one list. A post made through PostStreak that a sync has
// since found on the platform is one post, not two (matched by its platform id, or, for posts the
// creator confirmed by hand, by being the same platform within a few hours).

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
  platform_post_ids: Record<string, { id?: string } | undefined> | null;
};
export type SyncedRow = { platform: string; platform_post_id: string; title: string; posted_at: string; share_url: string | null };

/** The list the calendar shows. Pure, so the matching rules are tested without a database. */
export function mergeCalendar(scheduled: ScheduledRow[], synced: SyncedRow[]): CalendarItem[] {
  const items: CalendarItem[] = [];
  const claimed = new Set<string>(); // synced posts already shown as a scheduled one

  for (const row of scheduled) {
    const status: CalendarStatus | null =
      row.status === "published"
        ? "posted"
        : row.status === "pending_confirmation"
          ? "ready"
          : row.status === "draft"
            ? "draft"
            : row.status === "scheduled" || row.status === "publishing"
              ? "scheduled"
              : null;
    if (!status) continue; // failed / cancelled
    const at = row.published_at ?? row.scheduled_at;
    for (const platform of row.target_platforms) {
      const app = toAppPlatform(platform);
      if (!app) continue;
      if (status === "posted") {
        const knownId = row.platform_post_ids?.[platform]?.id;
        const twin = synced.find(
          (s) => s.platform === platform && (s.platform_post_id === knownId || Math.abs(Date.parse(s.posted_at) - Date.parse(at)) < SAME_POST_WINDOW_MS),
        );
        if (twin) {
          // The platform's own record of it wins (it has the link); show it once, as posted
          claimed.add(`${twin.platform}:${twin.platform_post_id}`);
          items.push({ id: row.id, kind: "scheduled", title: titleOf(row.content), platform: app, at: twin.posted_at, status: "posted", ...(twin.share_url && { url: twin.share_url }) });
          continue;
        }
      }
      items.push({ id: row.id, kind: "scheduled", title: titleOf(row.content), platform: app, at, status });
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

