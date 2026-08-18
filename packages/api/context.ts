import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type NextRequest, type NextResponse } from "next/server";

// ============================================================================
// Types
// ============================================================================
export type User = {
  id: string;
  email: string;
  role: "creator" | "staff_admin";
  accountStatus: string;
};

export type Context = {
  supabase: SupabaseClient;
  user: User | null;
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
 * Server-side client using service role key.
 * Used for webhook verification and privileged operations.
 */
export function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
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

  const { data: psUser } = await supabase
    .from("users")
    .select("role, account_status")
    .eq("id", user.id)
    .single();

  if (!psUser) return null;

  return {
    id: user.id,
    email: user.email!,
    role: (psUser.role as "creator" | "staff_admin") ?? "creator",
    accountStatus: psUser.account_status ?? "active",
  };
}

// ============================================================================
// tRPC context creation
// ============================================================================

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
      if (user) return { supabase, user };
    } catch {
      // Fall through to cookie auth
    }
  }

  // 2. Cookie session (web client)
  const supabase = createSupabaseServerClient(req.headers, resHeaders);
  const user = await resolveUser(supabase);
  return { supabase, user };
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
 * Requires authenticated user with active account status.
 */
export const protectedProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (ctx.user.accountStatus !== "active") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Account is not active",
      });
    }
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
