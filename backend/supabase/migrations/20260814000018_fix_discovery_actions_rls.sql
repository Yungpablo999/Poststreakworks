-- ============================================================================
-- Fix: discovery_actions RLS compared actor_id directly to auth.uid()
-- ============================================================================
-- actor_id/target_id are creator_profiles.id (a random gen_random_uuid()),
-- not users.id — so `actor_id = auth.uid()` can never be true for any real
-- caller. This made creatorNetwork.discover (every swipe/save/pass/pitch
-- action on the Match screen) fail for every user, always. Found live: a
-- real insert attempt via the app's own auth path returned a bare
-- INTERNAL_SERVER_ERROR with no clearer signal, because RLS violations on
-- INSERT surface as a generic Postgres error, not a typed one.
--
-- matches' RLS already gets this right (see 20260814000004) — this brings
-- discovery_actions in line with that same subquery pattern.

drop policy if exists "discovery_actions_insert_own" on discovery_actions;
create policy "discovery_actions_insert_own" on discovery_actions
  for insert with check (
    actor_id in (select id from creator_profiles where user_id = auth.uid())
  );

drop policy if exists "discovery_actions_select_own" on discovery_actions;
create policy "discovery_actions_select_own" on discovery_actions
  for select using (
    actor_id in (select id from creator_profiles where user_id = auth.uid())
  );
