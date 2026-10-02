-- ============================================================================
-- Migration: v1 legacy collision guard
-- ============================================================================
--
-- Runs first (timestamp before every other migration in this set) because
-- this backend is being pointed at PostIT-web's (v1) live Supabase project,
-- not an empty one — founder decision: keep every existing user, streak,
-- token and post rather than start fresh (see
-- 20260814000017_backfill_v1_legacy_data.sql for the data side of this).
--
-- v1's `streak_events` table has the same name as, but a different shape
-- than, the one 20260814000003_streak_jarvis_gamification.sql creates
-- (free-text event_type/reason/old-new-streak audit row vs. a typed enum +
-- event_date log). Reusing it in place isn't viable the way referrals/
-- autopilot_configs are (see the idempotent guards added directly in
-- 20260814000013_carried_over_v1_domains.sql for those two, which — unlike
-- this one — already match the new shape). Renaming it out of the way here
-- keeps all 12 existing rows intact under a clearly-legacy name and leaves
-- the `streak_events` name free for migration 3 to create its real table.
-- No-op on a fresh project (`if exists`).
-- ============================================================================

alter table if exists streak_events rename to streak_events_v1_legacy;

-- ----------------------------------------------------------------------------
-- Empty copies of the v1 tables this schema reads, so these migrations apply to
-- a BRAND-NEW project (dev, staging, CI, a local Supabase) as well as to v1's.
-- ----------------------------------------------------------------------------
-- Two things in this migration set reach into v1's tables: the signup trigger
-- (20260814000001) writes user_plans / user_streaks on every new account, and
-- the backfill (…17) reads user_tokens / posts / user_streaks. On v1's live
-- project they exist, with real data. On a fresh project they don't, so the
-- backfill failed and signing up would have failed too.
--
-- Each table is created ONLY if it is missing, so on the live project this
-- block does nothing, and v1's tables (and their row-level security settings)
-- are left exactly as they are. On a fresh project they are created empty, with
-- row-level security on and no policies (nothing can read or write them through
-- the API). Once v1 is fully retired, drop them in a later migration.
do $$
begin
  if to_regclass('public.user_plans') is null then
    create table public.user_plans (
      user_id uuid primary key references auth.users(id) on delete cascade,
      plan    text not null default 'free'
    );
    alter table public.user_plans enable row level security;
  end if;

  if to_regclass('public.user_streaks') is null then
    create table public.user_streaks (
      user_id        uuid primary key references auth.users(id) on delete cascade,
      current_streak integer not null default 0,
      longest_streak integer not null default 0,
      last_post_date date,
      updated_at     timestamptz not null default now()
    );
    alter table public.user_streaks enable row level security;
  end if;

  if to_regclass('public.user_tokens') is null then
    create table public.user_tokens (
      user_id       uuid,
      platform      text,
      access_token  text,
      refresh_token text,
      expires_at    timestamptz,
      created_at    timestamptz not null default now()
    );
    alter table public.user_tokens enable row level security;
  end if;

  if to_regclass('public.posts') is null then
    create table public.posts (
      id            uuid primary key default gen_random_uuid(),
      user_id       uuid,
      content       text,
      platform      text,
      scheduled_at  timestamptz,
      posted_at     timestamptz,
      created_at    timestamptz not null default now(),
      updated_at    timestamptz,
      status        text,
      postiz_id     text,
      tweet_url     text,
      is_thread     boolean,
      thread_tweets text[],
      locked_at     timestamptz,
      error         text
    );
    alter table public.posts enable row level security;
  end if;
end;
$$;
