-- ============================================================================
-- Migration: Social Platform Connections & Scheduling
-- Governed by: supabase/DATA_MODEL.md
-- ============================================================================

-- Platform enum
create type platform_type as enum ('linkedin', 'twitter', 'meta', 'tiktok');
create type publish_mode as enum ('api', 'assisted');
create type post_status as enum ('draft', 'scheduled', 'publishing', 'published', 'failed');

-- Platform connections: one row per (user, platform)
create table platform_connections (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references users(id) on delete cascade,
  platform          platform_type not null,
  publish_mode      publish_mode not null default 'assisted',
  platform_user_id  text,
  access_token      text,
  refresh_token     text,
  token_expires_at  timestamptz,
  connected_at      timestamptz not null default now(),
  disconnected_at   timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique(user_id, platform)
);

-- Scheduled posts
create table scheduled_posts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete cascade,
  content             text not null,
  media_urls          text[] default '{}',
  target_platforms    platform_type[] not null,
  scheduled_at        timestamptz not null,
  status              post_status not null default 'draft',
  published_at        timestamptz,
  platform_post_ids   jsonb default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Indexes
create index idx_platform_connections_user_id on platform_connections(user_id);
create index idx_platform_connections_platform on platform_connections(platform);
create index idx_scheduled_posts_user_id on scheduled_posts(user_id);
create index idx_scheduled_posts_status on scheduled_posts(status);
create index idx_scheduled_posts_scheduled_at on scheduled_posts(scheduled_at);
create index idx_scheduled_posts_user_status on scheduled_posts(user_id, status);

-- RLS
alter table platform_connections enable row level security;
alter table scheduled_posts enable row level security;

-- Platform connections: owner-only
create policy "platform_connections_select_own" on platform_connections
  for select using (user_id = auth.uid());
create policy "platform_connections_insert_own" on platform_connections
  for insert with check (user_id = auth.uid());
create policy "platform_connections_update_own" on platform_connections
  for update using (user_id = auth.uid());
create policy "platform_connections_delete_own" on platform_connections
  for delete using (user_id = auth.uid());

-- Scheduled posts: owner-only
create policy "scheduled_posts_select_own" on scheduled_posts
  for select using (user_id = auth.uid());
create policy "scheduled_posts_insert_own" on scheduled_posts
  for insert with check (user_id = auth.uid());
create policy "scheduled_posts_update_own" on scheduled_posts
  for update using (user_id = auth.uid());
create policy "scheduled_posts_delete_own" on scheduled_posts
  for delete using (user_id = auth.uid());

-- Triggers
create trigger set_platform_connections_updated_at
  before update on platform_connections
  for each row execute function public.set_updated_at();

create trigger set_scheduled_posts_updated_at
  before update on scheduled_posts
  for each row execute function public.set_updated_at();
