// ============================================================================
// Shared design tokens
// STUB — structural placeholder only. Values are DATA, not components —
// sharing this file doesn't conflict with the "UI separate" decision below.
// Governed by: apps/web/FRONTEND_ARCHITECTURE.md
// ============================================================================
//
// Intended contents: color, spacing, and type-scale tokens consumed by
// apps/web (via Tailwind theme config) and apps/mobile (via
// StyleSheet/NativeWind) — same values, platform-native application.
//
// KNOWN STATE, NOT GUESSED:
//   - Jarvis's color is NOT #FF6581 / pink, contrary to the Architecture
//     Doc (§6, §10). Founder-corrected during Stage 3. Real value not yet
//     provided — do not fill this in with a guess.
//   - Whether Jarvis's appearance is one constant color or varies per
//     emotion state is unresolved — tied to the emotion-state-count
//     question (DATA_MODEL.md item B, 8 vs 9 states).
//   - Base palette per the Architecture Doc §10 (unconfirmed hex values):
//     warm cream (background), electric violet (primary), warm gold
//     (accent). No hex codes given anywhere in the source docs for these
//     three — only names.
//   - DESIGN.md, cited as a live file in the Architecture Doc, does not
//     exist in this repo. This file is not a substitute for it.
// ============================================================================
