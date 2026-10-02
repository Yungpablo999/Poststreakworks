import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";
// A model call (and a second one on the fallback provider) can outlast a short platform default.
export const maxDuration = 30;

// Ask Jarvis. Body: { message, history?, context? }. Returns the reply shape
// src/jarvis/chat.ts renders: { text, ideas?, caption?, list?, tasks?, chips?,
// emotion?, degraded }.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await readJsonBody(request);
    const caller = await getCaller(request);
    return caller.jarvis.chat(body as Parameters<typeof caller.jarvis.chat>[0]);
  });
}
