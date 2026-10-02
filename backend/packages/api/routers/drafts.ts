import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";
import { appPlatformSchema, toAppPlatform, toDbPlatform } from "../lib/platforms";

// Drafts saved from Script, the post composer and Jarvis ("Ghost, save it to
// drafts"). The app addresses a draft by a string id it chooses and upserts on
// it; that id is stored as drafts.client_key. Creators own their drafts, so
// this uses the caller's own client and RLS (drafts_*_own) is the guard.

const draftInput = z.object({
  /** The app's draft id, e.g. "jarvis-My morning reset". */
  id: z.string().min(1).max(160),
  title: z.string().trim().min(1).max(300),
  kind: z.enum(["script", "post"]),
  format: z.string().max(80),
  platform: appPlatformSchema.optional(),
  /** Room for the script / caption / slides once the composer saves them. */
  payload: z
    .record(z.unknown())
    .default({})
    // The table caps this at 64 KB; refuse a too-large one with a clear 400
    // instead of a database error.
    .refine((payload) => JSON.stringify(payload).length <= 60_000, "This draft is too large to save"),
});

type DraftRow = {
  client_key: string;
  title: string;
  kind: "script" | "post";
  format: string;
  platform: string | null;
  payload: Record<string, unknown>;
  updated_at: string;
};

const COLUMNS = "client_key, title, kind, format, platform, payload, updated_at";

function toDraft(row: DraftRow) {
  return {
    id: row.client_key,
    title: row.title,
    kind: row.kind,
    format: row.format,
    platform: row.platform ? (toAppPlatform(row.platform) ?? undefined) : undefined,
    payload: row.payload,
    savedAt: new Date(row.updated_at).getTime(),
  };
}

export const draftsRouter = createTRPCRouter({
  /** Newest first. */
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("drafts")
      .select(COLUMNS)
      .eq("user_id", ctx.user.id)
      .order("updated_at", { ascending: false })
      .limit(200);

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch drafts" });
    }
    return (data as DraftRow[]).map(toDraft);
  }),

  /** Adds a draft, or updates the one with the same id and moves it to the top. */
  save: protectedProcedure.input(draftInput).mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase
      .from("drafts")
      .upsert(
        {
          user_id: ctx.user.id,
          client_key: input.id,
          title: input.title,
          kind: input.kind,
          format: input.format,
          platform: input.platform ? toDbPlatform(input.platform) : null,
          payload: input.payload,
        },
        { onConflict: "user_id,client_key" },
      )
      .select(COLUMNS)
      .single();

    if (error) {
      if (error.message.includes("row_cap_exceeded")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You've reached the draft limit. Delete a few drafts to save more.",
        });
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save draft" });
    }

    await ctx.track("draft_saved", { kind: input.kind, platform: input.platform ?? null });
    return toDraft(data as DraftRow);
  }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(160) }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("drafts")
        .delete()
        .eq("user_id", ctx.user.id)
        .eq("client_key", input.id);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete draft" });
      }
      return { removed: true };
    }),
});
