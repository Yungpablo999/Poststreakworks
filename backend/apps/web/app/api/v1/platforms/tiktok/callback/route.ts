import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";
// Exchanging the code, reading the profile and the first videos, and saving them can take
// a few round trips to TikTok; don't let a short platform default cut it off half-way.
export const maxDuration = 30;

// Step 3. The app's callback page posts the { code, state } TikTok sent back.
// Needs the same signed-in creator who started the connection.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await readJsonBody(request);
    const caller = await getCaller(request);
    return caller.platformConnect.tiktokCallback(body as Parameters<typeof caller.platformConnect.tiktokCallback>[0]);
  });
}
