-- ============================================================================
-- Migration: real connections for Instagram, Threads, Facebook and YouTube
-- ============================================================================
--
-- Migration …22 built the connection for TikTok only. The same machinery now serves
-- every platform PostStreak reads numbers from, so what was written for TikTok alone
-- is widened to all five (TikTok, Instagram, Threads, Facebook, YouTube):
--
--   * one PostStreak account per platform account (not just TikTok);
--   * creators can no longer write connection rows for any of them: only the OAuth
--     callback, running on the server, makes a connection;
--   * post numbers are written by one function that never lets a number the platform
--     didn't give us this time (Instagram's views for an old post, say) erase the
--     one we already hold.
--
-- Trust model is unchanged (backend/PHASE1_CONTRACT.md §3): the connection row, its
-- tokens and every stat are written ONLY by the server; creators read their own
-- account details and stats, never the tokens.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Placeholders from before the real OAuth flows are retired
-- ----------------------------------------------------------------------------
-- Until now "connecting" Instagram, YouTube, Threads or Facebook could store any string
-- the app sent as the token (there was no OAuth). A real token is sealed ("v1.…"); anything
-- else is a placeholder, not a connection. Retire them so creators connect for real.
update platform_connections
   set disconnected_at = coalesce(disconnected_at, now()),
       access_token    = null,
       refresh_token   = null,
       status          = 'needs_reauth'
 where platform in ('instagram', 'youtube', 'threads', 'facebook')
   and (access_token is null or access_token not like 'v1.%');

-- ----------------------------------------------------------------------------
-- 2. One PostStreak account per platform account
-- ----------------------------------------------------------------------------
-- So a connection can't be squatted or silently shared. A disconnected row doesn't count.
drop index if exists uq_platform_connections_tiktok_account;
create unique index if not exists uq_platform_connections_account
  on platform_connections (platform, platform_user_id)
  where platform in ('tiktok', 'instagram', 'youtube', 'threads', 'facebook')
    and disconnected_at is null
    and platform_user_id is not null;

-- ----------------------------------------------------------------------------
-- 3. Creators can no longer write connection rows for these platforms
-- ----------------------------------------------------------------------------
-- The connection comes from the OAuth callback, which runs on the server. A creator who
-- could insert one directly could fake "connected", or claim another creator's account
-- id before they do. (LinkedIn and X keep their older path until their own OAuth lands.)
drop policy if exists "platform_connections_insert_own" on platform_connections;
drop policy if exists "platform_connections_update_own" on platform_connections;
drop policy if exists "platform_connections_delete_own" on platform_connections;

create policy "platform_connections_insert_own" on platform_connections
  for insert with check (
    user_id = auth.uid()
    and platform not in ('tiktok', 'instagram', 'youtube', 'threads', 'facebook')
  );
create policy "platform_connections_update_own" on platform_connections
  for update using (
    user_id = auth.uid()
    and platform not in ('tiktok', 'instagram', 'youtube', 'threads', 'facebook')
  )
  with check (
    user_id = auth.uid()
    and platform not in ('tiktok', 'instagram', 'youtube', 'threads', 'facebook')
  );
create policy "platform_connections_delete_own" on platform_connections
  for delete using (
    user_id = auth.uid()
    and platform not in ('tiktok', 'instagram', 'youtube', 'threads', 'facebook')
  );

-- ----------------------------------------------------------------------------
-- 4. Writing post numbers
-- ----------------------------------------------------------------------------
-- p_posts is an array of { id, title, postedAt, coverUrl, shareUrl, durationSeconds,
-- views, likes, comments, shares, saves }. A post we have seen before keeps any number
-- the platform left out this time (null); a new post with no views yet starts at 0.
create or replace function public.record_post_stats(
  p_user_id  uuid,
  p_platform platform_type,
  p_posts    jsonb
) returns void
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if jsonb_typeof(p_posts) is distinct from 'array' then
    raise exception 'p_posts must be an array';
  end if;

  with incoming as (
    select distinct on (x->>'id')
      x->>'id'                                           as id,
      left(coalesce(x->>'title', ''), 300)                as title,
      nullif(x->>'postedAt', '')::timestamptz            as posted_at,
      nullif(x->>'coverUrl', '')                         as cover_url,
      nullif(x->>'shareUrl', '')                         as share_url,
      nullif(x->>'durationSeconds', '')::integer         as duration_seconds,
      nullif(x->>'views', '')::bigint                    as views,
      coalesce(nullif(x->>'likes', '')::bigint, 0)       as likes,
      coalesce(nullif(x->>'comments', '')::bigint, 0)    as comments,
      nullif(x->>'shares', '')::bigint                   as shares,
      nullif(x->>'saves', '')::bigint                    as saves
    from jsonb_array_elements(p_posts) x
    where nullif(x->>'id', '') is not null
  ),
  updated as (
    update post_stats s
       set title            = i.title,
           posted_at        = coalesce(i.posted_at, s.posted_at),
           cover_url        = coalesce(i.cover_url, s.cover_url),
           share_url        = coalesce(i.share_url, s.share_url),
           duration_seconds = coalesce(i.duration_seconds, s.duration_seconds),
           views            = coalesce(i.views, s.views),
           likes            = i.likes,
           comments         = i.comments,
           shares           = coalesce(i.shares, s.shares),
           saves            = coalesce(i.saves, s.saves),
           last_synced_at   = now()
      from incoming i
     where s.user_id = p_user_id and s.platform = p_platform and s.platform_post_id = i.id
    returning s.platform_post_id
  )
  insert into post_stats (user_id, platform, platform_post_id, title, posted_at, cover_url, share_url,
                          duration_seconds, views, likes, comments, shares, saves)
  select p_user_id, p_platform, i.id, i.title, i.posted_at, i.cover_url, i.share_url,
         i.duration_seconds, coalesce(i.views, 0), i.likes, i.comments, coalesce(i.shares, 0), i.saves
    from incoming i
   where i.id not in (select platform_post_id from updated)
  on conflict (user_id, platform, platform_post_id) do nothing;
end;
$$;

revoke execute on function public.record_post_stats(uuid, platform_type, jsonb) from public, anon, authenticated;
grant  execute on function public.record_post_stats(uuid, platform_type, jsonb) to service_role;
