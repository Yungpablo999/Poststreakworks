import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// ?goal=followers|saves|comments|often — ideas for the signed-in creator's own topics, from the idea library.
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const goal = new URL(request.url).searchParams.get("goal") ?? undefined;
    const caller = await getCaller(request);
    return caller.ideas.feed({ ...(goal && { goal }) });
  });
}
