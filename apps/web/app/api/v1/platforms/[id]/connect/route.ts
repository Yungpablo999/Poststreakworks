import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// NOTE: SocialPlatformsService.connectPlatform sends {authCodeOrHandle} —
// implying the backend exchanges an OAuth authorization code server-side.
// That exchange isn't ported yet (v1 has working /api/auth/{linkedin,x}
// authorize+callback routes this needs to be built from — see
// packages/integrations/{linkedin,x}.ts for the publish/refresh half that
// IS ported). For now this stores authCodeOrHandle directly as the access
// token, which only works if the caller already has a real token some other
// way — not a real OAuth flow yet.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const { authCodeOrHandle } = await request.json();
    const caller = await getCaller(request);
    return caller.socialScheduling.connect({
      platform: id as "linkedin" | "twitter" | "meta" | "tiktok",
      accessToken: authCodeOrHandle,
      platformUserId: authCodeOrHandle,
    });
  });
}
