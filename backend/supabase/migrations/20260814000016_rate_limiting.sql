-- ============================================================================
-- Migration: Rate limiting
-- ============================================================================
--
-- There was no general rate limiting anywhere in this backend — only the AI
-- generation daily quota (content-studio.ts), which is a product limit, not
-- abuse protection. Auth endpoints (sign-in especially) had zero brute-force
-- protection at all.
--
-- DB-backed fixed-window counters, matching BACKEND_ARCHITECTURE.md item L's
-- own stated default: "DB-backed counters, checked in
-- packages/api/context.ts... Upstash Redis is the natural upgrade path if
-- latency or DB load becomes a problem" — not a vendor decision made here,
-- following what was already decided.
--
-- Fixed-window (not sliding/token-bucket): simplest correct approach for a
-- single-region deployment with moderate traffic. The key already encodes
-- the window boundary (see packages/api/rate-limit.ts), so a row is really
-- "requests from `key` in this window" — old windows are just abandoned
-- rows, cleaned up by cron rather than needing a separate expiry mechanism.
-- ============================================================================

create table rate_limit_buckets (
  key         text not null,
  window_start timestamptz not null,
  count       integer not null default 1,
  primary key (key, window_start)
);

create index idx_rate_limit_buckets_window on rate_limit_buckets(window_start);

-- No policies added on purpose — RLS enabled with zero policies denies the
-- anon/authenticated roles entirely (deny-by-default), which is correct
-- here: only the service-role client (which bypasses RLS) should ever
-- touch this table, via increment_rate_limit() below.
alter table rate_limit_buckets enable row level security;

-- Atomic increment-and-read. A naive client-side "select, then update
-- count+1" has a race condition under concurrent requests (two requests in
-- the same window can both read count=4 and both write count=5, letting a
-- 6th request through under a limit of 5). This does it in one statement.
create or replace function increment_rate_limit(
  p_key text,
  p_window_start timestamptz
) returns integer as $$
  insert into rate_limit_buckets (key, window_start, count)
  values (p_key, p_window_start, 1)
  on conflict (key, window_start)
  do update set count = rate_limit_buckets.count + 1
  returning count;
$$ language sql volatile;
