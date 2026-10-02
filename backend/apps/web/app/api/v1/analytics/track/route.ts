import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// Body: { eventName: string, properties?: object } — recorded as "client.<eventName>".
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await readJsonBody(request);
    const caller = await getCaller(request);
    return caller.analytics.track(body as Parameters<typeof caller.analytics.track>[0]);
  });
}
