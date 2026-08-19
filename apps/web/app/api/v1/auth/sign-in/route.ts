import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assembleUserProfile } from "@/lib/trpc/assemble-profile";

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return NextResponse.json({ message: error?.message ?? "Invalid credentials" }, { status: 401 });
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const user = await assembleUserProfile(serviceClient, data.user.id);

  return NextResponse.json({ token: data.session.access_token, user });
}
