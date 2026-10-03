import { type NextRequest } from "next/server";
import { getCaller, providerFromParam, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// Step 1 of connecting TikTok, Instagram, Threads, Facebook or YouTube.
// Body (optional): { client?: "web" | "mobile" }. Returns { url } — send the creator to it.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const provider = providerFromParam((await params).id);
    const body = (await request.json().catch(() => ({}))) as { client?: "web" | "mobile" };
    const caller = await getCaller(request);
    return caller.platformConnect.authorize({ provider, client: body.client });
  });
}
