import { spawn, type ChildProcess } from "node:child_process";
import type { AddressInfo } from "node:net";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createProviderAdapter } from "./index";
import { ProviderApiError, PROVIDER_IDS, type ProviderAdapter, type ProviderId, type ProviderPost } from "./types";

// The adapters against the local stand-in platforms (backend/scripts/mock-providers.mjs), over real
// HTTP on this machine. The stand-ins are a second, independent implementation of each platform's
// documented replies, so this catches an adapter that only agrees with itself. It is NOT proof of
// what the live platforms do — that needs real approved apps (see backend/STAGING_RUNBOOK.md).

let server: ChildProcess;
let origin: string;

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address() as AddressInfo;
      probe.close(() => resolve(port));
    });
  });

beforeAll(async () => {
  const port = await freePort();
  origin = `http://127.0.0.1:${port}`;
  // Run the stand-ins the way a person does: as their own process
  const script = fileURLToPath(new URL("../../../scripts/mock-providers.mjs", import.meta.url));
  server = spawn(process.execPath, [script], { env: { ...process.env, MOCK_PROVIDERS_PORT: String(port) }, stdio: ["ignore", "pipe", "inherit"] });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.once("exit", (code) => reject(new Error(`the stand-ins stopped (exit ${code})`)));
    server.stdout!.on("data", (chunk: Buffer) => {
      if (chunk.toString().includes("stand-in platforms on")) resolve();
    });
  });
}, 30_000);

afterAll(async () => {
  server?.removeAllListeners("exit");
  server?.kill();
});

const STATE = "w.0123456789abcdefghijklmnopqrstuvwxyzABCDEFG";

function adapterFor(id: ProviderId): ProviderAdapter {
  return createProviderAdapter(id, {
    clientId: `local-${id}`,
    clientSecret: "local-secret",
    redirectUri: `http://localhost:8081/auth/${id}/callback`,
    mockOrigin: `${origin}/${id}`,
  });
}

/** Opens the platform's sign-in page and "taps" the person whose name contains `who`; returns where it sends them back. */
async function signInAs(adapter: ProviderAdapter, who: string): Promise<URL> {
  const html = await (await fetch(adapter.authorizeUrl(STATE))).text();
  const links = [...html.matchAll(/<a class="who" href="([^"]*)"><b>([^<]*)<\/b>/g)].map((m) => ({ href: m[1]!.replace(/&amp;/g, "&"), label: m[2]! }));
  const link = links.find((l) => l.label.includes(who));
  if (!link) throw new Error(`no "${who}" on the sign-in page: ${links.map((l) => l.label).join(", ")}`);
  return new URL(link.href);
}

async function allPosts(adapter: ProviderAdapter, tokens: Parameters<ProviderAdapter["fetchPosts"]>[0], account: Parameters<ProviderAdapter["fetchPosts"]>[1], limit = 20) {
  const posts: ProviderPost[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 20; page++) {
    const result = await adapter.fetchPosts(tokens, account, { cursor, limit });
    posts.push(...result.posts);
    if (!result.hasMore || result.cursor === null) return posts;
    cursor = result.cursor;
  }
  throw new Error("never reached the last page");
}

