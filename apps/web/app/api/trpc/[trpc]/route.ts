// ============================================================================
// tRPC HTTP entrypoint (Next.js Route Handler)
// STUB — structural placeholder only. No implementation yet.
// Governed by: packages/api/BACKEND_ARCHITECTURE.md
// ============================================================================
//
// Intended contents: Next.js App Router catch-all route that adapts
// incoming HTTP requests to the tRPC `appRouter` (packages/api/root.ts)
// via `fetchRequestHandler`. This is the ONLY way the mobile app and any
// external caller reach the backend — there is no separate REST layer.
//
// Auth: reads either a Supabase cookie session (web, same-origin request)
// or an `Authorization: Bearer <token>` header (mobile) — see
// packages/api/context.ts for the dual-mode auth resolution.
// ============================================================================
