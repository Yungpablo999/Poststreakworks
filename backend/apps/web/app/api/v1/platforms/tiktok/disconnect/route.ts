import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// Disconnect TikTok: revokes the token and deletes what we pulled from TikTok.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.platformConnect.tiktokDisconnect();
  });
}
