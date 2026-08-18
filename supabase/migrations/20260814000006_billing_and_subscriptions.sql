-- ============================================================================
-- Migration: Billing & Subscriptions
-- Governed by: supabase/DATA_MODEL.md
-- ============================================================================

-- Add FK from voice_minutes_wallet.subscription_id (created in migration 5)
-- This must happen after subscriptions table exists.
-- NOTE: deferred to end of this migration after subscriptions is created.

create type processor_type as enum ('paystack', 'stripe');
create type currency_type as enum ('NGN', 'USD');
create type subscription_status as enum ('active', 'cancelled', 'past_due', 'trialing');
create type payment_status as enum ('pending', 'success', 'failed', 'refunded');

-- Subscription plans: tier catalog
-- Do not seed real rows until pricing is resolved (DATA_MODEL.md item A).
create table subscription_plans (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  price_ngn   integer,
  price_usd   integer,
  features    jsonb default '{}',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Subscriptions: one active row per user
create table subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references users(id) on delete cascade,
  plan_id                 uuid not null references subscription_plans(id),
  status                  subscription_status not null default 'active',
  processor               processor_type not null,
  processor_subscription_id text,
  currency                currency_type not null default 'NGN',
  current_period_start    timestamptz not null default now(),
  current_period_end      timestamptz not null,
  cancel_at_period_end    boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Payment transactions: processor-specific metadata in jsonb
create table payment_transactions (
  id                      uuid primary key default gen_random_uuid(),
  subscription_id         uuid references subscriptions(id) on delete set null,
  user_id                 uuid not null references users(id) on delete cascade,
  processor               processor_type not null,
  processor_transaction_id text,
  amount                  integer not null,
  currency                currency_type not null default 'NGN',
  status                  payment_status not null default 'pending',
  metadata                jsonb default '{}',
  created_at              timestamptz not null default now()
);

-- Now add the FK from voice_minutes_wallet to subscriptions
alter table voice_minutes_wallet
  add constraint fk_voice_minutes_wallet_subscription_id
  foreign key (subscription_id) references subscriptions(id) on delete set null;

-- Indexes
create index idx_subscription_plans_slug on subscription_plans(slug);
create index idx_subscriptions_user_id on subscriptions(user_id);
create index idx_subscriptions_status on subscriptions(status);
create index idx_subscriptions_user_status on subscriptions(user_id, status);
create index idx_payment_transactions_subscription_id on payment_transactions(subscription_id);
create index idx_payment_transactions_user_id on payment_transactions(user_id);
create index idx_payment_transactions_processor on payment_transactions(processor);

-- RLS
alter table subscription_plans enable row level security;
alter table subscriptions enable row level security;
alter table payment_transactions enable row level security;

-- Subscription plans: public read
create policy "subscription_plans_select_public" on subscription_plans
  for select using (true);

-- Subscriptions: owner-only
create policy "subscriptions_select_own" on subscriptions
  for select using (user_id = auth.uid());
create policy "subscriptions_insert_own" on subscriptions
  for insert with check (user_id = auth.uid());
create policy "subscriptions_update_own" on subscriptions
  for update using (user_id = auth.uid());

-- Payment transactions: owner-only
create policy "payment_transactions_select_own" on payment_transactions
  for select using (user_id = auth.uid());
create policy "payment_transactions_insert_own" on payment_transactions
  for insert with check (user_id = auth.uid());

-- Triggers
create trigger set_subscriptions_updated_at
  before update on subscriptions
  for each row execute function public.set_updated_at();
