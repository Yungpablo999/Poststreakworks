import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// POST { platform, url? } -> { post, streak }   "I posted it", for one platform
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const body = (await readJsonBody(request)) as { platform?: string; url?: string | null };
    const caller = await getCaller(request);
    return caller.posts.markPosted({ id, platform: String(body.platform ?? ""), url: body.url ?? null });
  });
}
