import { PROVIDER_IDS, type ProviderId } from "@poststreak/integrations";
import { providerSetup } from "./provider-setup";

// What this server can really do, decided by what it has been given (keys,
// approvals). The app asks once (GET /me/bootstrap -> capabilities) and shows
// only what works: a feature the server can't deliver is hidden, never faked
// with sample data, and it appears by itself once the keys are set.

export type Capabilities = {
  /** Ideas, hooks, scripts, captions, Repurpose and Ask Jarvis are written by a real model. */
  ai: boolean;
  /** Which platforms can really be connected here (their app keys, redirect address and the token key are present and valid). */
  platforms: Record<ProviderId, boolean>;
  /** Same as platforms.tiktok. Kept for the app on the main branch, which asks for it by this name. */
  tiktok: boolean;
  /** A purchase can really unlock Pro (Stripe or Paystack configured). */
  payments: boolean;
  /** Voice Studio can really make audio. */
  voice: boolean;
  /** Local testing only: the sign-in screen offers one-tap test accounts. */
  devLogin: boolean;
  /** Posting for the creator at the best time. Needs each platform's posting approval. */
  autoPost: boolean;
  /** Age / place / online-time breakdowns of an audience. No connected platform's API gives them to us yet. */
  audienceDemographics: boolean;
};

type Env = Record<string, string | undefined>;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Is the database/auth service this server talks to running on this machine? */
export function usesLocalSupabase(env: Env = process.env): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname);
  } catch {
    return false;
  }
}

/**
 * One-tap test accounts on the sign-in screen. Three locks, all required: asked
 * for explicitly (DEV_LOGIN=true), not a production build, and talking to a
 * Supabase on this machine. A hosted project can never be reached through this,
 * even if the flag were copied there by mistake.
 */
export function devLoginEnabled(env: Env = process.env): boolean {
  return env.DEV_LOGIN === "true" && env.NODE_ENV !== "production" && usesLocalSupabase(env);
}

export function capabilitiesFromEnv(env: Env = process.env): Capabilities {
  const platforms = Object.fromEntries(PROVIDER_IDS.map((id) => [id, providerSetup(id, env) !== null])) as Record<ProviderId, boolean>;
  return {
    ai: Boolean(env.GROQ_API_KEY?.trim() || env.GEMINI_API_KEY?.trim()),
    platforms,
    tiktok: platforms.tiktok,
    payments: Boolean(
      (env.STRIPE_SECRET_KEY?.trim() && env.STRIPE_WEBHOOK_SECRET?.trim()) || env.PAYSTACK_SECRET_KEY?.trim(),
    ),
    voice: Boolean(env.FISH_AUDIO_API_KEY?.trim()),
    devLogin: devLoginEnabled(env),
    autoPost: false,
    audienceDemographics: false,
  };
}
