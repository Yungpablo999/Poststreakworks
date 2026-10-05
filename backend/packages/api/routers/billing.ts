import { z } from "zod";
import { createTRPCRouter, protectedProcedure, createSupabaseServiceClient } from "../context";
import { TRPCError } from "@trpc/server";
import { initiatePaystackTransaction, createStripeCheckoutSession, setStripeCancelAtPeriodEnd } from "@poststreak/integrations";
import { currentSubscription } from "@poststreak/workflows";
import { appReturnUrl, buildOffer, paystackReady, stripeReady } from "../lib/billing-offer";

// Pro: what's on sale, buying it, and stopping or resuming its renewal.
//
// A creator never makes themselves Pro: a payment processor's verified webhook does
// (apps/web/app/api/payments/*, packages/workflows/billing.ts). Cancelling goes to the processor first,
// so the card really stops being charged, and only then to our own record of it.

async function proPlan(db: ReturnType<typeof createSupabaseServiceClient>) {
  const { data, error } = await db
    .from("subscription_plans")
    .select("id, name, slug, price_usd, price_ngn")
    .eq("slug", "pro")
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Couldn't read the plans" });
  return data as { id: string; name: string; slug: string; price_usd: number | null; price_ngn: number | null } | null;
}

export const billingRouter = createTRPCRouter({
  /** All active plans. */
  getPlans: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase.from("subscription_plans").select("*").eq("is_active", true).order("price_ngn", { ascending: true });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch plans" });
    return data;
  }),

  /** What the Pro page shows: price, what each plan allows, and whether a payment can be taken here. */
  offer: protectedProcedure.query(async () => buildOffer(await proPlan(createSupabaseServiceClient()))),

  /** The creator's current subscription (paid for, not past its period), or null. */
  getSubscription: protectedProcedure.query(async ({ ctx }) => currentSubscription(ctx.user.id, createSupabaseServiceClient())),

  /** Payment history. */
  getTransactions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("payment_transactions")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false })
        .limit(input.limit);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch transactions" });
      return data;
    }),

  /** A checkout page for Pro. The creator comes back to the app (?payment=success|cancelled). */
  createCheckout: protectedProcedure
    .input(z.object({ processor: z.enum(["stripe", "paystack"]).default("stripe") }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.tier !== "free") throw new TRPCError({ code: "BAD_REQUEST", message: "You already have Pro." });
      const plan = await proPlan(createSupabaseServiceClient());
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Pro isn't on sale right now." });

      const ready = input.processor === "stripe" ? stripeReady(process.env) && plan.price_usd : paystackReady(process.env) && plan.price_ngn;
      if (!ready) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Payments aren't switched on yet. Please try again later." });
      }

      const metadata = { user_id: ctx.user.id, plan_id: plan.id, plan_slug: plan.slug };
      let checkoutUrl: string;
      try {
        checkoutUrl =
          input.processor === "paystack"
            ? (
                await initiatePaystackTransaction({
                  email: ctx.user.email,
                  amountKobo: plan.price_ngn!,
                  currency: "NGN",
                  callbackUrl: appReturnUrl("success"),
                  metadata,
                })
              ).url
            : (
                await createStripeCheckoutSession({
                  customerEmail: ctx.user.email,
                  amountUsdCents: plan.price_usd!,
                  productName: plan.name,
                  successUrl: appReturnUrl("success"),
                  cancelUrl: appReturnUrl("cancelled"),
                  metadata,
                })
              ).url;
      } catch (err) {
        console.error("Checkout:", err instanceof Error ? err.message : err);
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Couldn't open the payment page. Please try again." });
      }

      await ctx.track("checkout_initiated", { plan: plan.slug, processor: input.processor });
      return { checkoutUrl, processor: input.processor };
    }),

  /** Stops the renewal: Pro stays until the end of the period already paid for. */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => setRenewal(ctx.user.id, false, ctx.track)),

  /** Turns the renewal back on (before the period ends). */
  reactivateSubscription: protectedProcedure.mutation(async ({ ctx }) => setRenewal(ctx.user.id, true, ctx.track)),
});

async function setRenewal(userId: string, renew: boolean, track: (name: string, props?: Record<string, unknown>) => Promise<void>) {
  const db = createSupabaseServiceClient();
  const sub = await currentSubscription(userId, db);
  if (!sub) throw new TRPCError({ code: "NOT_FOUND", message: "You don't have Pro right now." });

  if (sub.processor !== "stripe" || !sub.processor_subscription_id) {
    // A one-off payment (Paystack) never renews: nothing to stop, and nothing to turn back on
    if (renew) throw new TRPCError({ code: "BAD_REQUEST", message: "This month was a one-off payment, so there's no renewal to turn on. Buy another month when it ends." });
    return { cancelAtPeriodEnd: true, renewsAt: null, endsAt: sub.current_period_end };
  }

  try {
    await setStripeCancelAtPeriodEnd(sub.processor_subscription_id, !renew);
  } catch (err) {
    console.error("Stripe renewal change:", err instanceof Error ? err.message : err);
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Couldn't reach the payment provider. Nothing was changed; please try again." });
  }
  // Stripe will confirm with customer.subscription.updated; this keeps the app truthful in the meantime
  const { error } = await db.from("subscriptions").update({ cancel_at_period_end: !renew }).eq("id", sub.id);
  if (error) console.error("Subscription update after Stripe:", error.message); // Stripe's notice will set it

  await track(renew ? "subscription_reactivated" : "subscription_cancel_initiated");
  return renew
    ? { cancelAtPeriodEnd: false, renewsAt: sub.current_period_end, endsAt: null }
    : { cancelAtPeriodEnd: true, renewsAt: null, endsAt: sub.current_period_end };
}
