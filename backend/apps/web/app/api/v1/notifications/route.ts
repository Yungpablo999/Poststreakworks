import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// The bell: { items: [{ id, kind, title, body, createdAt, read, action }], unread }
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.notifications.feed();
  });
}
