-- ============================================================================
-- Migration: a creator's posts are written by the server only
-- ============================================================================
--
-- scheduled_posts let a creator insert, edit and delete their own rows directly (the
-- "scheduled_posts_*_own" policies). The Supabase anon key is public and every sign-in
-- hands out a real session token, so anything a creator may write there they may write
-- through PostgREST, skipping the API. That includes a row with status 'published' for a
-- post that never happened. Posts made count: the persona, the weekly challenge, the
-- quests and the streak all read them. So a creator could finish "Post 3 times this week"
-- without posting anything.
--
-- Now creators READ their own posts and every change goes through the API
-- (workflows/posts.ts), which checks it. The two changes that must be atomic are
-- functions only the server can call:
--
--   release_due_posts()      a scheduled post whose time has come becomes "ready to
--                            post", and the creator gets one note saying so;
--   confirm_post_platform()  "I posted it" for one platform. The post is posted when
--                            every platform it was meant for is.
--
-- PostStreak does not publish to TikTok, Instagram, YouTube, Threads or Facebook for the
-- creator (those platforms' publishing APIs are separate approvals). A post is planned
-- here, becomes ready at its time, and the creator posts it in the app and says so.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. What a post carries
-- ----------------------------------------------------------------------------
-- content is the caption; the tags and the format are kept apart so a planned post opens
-- in the composer the way it was made.
alter table scheduled_posts
  add column if not exists tags   text[] not null default '{}',
  add column if not exists format text;

alter table scheduled_posts
  add constraint scheduled_posts_tags_cap    check (cardinality(tags) <= 30),
  add constraint scheduled_posts_format_len  check (format is null or char_length(format) <= 40);

-- ----------------------------------------------------------------------------
-- 2. Creators read their posts; the server writes them
-- ----------------------------------------------------------------------------
drop policy if exists "scheduled_posts_insert_own" on scheduled_posts;
drop policy if exists "scheduled_posts_update_own" on scheduled_posts;
drop policy if exists "scheduled_posts_delete_own" on scheduled_posts;
revoke insert, update, delete, truncate on public.scheduled_posts from anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Words used in notes
-- ----------------------------------------------------------------------------
create or replace function public.platform_label(p_platform platform_type)
returns text
language sql immutable set search_path = public, pg_catalog as $$
  select case p_platform::text
           when 'tiktok'   then 'TikTok'
           when 'youtube'  then 'YouTube'
           when 'twitter'  then 'X'
           when 'linkedin' then 'LinkedIn'
           else initcap(p_platform::text)
         end
$$;

create or replace function public.join_labels(p_labels text[])
returns text
language sql immutable set search_path = public, pg_catalog as $$
  select case coalesce(cardinality(p_labels), 0)
           when 0 then ''
           when 1 then p_labels[1]
           when 2 then p_labels[1] || ' and ' || p_labels[2]
           else array_to_string(p_labels[1:cardinality(p_labels) - 1], ', ') || ' and ' || p_labels[cardinality(p_labels)]
         end
$$;

-- ----------------------------------------------------------------------------
-- 4. A scheduled post whose time has come is "ready to post"
-- ----------------------------------------------------------------------------
-- Only posts meant for the five platforms PostStreak connects. (A post for an older
-- platform, LinkedIn say, is handled by the publisher in packages/jobs, which can post to it.)
-- Safe to run as often as the cron likes: a post is released once, and its note has a key
-- (the post and the time it was due), so it exists once. A post moved to a later time and
-- released again gets a new note. A platform the creator already posted to early stays posted.
create or replace function public.release_due_posts(p_now timestamptz default now())
returns integer
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_released integer;
begin
  with due as (
    update scheduled_posts sp
       set status = 'pending_confirmation',
           platform_post_ids = coalesce((
             select jsonb_object_agg(t.p::text, coalesce(sp.platform_post_ids -> t.p::text, jsonb_build_object('status', 'pending_confirmation')))
               from unnest(sp.target_platforms) as t(p)
           ), '{}'::jsonb),
           locked_at = null
     where sp.status = 'scheduled'
       and sp.scheduled_at <= p_now
       and sp.target_platforms <@ array['tiktok', 'instagram', 'youtube', 'threads', 'facebook']::platform_type[]
    returning sp.id, sp.user_id, sp.content, sp.target_platforms, sp.scheduled_at, sp.platform_post_ids as results
  ),
  named as (
    select d.id, d.user_id, d.scheduled_at,
           case when char_length(btrim(split_part(d.content, E'\n', 1))) > 60
                then left(btrim(split_part(d.content, E'\n', 1)), 59) || '...'
                else btrim(split_part(d.content, E'\n', 1))
           end as title,
           (select array_agg(public.platform_label(t.p) order by t.ord)
              from unnest(d.target_platforms) with ordinality as t(p, ord)
             where coalesce(d.results -> t.p::text ->> 'status', '') <> 'published') as labels
      from due d
  ),
  notes as (
    insert into notifications (user_id, type, title, body, action_text, metadata, key)
    select n.user_id,
           'system',
           'Time to post',
           case when cardinality(n.labels) = 1
                then 'Your ' || n.labels[1] || ' post "' || n.title || '" is ready. Open it to copy the caption and post.'
                else 'Your post "' || n.title || '" is ready for ' || public.join_labels(n.labels) || '. Open it to copy the caption and post.'
           end,
           'Open post',
           jsonb_build_object('kind', 'clock', 'target', 'schedule', 'postId', n.id),
           'post-ready:' || n.id::text || ':' || floor(extract(epoch from n.scheduled_at))::bigint::text
      from named n
     where cardinality(n.labels) > 0
    on conflict (user_id, key) do nothing
    returning 1
  )
  select count(*)::integer into v_released from due;
  return v_released;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. "I posted it"
-- ----------------------------------------------------------------------------
-- Marks one platform of a post as posted. Locks the row, so two taps (or two platforms
-- at once) can't overwrite each other. Allowed from "scheduled" too: a creator who posted
-- early has still posted. If the platform's own record of that post has already been read
-- (a sync found it), the two are linked, so it is one post and not two.
create or replace function public.confirm_post_platform(
  p_user_id uuid,
  p_post_id uuid,
  p_platform platform_type,
  p_url text default null,
  p_now timestamptz default now()
) returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_row     scheduled_posts%rowtype;
  v_step    jsonb;
  v_results jsonb;
  v_all     boolean;
  v_synced  text;
begin
  select * into v_row from scheduled_posts where id = p_post_id and user_id = p_user_id for update;
  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;
  if not (p_platform = any (v_row.target_platforms)) then
    return jsonb_build_object('result', 'wrong_platform');
  end if;
  if (v_row.platform_post_ids -> p_platform::text ->> 'status') = 'published' then
    return jsonb_build_object('result', 'already_posted', 'allPosted', v_row.status = 'published');
  end if;
  if v_row.status not in ('scheduled', 'pending_confirmation') then
    return jsonb_build_object('result', 'not_open', 'status', v_row.status::text);
  end if;

  v_step := jsonb_strip_nulls(jsonb_build_object(
    'status', 'published',
    'url', p_url,
    'at', to_char(p_now at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  ));

  select ps.platform_post_id into v_synced
    from post_stats ps
   where ps.user_id = p_user_id
     and ps.platform = p_platform
     and ps.posted_at is not null
     and abs(extract(epoch from (ps.posted_at - p_now))) <= 21600
     and not exists (
       select 1 from scheduled_posts o
        where o.user_id = p_user_id
          and (o.platform_post_ids -> p_platform::text ->> 'id') = ps.platform_post_id
     )
   order by abs(extract(epoch from (ps.posted_at - p_now)))
   limit 1;
  if v_synced is not null then
    v_step := v_step || jsonb_build_object('id', v_synced);
  end if;

  v_results := coalesce(v_row.platform_post_ids, '{}'::jsonb) || jsonb_build_object(p_platform::text, v_step);
  v_all := not exists (
    select 1 from unnest(v_row.target_platforms) as t(p)
     where coalesce(v_results -> t.p::text ->> 'status', '') <> 'published'
  );

  update scheduled_posts
     set platform_post_ids = v_results,
         status       = case when v_all then 'published'::post_status else status end,
         published_at = case when v_all then p_now else published_at end,
         error        = null,
         locked_at    = null
   where id = v_row.id;

  return jsonb_build_object('result', 'ok', 'allPosted', v_all);
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. A post read from the account that we already know about is linked, not counted twice
-- ----------------------------------------------------------------------------
-- When a sync finds a post the creator confirmed by hand (same platform, within six hours
-- of when they said they posted it), the confirmed post takes the platform's id for it.
-- The nearest one wins and each is linked once. After that, creator_posts() and the
-- calendar see one post, by its id, with no guessing at read time.
create or replace function public.link_synced_post()
returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_post uuid;
begin
  if new.posted_at is null then
    return new;
  end if;

  select sp.id into v_post
    from scheduled_posts sp
   where sp.user_id = new.user_id
     and new.platform = any (sp.target_platforms)
     and (sp.platform_post_ids -> new.platform::text ->> 'status') = 'published'
     and (sp.platform_post_ids -> new.platform::text ->> 'id') is null
     and abs(extract(epoch from (new.posted_at - coalesce((sp.platform_post_ids -> new.platform::text ->> 'at')::timestamptz, sp.published_at, sp.scheduled_at)))) <= 21600
   order by abs(extract(epoch from (new.posted_at - coalesce((sp.platform_post_ids -> new.platform::text ->> 'at')::timestamptz, sp.published_at, sp.scheduled_at))))
   limit 1
   for update of sp skip locked;

  if v_post is not null then
    update scheduled_posts
       set platform_post_ids = jsonb_set(platform_post_ids, array[new.platform::text, 'id'], to_jsonb(new.platform_post_id))
     where id = v_post;
  end if;
  return new;
end;
$$;

create trigger post_stats_link_posted after insert on post_stats
  for each row execute function public.link_synced_post();

-- ----------------------------------------------------------------------------
-- 7. creator_posts(): a platform counts as posted when the creator posted to it
-- ----------------------------------------------------------------------------
-- Before: a post counted once the WHOLE post was confirmed. A post meant for TikTok and
-- Instagram, posted to TikTok and not yet Instagram, was not a post made. Now each platform
-- the creator posted to counts, at the time they said they posted (older rows keep counting
-- by their own published time).
create or replace function public.creator_posts(p_user_id uuid)
returns table (platform text, posted_at timestamptz, source text)
language sql stable security definer set search_path = public, pg_catalog as $$
  select ps.platform::text, ps.posted_at, 'synced'::text
    from post_stats ps
   where ps.user_id = p_user_id and ps.posted_at is not null
  union all
  select t.platform::text,
         coalesce((sp.platform_post_ids -> (t.platform::text) ->> 'at')::timestamptz, sp.published_at, sp.scheduled_at),
         'published'::text
    from scheduled_posts sp
    cross join lateral unnest(sp.target_platforms) as t(platform)
   where sp.user_id = p_user_id
     and (sp.status = 'published' or (sp.platform_post_ids -> (t.platform::text) ->> 'status') = 'published')
     and not exists (
       select 1 from post_stats ps
        where ps.user_id = p_user_id
          and ps.platform = t.platform
          and ps.platform_post_id = (sp.platform_post_ids -> (t.platform::text) ->> 'id')
     )
$$;

-- ----------------------------------------------------------------------------
-- 8. Function privileges
-- ----------------------------------------------------------------------------
-- These take a user id (or act on everyone), so only the server may call them.
revoke execute on function public.platform_label(platform_type)                                     from public, anon, authenticated;
revoke execute on function public.join_labels(text[])                                              from public, anon, authenticated;
revoke execute on function public.release_due_posts(timestamptz)                                   from public, anon, authenticated;
revoke execute on function public.confirm_post_platform(uuid, uuid, platform_type, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.link_synced_post()                                               from public, anon, authenticated;

grant execute on function public.platform_label(platform_type)                                     to service_role;
grant execute on function public.join_labels(text[])                                              to service_role;
grant execute on function public.release_due_posts(timestamptz)                                   to service_role;
grant execute on function public.confirm_post_platform(uuid, uuid, platform_type, text, timestamptz) to service_role;
