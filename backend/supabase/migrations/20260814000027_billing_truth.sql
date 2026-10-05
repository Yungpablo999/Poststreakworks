-- ============================================================================
-- Migration: a subscription says what is true, and a payment event is applied once
-- ============================================================================
--
-- Before this, "Pro" meant "a subscriptions row whose status is active or trialing", and nothing ever
-- moved a row out of those states: a month paid once was Pro for ever, and cancelling at Stripe was
-- never heard of. Two things change here:
--
--   payment_events               every webhook event the server has applied (processor + event id), so a
--                                retried or replayed delivery changes nothing the second time;
--   expire_lapsed_subscriptions  run by the server's cron: a subscription whose paid period has ended
--                                (after a short grace for a late renewal notice) stops being active.
--
-- Every place that reads "active or trialing" stays correct without being changed, and the sign-in check
-- (packages/api/context.ts) also looks at the period end, so nothing waits for the cron.
-- Trust model (backend/PHASE1_CONTRACT.md §3): creators read their own subscription; only the server writes.
-- No data is changed by this migration itself: rows already past their period are expired by the cron.
-- ============================================================================

create table payment_events (
  processor   processor_type not null,
  event_id    text not null check (char_length(event_id) between 1 and 200),
  type        text not null check (char_length(type) between 1 and 100),
  received_at timestamptz not null default now(),
  primary key (processor, event_id)
);

alter table payment_events enable row level security;
-- Server only: no policies, and no client privileges at all.
revoke all on public.payment_events from anon, authenticated;

-- The webhook finds a subscription by the processor's id for it (renewals, cancellations).
create index if not exists idx_subscriptions_processor_sub
  on subscriptions (processor, processor_subscription_id)
  where processor_subscription_id is not null;

-- How long after the end of a paid period a subscription stays active while the renewal notice is on its
-- way (Stripe retries a failed renewal for days; a creator shouldn't lose Pro over a late message).
-- Keep in step with ENTITLEMENT_GRACE_HOURS in packages/workflows/billing.ts.
create or replace function public.subscription_grace()
returns interval
language sql immutable as $$ select interval '24 hours' $$;

/** Ends every active or trialing subscription whose paid period (plus the grace) is over. Returns how many. */
create or replace function public.expire_lapsed_subscriptions(p_now timestamptz default now())
returns integer
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_count integer;
begin
  update subscriptions
     set status = 'cancelled', updated_at = p_now
   where status in ('active', 'trialing')
     and current_period_end + public.subscription_grace() < p_now;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.expire_lapsed_subscriptions(timestamptz) from public, anon, authenticated;
grant execute on function public.expire_lapsed_subscriptions(timestamptz) to service_role;
