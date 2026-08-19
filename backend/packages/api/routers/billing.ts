import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../context";
import { TRPCError } from "@trpc/server";
import { initiatePaystackTransaction, createStripeCheckoutSession } from "@poststreak/integrations";

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

      // price_ngn/price_usd are stored in minor units (kobo/cents) — same
      // convention as payment_transactions.amount and earnings_events.amount
      // elsewhere in this schema. An integer column can't hold a fractional
      // dollar amount like $9.99 precisely, so "whole units, multiply by 100
      // here" (the previous approach) would silently corrupt any
      // non-whole-dollar price — $9.99 stored as 9 becomes $9.00, or worse,
      // 999 stored under a whole-unit assumption becomes $999.00.
      const amountMinorUnits =
        input.processor === "paystack" ? plan.price_ngn : plan.price_usd;
      const currency = input.processor === "paystack" ? "NGN" : "USD";

      if (!amountMinorUnits) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `No ${currency} price set for this plan`,
        });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://poststreak.app";
      let checkoutUrl: string;

      if (input.processor === "paystack") {
        const result = await initiatePaystackTransaction({
          email: ctx.user.email,
          amountKobo: amountMinorUnits,
          currency: "NGN",
          callbackUrl: `${appUrl}/billing?payment=success`,
          metadata: { user_id: ctx.user.id, plan_id: plan.id, plan_slug: plan.slug },
        });
        checkoutUrl = result.url;
      } else {
        const result = await createStripeCheckoutSession({
          customerEmail: ctx.user.email,
          amountUsdCents: amountMinorUnits,
          productName: plan.name,
          successUrl: `${appUrl}/billing?payment=success`,
          cancelUrl: `${appUrl}/billing?payment=cancelled`,
          metadata: { user_id: ctx.user.id, plan_id: plan.id, plan_slug: plan.slug },
        });
        checkoutUrl = result.url;
      }

      // Track analytics
      await ctx.supabase.from("analytics_events").insert({
        user_id: ctx.user.id,
        event_name: "checkout_initiated",
        properties: {
          plan: plan.slug,
          processor: input.processor,
          amount: amountMinorUnits,
          currency,
        },
      });

      return {
        checkoutUrl,
        plan,
        processor: input.processor,
        amount: amountMinorUnits,
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
