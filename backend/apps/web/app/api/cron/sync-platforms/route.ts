import { NextResponse } from "next/server";
import { TRPCError } from "@trpc/server";
import { syncDueTikTokAccounts } from "@poststreak/workflows";
import { tiktokDeps } from "@poststreak/api/lib/tiktok-deps";

export const runtime = "nodejs";
export const maxDuration = 60;

// Nightly: refreshes the numbers of every connected creator whose last sync is
// stale. Secured by CRON_SECRET — Vercel sends Authorization: Bearer <secret>
// on cron calls. See vercel.json for the schedule.
export async function GET(request: Request) {
  const auth = request.headers.get("Authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tiktok = await syncDueTikTokAccounts(tiktokDeps(), { limit: 40 });
    return NextResponse.json({ tiktok });
  } catch (err) {
    // TikTok not configured on this environment: nothing to do, and not an error.
    if (err instanceof TRPCError && err.code === "SERVICE_UNAVAILABLE") {
      return NextResponse.json({ tiktok: "skipped: not configured" });
    }
    throw err;
  }
}
