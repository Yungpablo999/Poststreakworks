// ============================================================================
// tRPC router: Creator Network
// STUB — structural placeholder only. No implementation yet.
// Data model: supabase/migrations/20260814000004_creator_network.sql
// ============================================================================
//
// Intended procedures: discovery.feed/act (pass/interested/save),
// matches.list, messages.send/list, briefs.create/update/complete,
// squads.list/join/leave. This is the router where the RLS philosophy
// decision (DATA_MODEL.md item F) actually bites — leaderboard and
// discovery-feed procedures need cross-user reads that plain row-owner
// RLS won't grant, whichever option gets picked.
// ============================================================================
