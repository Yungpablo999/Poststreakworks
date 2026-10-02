import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { GHOST_EMOTIONS, GHOST_PLACES } from "@poststreak/ai/jarvis-chat";
import { APP_PLATFORMS } from "./platforms";

// The frontend imports its API shapes and route paths from frontend/shared.
// These tests fail the moment that contract and the server disagree, which is
// the cheapest place to catch it — before a screen shows a blank list.

const REPO = fileURLToPath(new URL("../../../../", import.meta.url));
const read = (path: string) => readFileSync(join(REPO, path), "utf8");

/** The string members of `export type Name = 'a' | 'b' | …;` */
function unionMembers(source: string, name: string): string[] {
  const match = new RegExp(`export type ${name}\\s*=([^;]*);`).exec(source);
  expect(match, `type ${name} not found in frontend/shared/types/phase1.ts`).not.toBeNull();
  return [...match![1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
}

describe("frontend/shared/types/phase1.ts matches the server", () => {
  const types = read("frontend/shared/types/phase1.ts");

  it("lists the same platforms", () => {
    expect(new Set(unionMembers(types, "AppPlatform"))).toEqual(new Set(APP_PLATFORMS));
  });

  it("lists the same Ghost emotions, in the same order as the database enum", () => {
    expect(unionMembers(types, "GhostEmotion")).toEqual([...GHOST_EMOTIONS]);
  });

  it("lists the same pages Ghost can open", () => {
    expect(unionMembers(types, "GhostPlace")).toEqual([...GHOST_PLACES]);
  });
});

describe("frontend/shared/constants/apiRoutes.ts matches the server", () => {
  const ROUTES_ROOT = join(REPO, "backend/apps/web/app/api/v1");
  const source = read("frontend/shared/constants/apiRoutes.ts");

  /** Does a route.ts exist for these path segments? `[param]` matches any dynamic folder. */
  function hasRoute(segments: string[], dir = ROUTES_ROOT): boolean {
    if (segments.length === 0) return existsSync(join(dir, "route.ts"));
    const [head, ...rest] = segments as [string, ...string[]];
    const candidates =
      head === "[param]"
        ? readdirSync(dir).filter((name) => /^\[.+\]$/.test(name))
        : existsSync(join(dir, head))
          ? [head]
          : [];
    return candidates.some((name) => hasRoute(rest, join(dir, name)));
  }

  const paths = [...source.matchAll(/['`](\/api\/v1\/[^'`]*)['`]/g)].map((m) => m[1]!);

  it("finds the routes in the contract file", () => {
    expect(paths.length).toBeGreaterThan(30);
  });

  it.each([...new Set(paths)])("has a route handler for %s", (path) => {
    const clean = path
      .split("?")[0]!
      .replace(/\$\{[^}]*\}/g, "[param]")
      .replace(/^\/api\/v1\//, "");
    expect(hasRoute(clean.split("/").filter(Boolean)), `no route.ts for ${path}`).toBe(true);
  });
});
