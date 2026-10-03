import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// Body: { ids?: string[] } — marks those read, or every unread notification when ids is left out.
// Returns { unread }.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await readJsonBody(request);
    const caller = await getCaller(request);
    return caller.notifications.markRead(body as Parameters<typeof caller.notifications.markRead>[0]);
  });
}
