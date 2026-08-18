-- ============================================================================
-- Migration: Accounts & Identity
-- Governed by: supabase/DATA_MODEL.md
-- ============================================================================

-- Roles enum: creator | staff_admin
create type user_role as enum ('creator', 'staff_admin');

-- Users: 1:1 with Supabase Auth (auth.users)
create table users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  avatar_url   text,
  country      text default 'NG',
  locale       text default 'en',
  role         user_role not null default 'creator',
  onboarding_completed boolean not null default false,
  consent_marketing   boolean not null default false,
  closed_at    timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Trigger: auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Creator profiles
create table creator_profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references users(id) on delete cascade,
  bio                 text,
  niche               text,
  city                text,
  languages           text[] default '{}',
  platform_links      jsonb default '{}',
  collaboration_intent boolean default false,
  is_public           boolean default true,
  slug                text unique,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Indexes
create index idx_users_email on users(email);
create index idx_creator_profiles_user_id on creator_profiles(user_id);
create index idx_creator_profiles_slug on creator_profiles(slug);
create index idx_creator_profiles_niche on creator_profiles(niche);
create index idx_creator_profiles_city on creator_profiles(city);

-- RLS
alter table users enable row level security;
alter table creator_profiles enable row level security;

-- Users: owner-only read, service role for admin
create policy "users_select_own" on users
  for select using (auth.uid() = id);

create policy "users_update_own" on users
  for update using (auth.uid() = id);

-- Creator profiles: public read (for discovery), owner write
create policy "creator_profiles_select_public" on creator_profiles
  for select using (is_public = true or user_id = auth.uid());

create policy "creator_profiles_insert_own" on creator_profiles
  for insert with check (user_id = auth.uid());

create policy "creator_profiles_update_own" on creator_profiles
  for update using (user_id = auth.uid());

create policy "creator_profiles_delete_own" on creator_profiles
  for delete using (user_id = auth.uid());

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_users_updated_at
  before update on users
  for each row execute function public.set_updated_at();

create trigger set_creator_profiles_updated_at
  before update on creator_profiles
  for each row execute function public.set_updated_at();
