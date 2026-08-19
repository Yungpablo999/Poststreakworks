-- ============================================================================
-- Migration: Notifications, Quests/Challenges, Creator Economy (Passport,
-- Opportunity Readiness, Earnings/Campaigns)
-- ============================================================================
--
-- Reverse-engineered from the built frontend (30 Expo screens), which is now
-- the working spec — no Figma text access, no v1 equivalent for most of this.
-- Scope note: Creator Passport / Opportunity Readiness / Earnings map onto
-- the Brand & Agency Platform / Opportunity Marketplace pillars OPEN_QUESTIONS.md
-- listed as explicitly deferred. Confirmed to build anyway — the frontend has
-- already committed real screens to them, so the scope has expanded, same as
-- Missions/Duels were added mid-session in the original 8-stage docs.
--
-- Design note on "readiness scores": the frontend currently computes three
-- different, mutually inconsistent percentages for what's conceptually one
-- score (Earnings: 35%, Opportunity Readiness: 70%, Creator Passport: 70%).
-- This migration does NOT store a score — creator_passport_facts below holds
-- only the handful of facts that aren't derivable from existing tables
-- (identity verification, staff overrides). The score itself is computed by
-- a single procedure (packages/api/routers/passport.ts) from real signals —
-- profile completeness, streak length, platform count, quest completion —
-- so all three screens converge on one number instead of three.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────
-- Notifications — one feed, reused across Dashboard/Create/Composer/
-- Schedule/Match/Messages (identical NotificationItem shape on every screen).
-- ─────────────────────────────────────────────────────────────

create type notification_type as enum (
  'streak', 'collab', 'quest', 'level', 'growth', 'match', 'message', 'system'
);

create table notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  type          notification_type not null default 'system',
  title         text not null,
  body          text not null,
  action_text   text,
  metadata      jsonb not null default '{}',
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

create index idx_notifications_user_id on notifications(user_id);
create index idx_notifications_user_unread on notifications(user_id, read) where read = false;

alter table notifications enable row level security;

create policy "notifications_select_own" on notifications
  for select using (user_id = auth.uid());
create policy "notifications_update_own" on notifications
  for update using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- Quests — distinct from `missions` (missions.ts: one AI-recommended task
-- per day). Quests are a catalog: starter/onboarding quests, community
-- challenges' single-user detail view, and the locked brand-quest preview.
-- Multi-step requirement checklists (ChallengeDetailScreen) live in
-- `requirements` jsonb — each item is {id, title, order, dependsOn?}, and
-- quest_progress.requirement_status tracks per-step completion.
-- ─────────────────────────────────────────────────────────────

create type quest_category as enum ('daily', 'starter', 'community', 'brand');
create type quest_progress_status as enum ('not_started', 'in_progress', 'completed');

create table quests (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text not null,
  category          quest_category not null,
  xp_reward         integer not null default 0,
  streak_protected  boolean not null default false,
  requirements      jsonb not null default '[]',
  reward_badge      text,
  is_active         boolean not null default true,
  expires_at        timestamptz,
  created_at        timestamptz not null default now()
);

create index idx_quests_category on quests(category) where is_active = true;

alter table quests enable row level security;

-- Quest catalog: public read (every user needs to see available quests)
create policy "quests_select_public" on quests
  for select using (is_active = true);

create table quest_progress (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references users(id) on delete cascade,
  quest_id              uuid not null references quests(id) on delete cascade,
  status                quest_progress_status not null default 'not_started',
  requirement_status    jsonb not null default '{}',
  started_at            timestamptz,
  completed_at          timestamptz,
  unique(user_id, quest_id)
);

create index idx_quest_progress_user_id on quest_progress(user_id);

alter table quest_progress enable row level security;

create policy "quest_progress_all_own" on quest_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- Community Challenges — cohort-shared progress (target_posts counted
-- across ALL participants), distinct from single-user quests.
-- ─────────────────────────────────────────────────────────────

create table community_challenges (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text not null,
  target_posts  integer not null,
  reward_badge  text,
  starts_at     timestamptz not null default now(),
  ends_at       timestamptz not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table community_challenges enable row level security;

create policy "community_challenges_select_public" on community_challenges
  for select using (true);

create table challenge_participants (
  challenge_id    uuid not null references community_challenges(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  current_posts   integer not null default 0,
  joined_at       timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

alter table challenge_participants enable row level security;

-- Participant counts/rosters are shown publicly (avatar stack, "42 creators
-- competing") — same narrow-cross-user-read exception as leaderboards,
-- per DATA_MODEL.md item F's resolved RLS philosophy.
create policy "challenge_participants_select_public" on challenge_participants
  for select using (true);
create policy "challenge_participants_insert_own" on challenge_participants
  for insert with check (user_id = auth.uid());
create policy "challenge_participants_update_own" on challenge_participants
  for update using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- Creator Passport — only the facts that genuinely can't be derived.
-- Everything else (profile strength, streak score, quest completion) is
-- computed live from existing tables in packages/api/routers/passport.ts.
-- ─────────────────────────────────────────────────────────────

create table creator_passport_facts (
  user_id                  uuid primary key references users(id) on delete cascade,
  identity_verified        boolean not null default false,
  marketplace_ready_override boolean,  -- staff override; null = use computed default
  updated_at               timestamptz not null default now()
);

alter table creator_passport_facts enable row level security;

create policy "creator_passport_facts_select_own" on creator_passport_facts
  for select using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- Earnings & Campaigns — explicitly "tracked", not real payment movement
-- yet (JarvisProScreen's own paywall has zero real Stripe/IAP wiring, and
-- EarningsScreen's $ figures are static in the frontend today). Modeled as
-- an append-only ledger, same pattern as credits/voice_minutes_ledger
-- elsewhere in this schema — balance is derived, never stored/mutated
-- directly.
-- ─────────────────────────────────────────────────────────────

create type earnings_event_type as enum (
  'campaign_payout', 'external_tracked', 'payout_requested', 'payout_completed'
);

create table earnings_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  type          earnings_event_type not null,
  amount        integer not null,  -- minor units (cents), matches payment_transactions convention
  currency      currency_type not null default 'USD',
  status        text not null default 'pending' check (status in ('pending', 'confirmed', 'paid')),
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

create index idx_earnings_events_user_id on earnings_events(user_id);

alter table earnings_events enable row level security;

create policy "earnings_events_select_own" on earnings_events
  for select using (user_id = auth.uid());

create table income_goals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  label           text not null,
  target_amount   integer not null,  -- minor units
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create index idx_income_goals_user_active on income_goals(user_id) where is_active = true;

alter table income_goals enable row level security;

create policy "income_goals_all_own" on income_goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Brand campaigns: staff-managed catalog, not user-created. `locked` is
-- computed at query time (opportunity readiness score vs. a threshold), not
-- stored — same reasoning as not storing the passport score.
create table brand_campaigns (
  id                    uuid primary key default gen_random_uuid(),
  brand_name            text not null,
  title                 text not null,
  payout                integer not null,  -- minor units
  requirements_summary  text not null,
  min_readiness_score   integer not null default 70,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now()
);

alter table brand_campaigns enable row level security;

create policy "brand_campaigns_select_public" on brand_campaigns
  for select using (is_active = true);
