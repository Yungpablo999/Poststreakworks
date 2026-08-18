import { z } from "zod";
import { createTRPCRouter, protectedProcedure, staffProcedure } from "../context";
import { TRPCError } from "@trpc/server";

export const billingRouter = createTRPCRouter({
  /**
   * List all active subscription plans.
   */
  getPlans: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price_ngn", { ascending: true });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch plans",
      });
    }

    return data;
  }),

  /**
   * Get the current user's active subscription.
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("subscriptions")
      .select("*, subscription_plans(*)")
      .eq("user_id", ctx.user.id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error?.code === "PGRST116") return null;
    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subscription",
      });
    }

    return data;
  }),

  /**
   * Get payment transaction history.
   */
  getTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("payment_transactions")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false })
        .limit(input.limit);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch transactions",
        });
      }

      return data;
    }),

  /**
   * Create a checkout session for a plan upgrade.
   */
  createCheckout: protectedProcedure
    .input(
      z.object({
        planId: z.string().uuid(),
        processor: z.enum(["paystack", "stripe"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch the plan
      const { data: plan, error: planErr } = await ctx.supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", input.planId)
        .eq("is_active", true)
        .single();

      if (planErr || !plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found or inactive",
        });
      }

      const amount =
        input.processor === "paystack" ? plan.price_ngn : plan.price_usd;
      const currency = input.processor === "paystack" ? "NGN" : "USD";

      if (!amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `No ${currency} price set for this plan`,
        });
      }

      // TODO: Integrate with Paystack/Stripe checkout
      // For now, return a placeholder response
      const checkoutUrl =
        input.processor === "paystack"
          ? `https://checkout.paystack.com/${plan.slug}`
          : `https://checkout.stripe.com/${plan.slug}`;

      // Track analytics
      await ctx.supabase.from("analytics_events").insert({
        user_id: ctx.user.id,
        event_name: "checkout_initiated",
        properties: {
          plan: plan.slug,
          processor: input.processor,
          amount,
          currency,
        },
      });

      return {
        checkoutUrl,
        plan,
        processor: input.processor,
        amount,
        currency,
      };
    }),

  /**
   * Cancel subscription (takes effect at period end).
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("subscriptions")
      .update({ cancel_at_period_end: true })
      .eq("user_id", ctx.user.id)
      .in("status", ["active", "trialing"])
      .select()
      .single();

    if (error?.code === "PGRST116") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active subscription to cancel",
      });
    }
    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel subscription",
      });
    }

    // Track analytics
    await ctx.supabase.from("analytics_events").insert({
      user_id: ctx.user.id,
      event_name: "subscription_cancel_initiated",
    });

    return data;
  }),

  /**
   * Reactivate a cancelled subscription (if still within period).
   */
  reactivateSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("subscriptions")
      .update({ cancel_at_period_end: false })
      .eq("user_id", ctx.user.id)
      .eq("cancel_at_period_end", true)
      .in("status", ["active", "trialing"])
      .select()
      .single();

    if (error?.code === "PGRST116") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No cancelled subscription to reactivate",
      });
    }
    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to reactivate subscription",
      });
    }

    return data;
  }),
});
