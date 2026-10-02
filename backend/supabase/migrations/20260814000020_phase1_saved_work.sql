-- ============================================================================
-- Migration: Phase 1 — accounts state + "save what creators make"
-- ============================================================================
--
-- The finished front end (Expo app, October 2026) keeps all of this in memory,
-- so it resets on reload. This migration gives each piece a home:
--
--   in-memory today (src/data/index.ts, src/tour, src/mascot)  ->  here
--   ---------------------------------------------------------      -----------------
--   userProfile.niches                                          creator_profiles.niches
--   "tour done"                                                 users.tour_done_at
--   "tips seen"                                                 users.tips_seen
--   drafts (saveDraft)                                          drafts
--   saved hooks (toggleSavedHook)                               saved_hooks
--   check-ins / check-in streak                                 streak_events (+ streak_states cache)
--   repurpose allowance (spendRepurpose)                        repurpose_jobs
--
-- Design rules (see backend/PHASE1_CONTRACT.md):
--   * Rows a creator authors (drafts, saved hooks) are owner-only under RLS.
--   * Anything that gates an entitlement or feeds the streak (repurpose count,
--     check-ins) is written ONLY by the server, through SECURITY DEFINER
--     functions that only service_role may execute. A creator must not be able
--     to reset their own weekly allowance by deleting rows.
--   * "Today" and "this week" are the CREATOR's local day/week (users.timezone),
--     not the server's.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Mascot emotions — closes the open "Jarvis emotion count / colour" question
-- ----------------------------------------------------------------------------
-- The finished app has two characters: Jarvis (the AI, a flame orb) and Ghost
-- (the mascot, 12 emotions — one PNG each in assets/mascot/). Jarvis has no
-- emotion states of his own, so the 8-vs-9 question is moot. Keep in sync with
-- src/mascot/mascot.ts `Emotion`; a test compares this list to the API's zod enum.
create type ghost_emotion as enum (
  'wave', 'happy', 'excited', 'party', 'love', 'cool',
  'thinking', 'idea', 'working', 'determined', 'sleepy', 'calm'
);

create type draft_kind as enum ('script', 'post');

-- ----------------------------------------------------------------------------
-- 2. Profile / onboarding state
-- ----------------------------------------------------------------------------
alter table users
  add column if not exists timezone     text        not null default 'Africa/Lagos',
  add column if not exists tour_done_at timestamptz,
  add column if not exists tips_seen    text[]      not null default '{}',
  add constraint users_tips_seen_cap check (cardinality(tips_seen) <= 200);

alter table creator_profiles
  add column if not exists niches text[] not null default '{}',
  add constraint creator_profiles_niches_cap check (cardinality(niches) <= 12);

-- The creator's IANA time zone, falling back to Lagos when unset or invalid so
-- a bad value can never break a streak or allowance calculation. Validity is
-- tested by actually using the zone (rather than looking it up in
-- pg_timezone_names), which works the same on every Postgres build.
create or replace function public.user_timezone(p_user_id uuid)
returns text
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare
  v_tz text;
begin
  select u.timezone into v_tz from users u where u.id = p_user_id;
  if v_tz is null then
    return 'Africa/Lagos';
  end if;
  begin
    perform now() at time zone v_tz;
  exception when others then
    return 'Africa/Lagos';
  end;
  return v_tz;
end;
$$;

create or replace function public.local_today(p_user_id uuid)
returns date
language sql stable security definer set search_path = public, pg_catalog as $$
  select (now() at time zone public.user_timezone(p_user_id))::date
$$;

-- Marks a first-visit tip as seen. Runs as the caller (SECURITY INVOKER), so
-- it can only ever touch the caller's own row, and is idempotent + race-free.
create or replace function public.mark_tip_seen(p_key text)
returns text[]
language plpgsql security invoker set search_path = public, pg_catalog as $$
declare
  v_seen text[];
begin
  if p_key is null or p_key !~ '^[a-z0-9][a-z0-9:_-]{0,59}$' then
    raise exception 'invalid_tip_key' using errcode = 'P0001';
  end if;

  update users
     set tips_seen = case when p_key = any (tips_seen) then tips_seen else array_append(tips_seen, p_key) end
   where id = auth.uid()
  returning tips_seen into v_seen;

  return v_seen;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Per-user row cap — a tripwire against runaway clients, not a product limit
