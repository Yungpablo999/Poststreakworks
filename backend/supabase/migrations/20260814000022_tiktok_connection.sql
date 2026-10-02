-- ============================================================================
-- Migration: TikTok connection (Login Kit + Display API) and account stats
-- ============================================================================
--
-- What a real TikTok connection needs that the schema didn't have:
--   * somewhere to keep the account's details and sync health;
--   * a single-use, per-creator `state` for the OAuth round trip (CSRF guard);
--   * the numbers pulled from TikTok: daily account snapshots and per-video stats;
--   * a guarantee that nobody can fake a connection or squat someone else's
--     TikTok account.
--
-- Trust model (backend/PHASE1_CONTRACT.md §3): the connection row, its tokens
-- and every stat are written ONLY by the server. Creators can read their own
-- account details and stats; they can never read the tokens.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. platform_connections: account details and sync state
-- ----------------------------------------------------------------------------
alter table platform_connections
  add column if not exists account_name              text,
  add column if not exists account_handle            text,
  add column if not exists avatar_url                text,
  add column if not exists scopes                    text[]      not null default '{}',
  add column if not exists refresh_token_expires_at  timestamptz,
  add column if not exists status                    text        not null default 'connected',
  add column if not exists last_synced_at            timestamptz,
  add column if not exists last_sync_error           text,
  add column if not exists sync_locked_until         timestamptz;

alter table platform_connections
  add constraint platform_connections_status_valid check (status in ('connected', 'needs_reauth', 'error'));

-- Migration …21 limited creators to a named list of columns. The new ones that
-- are safe to show are granted here; the token columns and the sync lock are not.
grant select (
  account_name, account_handle, avatar_url, scopes,
  refresh_token_expires_at, status, last_synced_at, last_sync_error
) on public.platform_connections to authenticated;

-- Until now "connecting" TikTok stored whatever string the app sent as the
-- token (there was no OAuth). Any TikTok row that exists is therefore a
-- placeholder, not a real connection. Retire them so creators reconnect for
-- real, and so they can't collide with the unique index below.
update platform_connections
   set disconnected_at = coalesce(disconnected_at, now()),
       access_token    = null,
       refresh_token   = null,
       status          = 'needs_reauth'
 where platform = 'tiktok'
   and (access_token is null or access_token not like 'v1.%');

-- One PostStreak account per TikTok account, so a connection can't be squatted
-- or silently shared. A disconnected row doesn't count.
create unique index if not exists uq_platform_connections_tiktok_account
  on platform_connections (platform_user_id)
  where platform = 'tiktok' and disconnected_at is null and platform_user_id is not null;

-- ----------------------------------------------------------------------------
-- 2. Creators can no longer write TikTok connection rows at all
-- ----------------------------------------------------------------------------
-- The connection comes from the OAuth callback, which runs on the server. A
-- creator who could insert one directly could fake "connected", or claim another
-- creator's TikTok account id before they do. Add a platform here when its real
-- OAuth goes live.
drop policy if exists "platform_connections_insert_own" on platform_connections;
drop policy if exists "platform_connections_update_own" on platform_connections;
drop policy if exists "platform_connections_delete_own" on platform_connections;

create policy "platform_connections_insert_own" on platform_connections
  for insert with check (user_id = auth.uid() and platform <> 'tiktok');
create policy "platform_connections_update_own" on platform_connections
  for update using (user_id = auth.uid() and platform <> 'tiktok')
  with check (user_id = auth.uid() and platform <> 'tiktok');
create policy "platform_connections_delete_own" on platform_connections
  for delete using (user_id = auth.uid() and platform <> 'tiktok');

-- ----------------------------------------------------------------------------
-- 3. OAuth state: single-use, bound to the creator who started the connection
-- ----------------------------------------------------------------------------
create table oauth_states (
  state       text primary key check (char_length(state) between 20 and 200),
  user_id     uuid not null references users(id) on delete cascade,
  platform    platform_type not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '10 minutes')
);

create index idx_oauth_states_user    on oauth_states(user_id);
create index idx_oauth_states_expires on oauth_states(expires_at);

-- Row-level security on with NO policies: only the server (service role) can
-- touch this table. A creator must not be able to read or plant a state.
alter table oauth_states enable row level security;

-- ----------------------------------------------------------------------------
-- 4. Stats pulled from the platform
-- ----------------------------------------------------------------------------
-- A snapshot of the account once a (creator-local) day, for growth over time.
-- Counts are nullable: a connection without the stats permission records none
-- rather than a misleading zero.
create table account_stats (
  user_id     uuid not null references users(id) on delete cascade,
  platform    platform_type not null,
  day         date not null,
  followers   bigint,
  following   bigint,
  likes       bigint,
  videos      integer,
  recorded_at timestamptz not null default now(),
  primary key (user_id, platform, day)
);

-- One row per post, refreshed on every sync.
create table post_stats (
  user_id           uuid not null references users(id) on delete cascade,
  platform          platform_type not null,
  platform_post_id  text not null,
  title             text not null default '',
  posted_at         timestamptz,
  cover_url         text,
  share_url         text,
  duration_seconds  integer,
  views             bigint not null default 0,
  likes             bigint not null default 0,
  comments          bigint not null default 0,
  shares            bigint not null default 0,
  -- not every platform reports saves (TikTok's Display API doesn't)
  saves             bigint,
  last_synced_at    timestamptz not null default now(),
  primary key (user_id, platform, platform_post_id)
);

create index idx_post_stats_user_posted on post_stats(user_id, platform, posted_at desc);

alter table account_stats enable row level security;
alter table post_stats    enable row level security;

-- Read-only for the owner. No client writes: these are the numbers the Growth
-- screens, Jarvis's advice, and our own metrics are built on.
create policy "account_stats_select_own" on account_stats for select using (user_id = auth.uid());
create policy "post_stats_select_own"    on post_stats    for select using (user_id = auth.uid());

-- Records today's account numbers (the creator's local day). Safe to call many
-- times a day: the day's row is updated, and a count we didn't receive this time
-- never overwrites one we already had.
create or replace function public.record_account_snapshot(
  p_user_id   uuid,
  p_platform  platform_type,
  p_followers bigint,
  p_following bigint,
  p_likes     bigint,
  p_videos    integer
) returns void
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  insert into account_stats (user_id, platform, day, followers, following, likes, videos)
  values (p_user_id, p_platform, public.local_today(p_user_id), p_followers, p_following, p_likes, p_videos)
  on conflict (user_id, platform, day) do update
    set followers   = coalesce(excluded.followers, account_stats.followers),
        following   = coalesce(excluded.following, account_stats.following),
        likes       = coalesce(excluded.likes,     account_stats.likes),
        videos      = coalesce(excluded.videos,    account_stats.videos),
        recorded_at = now();
end;
$$;

revoke execute on function public.record_account_snapshot(uuid, platform_type, bigint, bigint, bigint, integer)
  from public, anon, authenticated;
grant  execute on function public.record_account_snapshot(uuid, platform_type, bigint, bigint, bigint, integer)
  to service_role;
