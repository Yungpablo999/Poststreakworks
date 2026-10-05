import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type NextRequest } from "next/server";
import { getServiceClient } from "@poststreak/workflows";
import { enforceRateLimit } from "./rate-limit";

// ============================================================================
// Types
// ============================================================================
export type User = {
  id: string;
  email: string;
  role: "creator" | "staff_admin";
  accountStatus: string;
  // Dual-tier entitlements (architecture/SUBSCRIPTION_AND_DUAL_TIER_ROUTING.md).
  // 'founding' isn't derivable from `subscriptions` — there's no data source
  // for it anywhere yet (no founding-tier flag on any table) — resolves to
  // 'pro' for now; whoever designs that tier needs a real column to check.
  tier: "free" | "pro" | "founding";
};

export type Context = {
  /** The caller's own client: RLS applies. Use for reads and user-authored rows. */
  supabase: SupabaseClient;
  user: User | null;
  /**
   * Records an analytics event for the caller. Written with the service role —
   * analytics_events has no client insert policy on purpose (the free-tier AI
   * quota counts these rows, so clients must not be able to write them). Never
   * throws: analytics must not break the request it describes.
   */
  track: (eventName: string, properties?: Record<string, unknown>) => Promise<void>;
};

// ============================================================================
// Supabase client factories
// ============================================================================

/**
 * Server-side client for web requests.
 * Uses cookie-based auth (same-origin requests).
 */
export function createSupabaseServerClient(
  reqHeaders: Headers,
  resHeaders: Headers,
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = reqHeaders.get("cookie")
            ?.split("; ")
            .find((c) => c.startsWith(`${name}=`));
          return cookie?.split("=").slice(1).join("=") ?? undefined;
        },
        set(name: string, value: string, options: CookieOptions) {
          const cookie = `${name}=${value}; ${Object.entries(options)
            .map(([k, v]) => `${k}=${v}`)
            .join("; ")}`;
          resHeaders.append("Set-Cookie", cookie);
        },
        remove(name: string, options: CookieOptions) {
          const cookie = `${name}=; Max-Age=0; ${Object.entries(options)
            .map(([k, v]) => `${k}=${v}`)
            .join("; ")}`;
          resHeaders.append("Set-Cookie", cookie);
        },
      },
    },
  );
}

/**
 * Server-side client using service role key (bypasses RLS).
 * Used for webhook verification and server-authoritative writes — always
 * filter by an explicit user id. Shared, memoised instance; see
 * packages/workflows/service-client.ts.
 */
export function createSupabaseServiceClient() {
  return getServiceClient();
}

/**
 * Client using a bearer token (mobile app requests).
 */
export function createSupabaseBearerClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

// ============================================================================
// Auth resolution
// ============================================================================

async function resolveUser(
  supabase: SupabaseClient,
): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const [{ data: psUser }, { data: subscription }] = await Promise.all([
    supabase.from("users").select("role, account_status").eq("id", user.id).single(),
    supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle(),
  ]);

  if (!psUser) return null;

  return {
    id: user.id,
    email: user.email!,
    role: (psUser.role as "creator" | "staff_admin") ?? "creator",
    accountStatus: psUser.account_status ?? "active",
    tier: subscription ? "pro" : "free",
  };
}

// ============================================================================
// tRPC context creation
// ============================================================================

function makeTracker(user: User | null): Context["track"] {
  return async (eventName, properties = {}) => {
    if (!user) return;
    try {
      const { error } = await getServiceClient().from("analytics_events").insert({
        user_id: user.id,
        event_name: eventName,
        properties,
      });
      if (error) console.error(`analytics insert failed (${eventName}):`, error.message);
    } catch (err) {
      console.error(`analytics insert failed (${eventName}):`, err instanceof Error ? err.message : err);
    }
  };
}

