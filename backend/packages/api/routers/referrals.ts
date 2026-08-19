import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";

// Ported from v1's src/app/api/referral/route.ts. Carried-over domain — not
// in the original 8-stage architecture, confirmed to keep on migration
// (see supabase/migrations/20260814000013_carried_over_v1_domains.sql).

export const referralsRouter = createTRPCRouter({
  /**
   * Get (or lazily create) this user's referral code, share link, and count
   * of paid referrals. v1's "get or create on first read" pattern rather
   * than provisioning a code at signup.
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    let { data: ref } = await ctx.supabase
      .from("referrals")
      .select("referral_code")
      .eq("referrer_user_id", ctx.user.id)
      .is("referred_user_id", null)
      .single();

    if (!ref) {
      const code = ctx.user.id.replace(/-/g, "").slice(0, 8);
      const { data: created, error } = await ctx.supabase
        .from("referrals")
        .insert({ referrer_user_id: ctx.user.id, referral_code: code })
        .select("referral_code")
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create referral code",
        });
      }
      ref = created;
    }

    const { count: paidReferrals } = await ctx.supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_user_id", ctx.user.id)
      .not("referred_user_id", "is", null)
      .not("paid_at", "is", null);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://poststreak.app";

    return {
      code: ref?.referral_code,
      link: `${appUrl}/r/${ref?.referral_code}`,
      paidReferrals: paidReferrals ?? 0,
    };
  }),
});
