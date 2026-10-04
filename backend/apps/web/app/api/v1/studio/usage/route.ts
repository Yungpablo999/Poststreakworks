import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// { generate: { used, limit }, edit: { used, limit } }  today's writes and edits; limit is null for Pro
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.studio.usage();
  });
}
