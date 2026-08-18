-- ============================================================================
-- Migration: Analytics Events
-- Governed by: supabase/DATA_MODEL.md
-- ============================================================================

-- Generic append-only event log
create table analytics_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete set null,
  event_name  text not null,
  properties  jsonb default '{}',
  created_at  timestamptz not null default now()
);

-- Indexes
create index idx_analytics_events_user_id on analytics_events(user_id);
create index idx_analytics_events_event_name on analytics_events(event_name);
create index idx_analytics_events_created_at on analytics_events(created_at);
create index idx_analytics_events_user_event on analytics_events(user_id, event_name);

-- RLS: owner-only read, service role can write
alter table analytics_events enable row level security;

create policy "analytics_events_select_own" on analytics_events
  for select using (user_id = auth.uid());

-- No insert policy for clients — analytics writes go through service role only
