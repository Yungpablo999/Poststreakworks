import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// Step 1 of connecting TikTok. Body (optional): { client?: "web" | "mobile" }.
// Returns { url } — send the creator to it.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = (await request.json().catch(() => ({}))) as { client?: "web" | "mobile" };
    const caller = await getCaller(request);
    return caller.platformConnect.tiktokAuthorize({ client: body.client });
  });
}
