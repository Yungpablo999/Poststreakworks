import { getServiceClient } from "./service-client";

// Notifications the server writes: welcome notes, quest and level news, "your post
// went out", "reconnect TikTok". The bell in the app reads them; a creator can only
// mark them read (migration …21).
//
// Every one carries a stable `key`, and the pair (creator, key) is unique, so an event
// that is reported twice (a cron that runs twice, a retried request) still makes one
// notification. Writing one must never fail the action that caused it.

/** The icon the bell draws. Same names as `Kind` in src/components/notifications/NotificationsSheet.tsx. */
export type NoteKind = "jarvis" | "growth" | "star" | "clock" | "flag" | "link" | "mic" | "calendar" | "pro";

/** Where tapping the note's button takes the creator. Same names as `NoteTarget` in the app. */
export type NoteTarget =
  | "create"
  | "accounts"
  | "challenge"
  | "jarvis-pro"
  | "platform-growth"
  | "post-performance"
  | "schedule"
  | "quests"
  | "home";

/** The database enum `notification_type`. */
export type NotificationType = "streak" | "collab" | "quest" | "level" | "growth" | "match" | "message" | "system";

export type NewNotification = {
  key: string;
  type: NotificationType;
  kind: NoteKind;
  title: string;
  body: string;
  action?: { label: string; target: NoteTarget };
};

export async function notify(userId: string, note: NewNotification): Promise<void> {
  try {
    const { error } = await getServiceClient()
      .from("notifications")
      .upsert(
        {
          user_id: userId,
          key: note.key,
          type: note.type,
          title: note.title,
          body: note.body,
          action_text: note.action?.label ?? null,
          metadata: { kind: note.kind, target: note.action?.target ?? null },
        },
        { onConflict: "user_id,key", ignoreDuplicates: true },
      );
    if (error) console.error(`notify failed (${note.key}):`, error.message);
  } catch (err) {
    console.error(`notify failed (${note.key}):`, err instanceof Error ? err.message : err);
  }
}
