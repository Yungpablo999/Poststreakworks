import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Same gap as growth/aggregate — post-level views/likes/saves/shares/
// revenue aren't tracked anywhere. Real 501.
export async function GET() {
  return NextResponse.json(
    { message: "Post performance analytics is not implemented yet — no metrics pipeline exists" },
    { status: 501 },
  );
}
