-- ============================================================================
-- Migration: Voice Studio
-- Governed by: supabase/DATA_MODEL.md
-- ============================================================================

create type voice_project_status as enum ('draft', 'generating', 'ready', 'published');

-- Voice projects: script, chosen narrator, status, linked post
create table voice_projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  script          text not null,
  voice_id        uuid,
  status          voice_project_status not null default 'draft',
  linked_post_id  uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Series voices: creator-saved narrators + pronunciation notes
create table series_voices (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references users(id) on delete cascade,
  name                  text not null,
  fish_audio_voice_id   text not null,
  pronunciation_notes   text,
  created_at            timestamptz not null default now()
);

-- Voice minutes wallet: included minutes per billing period
create table voice_minutes_wallet (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references users(id) on delete cascade,
  subscription_id   uuid,
  included_minutes  integer not null default 0,
  used_minutes      integer not null default 0,
  period_start      timestamptz not null,
  period_end        timestamptz not null,
  created_at        timestamptz not null default now()
);

-- Voice minutes ledger: append-only debits and credits
create table voice_minutes_ledger (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  type        text not null check (type in ('debit', 'credit')),
  minutes     integer not null check (minutes > 0),
  source      text not null,
  created_at  timestamptz not null default now()
);

-- Voice top-ups: purchased minute packs
create table voice_topups (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  minutes_purchased integer not null check (minutes_purchased > 0),
  amount_paid     integer not null,
  currency        text not null default 'NGN',
  provider        text not null default 'paystack',
  created_at      timestamptz not null default now()
);

-- FK: voice_projects.voice_id -> series_voices.id
alter table voice_projects
  add constraint fk_voice_projects_voice_id
  foreign key (voice_id) references series_voices(id) on delete set null;

-- FK: voice_minutes_wallet.subscription_id -> subscriptions.id
-- (subscriptions table created in migration 6; add constraint via ALTER in migration 6)

-- Indexes
create index idx_voice_projects_user_id on voice_projects(user_id);
create index idx_voice_projects_status on voice_projects(status);
create index idx_series_voices_user_id on series_voices(user_id);
create index idx_voice_minutes_wallet_user_id on voice_minutes_wallet(user_id);
create index idx_voice_minutes_ledger_user_id on voice_minutes_ledger(user_id);
create index idx_voice_topups_user_id on voice_topups(user_id);

-- RLS
alter table voice_projects enable row level security;
alter table series_voices enable row level security;
alter table voice_minutes_wallet enable row level security;
alter table voice_minutes_ledger enable row level security;
alter table voice_topups enable row level security;

-- Voice projects: owner-only
create policy "voice_projects_select_own" on voice_projects
  for select using (user_id = auth.uid());
create policy "voice_projects_insert_own" on voice_projects
  for insert with check (user_id = auth.uid());
create policy "voice_projects_update_own" on voice_projects
  for update using (user_id = auth.uid());
create policy "voice_projects_delete_own" on voice_projects
  for delete using (user_id = auth.uid());

-- Series voices: owner-only
create policy "series_voices_select_own" on series_voices
  for select using (user_id = auth.uid());
create policy "series_voices_insert_own" on series_voices
  for insert with check (user_id = auth.uid());
create policy "series_voices_update_own" on series_voices
  for update using (user_id = auth.uid());
create policy "series_voices_delete_own" on series_voices
  for delete using (user_id = auth.uid());

-- Voice minutes wallet: owner-only
create policy "voice_minutes_wallet_select_own" on voice_minutes_wallet
  for select using (user_id = auth.uid());

-- Voice minutes ledger: owner-only
create policy "voice_minutes_ledger_select_own" on voice_minutes_ledger
  for select using (user_id = auth.uid());
create policy "voice_minutes_ledger_insert_own" on voice_minutes_ledger
  for insert with check (user_id = auth.uid());

-- Voice top-ups: owner-only
create policy "voice_topups_select_own" on voice_topups
  for select using (user_id = auth.uid());
create policy "voice_topups_insert_own" on voice_topups
  for insert with check (user_id = auth.uid());

-- Triggers
create trigger set_voice_projects_updated_at
  before update on voice_projects
  for each row execute function public.set_updated_at();
