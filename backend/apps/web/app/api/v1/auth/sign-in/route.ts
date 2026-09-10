import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assembleUserProfile } from "@/lib/trpc/assemble-profile";
import { enforceRateLimit, getClientIp, RateLimitError } from "@poststreak/api/rate-limit";

export const runtime = "nodejs";

// NOTE for whoever wires src/api/services.ts: AuthService.signIn's second
// parameter is named `passwordHash`, but this route expects the real
// plaintext password (over HTTPS) — Supabase Auth hashes it server-side.
// If the frontend actually sends a client-computed hash, that hash just
// becomes the effective password (Supabase has no way to know it's not the
// real one), which is worse than either plaintext-over-TLS or a proper
// hashed-auth protocol (SRP, etc.) — it looks safer than it is. Flagging
// rather than silently building around it; this needs a real decision, not
// a guess baked into a route handler.
export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ message: "email and password are required" }, { status: 400 });
  }

  // Two layers: per-IP (10/15min) catches a single attacker hammering many
  // accounts; per-email (5/15min) catches credential stuffing against one
  // account spread across many IPs. Checked before calling Supabase Auth at
  // all — brute force protection, not just abuse protection.
  try {
    await enforceRateLimit(`auth:signin:ip:${getClientIp(request)}`, 10, 900);
    await enforceRateLimit(`auth:signin:email:${email.toLowerCase()}`, 5, 900);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ message: err.message }, { status: 429 });
    }
    throw err;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  let { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // Temp/staging affordance (project decision 2026-09-10): if the only thing
  // standing in the way is an unconfirmed email, confirm it server-side and
  // retry once. Gated on AUTH_DEV_AUTOCONFIRM — off in production, where a
  // genuine "email not confirmed" must stay a hard failure.
  if (
    process.env.AUTH_DEV_AUTOCONFIRM === "true" &&
    error?.message?.toLowerCase().includes("email not confirmed")
  ) {
    const { data: userList } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
    const target = userList?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (target) {
      await serviceClient.auth.admin.updateUserById(target.id, { email_confirm: true });
      ({ data, error } = await supabase.auth.signInWithPassword({ email, password }));
    }
  }

  if (error || !data.session) {
    return NextResponse.json({ message: error?.message ?? "Invalid credentials" }, { status: 401 });
  }

  const user = await assembleUserProfile(serviceClient, data.user.id);

  return NextResponse.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user,
  });
}
