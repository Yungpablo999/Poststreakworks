import { appRouter } from "@poststreak/api/root";
import { createContext } from "@poststreak/api/context";
import { NextResponse, type NextRequest } from "next/server";

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
      code === "BAD_REQUEST" ? 400 :
      500;

    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ message }, { status });
  }
}
