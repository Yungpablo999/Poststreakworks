import { describe, expect, it } from "vitest";
import { allowedOrigin, corsHeaders } from "./cors";

describe("allowedOrigin", () => {
  it("allows any website when nothing is configured (local development)", () => {
    expect(allowedOrigin("http://localhost:8081", undefined)).toBe("http://localhost:8081");
    expect(allowedOrigin("http://localhost:8081", "  ")).toBe("http://localhost:8081");
    expect(allowedOrigin(null, undefined)).toBe("*"); // not a browser: harmless
  });

  it("allows only the listed websites once configured", () => {
    const configured = "https://app.poststreak.app, https://staging.poststreak.app/";
    expect(allowedOrigin("https://app.poststreak.app", configured)).toBe("https://app.poststreak.app");
    expect(allowedOrigin("https://staging.poststreak.app", configured)).toBe("https://staging.poststreak.app");
    expect(allowedOrigin("https://evil.example", configured)).toBeNull();
    // a look-alike that merely starts with an allowed name is still a different site
    expect(allowedOrigin("https://app.poststreak.app.evil.example", configured)).toBeNull();
    expect(allowedOrigin("http://app.poststreak.app", configured)).toBeNull();
    expect(allowedOrigin(null, configured)).toBeNull();
  });
});

describe("corsHeaders", () => {
  it("never allows credentials, and always varies by Origin", () => {
    const allowed = corsHeaders("https://app.poststreak.app", "https://app.poststreak.app");
    expect(allowed["Access-Control-Allow-Origin"]).toBe("https://app.poststreak.app");
    expect(allowed).not.toHaveProperty("Access-Control-Allow-Credentials");
    expect(allowed.Vary).toBe("Origin");
  });

  it("sends no allow headers to a website that isn't listed", () => {
    const denied = corsHeaders("https://evil.example", "https://app.poststreak.app");
    expect(denied).toEqual({ Vary: "Origin" });
  });
});
