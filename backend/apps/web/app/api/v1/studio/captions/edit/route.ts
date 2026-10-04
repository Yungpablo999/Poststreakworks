import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";
// A model call (and one more if its first answer was unusable) can outlast a short platform default.
export const maxDuration = 60;

// { caption, action: rewrite | shorten | ask | tags, platform?, idea? } -> { caption, usage } or { tags, usage }
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await readJsonBody(request);
    const caller = await getCaller(request);
    return caller.studio.captionEdit(body as Parameters<typeof caller.studio.captionEdit>[0]);
  });
}
