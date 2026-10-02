import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// The draft id is the app's own string id (e.g. "jarvis-My morning reset"), so
// clients must URL-encode it.

// Upsert: creates the draft, or updates the one with this id.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const body = (await readJsonBody(request)) as Record<string, unknown>;
    const caller = await getCaller(request);
    return caller.drafts.save({ ...body, id } as Parameters<typeof caller.drafts.save>[0]);
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const caller = await getCaller(request);
    return caller.drafts.remove({ id });
  });
}