-- ----------------------------------------------------------------------------
-- AFTER INSERT, not BEFORE: "insert ... on conflict do update" (how the app
-- upserts a draft) fires BEFORE INSERT triggers even when it turns out to be an
-- edit, so a creator sitting exactly at the cap could no longer edit anything.
-- An edit never inserts a row, so it never reaches an AFTER INSERT trigger.
create or replace function public.enforce_user_row_cap()
returns trigger
language plpgsql set search_path = public, pg_catalog as $$
declare
  v_cap   integer := tg_argv[0]::integer;
  v_count integer;
begin
  execute format('select count(*) from %I.%I where user_id = $1', tg_table_schema, tg_table_name)
    into v_count using new.user_id;
  -- The new row is already counted.
  if v_count > v_cap then
    raise exception 'row_cap_exceeded:%', tg_table_name using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. Drafts
-- ----------------------------------------------------------------------------
-- The app addresses drafts by a client-chosen string id and upserts on it
-- ("same id updates and moves to top"), e.g. "jarvis-My morning reset". That id
-- is stored as client_key; the real primary key stays a uuid.
create table drafts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  client_key  text not null check (char_length(client_key) between 1 and 160),
  title       text not null check (char_length(title) between 1 and 300),
  kind        draft_kind not null,
  format      text not null check (char_length(format) <= 80),
  platform    platform_type,
  -- Room for the actual script / caption / slides once the composer saves them.
  payload     jsonb not null default '{}' check (pg_column_size(payload) <= 65536),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, client_key)
);

create index idx_drafts_user_updated on drafts(user_id, updated_at desc);

create trigger set_drafts_updated_at
  before update on drafts
  for each row execute function public.set_updated_at();

create trigger drafts_row_cap
  after insert on drafts
  for each row execute function public.enforce_user_row_cap(500);

alter table drafts enable row level security;

create policy "drafts_select_own" on drafts for select using (user_id = auth.uid());
create policy "drafts_insert_own" on drafts for insert with check (user_id = auth.uid());
create policy "drafts_update_own" on drafts for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "drafts_delete_own" on drafts for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 5. Saved hooks (Hook Studio hearts)
-- ----------------------------------------------------------------------------
create table saved_hooks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  line        text not null check (char_length(line) between 1 and 500),
  style       text not null check (style in ('talking', 'dance', 'skit', 'text')),
  idea        text not null default '' check (char_length(idea) <= 300),
  created_at  timestamptz not null default now(),
  unique (user_id, line)
);

create index idx_saved_hooks_user_created on saved_hooks(user_id, created_at desc);

create trigger saved_hooks_row_cap
  after insert on saved_hooks
  for each row execute function public.enforce_user_row_cap(500);

alter table saved_hooks enable row level security;

create policy "saved_hooks_select_own" on saved_hooks for select using (user_id = auth.uid());
create policy "saved_hooks_insert_own" on saved_hooks for insert with check (user_id = auth.uid());
create policy "saved_hooks_delete_own" on saved_hooks for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 6. Check-ins and the streak
-- ----------------------------------------------------------------------------
-- streak_events is already "the append-only log of qualifying actions per day",
-- which is exactly a check-in log, so check-ins live there (event_type
-- 'check_in') rather than in a second table that could drift from it.
-- streak_states stays as a cache of the log (current / longest / last day).
--
-- One qualifying day per user: enforced by the database, so two concurrent
-- requests (or a cron run racing a tap) can't double-count. First remove any
-- duplicates the old read-then-insert code may have left, keeping the earliest.
delete from streak_events a
 using streak_events b
 where a.user_id = b.user_id
   and a.event_date = b.event_date
   and (a.created_at, a.id) > (b.created_at, b.id);

create unique index if not exists uq_streak_events_user_day
  on streak_events(user_id, event_date);

-- Carry existing creators' streaks into the log, so "existing users keep their
-- streaks" (ROADMAP.md) holds now that the streak is read from the log. For
-- each streak_states row, write one 'check_in' per day of the stored run.
-- Idempotent; never overwrites a real event.
insert into streak_events (user_id, event_type, event_date, metadata)
select s.user_id, 'check_in', d::date, jsonb_build_object('backfilled', true)
  from streak_states s
 cross join lateral generate_series(
         (s.last_qualifying_day - (s.current_streak - 1))::timestamp,
         s.last_qualifying_day::timestamp,
         interval '1 day') as d
 where s.last_qualifying_day is not null
   and s.current_streak between 1 and 1000
on conflict (user_id, event_date) do nothing;

