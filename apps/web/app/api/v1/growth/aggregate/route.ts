import { NextResponse } from "next/server";

export const runtime = "nodejs";

// GrowthMetrics needs followers/views/likes/saves/shares/growth-rate per
// platform — none of that is ingested anywhere in this schema (no analytics
// pull from LinkedIn/X/TikTok APIs exists). Real 501, not fabricated
// numbers — packages/analytics/ (Stage 6) is admin/aggregate-scoped per the
// original architecture notes and was never extended with a per-creator,
// per-platform metrics pipeline either.
export async function GET() {
  return NextResponse.json(
    { message: "Growth analytics ingestion is not implemented yet — no platform metrics pipeline exists" },
    { status: 501 },
  );
}
