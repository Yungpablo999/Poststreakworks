import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const caller = await getCaller(request);
    return caller.savedHooks.list();
  });
}

// Saves the hook, or un-saves it if already saved. Returns { saved }.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await readJsonBody(request);
    const caller = await getCaller(request);
    return caller.savedHooks.toggle(body as Parameters<typeof caller.savedHooks.toggle>[0]);
  });
}
