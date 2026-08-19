import { type NextRequest } from "next/server";
import { TRPCError } from "@trpc/server";
import { createContext } from "@poststreak/api/context";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const ctx = await createContext({ req: request, resHeaders: new Headers() });
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });

    // disconnect() takes a connection id, this route gets a platform name —
    // resolve one from the other first.
    const { data: connection } = await ctx.supabase
      .from("platform_connections")
      .select("id")
      .eq("user_id", ctx.user.id)
      .eq("platform", id)
      .is("disconnected_at", null)
      .single();

    if (!connection) {
      throw new TRPCError({ code: "NOT_FOUND", message: `No active connection for platform '${id}'` });
    }

    const caller = await getCaller(request);
    return caller.socialScheduling.disconnect({ connectionId: connection.id });
  });
}
