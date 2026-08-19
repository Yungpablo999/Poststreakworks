import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const { scriptSummary, platform } = await request.json();
    const caller = await getCaller(request);
    const result = await caller.contentStudio.generateCaption({
      contentSummary: scriptSummary ?? "",
      voice: "authentic",
      platform: platform ?? "general",
      includeHashtags: true,
    });
    return { caption: result.caption.caption, hashtags: result.caption.hashtags ?? [] };
  });
}
