import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";
export const maxDuration = 30;

// Refresh the creator's TikTok numbers now.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.platformConnect.tiktokSync();
  });
}
