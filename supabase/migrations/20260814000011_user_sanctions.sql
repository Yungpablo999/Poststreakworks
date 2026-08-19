-- ============================================================================
-- Migration: User Sanctions & Account Status
-- Governed by: supabase/DATA_MODEL.md
-- ============================================================================

-- Account status enum: supersedes generic status column on users
create type account_status as enum ('active', 'warned', 'restricted', 'suspended', 'closed');

-- Add the new column (not renaming — old column stays, new column is the source of truth)
alter table users add column account_status account_status not null default 'active';

-- User sanctions: append-only audit log
create table user_sanctions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  action      account_status not null,
  reason      text not null,
  issued_by   uuid not null references users(id) on delete cascade,
  issued_at   timestamptz not null default now(),
  expires_at  timestamptz
);

-- Indexes
create index idx_user_sanctions_user_id on user_sanctions(user_id);
create index idx_user_sanctions_issued_by on user_sanctions(issued_by);

-- RLS
alter table user_sanctions enable row level security;

-- Staff-only access
create policy "user_sanctions_select_staff" on user_sanctions
  for select using (
    exists (select 1 from users where id = auth.uid() and role = 'staff_admin')
  );
create policy "user_sanctions_insert_staff" on user_sanctions
  for insert with check (
    exists (select 1 from users where id = auth.uid() and role = 'staff_admin')
  );
