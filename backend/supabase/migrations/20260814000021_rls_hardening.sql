-- ============================================================================
-- Migration: RLS hardening — server-authoritative state is server-written
-- ============================================================================
--
-- Why this exists. The Supabase anon key is public by design, and the sign-in
-- endpoints hand every user a real Supabase session token. With those two, any
-- signed-in user can call PostgREST directly (/rest/v1/<table>) and bypass the
-- API entirely. So RLS — not the tRPC layer — is the real security boundary.
--
-- Migrations 1–18 granted clients write access to tables that must only ever be
-- written by the server. Concretely, any signed-in user could:
--
--   * PATCH their own users row:  role = 'staff_admin'  (admin takeover), or
--     account_status = 'active' (clear their own suspension)
--   * INSERT a subscriptions row with status 'active' (free Pro — `tier` is
--     resolved from this table)
--   * INSERT credits / milestones rows (mint unlimited XP and level up)
--   * INSERT streak_events / UPDATE streak_states (set any streak)
--   * INSERT voice_minutes_ledger / voice_topups / payment_transactions rows
--   * INSERT into any conversation's messages, or join a squad as 'leader'
--
-- After this migration the rule is:
--   * creators write rows they genuinely author (profile, posts, drafts, hooks,
--     messages in their own conversations, reports, blocks);
--   * money, credits, streaks, roles and account status are written only by the
--     server (service_role), via SECURITY DEFINER functions where the write
--     must be atomic.
--
-- Not in this migration (tracked in backend/PHASE1_CONTRACT.md "Still open"):
-- missions, duels, referrals, quest_progress and challenge_participants still
-- have client-write policies; closing them needs router changes that belong
-- with those features' own work.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. users: column-level update. Privilege and status columns are server-only.
-- ----------------------------------------------------------------------------
-- The row policy (users_update_own) only limits WHICH ROW; it never limited
-- which COLUMNS. Revoke the blanket UPDATE and grant back only what a creator
-- legitimately edits. (REVOKE first: revoking at table level also clears any
-- column-level grants, so the order matters.)
revoke update on public.users from anon, authenticated;
grant update (
  display_name, avatar_url, country, locale, consent_marketing,
  onboarding_completed, timezone, tour_done_at, tips_seen
) on public.users to authenticated;

-- ----------------------------------------------------------------------------
-- 2. Money, credits and streaks: no client writes
-- ----------------------------------------------------------------------------
drop policy if exists "subscriptions_insert_own"         on subscriptions;
drop policy if exists "subscriptions_update_own"         on subscriptions;
drop policy if exists "payment_transactions_insert_own"  on payment_transactions;
drop policy if exists "voice_topups_insert_own"          on voice_topups;
drop policy if exists "voice_minutes_ledger_insert_own"  on voice_minutes_ledger;
drop policy if exists "credits_insert_own"               on credits;
drop policy if exists "milestones_insert_own"            on milestones;
drop policy if exists "streak_events_insert_own"         on streak_events;
drop policy if exists "streak_states_insert_own"         on streak_states;
drop policy if exists "streak_states_update_own"         on streak_states;
drop policy if exists "streak_freezes_insert_own"        on streak_freezes;

-- ----------------------------------------------------------------------------
-- 3. notifications: a creator may mark their own as read, nothing else
-- ----------------------------------------------------------------------------
-- (Previously the policy allowed rewriting title/body/metadata of their own
-- notifications.)
revoke update on public.notifications from anon, authenticated;
grant update (read) on public.notifications to authenticated;

-- ----------------------------------------------------------------------------
-- 4. Messaging and squads: authorship alone isn't authorisation
-- ----------------------------------------------------------------------------
-- messages: the sender must also be a participant in the conversation. Mirrors
-- the existing messages_select_own membership check.
drop policy if exists "messages_insert_own" on messages;
create policy "messages_insert_participant" on messages
  for insert with check (
    sender_id = auth.uid()
    and conversation_id in (
      select c.id
        from conversations c
        join matches m on c.match_id = m.id
       where m.user_a_id in (select id from creator_profiles where user_id = auth.uid())
          or m.user_b_id in (select id from creator_profiles where user_id = auth.uid())
    )
  );

-- squad_members: anyone may join as a member; only the squad's creator may hold
-- the 'leader' role (the creator adds themselves as leader when making a squad).
drop policy if exists "squad_members_insert_own" on squad_members;
create policy "squad_members_insert_own" on squad_members
  for insert with check (
    user_id = auth.uid()
    and (
      role = 'member'
      or exists (select 1 from squads s where s.id = squad_id and s.created_by = auth.uid())
    )
  );

-- collaboration_tasks: only on briefs you created.
drop policy if exists "collaboration_tasks_insert_own" on collaboration_tasks;
create policy "collaboration_tasks_insert_own" on collaboration_tasks
  for insert with check (
    assigned_to = auth.uid()
    and exists (
      select 1 from collaboration_briefs b where b.id = brief_id and b.created_by = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 5. OAuth tokens: written by the app when connecting, readable only by the server
-- ----------------------------------------------------------------------------
-- platform_connections holds each creator's social-account access and refresh
-- tokens. The owner-select policy let the app (and anything running in it) read
-- those long-lived credentials back, but only the server — the scheduled
-- publisher and the token refresh — ever needs them. So creators keep every
-- other column and can still insert a connection; the token columns are
-- unreadable to them. Anything that does `select *` on this table as a creator
-- will now fail, which is the point: list the columns you need.
--
-- Not done here (tracked in backend/PHASE1_CONTRACT.md): encrypting the tokens
-- at rest (Supabase Vault), and replacing "the app sends us a token" with a
-- server-side OAuth callback.
--
-- Columns added to this table later need an explicit `grant select (col)`.
do $$
declare
  v_cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into v_cols
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'platform_connections'
     and column_name not in ('access_token', 'refresh_token');

  revoke select on public.platform_connections from anon, authenticated;
  execute format('grant select (%s) on public.platform_connections to authenticated', v_cols);
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. analytics_events: intentionally NOT opened to clients
-- ----------------------------------------------------------------------------
-- 20260814000008 states analytics writes go through the service role only, and
-- that is the right design: the free-tier AI quota is computed by counting
-- these rows, so a client-writable table would make the quota (and the growth
-- metrics) forgeable. But the routers were inserting events with the caller's
-- own client, which RLS denies — silently, since the error was ignored. So no
-- analytics were recorded and the quota never tripped. The fix is in the
-- routers (ctx.track(), which writes with the service role), not here.
