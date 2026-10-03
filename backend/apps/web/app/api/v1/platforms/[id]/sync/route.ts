import { type NextRequest } from "next/server";
import { getCaller, providerFromParam, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";
export const maxDuration = 30;

// Refresh the creator's numbers on this platform now.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const provider = providerFromParam((await params).id);
    const caller = await getCaller(request);
    return caller.platformConnect.sync({ provider });
  });
}
