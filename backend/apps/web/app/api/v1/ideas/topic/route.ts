import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// ?topic=…&goal=…&format=…&round=0 — three ideas about a topic the creator typed.
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const q = new URL(request.url).searchParams;
    const caller = await getCaller(request);
    return caller.ideas.topic({
      topic: q.get("topic") ?? "",
      ...(q.get("goal") && { goal: q.get("goal")! }),
      ...(q.get("format") && { format: q.get("format")! }),
      round: Number(q.get("round") ?? 0),
    });
  });
}
