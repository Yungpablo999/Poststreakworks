import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const body = await request.json();
    const caller = await getCaller(request);
    return caller.socialScheduling.update({
      postId: id,
      content: body.content,
      mediaUrls: body.mediaUrls,
      targetPlatforms: body.targetPlatforms,
      scheduledAt: body.scheduledAt,
    });
  });
}

// Soft-delete (cancel), not a hard delete — no hard-delete procedure exists
// on scheduled_posts, which is the correct default (keeps history/audit
// trail) rather than a gap.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const caller = await getCaller(request);
    return caller.socialScheduling.cancel({ postId: id });
  });
}
