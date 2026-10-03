import { type NextRequest } from "next/server";
import { TRPCError } from "@trpc/server";
import { getCaller, readJsonBody, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// GET ?state=ready -> { posts }   the posts whose time has come and are waiting to be posted
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const state = new URL(request.url).searchParams.get("state");
    if (state !== "ready") throw new TRPCError({ code: "BAD_REQUEST", message: "Ask for ?state=ready" });
    const caller = await getCaller(request);
    return caller.posts.ready();
  });
}

// POST { caption, tags?, platforms, format?, when: "now" | "schedule", at?, fromDraft? } -> Post
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = (await readJsonBody(request)) as Parameters<Awaited<ReturnType<typeof getCaller>>["posts"]["create"]>[0];
    const caller = await getCaller(request);
    return caller.posts.create(body);
  });
}
