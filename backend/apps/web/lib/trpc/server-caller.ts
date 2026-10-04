import { appRouter } from "@poststreak/api/root";
import { createContext } from "@poststreak/api/context";
import { TRPCError } from "@trpc/server";
import { isProviderId, type ProviderId } from "@poststreak/integrations";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

// REST route handlers under app/api/v1/* are thin wrappers over the same
// tRPC routers used internally — this builds a server-side caller so those
// routes can invoke a procedure directly (no HTTP round-trip to itself) and
// share every bit of validation/business logic with the tRPC surface,
// rather than duplicating it. See frontend/shared/constants/apiRoutes.ts for
// the contract this maps onto (the frontend's already-coded REST client,
// unrelated to the founder-approved "tRPC only" architecture decision — this
// reconciles the two without touching frontend code).
export async function getCaller(req: NextRequest) {
  const ctx = await createContext({ req, resHeaders: new Headers() });
  return appRouter.createCaller(ctx);
}

/**
 * Parses a JSON request body. A malformed body is the client's mistake (400),
 * not a server error (500) — which is what a bare `await request.json()`
 * turned it into. Shape validation is left to the tRPC procedure's zod input.
 */
export async function readJsonBody(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Request body must be valid JSON" });
  }
}

/**
 * Runs a REST handler body and converts tRPC errors into the plain
 * {message} + status-code JSON shape apps/web's REST routes return —
 * src/api/apiClient.ts (the frontend's hand-rolled client) parses any
 * non-2xx response as {message?: string} and doesn't understand TRPCError's
 * shape at all.
 */
export async function withErrorHandling<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    const data = await fn();
    return NextResponse.json(data);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    const status =
      code === "UNAUTHORIZED" ? 401 :
      code === "FORBIDDEN" ? 403 :
      code === "NOT_FOUND" ? 404 :
      code === "CONFLICT" ? 409 :
      code === "TOO_MANY_REQUESTS" ? 429 :
      code === "PAYMENT_REQUIRED" ? 402 :
      code === "BAD_GATEWAY" ? 502 :
      code === "SERVICE_UNAVAILABLE" ? 503 :
      code === "BAD_REQUEST" ? 400 :
      500;

    // A request that doesn't fit the procedure's input is the client's mistake (400). tRPC's own message for it
    // is a dump of every zod issue; the first issue, in the words the procedure gave it, is what a person can read.
    const cause = (err as { cause?: unknown })?.cause;
    const message =
      cause instanceof ZodError
        ? (cause.issues[0]?.message ?? "That doesn't look right.")
        : err instanceof Error
          ? err.message
          : "Request failed";

    // requirePro() (context.ts) carries an upsell payload on TRPCError.cause —
    // surface it so a 403 from a Pro-gated route matches
    // architecture/SUBSCRIPTION_AND_DUAL_TIER_ROUTING.md §3.B's exact shape
    // instead of just a bare message.
    const upsell = (err as { cause?: { upgradeRequired?: boolean; upsell?: unknown } })?.cause;
    if (upsell?.upgradeRequired) {
      return NextResponse.json(
        { message, code: "UPGRADE_REQUIRED", upsell: upsell.upsell },
        { status },
      );
    }

    return NextResponse.json({ message }, { status });
  }
}

/** The platform named in a route address (/platforms/instagram/…), or a 404 for one PostStreak doesn't connect. */
export function providerFromParam(id: string): ProviderId {
  if (!isProviderId(id)) throw new TRPCError({ code: "NOT_FOUND", message: `Unknown platform '${id}'` });
  return id;
}
