-- ============================================================================
-- Migration: what Jarvis writes for a creator is counted by the server, atomically
-- ============================================================================
--
-- The free plan gets a few AI writes a day. The count used to be taken from the analytics
-- log after the fact, so two requests made at once could both get through, and a write that
-- failed was still counted if the log entry was made first. Now every write is one row here,
-- made BEFORE the model is asked and removed again if the model fails, inside one locked step:
--
--   spend_ai()   "may this creator have one more?" and "count it", together;
--   refund_ai()  the model didn't deliver: give it back.
--
-- Two kinds are counted separately: a new piece of writing ("generate": a script, three
-- captions, three hooks) and a small change to something already written ("edit": rewrite a
-- part, shorten a caption). "Today" is the creator's own day (users.timezone).
-- Trust model (backend/PHASE1_CONTRACT.md §3): creators read their own usage; only the server writes it.
-- ============================================================================

create table ai_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  kind       text not null check (kind in ('generate', 'edit')),
  tool       text not null check (char_length(tool) between 1 and 40),
  created_at timestamptz not null default now()
);

create index idx_ai_usage_user_time on ai_usage (user_id, created_at desc);

alter table ai_usage enable row level security;
create policy "ai_usage_select_own" on ai_usage for select using (user_id = auth.uid());
-- No client writes: this table enforces a limit, so a creator who could delete rows could reset it.
revoke insert, update, delete, truncate on public.ai_usage from anon, authenticated;

-- The start of the creator's current day, as an instant.
create or replace function public.local_day_start(p_user_id uuid)
returns timestamptz
language sql stable security definer set search_path = public, pg_catalog as $$
  select (date_trunc('day', now() at time zone public.user_timezone(p_user_id)))
         at time zone public.user_timezone(p_user_id)
$$;

-- Counts one write if today's allowance has room. p_daily_limit NULL means unlimited (Pro); the number
-- comes from the server (TIER_LIMITS), so there is one source of truth for plan numbers.
create or replace function public.spend_ai(p_user_id uuid, p_kind text, p_tool text, p_daily_limit integer)
returns jsonb
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_used integer;
  v_id   uuid;
begin
  -- Serialise this creator's writes of this kind, so two taps can't both pass.
  perform pg_advisory_xact_lock(hashtextextended('ai:' || p_kind || ':' || p_user_id::text, 0));

  select count(*)::integer into v_used
    from ai_usage
   where user_id = p_user_id and kind = p_kind and created_at >= public.local_day_start(p_user_id);

  if p_daily_limit is not null and v_used >= p_daily_limit then
    return jsonb_build_object('allowed', false, 'used', v_used, 'limit', p_daily_limit);
  end if;

  insert into ai_usage (user_id, kind, tool) values (p_user_id, p_kind, p_tool) returning id into v_id;
  return jsonb_build_object('allowed', true, 'used', v_used + 1, 'limit', p_daily_limit, 'id', v_id);
end;
$$;

-- How many a creator has had today, without spending one.
create or replace function public.ai_used_today(p_user_id uuid, p_kind text)
returns integer
language sql stable security definer set search_path = public, pg_catalog as $$
  select count(*)::integer
    from ai_usage
   where user_id = p_user_id and kind = p_kind and created_at >= public.local_day_start(p_user_id)
$$;

-- The model didn't deliver: the write doesn't count.
create or replace function public.refund_ai(p_user_id uuid, p_id uuid)
returns void
language sql security definer set search_path = public, pg_catalog as $$
  delete from ai_usage where id = p_id and user_id = p_user_id
$$;

revoke execute on function public.local_day_start(uuid)                from public, anon, authenticated;
revoke execute on function public.spend_ai(uuid, text, text, integer)  from public, anon, authenticated;
revoke execute on function public.ai_used_today(uuid, text)            from public, anon, authenticated;
revoke execute on function public.refund_ai(uuid, uuid)                from public, anon, authenticated;

grant execute on function public.local_day_start(uuid)                 to service_role;
grant execute on function public.spend_ai(uuid, text, text, integer)  to service_role;
grant execute on function public.ai_used_today(uuid, text)            to service_role;
grant execute on function public.refund_ai(uuid, uuid)                to service_role;
