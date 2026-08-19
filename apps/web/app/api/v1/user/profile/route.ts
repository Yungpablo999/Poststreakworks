import { type NextRequest } from "next/server";
import { TRPCError } from "@trpc/server";
import { assembleUserProfile } from "@/lib/trpc/assemble-profile";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";
import { createContext } from "@poststreak/api/context";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const ctx = await createContext({ req: request, resHeaders: new Headers() });
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
    return assembleUserProfile(ctx.supabase, ctx.user.id);
  });
}

export async function PUT(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const caller = await getCaller(request);
    return caller.accounts.upsertProfile(body);
  });
}
