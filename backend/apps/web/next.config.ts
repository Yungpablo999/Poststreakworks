import path from "path";
import type { NextConfig } from "next";

// Without this, Turbopack auto-detects the workspace root by walking up
// looking for lockfiles, and picks the wrong one: this repo has the root
// Expo app's package-lock.json two levels above backend/'s own
// pnpm-lock.yaml, and Turbopack was choosing the outer one (see "Next.js
// inferred your workspace root, but it may not be correct" in dev output).
// That means it was watching/resolving against a much larger, irrelevant
// file tree (the Expo app's node_modules) on every dev server start,
// which is real, measurable, avoidable overhead — not inherent Turbopack
// slowness. Measured: 35.7s -> 20.7s cold start with this set.
const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;
