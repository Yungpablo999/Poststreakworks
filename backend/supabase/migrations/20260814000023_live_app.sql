-- ============================================================================
-- Migration: what the app's Home, Quests and bell need from the server
-- ============================================================================
--
-- Until now these screens showed numbers and lists the app made up. This gives
-- each of them a real source:
--
--   * notifications the server writes (once each), which the creator can only mark read;
--   * ONE definition of "a post a creator has made" (published through PostStreak, or
--     read from a connected account), used by the persona, the challenge and quests;
--   * quest completions: awarded exactly once per period, atomically with the XP,
--     by the server only (closing the "complete a quest as often as you like" hole
--     the Phase 1 security notes listed);
--   * the weekly challenge: one row per week, joined by the creator through the server;
--   * the days a creator asked to be reminded about the challenge.
--
-- Trust model (backend/PHASE1_CONTRACT.md §3): anything that awards XP or counts
-- towards a reward is written only by the server. Creators can read their own rows.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Notifications: server-made ones carry a key, so each is created once
-- ----------------------------------------------------------------------------
alter table notifications add column if not exists key text;

-- (Notes without a key stay possible: NULLs never collide in a unique index.)
create unique index if not exists uq_notifications_user_key
  on notifications (user_id, key);

-- ----------------------------------------------------------------------------
-- 2. A creator's posts
-- ----------------------------------------------------------------------------
-- Posts read from a connected account (post_stats), plus posts published through
-- PostStreak that haven't shown up in a sync yet (a published scheduled post whose
-- platform id is already in post_stats is the same post, not a second one).
-- Convention for scheduled_posts.platform_post_ids: {"tiktok": {"status": "...", "id": "..."}}.
create or replace function public.creator_posts(p_user_id uuid)
returns table (platform text, posted_at timestamptz, source text)
language sql stable security definer set search_path = public, pg_catalog as $$
  select ps.platform::text, ps.posted_at, 'synced'::text
    from post_stats ps
   where ps.user_id = p_user_id and ps.posted_at is not null
  union all
  select t.platform::text, coalesce(sp.published_at, sp.scheduled_at), 'published'::text
    from scheduled_posts sp
    cross join lateral unnest(sp.target_platforms) as t(platform)
   where sp.user_id = p_user_id
     and sp.status = 'published'
     and not exists (
       select 1 from post_stats ps
        where ps.user_id = p_user_id
          and ps.platform = t.platform
          and ps.platform_post_id = (sp.platform_post_ids -> (t.platform::text) ->> 'id')
     )
$$;

-- ----------------------------------------------------------------------------
-- 3. Quest completions
-- ----------------------------------------------------------------------------
-- The quests themselves (what each asks for) are code (workflows/quests.ts): each rule
-- is checked against the creator's real rows. This table is the record that a quest
-- was finished in a period ("D:2026-10-03" a day, "W:2026-09-28" a week, "O" once),
-- so it can't be awarded twice.
create table quest_completions (
  user_id       uuid not null references users(id) on delete cascade,
  quest_key     text not null check (char_length(quest_key) between 1 and 80),
  period_key    text not null check (char_length(period_key) between 1 and 40),
  xp            integer not null check (xp >= 0),
  completed_at  timestamptz not null default now(),
  primary key (user_id, quest_key, period_key)
);

create index idx_quest_completions_user on quest_completions (user_id, completed_at desc);

alter table quest_completions enable row level security;
create policy "quest_completions_select_own" on quest_completions
  for select using (user_id = auth.uid());
-- No client writes: see complete_quest().

-- Completes a quest for a period and pays its XP, once. Returns false when it was already
-- completed. One statement block, so the record and the XP can't get out of step.
create or replace function public.complete_quest(
  p_user_id uuid, p_quest_key text, p_period_key text, p_xp integer, p_title text
) returns boolean
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_rows integer;
begin
  insert into quest_completions (user_id, quest_key, period_key, xp)
  values (p_user_id, p_quest_key, p_period_key, greatest(p_xp, 0))
  on conflict do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return false;
  end if;
  if p_xp > 0 then
    insert into credits (user_id, type, amount, source, description)
    values (p_user_id, 'earn', p_xp, 'quest_completed', p_title);
  end if;
  return true;
end;
$$;

