import { describe, expect, it } from "vitest";
import { DEV_ACCOUNTS, isDevAccount } from "./dev-accounts";
import { DevLoginDisabledError, DevLoginFailedError, devLogin } from "./dev-login";

const LOCAL = {
  NODE_ENV: "development",
  DEV_LOGIN: "true",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
};

describe("test accounts", () => {
  it("are one of each kind: free/pro × new/existing", () => {
    const kinds = DEV_ACCOUNTS.map((a) => `${a.plan}/${a.stage}`).sort();
    expect(kinds).toEqual(["free/existing", "free/new", "pro/existing", "pro/new"]);
  });

  it("use throwaway example.com addresses and distinct handles", () => {
    expect(DEV_ACCOUNTS.every((a) => a.email.endsWith("@example.com"))).toBe(true);
    expect(new Set(DEV_ACCOUNTS.map((a) => a.handle)).size).toBe(DEV_ACCOUNTS.length);
  });

  it("are recognised case-insensitively, and nobody else is", () => {
    expect(isDevAccount("Free.New@Example.com")).toBe(true);
    expect(isDevAccount("someone.real@gmail.com")).toBe(false);
  });
});

describe("one-tap sign-in", () => {
  it("refuses when it is not switched on", async () => {
    await expect(devLogin("free.new@example.com", { ...LOCAL, DEV_LOGIN: undefined })).rejects.toBeInstanceOf(DevLoginDisabledError);
  });

  it("refuses anyone who is not a test account, even on the local stack", async () => {
    await expect(devLogin("someone.real@gmail.com", LOCAL)).rejects.toBeInstanceOf(DevLoginFailedError);
  });
});
