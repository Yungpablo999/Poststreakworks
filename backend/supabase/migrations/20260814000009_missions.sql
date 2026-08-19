-- ============================================================================
-- Migration: Missions (Daily Recommendation System)
-- Governed by: supabase/DATA_MODEL.md
-- ============================================================================

create type mission_type as enum (
  'ideation',
  'production',
  'publishing',
  'engagement',
  'collaboration',
  'growth_experiment',
  'business',
  'recovery'
);

create type mission_difficulty as enum ('easy', 'medium', 'hard');

create type mission_status as enum (
  'pending',
  'started',
  'completed',
  'replaced',
  'rescheduled',
  'simplified'
);

create type mission_source as enum ('ai', 'rules', 'manual');

-- Missions: daily recommendation system
create table missions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references users(id) on delete cascade,
  type              mission_type not null,
  instructions      text not null,
  difficulty        mission_difficulty not null default 'medium',
  status            mission_status not null default 'pending',
  source            mission_source not null default 'rules',
  target_date       date not null,
  linked_post_id    uuid references scheduled_posts(id) on delete set null,
  linked_brief_id   uuid references collaboration_briefs(id) on delete set null,
  created_at        timestamptz not null default now(),
  completed_at      timestamptz
);

-- Indexes
create index idx_missions_user_id on missions(user_id);
create index idx_missions_user_date on missions(user_id, target_date);
create index idx_missions_target_date on missions(target_date);
create index idx_missions_status on missions(status);

-- RLS
alter table missions enable row level security;

create policy "missions_select_own" on missions
  for select using (user_id = auth.uid());
create policy "missions_insert_own" on missions
  for insert with check (user_id = auth.uid());
create policy "missions_update_own" on missions
  for update using (user_id = auth.uid());
