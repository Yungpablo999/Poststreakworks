import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { TokenVaultError, isSealed, needsReseal, openToken, sealToken } from "./token-vault";

const newKey = () => randomBytes(32).toString("base64");
const env = { TOKEN_ENCRYPTION_KEY: newKey() };
const CONTEXT = "11111111-1111-1111-1111-111111111111:tiktok:access";

describe("token vault", () => {
  it("opens what it sealed", () => {
    const sealed = sealToken("act.example-token-123", CONTEXT, env);
    expect(openToken(sealed, CONTEXT, env)).toBe("act.example-token-123");
  });

  it("never stores the token readably", () => {
    const sealed = sealToken("act.example-token-123", CONTEXT, env);
    expect(sealed).not.toContain("example-token");
    expect(sealed.startsWith("v1.")).toBe(true);
    expect(isSealed(sealed)).toBe(true);
    expect(isSealed("act.example-token-123")).toBe(false);
  });

  it("produces a different value every time (random IV)", () => {
    expect(sealToken("same", CONTEXT, env)).not.toBe(sealToken("same", CONTEXT, env));
  });

  it("handles empty, long and non-ASCII tokens", () => {
    for (const token of ["", "x".repeat(5000), "tökén-😀-токен"]) {
      expect(openToken(sealToken(token, CONTEXT, env), CONTEXT, env)).toBe(token);
    }
  });

  describe("refuses to open", () => {
    const sealed = sealToken("secret-token", CONTEXT, env);

    it("a value that was tampered with", () => {
      const parts = sealed.split(".");
      const flipped = parts[3]!.startsWith("A") ? "B" + parts[3]!.slice(1) : "A" + parts[3]!.slice(1);
      expect(() => openToken([parts[0], parts[1], parts[2], flipped].join("."), CONTEXT, env)).toThrow(TokenVaultError);
    });

    it("a value sealed for a different user, platform or column", () => {
      expect(() => openToken(sealed, "22222222-2222-2222-2222-222222222222:tiktok:access", env)).toThrow(TokenVaultError);
      expect(() => openToken(sealed, "11111111-1111-1111-1111-111111111111:instagram:access", env)).toThrow(TokenVaultError);
      expect(() => openToken(sealed, "11111111-1111-1111-1111-111111111111:tiktok:refresh", env)).toThrow(TokenVaultError);
    });

    it("the wrong key", () => {
      expect(() => openToken(sealed, CONTEXT, { TOKEN_ENCRYPTION_KEY: newKey() })).toThrow(TokenVaultError);
    });

    it("something that was never sealed", () => {
      expect(() => openToken("plain-token", CONTEXT, env)).toThrow(TokenVaultError);
      expect(() => openToken("v1.a.b", CONTEXT, env)).toThrow(TokenVaultError);
      expect(() => openToken("", CONTEXT, env)).toThrow(TokenVaultError);
    });

    it("without leaking the token or key in the error", () => {
      try {
        openToken(sealed, "wrong-context", env);
        expect.unreachable();
      } catch (err) {
        const message = (err as Error).message;
        expect(message).not.toContain("secret-token");
        expect(message).not.toContain(env.TOKEN_ENCRYPTION_KEY);
      }
    });
  });

  describe("keys", () => {
    it("fail loudly when missing or the wrong size", () => {
      expect(() => sealToken("x", CONTEXT, {})).toThrow(/TOKEN_ENCRYPTION_KEY is not set/);
      expect(() => sealToken("x", CONTEXT, { TOKEN_ENCRYPTION_KEY: "short" })).toThrow(/32 random bytes/);
      expect(() => sealToken("x", CONTEXT, { TOKEN_ENCRYPTION_KEY: randomBytes(16).toString("base64") })).toThrow(/32 random bytes/);
    });

    it("rotate: values sealed with the previous key still open, and can be re-sealed", () => {
      const oldKey = newKey();
      const sealedOld = sealToken("rotating-token", CONTEXT, { TOKEN_ENCRYPTION_KEY: oldKey });

      const rotated = { TOKEN_ENCRYPTION_KEY: newKey(), TOKEN_ENCRYPTION_KEY_PREVIOUS: oldKey };
      expect(openToken(sealedOld, CONTEXT, rotated)).toBe("rotating-token");
      expect(needsReseal(sealedOld, CONTEXT, rotated)).toBe(true);

      const resealed = sealToken(openToken(sealedOld, CONTEXT, rotated), CONTEXT, rotated);
      expect(needsReseal(resealed, CONTEXT, rotated)).toBe(false);
      // and it opens with the new key alone, so the old one can finally be dropped
      expect(openToken(resealed, CONTEXT, { TOKEN_ENCRYPTION_KEY: rotated.TOKEN_ENCRYPTION_KEY })).toBe("rotating-token");
    });
  });
});
