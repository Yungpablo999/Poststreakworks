import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// Body: { niches?: string[], timezone?: string }
export async function PUT(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await readJsonBody(request);
    const caller = await getCaller(request);
    return caller.accounts.saveOnboarding(body as Parameters<typeof caller.accounts.saveOnboarding>[0]);
  });
}
