import { NextResponse } from "next/server";
import { PROVIDER_IDS } from "@poststreak/integrations";
import { syncDueAccounts, type SyncBatchResult } from "@poststreak/workflows";
import { providerSetup } from "@poststreak/api/lib/provider-setup";
import { socialDeps } from "@poststreak/api/lib/social-deps";

export const runtime = "nodejs";
export const maxDuration = 60;

// Nightly: refreshes the numbers of every connected creator whose last sync is stale, on every
// platform this server is set up for (it also renews Instagram and Threads tokens before they
// run out). Secured by CRON_SECRET — Vercel sends Authorization: Bearer <secret> on cron calls.
// See vercel.json for the schedule.
export async function GET(request: Request) {
  const auth = request.headers.get("Authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report: Record<string, SyncBatchResult | string> = {};
  for (const id of PROVIDER_IDS) {
    // Not set up on this environment: nothing to do, and not an error.
    if (!providerSetup(id)) {
      report[id] = "skipped: not configured";
      continue;
    }
    try {
      report[id] = await syncDueAccounts(socialDeps(id), { limit: 40 });
    } catch (err) {
      console.error(`sync-platforms (${id}) failed:`, err instanceof Error ? err.message : err);
      report[id] = "failed";
    }
  }
  return NextResponse.json(report);
}
