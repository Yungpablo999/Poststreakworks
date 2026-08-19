-- ============================================================================
-- Migration: Streak, Jarvis & Gamification
-- Governed by: supabase/DATA_MODEL.md
-- ============================================================================

-- Jarvis emotion state: 9 states (Architecture Doc matches founder ground truth)
-- DATA_MODEL.md item B was OPEN; using 9 states per founder confirmation.
create type jarvis_emotion as enum (
  'thriving',
  'happy',
  'content',
  'neutral',
  'concerned',
  'worried',
  'at_risk',
  'devastated',
  'heartbroken'
);

create type streak_event_type as enum ('publish', 'mission_completion', 'collaboration_completion');

-- Streak states: per-user current streak info
create table streak_states (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references users(id) on delete cascade,
  current_streak    integer not null default 0,
  longest_streak    integer not null default 0,
  last_qualifying_day date,
  weekly_target     integer default 5,
  jarvis_emotion    jarvis_emotion not null default 'neutral',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Streak events: append-only log of qualifying actions per day
create table streak_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  event_type  streak_event_type not null,
  event_date  date not null,
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now()
);

-- Streak freezes: separate entity, mechanic TBD (DATA_MODEL.md item D)
create table streak_freezes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  frozen_at   timestamptz not null default now(),
  expires_at  timestamptz not null,
  source      text not null default 'milestone',
  created_at  timestamptz not null default now()
);

-- Credits ledger
create table credits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  type           text not null check (type in ('earn', 'redeem')),
  amount         integer not null check (amount > 0),
  source         text not null,
  description    text,
  created_at     timestamptz not null default now()
);

-- Milestones
create table milestones (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  milestone_type  text not null,
  achieved_at     timestamptz not null default now()
);

-- Indexes
create index idx_streak_states_user_id on streak_states(user_id);
create index idx_streak_events_user_id on streak_events(user_id);
create index idx_streak_events_user_date on streak_events(user_id, event_date);
create index idx_streak_events_date on streak_events(event_date);
create index idx_streak_freezes_user_id on streak_freezes(user_id);
create index idx_credits_user_id on credits(user_id);
create index idx_credits_user_type on credits(user_id, type);
create index idx_milestones_user_id on milestones(user_id);

-- RLS
alter table streak_states enable row level security;
alter table streak_events enable row level security;
alter table streak_freezes enable row level security;
alter table credits enable row level security;
alter table milestones enable row level security;

-- Streak states: owner-only
create policy "streak_states_select_own" on streak_states
  for select using (user_id = auth.uid());
create policy "streak_states_insert_own" on streak_states
  for insert with check (user_id = auth.uid());
create policy "streak_states_update_own" on streak_states
  for update using (user_id = auth.uid());

-- Streak events: owner-only
create policy "streak_events_select_own" on streak_events
  for select using (user_id = auth.uid());
create policy "streak_events_insert_own" on streak_events
  for insert with check (user_id = auth.uid());

-- Streak freezes: owner-only
create policy "streak_freezes_select_own" on streak_freezes
  for select using (user_id = auth.uid());
create policy "streak_freezes_insert_own" on streak_freezes
  for insert with check (user_id = auth.uid());

-- Credits: owner-only
create policy "credits_select_own" on credits
  for select using (user_id = auth.uid());
create policy "credits_insert_own" on credits
  for insert with check (user_id = auth.uid());

-- Milestones: owner-only
create policy "milestones_select_own" on milestones
  for select using (user_id = auth.uid());
create policy "milestones_insert_own" on milestones
  for insert with check (user_id = auth.uid());

-- Triggers
create trigger set_streak_states_updated_at
  before update on streak_states
  for each row execute function public.set_updated_at();
