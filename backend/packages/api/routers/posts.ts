import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../context";
import { PostError, createPost, deletePost, getPost, listReadyPosts, markPosted, updatePost } from "@poststreak/workflows";

// A creator's posts: planned, ready, posted. The rules (and why creators can't write the table
// themselves) are in workflows/posts.ts; this only carries requests to it and turns its refusals
// into the right status codes.

function fail(err: unknown): never {
  if (err instanceof PostError) {
    const code = err.code === "not_found" ? "NOT_FOUND" : err.code === "conflict" ? "CONFLICT" : "BAD_REQUEST";
    throw new TRPCError({ code, message: err.message });
  }
  console.error("posts:", err instanceof Error ? err.message : err);
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong with that post. Try again." });
}

const id = z.object({ id: z.string().uuid() });

// Sizes are capped here; the friendly messages for what is wrong with the content come from the workflow.
const tags = z.array(z.string().max(200)).max(100);
const platforms = z.array(z.string().max(20)).max(10);

export const postsRouter = createTRPCRouter({
  get: protectedProcedure.input(id).query(async ({ ctx, input }) => {
    try {
      return await getPost(ctx.user.id, input.id);
    } catch (err) {
      return fail(err);
    }
  }),

  /** Posts whose time has come and are waiting for the creator to post them. */
  ready: protectedProcedure.query(async ({ ctx }) => {
    try {
      return { posts: await listReadyPosts(ctx.user.id) };
    } catch (err) {
      return fail(err);
    }
  }),

  /** Plans a post for a time, or makes it ready right now. */
  create: protectedProcedure
    .input(
      z.object({
        caption: z.string().max(20_000),
        tags: tags.optional(),
        platforms,
        format: z.string().max(40).nullish(),
        when: z.enum(["now", "schedule"]),
        at: z.string().max(40).optional(),
        fromDraft: z.string().min(1).max(160).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const post = await createPost(ctx.user.id, input);
        await ctx.track("post_planned", { when: input.when, platforms: post.platforms.map((p) => p.platform), format: post.format, tags: post.tags.length });
        return post;
      } catch (err) {
        return fail(err);
      }
    }),

  /** Changes the caption, tags, platforms or time of a post that hasn't been posted. A new time makes a ready post wait for it. */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        caption: z.string().max(20_000).optional(),
        tags: tags.optional(),
        platforms: platforms.optional(),
        format: z.string().max(40).nullable().optional(),
        at: z.string().max(40).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id: postId, ...patch } = input;
      try {
        return await updatePost(ctx.user.id, postId, patch);
      } catch (err) {
        return fail(err);
      }
    }),

  remove: protectedProcedure.input(id).mutation(async ({ ctx, input }) => {
    try {
      await deletePost(ctx.user.id, input.id);
      return { removed: true };
    } catch (err) {
      return fail(err);
    }
  }),

  /** "I posted it", for one platform. The post is posted once every platform it was planned for is. */
  markPosted: protectedProcedure
    .input(z.object({ id: z.string().uuid(), platform: z.string().max(20), url: z.string().max(600).nullish() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await markPosted(ctx.user.id, input.id, { platform: input.platform, url: input.url ?? null });
        if (result.streak) await ctx.track("post_confirmed", { platform: input.platform, has_link: Boolean(input.url) });
        return result;
      } catch (err) {
        return fail(err);
      }
    }),
});
