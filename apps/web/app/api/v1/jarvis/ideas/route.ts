import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// JarvisEngineService.generateIdeas sends only {niche, goal} — contentStudio.
// generateIdeas needs {niche, goal, topic, platform, audience}. Filling
// reasonable defaults for what the REST contract doesn't collect rather
// than loosening the tRPC schema (which real tRPC callers may rely on
// being complete).
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const { niche, goal } = await request.json();
    const caller = await getCaller(request);
    const result = await caller.contentStudio.generateIdeas({
      niche: niche ?? "general",
      goal: goal ?? "grow audience",
      topic: goal ?? "general",
      platform: "general",
      audience: "general",
    });
    return { ideas: result.ideas.map((i) => i.title) };
  });
}
