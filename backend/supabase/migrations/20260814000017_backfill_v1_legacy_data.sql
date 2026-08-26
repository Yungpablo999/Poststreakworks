-- ============================================================================
-- Migration: Backfill v1 legacy data into the new schema
-- ============================================================================
--
-- Founder decision (see 20260814000000_v1_legacy_collision_guard.sql): this
-- backend is being pointed at PostIT-web's (v1) live Supabase project. Every
-- existing user, streak, platform token and scheduled post carries over —
-- nothing gets dropped. This migration must run last (after every table it
-- writes into exists) and is idempotent (`on conflict do nothing` /
-- `where not exists` throughout), safe to re-run.
--
-- v1 tables covered here: user_tokens -> platform_connections,
-- posts -> scheduled_posts, user_streaks -> streak_states, plus the
-- public.users backfill every other insert here depends on (the
-- on_auth_user_created trigger from migration 1 only fires for signups
-- *after* it was created — every existing auth.users row needs a matching
-- public.users row created explicitly, once, here).
--
-- v1 tables intentionally NOT touched by this migration (no collision, so
-- left in place as-is, not renamed or dropped — nothing is lost, they're
-- just not read by the new routers yet):
--   - user_plans (27 rows) — 100% of rows are plan='free' as of this
--     writing, and "no subscriptions row" already means free tier in the
--     new schema's tier resolution, so there is nothing to backfill yet.
--     Revisit if/when a real paid v1 customer needs their
--     paystack_customer_code / pro_expires_at carried into `subscriptions`.
--   - email_sequences (76 rows), user_preferences (0), voice_profiles (0),
--     streak_leaderboard (3) — no equivalent table exists anywhere in this
--     schema yet; that's a product gap, not something this migration should
--     paper over by inventing a destination for them.
--   - streak_events_v1_legacy (12 rows, renamed by migration 0) — shape is
--     incompatible with the new streak_events (free-text vs. typed enum);
--     it's an audit trail, not functional state, so left un-migrated.
--
-- v1 used 'x' as its platform value; this schema's platform_type enum uses
-- 'twitter'. Mapped explicitly below rather than assuming a 1:1 cast.
-- ============================================================================

-- 1. Backfill public.users for every existing auth.users row that predates
--    the on_auth_user_created trigger. Everything downstream in this file
--    has an FK into users(id), so this must run first.
insert into public.users (id, email, display_name, avatar_url, created_at, updated_at)
select
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data ->> 'full_name', au.raw_user_meta_data ->> 'name'),
  au.raw_user_meta_data ->> 'avatar_url',
  au.created_at,
  au.created_at
from auth.users au
where not exists (select 1 from public.users u where u.id = au.id);

-- 2. user_tokens -> platform_connections
insert into platform_connections (
  user_id, platform, access_token, refresh_token, token_expires_at,
  connected_at, created_at
)
select
  ut.user_id,
  (case ut.platform when 'x' then 'twitter' else ut.platform end)::platform_type,
  ut.access_token,
  ut.refresh_token,
  ut.expires_at,
  ut.created_at,
  ut.created_at
from user_tokens ut
where exists (select 1 from public.users u where u.id = ut.user_id)
on conflict (user_id, platform) do nothing;

-- 3. posts -> scheduled_posts (id preserved, so anything that already
--    referenced a v1 post by id — e.g. voice_projects.linked_post_id — still
--    resolves). v1 was one row per platform; each row becomes a single-
--    target scheduled_posts row rather than trying to fold same-content
--    rows back together, since v1 never recorded which posts were the
--    "same" multi-platform post to begin with.
insert into scheduled_posts (
  id, user_id, content, target_platforms, scheduled_at, status,
  published_at, platform_post_ids, created_at, updated_at, locked_at, error
)
select
  p.id,
  p.user_id,
  p.content,
  array[(case p.platform when 'x' then 'twitter' else p.platform end)::platform_type],
  -- v1 allowed a null scheduled_at for posts published immediately with no
  -- pre-scheduling (10 of 66 live rows); scheduled_posts.scheduled_at is
  -- not null, so fall back to when it actually went out.
  coalesce(p.scheduled_at, p.posted_at, p.created_at),
  p.status::post_status,
  p.posted_at,
  jsonb_build_object(
    (case p.platform when 'x' then 'twitter' else p.platform end),
    jsonb_strip_nulls(jsonb_build_object(
      'postiz_id', p.postiz_id,
      'tweet_url', p.tweet_url,
      'is_thread', p.is_thread,
      'thread_tweets', to_jsonb(p.thread_tweets)
    ))
  ),
  p.created_at,
  coalesce(p.updated_at, p.created_at),
  p.locked_at,
  p.error
from posts p
where exists (select 1 from public.users u where u.id = p.user_id)
on conflict (id) do nothing;

-- 4. user_streaks -> streak_states
insert into streak_states (
  user_id, current_streak, longest_streak, last_qualifying_day, updated_at
)
select
  us.user_id,
  us.current_streak,
  us.longest_streak,
  us.last_post_date,
  us.updated_at
from user_streaks us
where exists (select 1 from public.users u where u.id = us.user_id)
on conflict (user_id) do nothing;
