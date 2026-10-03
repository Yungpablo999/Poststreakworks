import { type NextRequest } from "next/server";
import { enforceRateLimit } from "@poststreak/api/rate-limit";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// Before sign-up (the "Your plan" step): ideas for the topics and platforms picked so far.
// ?niches=tech,food&platforms=tiktok. No account yet, so it is limited per address.
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    await enforceRateLimit(`public-ideas:${ip}`, 120, 60 * 60);
    const q = new URL(request.url).searchParams;
    const list = (name: string) => (q.get(name) ?? "").split(",").map((x) => x.trim()).filter(Boolean);
    const caller = await getCaller(request);
    return caller.ideas.starter({ niches: list("niches"), platforms: list("platforms") });
  });
}