describe.each(PROVIDER_IDS)("%s against its local stand-in", (id) => {
  it("goes from sign-in to numbers: connect, read the account, read every post", async () => {
    const adapter = adapterFor(id);
    const back = await signInAs(adapter, "Bayo");

    // the platform sends the person back to our callback address, with the code and our state untouched
    expect(`${back.origin}${back.pathname}`).toBe(`http://localhost:8081/auth/${id}/callback`);
    expect(back.searchParams.get("state")).toBe(STATE);
    const code = back.searchParams.get("code")!;
    expect(code).toBeTruthy();

    const tokens = await adapter.exchangeCode(code);
    for (const scope of adapter.requiredScopes) expect(tokens.scopes).toContain(scope);
    expect(tokens.accessToken.length).toBeGreaterThan(8);

    const account = await adapter.fetchAccount(tokens);
    expect(account.externalId).toBeTruthy();
    expect(account.name).toBe("Bayo Alade");
    expect(account.followers).toBeGreaterThan(0);

    const posts = await allPosts(adapter, tokens, account);
    expect(posts.length).toBeGreaterThan(3);
    expect(new Set(posts.map((p) => p.id)).size).toBe(posts.length);
    for (const post of posts) {
      expect(post.title).not.toBe("");
      expect(post.postedAt).toBeInstanceOf(Date);
      expect(post.views).toBeGreaterThan(0);
      expect(post.likes).toBeGreaterThanOrEqual(0);
    }
    // newest first
    const times = posts.map((p) => p.postedAt!.getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
    if (account.posts !== null) expect(posts.length).toBe(account.posts);
  });

  it("gives the same posts however they are paged", async () => {
    const adapter = adapterFor(id);
    const tokens = await adapter.exchangeCode((await signInAs(adapter, "Chidi")).searchParams.get("code")!);
    const account = await adapter.fetchAccount(tokens);
    const whole = await allPosts(adapter, tokens, account, 20);
    const small = await allPosts(adapter, tokens, account, 4);
    expect(small.map((p) => p.id)).toEqual(whole.map((p) => p.id));
  });

  it("renews, and the renewed token works", async () => {
    const adapter = adapterFor(id);
    const tokens = await adapter.exchangeCode((await signInAs(adapter, "Dami")).searchParams.get("code")!);
    if (adapter.refreshWindowMs === 0) {
      // A Facebook Page token doesn't run out
      expect(tokens.accessExpiresAt).toBeNull();
      expect(adapter.canRefresh(tokens, new Date())).toBe(false);
      return;
    }
    expect(adapter.canRefresh(tokens, new Date())).toBe(true);
    const fresh = await adapter.refresh(tokens);
    expect(fresh.accessToken).not.toBe(tokens.accessToken);
    expect(fresh.scopes.length).toBeGreaterThan(0);
    expect((await adapter.fetchAccount(fresh)).name).toBe("Dami Bello");
  });

  it("refuses a code it never issued", async () => {
    const err = await adapterFor(id).exchangeCode("garbage").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProviderApiError);
    expect((err as ProviderApiError).provider).toBe(id);
  });

  it("asks the creator to reconnect when the platform turns the connection down, and a fresh connection fixes it", async () => {
    const adapter = adapterFor(id);
    const tokens = await adapter.exchangeCode((await signInAs(adapter, "Ada")).searchParams.get("code")!);
    expect((await adapter.fetchAccount(tokens)).name).toBe("Ada Okoye");

    await fetch(`${origin}/${id}/_control/expire?account=ada_free_new`);
    const err = (await adapter.fetchAccount(tokens).catch((e: unknown) => e)) as ProviderApiError;
    expect(err).toBeInstanceOf(ProviderApiError);
    expect(err.kind).toBe("reauth");

    // connecting again fixes it
    const again = await adapter.exchangeCode((await signInAs(adapter, "Ada")).searchParams.get("code")!);
    expect((await adapter.fetchAccount(again)).name).toBe("Ada Okoye");
    await fetch(`${origin}/${id}/_control/reset`);
  });

  it("says where the person ends up when they cancel", async () => {
    const adapter = adapterFor(id);
    const html = await (await fetch(adapter.authorizeUrl(STATE))).text();
    const cancel = new URL(/class="cancel" href="([^"]*)"/.exec(html)![1]!.replace(/&amp;/g, "&"));
    expect(cancel.searchParams.get("error")).toBe("access_denied");
    expect(cancel.searchParams.get("state")).toBe(STATE);
    expect(cancel.searchParams.get("code")).toBeNull();
  });
});

describe("what only some platforms do", () => {
  it("Facebook connects the biggest Page, not the first one listed", async () => {
    const adapter = adapterFor("facebook");
    const tokens = await adapter.exchangeCode((await signInAs(adapter, "Bayo")).searchParams.get("code")!);
    const account = await adapter.fetchAccount(tokens);
    expect(account.followers).toBeGreaterThan(1000); // the small old Page has 14
    expect(account.handle).toBe("bayo_studio");
  });

  it("Facebook says so when the person manages no Page", async () => {
    const adapter = adapterFor("facebook");
    await expect(adapter.exchangeCode((await signInAs(adapter, "no Facebook Page")).searchParams.get("code")!)).rejects.toMatchObject({ code: "no_page" });
  });

  it("YouTube says so when the Google account has no channel", async () => {
    const adapter = adapterFor("youtube");
    const tokens = await adapter.exchangeCode((await signInAs(adapter, "no YouTube channel")).searchParams.get("code")!);
    await expect(adapter.fetchAccount(tokens)).rejects.toMatchObject({ code: "no_channel" });
  });

  it("YouTube: the refresh token stops working once the grant is revoked", async () => {
    const adapter = adapterFor("youtube");
    const tokens = await adapter.exchangeCode((await signInAs(adapter, "Bayo")).searchParams.get("code")!);
    expect(tokens.refreshToken).toBeTruthy();
    await adapter.revoke(tokens);
    await expect(adapter.refresh(tokens)).rejects.toMatchObject({ kind: "reauth", code: "invalid_grant" });
  });

  it("Instagram and Threads: the long-lived token lasts about 60 days", async () => {
    for (const id of ["instagram", "threads"] as const) {
      const adapter = adapterFor(id);
      const tokens = await adapter.exchangeCode((await signInAs(adapter, "Bayo")).searchParams.get("code")!);
      const days = (tokens.accessExpiresAt!.getTime() - Date.now()) / 86_400_000;
      expect(days).toBeGreaterThan(59);
      expect(days).toBeLessThan(61);
      expect(tokens.refreshToken).toBeNull();
    }
  });
});
