import { describe, expect, it } from "vitest";
import { ProviderConfigError, createProviderAdapter, providerConfigFromEnv, providerEnvNames } from "./index";
import { PROVIDER_IDS } from "./types";

// Fake values only. Real keys live in the deployment's environment, never in the repository.

const base = {
  APP_WEB_URL: "https://app.example.test",
  TIKTOK_CLIENT_KEY: "tk", TIKTOK_CLIENT_SECRET: "ts",
  INSTAGRAM_APP_ID: "ig", INSTAGRAM_APP_SECRET: "is",
  THREADS_APP_ID: "th", THREADS_APP_SECRET: "ths",
  FACEBOOK_APP_ID: "fb", FACEBOOK_APP_SECRET: "fs",
  GOOGLE_CLIENT_ID: "gc", GOOGLE_CLIENT_SECRET: "gs",
};

describe("provider settings", () => {
  it("reads each platform's keys by that platform's own names", () => {
    expect(providerConfigFromEnv("tiktok", base)).toMatchObject({ clientId: "tk", clientSecret: "ts" });
    expect(providerConfigFromEnv("instagram", base)).toMatchObject({ clientId: "ig", clientSecret: "is" });
    expect(providerConfigFromEnv("threads", base)).toMatchObject({ clientId: "th", clientSecret: "ths" });
    expect(providerConfigFromEnv("facebook", base)).toMatchObject({ clientId: "fb", clientSecret: "fs" });
    expect(providerConfigFromEnv("youtube", base)).toMatchObject({ clientId: "gc", clientSecret: "gs" });
  });

  it("makes the redirect address from the web address: <app>/auth/<platform>/callback", () => {
    for (const id of PROVIDER_IDS) {
      expect(providerConfigFromEnv(id, base)!.redirectUri).toBe(`https://app.example.test/auth/${id}/callback`);
    }
    expect(providerConfigFromEnv("threads", { ...base, APP_WEB_URL: "https://app.example.test///" })!.redirectUri).toBe("https://app.example.test/auth/threads/callback");
  });

  it("lets a platform's own redirect address win", () => {
    const config = providerConfigFromEnv("instagram", { ...base, INSTAGRAM_REDIRECT_URI: "https://other.example.test/ig/back" });
    expect(config!.redirectUri).toBe("https://other.example.test/ig/back");
  });

  it("is null (not an error) when the platform isn't set up on this server", () => {
    expect(providerConfigFromEnv("instagram", {})).toBeNull();
    expect(providerConfigFromEnv("instagram", { ...base, INSTAGRAM_APP_SECRET: "" })).toBeNull();
    expect(providerConfigFromEnv("instagram", { ...base, INSTAGRAM_APP_ID: "   " })).toBeNull();
    // keys but nowhere to come back to
    expect(providerConfigFromEnv("instagram", { ...base, APP_WEB_URL: undefined })).toBeNull();
  });

  it("names the settings each platform needs", () => {
    expect(providerEnvNames("youtube")).toMatchObject({ id: "GOOGLE_CLIENT_ID", secret: "GOOGLE_CLIENT_SECRET" });
    expect(providerEnvNames("facebook")).toMatchObject({ id: "FACEBOOK_APP_ID", secret: "FACEBOOK_APP_SECRET" });
  });

  it("refuses a redirect address the platforms would reject", () => {
    for (const bad of [
      "http://app.example.test/cb",
      "https://app.example.test/cb?x=1",
      "https://app.example.test/cb#frag",
      "not a url",
      "https://app.example.test/" + "x".repeat(520),
    ]) {
      expect(() => providerConfigFromEnv("instagram", { ...base, INSTAGRAM_REDIRECT_URI: bad }), bad.slice(0, 40)).toThrow(ProviderConfigError);
    }
  });
});

describe("the local stand-ins (testing on one machine)", () => {
  const local = { ...base, INSTAGRAM_REDIRECT_URI: "http://localhost:8081/auth/instagram/callback", INSTAGRAM_MOCK_ORIGIN: "http://127.0.0.1:4010/instagram" };

  it("lets the redirect be http://localhost, but only together with the stand-in", () => {
    expect(providerConfigFromEnv("instagram", local)).toMatchObject({ mockOrigin: "http://127.0.0.1:4010/instagram", redirectUri: local.INSTAGRAM_REDIRECT_URI });
    expect(() => providerConfigFromEnv("instagram", { ...local, INSTAGRAM_MOCK_ORIGIN: undefined })).toThrow(ProviderConfigError);
  });

  it("never lets the stand-in point anywhere but this machine", () => {
    for (const bad of [
      "https://evil.example",
      "http://evil.example:4010",
      "http://8.8.8.8:4010",
      "http://172.32.0.1:4010", // just outside the private range
      "http://192.168.1.5.evil.example:4010",
      "https://127.0.0.1:4010",
      "ftp://localhost",
      "nope",
    ]) {
      expect(() => providerConfigFromEnv("instagram", { ...local, INSTAGRAM_MOCK_ORIGIN: bad }), bad).toThrow(ProviderConfigError);
    }
  });

  it("accepts this computer's address on a private network, so a phone on the same Wi-Fi can be tried", () => {
    for (const lan of ["http://192.168.1.20:4010/instagram", "http://10.0.0.5:4010/instagram", "http://172.16.4.9:4010/instagram"]) {
      const env = { ...local, INSTAGRAM_MOCK_ORIGIN: lan, INSTAGRAM_REDIRECT_URI: "http://192.168.1.20:8081/auth/instagram/callback" };
      expect(providerConfigFromEnv("instagram", env)!.mockOrigin).toBe(lan);
    }
    // ... but only together with a stand-in, never for a real platform
    expect(() => providerConfigFromEnv("instagram", { ...base, INSTAGRAM_REDIRECT_URI: "http://192.168.1.20:8081/auth/instagram/callback" })).toThrow(ProviderConfigError);
  });

  it("accepts a path prefix (one stand-in server serves every platform) but nothing sneakier", () => {
    expect(providerConfigFromEnv("instagram", { ...local, INSTAGRAM_MOCK_ORIGIN: "http://127.0.0.1:4010/instagram/" })!.mockOrigin).toBe("http://127.0.0.1:4010/instagram");
    for (const bad of ["http://user:pw@127.0.0.1:4010", "http://127.0.0.1:4010/instagram?x=1", "http://127.0.0.1:4010/#frag"]) {
      expect(() => providerConfigFromEnv("instagram", { ...local, INSTAGRAM_MOCK_ORIGIN: bad }), bad).toThrow(ProviderConfigError);
    }
  });

  it("still refuses a non-local http redirect, stand-in or not", () => {
    expect(() => providerConfigFromEnv("instagram", { ...local, INSTAGRAM_REDIRECT_URI: "http://evil.example/cb" })).toThrow(ProviderConfigError);
  });

  it("makes an adapter for every platform", () => {
    for (const id of PROVIDER_IDS) {
      const adapter = createProviderAdapter(id, providerConfigFromEnv(id, base)!);
      expect(adapter.id).toBe(id);
      expect(adapter.requiredScopes.length).toBeGreaterThan(0);
    }
  });
});
