-- ============================================================================
-- Migration: Seed the Pro plan
-- ============================================================================
--
-- subscription_plans had zero seeded rows — DATA_MODEL.md item A left
-- pricing formally OPEN (Free/Pro/Growth vs. Creator/Growth/Automation,
-- different numbers in each source doc). That's no longer ambiguous for the
-- Pro tier specifically: JarvisProScreen (built, on main) shows one flat
-- $9.99/month plan with a fixed feature list, no plan picker. Seeding
-- exactly that — not a guess, a fact already shipped in the UI.
--
-- price_ngn is left null, on purpose — no NGN figure exists anywhere for
-- this plan (the architecture docs and the screen only ever show $9.99),
-- so guessing a Naira conversion here would be inventing a number nobody
-- decided, not porting one. billing.createCheckout already throws a clear
-- "No NGN price set for this plan" error for a Paystack checkout attempt
-- until someone provides one.
-- ============================================================================

insert into subscription_plans (name, slug, price_usd, features, is_active)
values (
  'Jarvis Pro',
  'pro',
  999, -- $9.99 in cents, matching subscriptions.amount's minor-unit convention
  '{
    "full_jarvis_intelligence": true,
    "growth_analytics_suite": true,
    "unlimited_discovery": true,
    "priority_creator_matching": true,
    "digital_media_kit_and_rate_card": true
  }'::jsonb,
  true
);
