import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// "Send Pitch" isn't a single existing procedure — it's modeled as two
// things together: a priority_requested discovery action (surfaces to the
// target, can form a match same as an "interested" swipe) plus a
// collaboration_briefs row holding the actual pitch message/collab idea,
// since discovery_actions has no free-text field to hold one.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const caller = await getCaller(request);

    await caller.creatorNetwork.discover({
      targetId: body.targetCreatorId,
      action: "priority_requested",
    });

    return caller.creatorNetwork.createBrief({
      concept: body.message,
    });
  });
}
