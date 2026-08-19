-- ============================================================================
-- Migration: Duels
-- Governed by: supabase/DATA_MODEL.md
-- ============================================================================

create type duel_status as enum ('active', 'completed', 'cancelled');

-- Duels: paired two-person streak accountability
-- No "failed" status — missed shared-completion day skips that day's reward only.
-- No separate progress table: reads streak_events directly.
create table duels (
  id            uuid primary key default gen_random_uuid(),
  user_a_id     uuid not null references users(id) on delete cascade,
  user_b_id     uuid not null references users(id) on delete cascade,
  start_date    date not null,
  end_date      date not null,
  status        duel_status not null default 'active',
  reward_type   text default 'credits',
  reward_amount integer default 10,
  created_at    timestamptz not null default now()
);

-- Indexes
create index idx_duels_user_a on duels(user_a_id);
create index idx_duels_user_b on duels(user_b_id);
create index idx_duels_status on duels(status);
create index idx_duels_dates on duels(start_date, end_date);

-- RLS
alter table duels enable row level security;

-- Both participants can read their duels
create policy "duels_select_own" on duels
  for select using (user_a_id = auth.uid() or user_b_id = auth.uid());
create policy "duels_insert_own" on duels
  for insert with check (user_a_id = auth.uid() or user_b_id = auth.uid());
create policy "duels_update_own" on duels
  for update using (user_a_id = auth.uid() or user_b_id = auth.uid());
