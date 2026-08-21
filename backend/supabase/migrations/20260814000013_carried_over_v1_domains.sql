-- ============================================================================
-- Migration: Referrals, Autopilot, Agent Memory (carried over from v1)
-- ============================================================================
--
-- Three live v1 (PostIT-web) features with no home in the original 8-stage
-- data model — never asked about in Stage 1, because they didn't exist to
-- ask about at the time. Founder confirmed keeping all three rather than
-- cutting them on migration: ROADMAP.md's whole launch premise is "existing
-- users keep their streaks, credits, and subscriptions," and that principle
-- applies here too. Modeled as an addendum migration, same discipline as
-- Missions/Duels/User Sanctions being added mid-session in the original
-- 8-stage docs rather than silently folded in as if always planned.
--
-- Schema adapted from v1's supabase/migrations/001_posts_and_tokens.sql and
-- src/app/api/agent/memory/route.ts — logic ports 1:1, table shape updated
-- to key off `users.id` (this schema's identity table) rather than
-- `auth.users.id` directly, consistent with every other migration here.
--
-- `if not exists` / `drop ... if exists` guards throughout referrals and
-- autopilot_configs (not agent_memory, which is genuinely new): when this
-- runs against v1's live Supabase project rather than a fresh one, those two
-- tables already exist with this exact shape — this migration should adopt
-- them in place, not fail trying to recreate them. See
-- 20260814000000_v1_legacy_collision_guard.sql for the analogous streak_events
-- case, where the shapes differ and reuse isn't viable.
-- ============================================================================

-- Referrals: one row per referral relationship. A referrer's own code is a
-- row with referred_user_id null (v1's pattern — "get or create" on first
-- read rather than provisioning a code at signup).
create table if not exists referrals (
  id                  uuid primary key default gen_random_uuid(),
  referrer_user_id    uuid not null references users(id) on delete cascade,
  referred_user_id    uuid references users(id) on delete cascade,
  referral_code       text not null unique,
  paid_at             timestamptz,
  reward_granted_at   timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists idx_referrals_referrer on referrals(referrer_user_id);
create index if not exists idx_referrals_referred on referrals(referred_user_id);
create index if not exists idx_referrals_code on referrals(referral_code);

alter table referrals enable row level security;

drop policy if exists "referrals_select_own" on referrals;
create policy "referrals_select_own" on referrals
  for select using (referrer_user_id = auth.uid() or referred_user_id = auth.uid());
drop policy if exists "referrals_insert_own" on referrals;
create policy "referrals_insert_own" on referrals
  for insert with check (referrer_user_id = auth.uid());

-- Autopilot: one config per user. `platforms` intentionally stays text[]
-- rather than platform_type[] — v1's dispatch reads this generically per
-- platform string, and coupling it to the enum would force a migration
-- every time a new platform is added here before scheduling supports it.
create table if not exists autopilot_configs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references users(id) on delete cascade,
  topics        text[] not null default '{}',
  platforms     text[] not null default '{}',
  frequency     integer not null default 1,
  mode          text not null default 'suggest' check (mode in ('auto', 'suggest')),
  enabled       boolean not null default false,
  last_run_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_autopilot_configs_enabled on autopilot_configs(enabled) where enabled = true;

alter table autopilot_configs enable row level security;

drop policy if exists "autopilot_configs_all_own" on autopilot_configs;
create policy "autopilot_configs_all_own" on autopilot_configs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop trigger if exists set_autopilot_configs_updated_at on autopilot_configs;
create trigger set_autopilot_configs_updated_at
  before update on autopilot_configs
  for each row execute function public.set_updated_at();

-- Agent memory: key/value preferences the AI agent learns from chat (e.g.
-- "no hashtags", "always casual tone") and applies to future generations.
-- v1's src/app/api/agent/memory/route.ts — one row per (user, key).
create table agent_memory (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  key         text not null,
  value       text not null,
  updated_at  timestamptz not null default now(),
  unique(user_id, key)
);

create index idx_agent_memory_user_id on agent_memory(user_id);

alter table agent_memory enable row level security;

create policy "agent_memory_all_own" on agent_memory
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
