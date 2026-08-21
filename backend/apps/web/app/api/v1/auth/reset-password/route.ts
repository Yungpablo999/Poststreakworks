import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit, getClientIp, RateLimitError } from "@poststreak/api/rate-limit";

export const runtime = "nodejs";

// ResetPasswordScreen (frontend) is a 3-step flow (send email -> verify
// 6-digit OTP -> set new password), but apiRoutes.ts only defines one
// endpoint for all of it. Dispatches on a `step` field since there's
// nowhere else for that distinction to live without adding routes the
// frontend doesn't reference yet.
export async function POST(request: Request) {
  const body = await request.json();
  const step = body.step as "send" | "verify" | "update" | undefined;
  const ip = getClientIp(request);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  if (step === "verify") {
    const { email, otp } = body;
    if (!email || !otp) {
      return NextResponse.json({ message: "email and otp are required" }, { status: 400 });
    }
    // The tightest limit in this file on purpose — a 6-digit OTP is only
    // 1,000,000 possibilities, and without a strict attempt cap it's
    // brute-forceable well within a plausible attack window.
    try {
      await enforceRateLimit(`auth:reset:verify:ip:${ip}`, 5, 900);
      await enforceRateLimit(`auth:reset:verify:email:${email.toLowerCase()}`, 5, 900);
    } catch (err) {
      if (err instanceof RateLimitError) {
        return NextResponse.json({ message: err.message }, { status: 429 });
      }
      throw err;
    }
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: "recovery" });
    if (error || !data.session) {
      return NextResponse.json({ message: error?.message ?? "Invalid code" }, { status: 401 });
    }
    // Client needs this session token to authorize the "update" step below.
    return NextResponse.json({ verified: true, token: data.session.access_token });
  }

  if (step === "update") {
    const { token, newPassword } = body;
    if (!token || !newPassword) {
      return NextResponse.json({ message: "token and newPassword are required" }, { status: 400 });
    }
    const sessionClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { error } = await sessionClient.auth.updateUser({ password: newPassword });
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  // Default / step === "send"
  const { email } = body;
  if (!email) {
    return NextResponse.json({ message: "email is required" }, { status: 400 });
  }
  // Per-IP only — protects against email-bombing a victim's inbox, not
  // targeting one account (that's the "verify" step's job).
  try {
    await enforceRateLimit(`auth:reset:send:ip:${ip}`, 3, 3600);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ message: err.message }, { status: 429 });
    }
    throw err;
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
  return NextResponse.json({ sent: true });
}
