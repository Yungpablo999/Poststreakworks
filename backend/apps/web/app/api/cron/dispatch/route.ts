import { NextResponse } from "next/server";
import { dispatchScheduledPosts, dispatchAutopilot } from "@poststreak/jobs";

export const runtime = "nodejs";
export const maxDuration = 60;

// Secured by CRON_SECRET — Vercel sets Authorization: Bearer <secret> on
// every cron-triggered call automatically; this rejects anyone else. Ported
// from v1's src/app/api/cron/dispatch/route.ts.
export async function GET(request: Request) {
  const auth = request.headers.get("Authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await dispatchScheduledPosts();
  const autopilot = await dispatchAutopilot();

  return NextResponse.json({ posts, autopilot });
}
