import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// Body: { key: string }  — a first-visit tip was shown. Idempotent.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await readJsonBody(request);
    const caller = await getCaller(request);
    return caller.accounts.markTipSeen(body as Parameters<typeof caller.accounts.markTipSeen>[0]);
  });
}
