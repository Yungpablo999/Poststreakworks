import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Honest stub, not a fabricated success — there is no platform-analytics
// sync job anywhere in this backend yet (no follower-count/engagement
// ingestion from LinkedIn/X/etc. exists; packages/integrations only has
// publish + token refresh). Returns 501 rather than pretending a sync ran.
export async function POST() {
  return NextResponse.json(
    { message: "Platform analytics sync is not implemented yet" },
    { status: 501 },
  );
}
