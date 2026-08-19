-- ============================================================================
-- Migration: Safety & Moderation
-- Governed by: supabase/DATA_MODEL.md
-- ============================================================================

create type report_category as enum ('spam', 'harassment', 'inappropriate', 'other');
create type report_status as enum ('pending', 'reviewing', 'resolved', 'dismissed');
create type report_severity as enum ('low', 'medium', 'high');
create type moderation_action_type as enum ('warn', 'restrict', 'suspend', 'dismiss', 'resolve');

-- Blocks: user -> user
create table blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references users(id) on delete cascade,
  blocked_id  uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(blocker_id, blocked_id)
);

-- Reports
create table reports (
  id                uuid primary key default gen_random_uuid(),
  reporter_id       uuid not null references users(id) on delete cascade,
  target_user_id    uuid references users(id) on delete set null,
  target_message_id uuid references messages(id) on delete set null,
  target_type       text not null check (target_type in ('user', 'message', 'collaboration')),
  category          report_category not null,
  evidence          text,
  status            report_status not null default 'pending',
  severity          report_severity not null default 'medium',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Moderation actions: staff audit trail
create table moderation_actions (
  id              uuid primary key default gen_random_uuid(),
  report_id       uuid not null references reports(id) on delete cascade,
  staff_user_id   uuid not null references users(id) on delete cascade,
  action          moderation_action_type not null,
  reason          text not null,
  created_at      timestamptz not null default now()
);

-- Indexes
create index idx_blocks_blocker on blocks(blocker_id);
create index idx_blocks_blocked on blocks(blocked_id);
create index idx_reports_reporter on reports(reporter_id);
create index idx_reports_target_user on reports(target_user_id);
create index idx_reports_status on reports(status);
create index idx_moderation_actions_report on moderation_actions(report_id);

-- RLS
alter table blocks enable row level security;
alter table reports enable row level security;
alter table moderation_actions enable row level security;

-- Blocks: owner-only
create policy "blocks_select_own" on blocks
  for select using (blocker_id = auth.uid());
create policy "blocks_insert_own" on blocks
  for insert with check (blocker_id = auth.uid());
create policy "blocks_delete_own" on blocks
  for delete using (blocker_id = auth.uid());

-- Reports: reporter-only read
create policy "reports_select_own" on reports
  for select using (reporter_id = auth.uid());
create policy "reports_insert_own" on reports
  for insert with check (reporter_id = auth.uid());

-- Moderation actions: staff-only (enforced at API level via role check)
create policy "moderation_actions_select_staff" on moderation_actions
  for select using (
    exists (select 1 from users where id = auth.uid() and role = 'staff_admin')
  );
create policy "moderation_actions_insert_staff" on moderation_actions
  for insert with check (
    exists (select 1 from users where id = auth.uid() and role = 'staff_admin')
  );

-- Triggers
create trigger set_reports_updated_at
  before update on reports
  for each row execute function public.set_updated_at();
