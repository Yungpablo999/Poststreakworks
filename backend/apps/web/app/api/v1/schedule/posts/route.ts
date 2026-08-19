import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.socialScheduling.getPosts({ limit: 50, offset: 0 });
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
