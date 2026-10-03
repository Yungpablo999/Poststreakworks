import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { devLogin, DevLoginDisabledError } from "@poststreak/api/lib/dev-login";

export const runtime = "nodejs";

// Local testing only: signs in one of the test accounts without the emailed code
// (see packages/api/lib/dev-login.ts for the three locks). On any server where those
// locks aren't all open this answers 404, as if the route didn't exist.
export async function POST(request: NextRequest) {
  const body = z.object({ email: z.string().email() }).safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: "An email is required" }, { status: 400 });

  try {
    return NextResponse.json(await devLogin(body.data.email.toLowerCase()));
  } catch (err) {
    if (err instanceof DevLoginDisabledError) return new NextResponse(null, { status: 404 });
    return NextResponse.json({ message: "That test account doesn't exist yet. Run the seed script." }, { status: 404 });
  }
}