-- Records one qualifying action for the creator's local today. Idempotent per
-- local day. This is the ONLY place a streak is advanced: check-ins, publishing,
-- mission completion and collaboration completion all call it.
--
-- The streak is recomputed from the log (consecutive days ending today), so it
-- stays correct if events arrive late or are backfilled. A missed day simply
-- starts a new run — there are no freezes, countdowns or loss states
-- (product direction: "never guilt for a missed day").
create or replace function public.record_qualifying_action(
  p_user_id    uuid,
  p_event_type streak_event_type,
  p_metadata   jsonb default '{}'
) returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_today        date := public.local_today(p_user_id);
  v_rows         integer;
  v_streak       integer;
  v_longest      integer;
  v_is_milestone boolean;
  v_milestones   constant integer[] := array[7, 14, 30, 50, 100, 365];
begin
  insert into streak_states (user_id) values (p_user_id) on conflict (user_id) do nothing;
  -- Serialise concurrent calls for the same creator.
  perform 1 from streak_states where user_id = p_user_id for update;

  insert into streak_events (user_id, event_type, event_date, metadata)
  values (p_user_id, p_event_type, v_today, coalesce(p_metadata, '{}'::jsonb))
  on conflict (user_id, event_date) do nothing;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    select current_streak, longest_streak into v_streak, v_longest
      from streak_states where user_id = p_user_id;
    return jsonb_build_object(
      'qualified', false,
      'reason', 'already_qualified_today',
      'current_streak', coalesce(v_streak, 0),
      'longest_streak', coalesce(v_longest, 0)
    );
  end if;

  with ev as (
    select event_date,
           event_date - (row_number() over (order by event_date))::integer as grp
      from streak_events
     where user_id = p_user_id and event_date <= v_today
  )
  select count(*) into v_streak
    from ev
   where grp = (select grp from ev where event_date = v_today);

  update streak_states
     set current_streak      = v_streak,
         longest_streak      = greatest(longest_streak, v_streak),
         last_qualifying_day = v_today
   where user_id = p_user_id
  returning longest_streak into v_longest;

  v_is_milestone := v_streak = any (v_milestones);
  if v_is_milestone then
    insert into milestones (user_id, milestone_type)
    values (p_user_id, v_streak || '_day_streak');

    insert into credits (user_id, type, amount, source, description)
    values (p_user_id, 'earn', v_streak * 2, 'streak_milestone', v_streak || '-day streak milestone');
  end if;

  insert into analytics_events (user_id, event_name, properties)
  values (p_user_id, 'streak_qualified', jsonb_build_object(
    'event_type', p_event_type, 'new_streak', v_streak, 'is_milestone', v_is_milestone));

  return jsonb_build_object(
    'qualified', true,
    'current_streak', v_streak,
    'longest_streak', v_longest,
    'is_milestone', v_is_milestone
  );
end;
$$;

