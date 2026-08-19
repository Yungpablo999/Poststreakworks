import { FlatCompat } from "@eslint/eslintrc";

// next lint prompts interactively to generate this file on first run when
// none exists — which hangs forever in non-interactive CI. Written
// explicitly instead of letting that prompt happen.
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**"],
  },
];
