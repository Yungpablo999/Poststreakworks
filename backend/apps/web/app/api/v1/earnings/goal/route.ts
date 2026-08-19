import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const caller = await getCaller(request);
    return caller.earnings.setGoal({ targetAmount: body.targetAmount, label: body.label });
  });
}
