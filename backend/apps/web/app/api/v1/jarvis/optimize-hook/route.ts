import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// No dedicated "optimize an existing hook" function exists — reuses
// generateHooks as the closest fit (regenerates variants) rather than a 501,
// since it's a genuinely reasonable approximation, unlike growth analytics.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const { hook, tone } = await request.json();
    const caller = await getCaller(request);
    const result = await caller.contentStudio.generateHooks({
      topic: hook ?? "",
      tone: tone ?? "engaging",
      format: "short-form",
    });
    return { hooks: result.hooks };
  });
}
