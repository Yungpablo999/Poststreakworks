import { type NextRequest } from "next/server";
import { getCaller, providerFromParam, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";
// Exchanging the code, reading the profile and the first posts, and saving them can take a few
// round trips to the platform; don't let a short platform default cut it off half-way.
export const maxDuration = 30;

// Step 3. The app's callback page posts the { code, state } the platform sent back.
// Needs the same signed-in creator who started the connection.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const provider = providerFromParam((await params).id);
    const body = await readJsonBody(request);
    const { code, state } = (typeof body === "object" && body !== null ? body : {}) as { code?: unknown; state?: unknown };
    const caller = await getCaller(request);
    return caller.platformConnect.callback({
      provider,
      code: typeof code === "string" ? code : "",
      state: typeof state === "string" ? state : "",
    });
  });
}
