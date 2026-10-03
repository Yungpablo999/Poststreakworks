import { describe, expect, it } from "vitest";
import { capabilitiesFromEnv, devLoginEnabled, usesLocalSupabase } from "./capabilities";

const local = { NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" };
const hosted = { NEXT_PUBLIC_SUPABASE_URL: "https://abcdefgh.supabase.co" };

describe("one-tap test sign-in", () => {
  it("needs all three locks: asked for, not production, and a Supabase on this machine", () => {
    expect(devLoginEnabled({ ...local, DEV_LOGIN: "true", NODE_ENV: "development" })).toBe(true);
    expect(devLoginEnabled({ ...local, NODE_ENV: "development" })).toBe(false); // not asked for
    expect(devLoginEnabled({ ...local, DEV_LOGIN: "true", NODE_ENV: "production" })).toBe(false);
    expect(devLoginEnabled({ ...hosted, DEV_LOGIN: "true", NODE_ENV: "development" })).toBe(false); // hosted project
    expect(devLoginEnabled({ DEV_LOGIN: "true", NODE_ENV: "development" })).toBe(false); // no Supabase at all
  });

  it("only counts localhost addresses as this machine", () => {
    for (const url of ["http://localhost:54321", "http://127.0.0.1:54321"]) expect(usesLocalSupabase({ NEXT_PUBLIC_SUPABASE_URL: url })).toBe(true);
    for (const url of ["https://localhost.evil.example", "http://127.0.0.1.evil.example", "http://10.0.0.2:54321", "https://x.supabase.co", "", "nope"]) {
      expect(usesLocalSupabase({ NEXT_PUBLIC_SUPABASE_URL: url }), url).toBe(false);
    }
  });
});

describe("capabilities", () => {
  const key = Buffer.alloc(32, 7).toString("base64");
  const tiktok = { TIKTOK_CLIENT_KEY: "k", TIKTOK_CLIENT_SECRET: "s", TIKTOK_REDIRECT_URI: "https://app.example.test/auth/tiktok/callback", TOKEN_ENCRYPTION_KEY: key };

  it("claims nothing a bare server can't do", () => {
    expect(capabilitiesFromEnv({})).toEqual({
      ai: false,
      tiktok: false,
      payments: false,
      voice: false,
      devLogin: false,
      otherPlatforms: false,
      autoPost: false,
      audienceDemographics: false,
    });
  });

  it("turns each one on only when its keys are present", () => {
    expect(capabilitiesFromEnv({ GROQ_API_KEY: "g" }).ai).toBe(true);
    expect(capabilitiesFromEnv({ GEMINI_API_KEY: "g" }).ai).toBe(true);
    expect(capabilitiesFromEnv({ FISH_AUDIO_API_KEY: "f" }).voice).toBe(true);
    expect(capabilitiesFromEnv({ STRIPE_SECRET_KEY: "s", STRIPE_WEBHOOK_SECRET: "w" }).payments).toBe(true);
    expect(capabilitiesFromEnv({ STRIPE_SECRET_KEY: "s" }).payments).toBe(false); // can't verify its webhooks
    expect(capabilitiesFromEnv({ PAYSTACK_SECRET_KEY: "p" }).payments).toBe(true);
    expect(capabilitiesFromEnv({ GROQ_API_KEY: "  " }).ai).toBe(false);
  });

  it("needs both the TikTok app settings and a valid token key for TikTok", () => {
    expect(capabilitiesFromEnv(tiktok).tiktok).toBe(true);
    expect(capabilitiesFromEnv({ ...tiktok, TOKEN_ENCRYPTION_KEY: undefined }).tiktok).toBe(false);
    expect(capabilitiesFromEnv({ ...tiktok, TOKEN_ENCRYPTION_KEY: "short" }).tiktok).toBe(false);
    expect(capabilitiesFromEnv({ ...tiktok, TIKTOK_CLIENT_SECRET: undefined }).tiktok).toBe(false);
    expect(capabilitiesFromEnv({ ...tiktok, TIKTOK_REDIRECT_URI: "http://evil.example/cb" }).tiktok).toBe(false); // misconfigured
  });

  it("never claims the things that aren't built", () => {
    const everything = capabilitiesFromEnv({ ...tiktok, GROQ_API_KEY: "g", FISH_AUDIO_API_KEY: "f", PAYSTACK_SECRET_KEY: "p" });
    expect(everything.otherPlatforms).toBe(false);
    expect(everything.autoPost).toBe(false);
    expect(everything.audienceDemographics).toBe(false);
  });
});
