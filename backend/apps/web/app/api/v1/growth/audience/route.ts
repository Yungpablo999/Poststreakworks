import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    { message: "Audience analytics is not implemented yet — no metrics pipeline exists" },
    { status: 501 },
  );
}
