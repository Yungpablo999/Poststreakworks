import { type NextRequest } from "next/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const caller = await getCaller(request);
    return caller.posts.get({ id });
  });
}

// PATCH { caption?, tags?, platforms?, format?, at? } -> Post
export async function PATCH(request: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const body = (await readJsonBody(request)) as Record<string, unknown>;
    const caller = await getCaller(request);
    return caller.posts.update({ ...(body as object), id } as Parameters<typeof caller.posts.update>[0]);
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const caller = await getCaller(request);
    return caller.posts.remove({ id });
  });
}
