import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assembleUserProfile } from "@/lib/trpc/assemble-profile";

export const runtime = "nodejs";

// NOTE: SignUpScreen (frontend) only collects username + email — no
// password field exists in that screen at all (confirmed by the screen
// audit), yet AuthService.signUp's return type is an immediate {token,
// user}, which needs a real Supabase session to exist. This route accepts
// an optional `password`; when it's missing (matching what the current
// screen actually sends), it falls back to Supabase's OTP flow and returns
// a "check your email" response instead of an immediate session — there
// isn't yet a verify-code screen wired to that flow either
// (ResetPasswordScreen has the UI pattern for one, could be reused).
// This needs a real product decision (password field added to sign-up,
// vs. OTP-first with a verify step, vs. SSO-only) — not a default silently
// picked here.
export async function POST(request: Request) {
  const { name, email, niche, password } = await request.json();

  if (!email) {
    return NextResponse.json({ message: "email is required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  if (!password) {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Verification code sent to email — no password was provided", requiresVerification: true },
      { status: 202 },
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  if (error || !data.user) {
    return NextResponse.json({ message: error?.message ?? "Sign up failed" }, { status: 400 });
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  if (niche) {
    await serviceClient
      .from("creator_profiles")
      .upsert({ user_id: data.user.id, niche }, { onConflict: "user_id" });
  }

  const user = await assembleUserProfile(serviceClient, data.user.id);

  return NextResponse.json({ token: data.session?.access_token ?? null, user });
}
