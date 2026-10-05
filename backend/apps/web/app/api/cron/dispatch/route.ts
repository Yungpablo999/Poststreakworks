import { NextResponse } from "next/server";
import { dispatchScheduledPosts, dispatchAutopilot } from "@poststreak/jobs";
import { expireLapsedSubscriptions } from "@poststreak/workflows";

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
  // A paid period that is over (plus the grace) stops being Pro. Its own step: a failure here must not
  // stop the posts above, and is retried on the next run.
  let subscriptionsEnded: number | null = null;
  try {
    subscriptionsEnded = await expireLapsedSubscriptions();
    if (subscriptionsEnded) console.log(`Cron billing: ended ${subscriptionsEnded} lapsed subscription(s)`);
  } catch (err) {
    console.error("Cron billing:", err instanceof Error ? err.message : err);
  }

  return NextResponse.json({ posts, autopilot, subscriptionsEnded });
}
