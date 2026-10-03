import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// The address the app on the main branch uses; /platforms/<platform>/disconnect serves every platform.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.platformConnect.disconnect({ provider: "tiktok" });
  });
}
