import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";
// A model call (and one more if its first answer was unusable) can outlast a short platform default.
export const maxDuration = 60;

// { idea, style?, angle?, avoid? } -> { hooks: [3 lines], usage }  (Pro)
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await readJsonBody(request);
    const caller = await getCaller(request);
    return caller.studio.hooks(body as Parameters<typeof caller.studio.hooks>[0]);
  });
}
