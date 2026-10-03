import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";
import { refreshEverydayNotes, type NoteKind, type NoteTarget } from "@poststreak/workflows";

// The bell. The server writes the notifications (a welcome, quest and level news, "your post went
// out", "reconnect TikTok"…, each once); the creator reads them and marks them read. Nothing here
// is made up by the app.

const KINDS: readonly NoteKind[] = ["jarvis", "growth", "star", "clock", "flag", "link", "mic", "calendar", "pro"];
const TARGETS: readonly NoteTarget[] = ["create", "accounts", "challenge", "jarvis-pro", "platform-growth", "post-performance", "schedule", "quests", "home"];

export type NotificationItem = {
  id: string;
  kind: NoteKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  action: { label: string; target: NoteTarget } | null;
};

type Row = {
  id: string;
  title: string;
  body: string;
  action_text: string | null;
  metadata: { kind?: string; target?: string | null } | null;
  read: boolean;
  created_at: string;
};

/** A database row as the bell shows it. Unknown icons and places fall back, so an old note never breaks the sheet. */
export function toItem(row: Row): NotificationItem {
  const kind = KINDS.find((k) => k === row.metadata?.kind) ?? "jarvis";
  const target = TARGETS.find((t) => t === row.metadata?.target);
  return {
    id: row.id,
    kind,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    read: row.read,
    action: row.action_text && target ? { label: row.action_text, target } : null,
  };
}

export const notificationsRouter = createTRPCRouter({
  /** The latest notifications, newest first, plus how many are unread. */
  feed: protectedProcedure.query(async ({ ctx }) => {
    await refreshEverydayNotes(ctx.user.id, ctx.user.tier);

    const { data, error } = await ctx.supabase
      .from("notifications")
      .select("id, title, body, action_text, metadata, read, created_at")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch notifications" });

    const items = ((data ?? []) as Row[]).map(toItem);
    return { items, unread: items.filter((i) => !i.read).length };
  }),

  /** Marks the given notifications read, or every unread one when no ids are given. */
  markRead: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).max(100).optional() }))
    .mutation(async ({ ctx, input }) => {
      let query = ctx.supabase.from("notifications").update({ read: true }).eq("user_id", ctx.user.id).eq("read", false);
      if (input.ids) query = query.in("id", input.ids);
      const { error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to mark notifications read" });

      const { count } = await ctx.supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ctx.user.id)
        .eq("read", false);
      return { unread: count ?? 0 };
    }),
});
