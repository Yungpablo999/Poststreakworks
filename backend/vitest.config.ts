import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "supabase/tests/**/*.test.ts"],
    // The migration tests boot an in-process Postgres and apply every
    // migration, which takes a few seconds per database.
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
