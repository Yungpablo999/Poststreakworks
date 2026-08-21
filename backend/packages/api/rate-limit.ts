import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";

// Fixed-window DB-backed rate limiting — see supabase/migrations/
// 20260814000016_rate_limiting.sql for why this shape (atomic RPC,
// service-role only, no new vendor) rather than Redis/Upstash.
//
// Builds its own client rather than importing createSupabaseServiceClient
// from ./context — context.ts needs to call enforceRateLimit, and context
// importing from rate-limit importing from context would be a circular
// dependency.
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export class RateLimitError extends TRPCError {
  constructor(retryAfterSeconds: number) {
    super({
      code: "TOO_MANY_REQUESTS",
      message: `Too many requests. Try again in ${retryAfterSeconds}s.`,
    });
  }
}

/**
 * Throws RateLimitError if `key` has exceeded `maxRequests` within the
 * current `windowSeconds` window. The window boundary is baked into the key
 * sent to the DB (floor(now / windowSeconds)), so this is a fixed-window
 * limiter, not sliding — simplest correct choice for this traffic level.
 */
export async function enforceRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<void> {
  const windowStart = new Date(
    Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000,
  ).toISOString();

  const { data: count, error } = await serviceClient.rpc("increment_rate_limit", {
    p_key: key,
    p_window_start: windowStart,
  });

  // Fail open, not closed — a rate-limit infrastructure error must never
  // take down the actual feature it's protecting. Logged, not thrown.
  if (error) {
    console.error("Rate limit check failed (failing open):", error.message);
    return;
  }

  if ((count as number) > maxRequests) {
    const windowEndMs =
      Math.ceil(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000;
    throw new RateLimitError(Math.ceil((windowEndMs - Date.now()) / 1000));
  }
}

/** Best-effort client IP extraction behind Vercel's proxy. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