-- What Home / Quests / the calendar show for the check-in streak. Matches the
-- app's CheckInStreak: the run counts through today if checked in, otherwise
-- through yesterday; anything older is a fresh start at 0.
create or replace function public.get_check_in_summary(p_user_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare
  v_today      date := public.local_today(p_user_id);
  v_checked    boolean;
  v_anchor     date;
  v_current    integer := 0;
  v_longest    integer;
  v_week_start date;
  v_week       boolean[];
begin
  v_checked := exists (
    select 1 from streak_events where user_id = p_user_id and event_date = v_today);

  v_anchor := case
    when v_checked then v_today
    when exists (select 1 from streak_events where user_id = p_user_id and event_date = v_today - 1)
      then v_today - 1
    else null
  end;

  if v_anchor is not null then
    with ev as (
      select event_date,
             event_date - (row_number() over (order by event_date))::integer as grp
        from streak_events
       where user_id = p_user_id and event_date <= v_anchor
    )
    select count(*) into v_current
      from ev
     where grp = (select grp from ev where event_date = v_anchor);
  end if;

  -- Monday-first week, like the app's calendar.
  v_week_start := v_today - (extract(isodow from v_today)::integer - 1);
  select array_agg(
           exists (select 1 from streak_events e
                    where e.user_id = p_user_id and e.event_date = v_week_start + i)
           order by i)
    into v_week
    from generate_series(0, 6) as i;

  select coalesce(max(longest_streak), 0) into v_longest
    from streak_states where user_id = p_user_id;

  return jsonb_build_object(
    'currentDays',    v_current,
    'week',           to_jsonb(v_week),
    'todayIndex',     extract(isodow from v_today)::integer - 1,
    'checkedInToday', v_checked,
    'longestDays',    greatest(v_longest, v_current),
    'localDate',      v_today
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- 7. Repurpose allowance (free plan: N per week; Pro: unlimited)
-- ----------------------------------------------------------------------------
-- One row per repurpose a creator starts. The free plan's weekly allowance is
-- the number of these rows this week, so it is the single source of truth: the
-- count can't drift from the work. `source` and `versions` hold what was
-- repurposed and what was made; they stay empty until the AI behind Repurpose
-- is wired up (today the app generates sample copy).
create table repurpose_jobs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  -- e.g. {"kind":"link","url":"…"} or a reference to an uploaded video
  source     jsonb not null default '{}' check (pg_column_size(source) <= 65536),
  -- the platform versions Jarvis wrote
  versions   jsonb not null default '[]' check (pg_column_size(versions) <= 262144),
  created_at timestamptz not null default now()
);

create index idx_repurpose_jobs_user_time on repurpose_jobs(user_id, created_at desc);

alter table repurpose_jobs enable row level security;
-- Read-only for the owner. No client writes: this table enforces a limit, so a
-- creator who could delete rows could reset their own allowance.
create policy "repurpose_jobs_select_own" on repurpose_jobs for select using (user_id = auth.uid());

-- Start of the creator's current week (Monday 00:00 local), as an instant.
create or replace function public.local_week_start(p_user_id uuid)
returns timestamptz
language sql stable security definer set search_path = public, pg_catalog as $$
  select (date_trunc('week', now() at time zone public.user_timezone(p_user_id)))
         at time zone public.user_timezone(p_user_id)
$$;

create or replace function public.repurpose_used_this_week(p_user_id uuid)
returns integer
language sql stable security definer set search_path = public, pg_catalog as $$
  select count(*)::integer
    from repurpose_jobs
   where user_id = p_user_id and created_at >= public.local_week_start(p_user_id)
$$;

-- Spends one repurpose if the weekly limit allows. p_weekly_limit NULL means
-- unlimited (Pro). The limit is passed in by the server from TIER_LIMITS so
-- there is one source of truth for plan numbers.
create or replace function public.spend_repurpose(p_user_id uuid, p_weekly_limit integer)
returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_used integer;
  v_job  uuid;
begin
  -- Serialise concurrent spends for this creator, so two taps can't both pass.
  perform pg_advisory_xact_lock(hashtextextended('repurpose:' || p_user_id::text, 0));

  v_used := public.repurpose_used_this_week(p_user_id);

  if p_weekly_limit is not null and v_used >= p_weekly_limit then
    return jsonb_build_object('allowed', false, 'used', v_used, 'limit', p_weekly_limit);
  end if;

  insert into repurpose_jobs (user_id) values (p_user_id) returning id into v_job;
  return jsonb_build_object('allowed', true, 'used', v_used + 1, 'limit', p_weekly_limit, 'job_id', v_job);
end;
$$;

-- ----------------------------------------------------------------------------
-- 8. Function privileges
-- ----------------------------------------------------------------------------
-- Supabase grants EXECUTE on new functions to anon/authenticated by default.
-- Everything below takes a user id as an argument, so letting a client call it
-- would let them act as anyone. Server (service_role) only.
revoke execute on function public.user_timezone(uuid)                              from public, anon, authenticated;
revoke execute on function public.local_today(uuid)                                from public, anon, authenticated;
revoke execute on function public.local_week_start(uuid)                           from public, anon, authenticated;
revoke execute on function public.repurpose_used_this_week(uuid)                   from public, anon, authenticated;
revoke execute on function public.spend_repurpose(uuid, integer)                   from public, anon, authenticated;
revoke execute on function public.record_qualifying_action(uuid, streak_event_type, jsonb) from public, anon, authenticated;
revoke execute on function public.get_check_in_summary(uuid)                       from public, anon, authenticated;

grant execute on function public.user_timezone(uuid)                               to service_role;
grant execute on function public.local_today(uuid)                                 to service_role;
grant execute on function public.local_week_start(uuid)                            to service_role;
grant execute on function public.repurpose_used_this_week(uuid)                    to service_role;
grant execute on function public.spend_repurpose(uuid, integer)                    to service_role;
grant execute on function public.record_qualifying_action(uuid, streak_event_type, jsonb) to service_role;
grant execute on function public.get_check_in_summary(uuid)                        to service_role;

-- mark_tip_seen is SECURITY INVOKER and scoped to auth.uid(): safe for clients.
revoke execute on function public.mark_tip_seen(text) from public, anon;
grant  execute on function public.mark_tip_seen(text) to authenticated;
