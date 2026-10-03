import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "supabase/tests/**/*.test.ts"],
    // The migration tests boot an in-process Postgres and apply every
    // migration, which takes a few seconds per database.
    testTimeout: 30_000,
    hookTimeout: 120_000,
    // Each of those databases is a WebAssembly Postgres of a few hundred MB. Running every test file at
    // once can exhaust the memory of a laptop ("Worker exited unexpectedly", "could not allocate memory").
    poolOptions: { forks: { minForks: 1, maxForks: 2 } },
  },
});
