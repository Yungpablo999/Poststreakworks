import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";
export const maxDuration = 30;

// The address the app on the main branch uses; /platforms/<platform>/callback serves every platform.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await readJsonBody(request);
    const { code, state } = (typeof body === "object" && body !== null ? body : {}) as { code?: unknown; state?: unknown };
    const caller = await getCaller(request);
    return caller.platformConnect.callback({
      provider: "tiktok",
      code: typeof code === "string" ? code : "",
      state: typeof state === "string" ? state : "",
    });
  });
}