-- What a creator has done, counted in THEIR day and week: the facts quest rules read.
create or replace function public.quest_facts(p_user_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare
  v_tz         text := public.user_timezone(p_user_id);
  v_day_start  timestamptz := (date_trunc('day', now() at time zone v_tz)) at time zone v_tz;
  v_week_start timestamptz := public.local_week_start(p_user_id);
begin
  return jsonb_build_object(
    'today',            ((now() at time zone v_tz)::date)::text,
    'weekStart',        ((v_week_start at time zone v_tz)::date)::text,
    'dayStartAt',       v_day_start,
    'weekStartAt',      v_week_start,
    'draftsToday',      (select count(*) from drafts where user_id = p_user_id and updated_at >= v_day_start),
    'scriptDraftsToday',(select count(*) from drafts where user_id = p_user_id and kind = 'script' and updated_at >= v_day_start),
    'postDraftsToday',  (select count(*) from drafts where user_id = p_user_id and kind = 'post' and updated_at >= v_day_start),
    'draftsEver',       (select count(*) from drafts where user_id = p_user_id),
    'hooksToday',       (select count(*) from saved_hooks where user_id = p_user_id and created_at >= v_day_start),
    'hooksEver',        (select count(*) from saved_hooks where user_id = p_user_id),
    'hooksSameIdeaThisWeek',
      (select coalesce(max(c), 0) from (
         select count(*) as c from saved_hooks
          where user_id = p_user_id and created_at >= v_week_start group by idea) t),
    'ideaPicksToday',   (select count(*) from analytics_events
                          where user_id = p_user_id and event_name = 'client.idea_picked' and created_at >= v_day_start),
    'scheduledToday',   (select count(*) from scheduled_posts where user_id = p_user_id and created_at >= v_day_start),
    'scheduledThisWeek',(select count(*) from scheduled_posts where user_id = p_user_id and created_at >= v_week_start),
    'scheduledEver',    (select count(*) from scheduled_posts where user_id = p_user_id),
    'postsToday',       (select count(*) from public.creator_posts(p_user_id) where posted_at >= v_day_start),
    'postsThisWeek',    (select count(*) from public.creator_posts(p_user_id) where posted_at >= v_week_start and posted_at < v_week_start + interval '7 days'),
    'postsEver',        (select count(*) from public.creator_posts(p_user_id)),
    'connections',      (select count(*) from platform_connections where user_id = p_user_id and disconnected_at is null),
    'repurposesThisWeek', (select count(*) from repurpose_jobs where user_id = p_user_id and created_at >= v_week_start)
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. Quest and challenge progress are the server's
-- ----------------------------------------------------------------------------
-- quest_progress and challenge_participants were creator-writable (a creator could mark any
-- quest completed, or set their own post count). Nothing the app does needs that now.
drop policy if exists "quest_progress_all_own" on quest_progress;
create policy "quest_progress_select_own" on quest_progress
  for select using (user_id = auth.uid());

drop policy if exists "challenge_participants_insert_own" on challenge_participants;
drop policy if exists "challenge_participants_update_own" on challenge_participants;

-- ----------------------------------------------------------------------------
-- 5. The weekly challenge: "Post 3 times this week"
-- ----------------------------------------------------------------------------
-- One row per week (the Monday it starts, in the creator's own calendar; two time zones can
-- briefly be in different weeks, so each gets its own row). target_posts is each creator's own
-- goal. Progress is not stored: it is counted from the creator's posts, so it can't drift.
alter table community_challenges add column if not exists week_start date;
create unique index if not exists uq_community_challenges_week
  on community_challenges (week_start);

create or replace function public.ensure_weekly_challenge(p_user_id uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_week date := (date_trunc('week', now() at time zone public.user_timezone(p_user_id)))::date;
  v_id   uuid;
begin
  insert into community_challenges (title, description, target_posts, reward_badge, starts_at, ends_at, week_start)
  values (
    'Post 3 times this week',
    'At your own pace. Any platform and any format counts.',
    3,
    'consistency',
    (v_week::timestamp at time zone 'UTC'),
    ((v_week + 7)::timestamp at time zone 'UTC'),
    v_week
  )
  on conflict (week_start) do nothing;

  select id into v_id from community_challenges where week_start = v_week;
  return v_id;
end;
$$;

-- Joining is idempotent. Only the server calls this.
create or replace function public.join_weekly_challenge(p_user_id uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_id uuid := public.ensure_weekly_challenge(p_user_id);
begin
  insert into challenge_participants (challenge_id, user_id) values (v_id, p_user_id) on conflict do nothing;
  return v_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. Challenge reminders
-- ----------------------------------------------------------------------------
-- The days of the week (0 = Monday … 6 = Sunday, the creator's own week) the creator asked to
-- be reminded to post. The cron turns each into a notification on the day.
create table challenge_reminders (
  user_id     uuid not null references users(id) on delete cascade,
  week_start  date not null,
  days        smallint[] not null check (cardinality(days) between 1 and 7),
  created_at  timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table challenge_reminders enable row level security;
create policy "challenge_reminders_select_own" on challenge_reminders
  for select using (user_id = auth.uid());

-- Writes today's reminder notes. Safe to run as often as the cron likes: each note has a key
-- and exists once. Skips anyone who has already finished the week's challenge.
create or replace function public.send_challenge_reminders()
returns integer
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_rows integer;
begin
  insert into notifications (user_id, type, title, body, action_text, metadata, key)
  select r.user_id,
         'quest',
         'A posting day for your challenge',
         'You planned to post today. Any platform and any format counts.',
         'See the challenge',
         jsonb_build_object('kind', 'flag', 'target', 'challenge'),
         'challenge-day:' || r.week_start::text || ':' || ((now() at time zone public.user_timezone(r.user_id))::date - r.week_start)::text
    from challenge_reminders r
   where (date_trunc('week', now() at time zone public.user_timezone(r.user_id)))::date = r.week_start
     and ((now() at time zone public.user_timezone(r.user_id))::date - r.week_start) = any (r.days::int[])
     and not exists (
       select 1 from quest_completions c
        where c.user_id = r.user_id and c.quest_key = 'weekly.challenge' and c.period_key = 'W:' || r.week_start::text
     )
  on conflict (user_id, key) do nothing;
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

-- ----------------------------------------------------------------------------
-- 7. News the database itself knows about
-- ----------------------------------------------------------------------------
-- A streak milestone and a new level are facts that appear in the database whichever code path
-- caused them (a check-in, a published post, a quest), so the notification is written there.

create or replace function public.notify_milestone()
returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_days integer;
begin
  if new.milestone_type ~ '^[0-9]+_day_streak$' then
    v_days := split_part(new.milestone_type, '_', 1)::integer;
    insert into notifications (user_id, type, title, body, metadata, key)
    values (
      new.user_id,
      'streak',
      'A ' || v_days || '-day streak',
      case when v_days = 7 then 'A week of check-ins. Nice rhythm.' else v_days || ' days of showing up. Nice rhythm.' end,
      jsonb_build_object('kind', 'star'),
      'milestone:' || new.milestone_type
    )
    on conflict (user_id, key) do nothing;
  end if;
  return new;
end;
$$;

create trigger milestones_notify after insert on milestones
  for each row execute function public.notify_milestone();

-- 250 XP a level, as levelForXp() in workflows/streak-engine.ts (a test keeps the two equal).
create or replace function public.notify_level_up()
returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_after integer;
  v_before integer;
  v_level integer;
begin
  if new.type <> 'earn' then
    return new;
  end if;
  select coalesce(sum(case when type = 'earn' then amount else -amount end), 0)::integer
    into v_after from credits where user_id = new.user_id;
  v_before := greatest(v_after - new.amount, 0);
  if floor(v_after / 250.0) > floor(v_before / 250.0) then
    v_level := floor(v_after / 250.0)::integer + 1;
    insert into notifications (user_id, type, title, body, action_text, metadata, key)
    values (
      new.user_id,
      'level',
      'You reached level ' || v_level,
      'Every quest and check-in adds up.',
      'See your quests',
      jsonb_build_object('kind', 'star', 'target', 'quests'),
      'level:' || v_level
    )
    on conflict (user_id, key) do nothing;
  end if;
  return new;
end;
$$;

create trigger credits_level_up after insert on credits
  for each row execute function public.notify_level_up();

-- ----------------------------------------------------------------------------
-- 8. Function privileges
-- ----------------------------------------------------------------------------
-- All of these take a user id (or act on everyone), so only the server may call them.
revoke execute on function public.creator_posts(uuid)                                   from public, anon, authenticated;
revoke execute on function public.complete_quest(uuid, text, text, integer, text)       from public, anon, authenticated;
revoke execute on function public.quest_facts(uuid)                                     from public, anon, authenticated;
revoke execute on function public.ensure_weekly_challenge(uuid)                         from public, anon, authenticated;
revoke execute on function public.join_weekly_challenge(uuid)                           from public, anon, authenticated;
revoke execute on function public.send_challenge_reminders()                            from public, anon, authenticated;
revoke execute on function public.notify_milestone()                                    from public, anon, authenticated;
revoke execute on function public.notify_level_up()                                     from public, anon, authenticated;