export async function createContext({
  req,
  resHeaders,
}: {
  req: NextRequest;
  resHeaders: Headers;
}): Promise<Context> {
  // 1. Try Bearer token (mobile client)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const supabase = createSupabaseBearerClient(token);
      const user = await resolveUser(supabase);
      if (user) return { supabase, user, track: makeTracker(user) };
    } catch {
      // Fall through to cookie auth
    }
  }

  // 2. Cookie session (web client)
  const supabase = createSupabaseServerClient(req.headers, resHeaders);
  const user = await resolveUser(supabase);
  return { supabase, user, track: makeTracker(user) };
}

// ============================================================================
// tRPC initialization
// ============================================================================

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error ? error.cause.message : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/**
 * Requires authenticated user with active account status. Also enforces a
 * generous general-abuse rate limit (300 req / 5 min per user) — high
 * enough to never bother a real client, low enough to catch a runaway
 * script or a compromised token being hammered. Per-endpoint limits (AI
 * generation quota, etc.) are separate and stricter, layered on top of
 * this, not a replacement for it.
 */
export const protectedProcedure = t.procedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (ctx.user.accountStatus !== "active") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Account is not active",
      });
    }
    await enforceRateLimit(`api:${ctx.user.id}`, 300, 300);
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

/**
 * Requires staff_admin role.
 */
export const staffProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (ctx.user.role !== "staff_admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Staff access required",
      });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

// ============================================================================
// Dual-tier entitlements — architecture/SUBSCRIPTION_AND_DUAL_TIER_ROUTING.md
// ============================================================================
// Numbers here are the entitlement matrix from that doc, kept in one place so
// "what does free vs. pro get" has a single source of truth instead of a
// magic number re-guessed in every router that needs one.

//
// freeRepurposesPerWeek / jarvisChatPerDay come from the October 2026 product
// brief. Repurposes: "1 free per week" (an open decision — keep or change; this
// is the one place to change it). Jarvis chat is a SEPARATE budget from the
// four content tools above (ideas/hooks/scripts/captions): chat is open to
// everyone, so these numbers are abuse/cost guards. They are PLACEHOLDERS until
// product sets real ones.
export const TIER_LIMITS = {
  free: {
    maxConnectedPlatforms: 2,
    aiGenerationsPerDay: 3,
    // Small changes to something already written (rewrite one part of a script, shorten a caption,
    // suggest tags) are counted apart from new writing, so tidying a script doesn't use up the day.
    // A PLACEHOLDER like jarvisChatPerDay until product sets the real number.
    aiEditsPerDay: 10,
    passportBoostPct: 0,
    repurposesPerWeek: 1 as number | null,
    jarvisChatPerDay: 30,
  },
  pro: {
    maxConnectedPlatforms: Infinity,
    aiGenerationsPerDay: Infinity,
    aiEditsPerDay: Infinity,
    passportBoostPct: 15,
    repurposesPerWeek: null as number | null,
    jarvisChatPerDay: 300,
  },
  founding: {
    maxConnectedPlatforms: Infinity,
    aiGenerationsPerDay: Infinity,
    aiEditsPerDay: Infinity,
    passportBoostPct: 15,
    repurposesPerWeek: null as number | null,
    jarvisChatPerDay: 300,
  },
} as const;

/**
 * Throws a 403 shaped exactly like architecture/SUBSCRIPTION_AND_DUAL_TIER_ROUTING.md
 * §3.B's requireEntitlement middleware (code: UPGRADE_REQUIRED + an upsell
 * payload) — carried on TRPCError.cause so both the tRPC error formatter and
 * apps/web/lib/trpc/server-caller.ts's REST error handler can surface it
 * without duplicating the shape in two places.
 */
export function requirePro(user: User, features: string[]): void {
  if (user.tier !== "free") return;
  throw new TRPCError({
    code: "FORBIDDEN",
    // Shown to the creator as it is: name the tool ("Hook Studio is part of Pro.")
    message: features[0] ? `${(features[0].split(":")[0] ?? features[0]).trim()} is part of Pro.` : "This is part of Pro.",
    cause: {
      upgradeRequired: true,
      upsell: {
        title: "Unlock with Jarvis Pro",
        features,
        upgradeUrl: "/api/v1/billing/checkout",
      },
    },
  });
}
