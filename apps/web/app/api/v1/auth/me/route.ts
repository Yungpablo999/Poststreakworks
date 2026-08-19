import { NextResponse, type NextRequest } from "next/server";
import { createContext } from "@poststreak/api/context";
import { assembleUserProfile } from "@/lib/trpc/assemble-profile";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ctx = await createContext({ req: request, resHeaders: new Headers() });

  if (!ctx.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await assembleUserProfile(ctx.supabase, ctx.user.id);
  return NextResponse.json(user);
}
