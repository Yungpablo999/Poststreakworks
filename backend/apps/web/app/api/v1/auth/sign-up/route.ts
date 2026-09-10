import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assembleUserProfile } from "@/lib/trpc/assemble-profile";
import { enforceRateLimit, getClientIp, RateLimitError } from "@poststreak/api/rate-limit";

export const runtime = "nodejs";

// Temp/staging auth model (project decision 2026-09-10): every sign-up ends
// with a real Supabase session so the frontend can wire authenticated
// screens immediately. When AUTH_DEV_AUTOCONFIRM is on we mark the email
// confirmed server-side (service-role admin) right after creating the user,
// then sign in to mint the JWT. SignUpScreen currently collects no password
// field; when none is sent we generate one and return it as
// `generatedPassword` so the account stays reachable via normal sign-in
// later. AUTH_DEV_AUTOCONFIRM MUST be unset in production — real email
// verification (or an OAuth provider) takes over there.
const AUTO_CONFIRM = process.env.AUTH_DEV_AUTOCONFIRM === "true";

function generatePassword(): string {
  // 24 hex chars + fixed class padding keeps it well above any policy floor.
  return `${crypto.randomUUID().replace(/-/g, "")}Aa1!`;
}

export async function POST(request: Request) {
  const { name, email, niche, password: providedPassword } = await request.json();

  if (!email) {
    return NextResponse.json({ message: "email is required" }, { status: 400 });
  }

  // Per-IP only (not per-email like sign-in) — sign-up spam is the threat
  // here, not credential stuffing against a known account. 5 accounts per
  // IP per hour is generous for a real user, tight for a spam script.
  try {
    await enforceRateLimit(`auth:signup:ip:${getClientIp(request)}`, 5, 3600);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ message: err.message }, { status: 429 });
    }
    throw err;
  }

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const password: string = providedPassword || generatePassword();
  const passwordWasGenerated = !providedPassword;

  const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  if (signUpError || !signUpData.user) {
    return NextResponse.json(
      { message: signUpError?.message ?? "Sign up failed" },
      { status: 400 },
    );
  }

  if (AUTO_CONFIRM) {
    const { error: confirmError } = await serviceClient.auth.admin.updateUserById(
      signUpData.user.id,
      { email_confirm: true },
    );
    if (confirmError) {
      console.error("Auto-confirm failed:", confirmError.message);
    }
  }

  if (niche) {
    await serviceClient
      .from("creator_profiles")
      .upsert({ user_id: signUpData.user.id, niche }, { onConflict: "user_id" });
  }

  // Prefer the session Supabase already handed back (confirmations disabled
  // project-wide); otherwise mint one now that the email is confirmed.
  let session = signUpData.session;
  if (!session) {
    const { data: signInData, error: signInError } =
      await anonClient.auth.signInWithPassword({ email, password });
    if (signInError || !signInData.session) {
      // User exists and is confirmed, but we couldn't mint a token. Surface
      // it honestly rather than returning a tokenless "success".
      return NextResponse.json(
        {
          message:
            "Account created, but could not establish a session — sign in to continue.",
          requiresVerification: !AUTO_CONFIRM,
        },
        { status: 202 },
      );
    }
    session = signInData.session;
  }

  const user = await assembleUserProfile(serviceClient, signUpData.user.id);

  return NextResponse.json({
    token: session.access_token,
    refreshToken: session.refresh_token,
    user,
    ...(passwordWasGenerated ? { generatedPassword: password } : {}),
  });
}
