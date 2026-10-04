import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";
// A model call (and one more if its first answer was unusable) can outlast a short platform default.
export const maxDuration = 60;

// { topic, goal?, tones?, platform?, avoid? } -> { options: [3 x { id, label, caption, hashtags }], usage }
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await readJsonBody(request);
    const caller = await getCaller(request);
    return caller.studio.captions(body as Parameters<typeof caller.studio.captions>[0]);
  });
}
