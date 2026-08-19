import { NextResponse } from "next/server";

export const runtime = "nodejs";

// A "rate card" (suggested brand-deal pricing based on followers/engagement)
// needs real analytics data this backend doesn't have (see growth/* routes)
// plus pricing logic that's never been designed anywhere in the docs. Real
// 501, not a fabricated number — this isn't a case of thin adapter work,
// it's an undesigned feature.
export async function POST() {
  return NextResponse.json(
    { message: "Rate card generation is not implemented yet — needs real analytics data and undesigned pricing logic" },
    { status: 501 },
  );
}
