import { type NextRequest } from "next/server";
import { TRPCError } from "@trpc/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// One post's numbers and how they compare with the account's others. GET ?key=tiktok:7012…
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const key = request.nextUrl.searchParams.get("key");
    if (!key) throw new TRPCError({ code: "BAD_REQUEST", message: "Which post? Add ?key=" });
    const caller = await getCaller(request);
    return caller.growth.post({ key });
  });
}
