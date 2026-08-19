-- ============================================================================
-- Migration: Creator Network (Matching, Collaboration, Squads, Passport)
-- Governed by: supabase/DATA_MODEL.md
-- ============================================================================

create type discovery_action_type as enum ('viewed', 'passed', 'saved', 'interested', 'priority_requested');
create type match_status as enum ('pending', 'active', 'expired', 'blocked');
create type brief_status as enum ('proposed', 'accepted', 'scheduled', 'active', 'completed', 'cancelled', 'disputed');
create type squad_type as enum ('city', 'niche', 'stage', 'language');
create type squad_member_role as enum ('leader', 'member');

-- Discovery actions: one row per actor->target action
create table discovery_actions (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid not null references creator_profiles(id) on delete cascade,
  target_id   uuid not null references creator_profiles(id) on delete cascade,
  action      discovery_action_type not null,
  created_at  timestamptz not null default now(),
  unique(actor_id, target_id, action)
);

-- Matches: created when both sides express interest
create table matches (
  id          uuid primary key default gen_random_uuid(),
  user_a_id   uuid not null references creator_profiles(id) on delete cascade,
  user_b_id   uuid not null references creator_profiles(id) on delete cascade,
  status      match_status not null default 'pending',
  matched_at  timestamptz not null default now(),
  unique(user_a_id, user_b_id)
);

-- Conversations: scoped to a match
create table conversations (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references matches(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Messages: per conversation
create table messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid not null references conversations(id) on delete cascade,
  sender_id         uuid not null references users(id) on delete cascade,
  content           text not null,
  moderation_status text default 'approved',
  created_at        timestamptz not null default now()
);

-- Collaboration briefs
create table collaboration_briefs (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid references matches(id) on delete set null,
  created_by  uuid not null references users(id) on delete cascade,
  concept     text not null,
  roles       jsonb default '[]',
  deliverables jsonb default '[]',
  start_date  date,
  end_date    date,
  status      brief_status not null default 'proposed',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Collaboration tasks: sub-items on a brief
create table collaboration_tasks (
  id          uuid primary key default gen_random_uuid(),
  brief_id    uuid not null references collaboration_briefs(id) on delete cascade,
  assigned_to uuid references users(id) on delete set null,
  title       text not null,
  status      brief_status not null default 'proposed',
  due_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Squads
create table squads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  type        squad_type not null,
  created_by  uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Squad members
create table squad_members (
  id          uuid primary key default gen_random_uuid(),
  squad_id    uuid not null references squads(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  role        squad_member_role not null default 'member',
  joined_at   timestamptz not null default now(),
  unique(squad_id, user_id)
);

-- Indexes
create index idx_discovery_actions_actor on discovery_actions(actor_id);
create index idx_discovery_actions_target on discovery_actions(target_id);
create index idx_matches_user_a on matches(user_a_id);
create index idx_matches_user_b on matches(user_b_id);
create index idx_conversations_match on conversations(match_id);
create index idx_messages_conversation on messages(conversation_id);
create index idx_messages_sender on messages(sender_id);
create index idx_collaboration_briefs_match on collaboration_briefs(match_id);
create index idx_collaboration_briefs_created_by on collaboration_briefs(created_by);
create index idx_collaboration_tasks_brief on collaboration_tasks(brief_id);
create index idx_squads_type on squads(type);
create index idx_squad_members_squad on squad_members(squad_id);
create index idx_squad_members_user on squad_members(user_id);

-- RLS
alter table discovery_actions enable row level security;
alter table matches enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table collaboration_briefs enable row level security;
alter table collaboration_tasks enable row level security;
alter table squads enable row level security;
alter table squad_members enable row level security;

-- Discovery actions: actor-only
create policy "discovery_actions_select_own" on discovery_actions
  for select using (actor_id = auth.uid());
create policy "discovery_actions_insert_own" on discovery_actions
  for insert with check (actor_id = auth.uid());

-- Matches: both parties can read
create policy "matches_select_own" on matches
  for select using (
    user_a_id in (select id from creator_profiles where user_id = auth.uid())
    or user_b_id in (select id from creator_profiles where user_id = auth.uid())
  );

-- Conversations: match participants can read
create policy "conversations_select_own" on conversations
  for select using (
    match_id in (
      select id from matches where
        user_a_id in (select id from creator_profiles where user_id = auth.uid())
        or user_b_id in (select id from creator_profiles where user_id = auth.uid())
    )
  );

-- Messages: conversation participants can read, sender can insert
create policy "messages_select_own" on messages
  for select using (
    conversation_id in (
      select c.id from conversations c
      join matches m on c.match_id = m.id
      where m.user_a_id in (select id from creator_profiles where user_id = auth.uid())
         or m.user_b_id in (select id from creator_profiles where user_id = auth.uid())
    )
  );
create policy "messages_insert_own" on messages
  for insert with check (sender_id = auth.uid());

-- Collaboration briefs: match participants can read, creator can write
create policy "collaboration_briefs_select_own" on collaboration_briefs
  for select using (created_by = auth.uid());
create policy "collaboration_briefs_insert_own" on collaboration_briefs
  for insert with check (created_by = auth.uid());
create policy "collaboration_briefs_update_own" on collaboration_briefs
  for update using (created_by = auth.uid());

-- Collaboration tasks: brief participants can read/write
create policy "collaboration_tasks_select_own" on collaboration_tasks
  for select using (assigned_to = auth.uid());
create policy "collaboration_tasks_insert_own" on collaboration_tasks
  for insert with check (assigned_to = auth.uid());
create policy "collaboration_tasks_update_own" on collaboration_tasks
  for update using (assigned_to = auth.uid());

-- Squads: public read, creator can write
create policy "squads_select_public" on squads
  for select using (true);
create policy "squads_insert_own" on squads
  for insert with check (created_by = auth.uid());

-- Squad members: public read, self join
create policy "squad_members_select_own" on squad_members
  for select using (true);
create policy "squad_members_insert_own" on squad_members
  for insert with check (user_id = auth.uid());

-- Triggers
create trigger set_collaboration_briefs_updated_at
  before update on collaboration_briefs
  for each row execute function public.set_updated_at();

create trigger set_collaboration_tasks_updated_at
  before update on collaboration_tasks
  for each row execute function public.set_updated_at();
