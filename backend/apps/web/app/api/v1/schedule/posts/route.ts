import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// ?from=<ISO>&to=<ISO> bound scheduled_at (from inclusive, to exclusive);
// also ?status=, ?limit= (max 100, default 50) and ?offset=.
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const params = new URL(request.url).searchParams;
    const status = params.get("status");
    const from = params.get("from");
    const to = params.get("to");
    const caller = await getCaller(request);
    return caller.socialScheduling.getPosts({
      limit: Number(params.get("limit") ?? 50),
      offset: Number(params.get("offset") ?? 0),
      ...(status && { status: status as Parameters<typeof caller.socialScheduling.getPosts>[0]["status"] }),
      ...(from && { from }),
      ...(to && { to }),
    });
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const caller = await getCaller(request);
    return caller.socialScheduling.create({
      content: body.content,
      mediaUrls: body.mediaUrls,
      targetPlatforms: body.targetPlatforms,
      scheduledAt: body.scheduledAt,
    });
  });
}
