import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// The address the app on the main branch uses; /platforms/<platform>/authorize serves every platform.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = (await request.json().catch(() => ({}))) as { client?: "web" | "mobile" };
    const caller = await getCaller(request);
    return caller.platformConnect.authorize({ provider: "tiktok", client: body.client });
  });
}
