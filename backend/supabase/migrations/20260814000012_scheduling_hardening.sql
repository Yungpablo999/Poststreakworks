-- ============================================================================
-- Migration: Scheduling hardening (follow-up to 20260814000002)
-- ============================================================================
--
-- Adds three things 20260814000002_social_scheduling.sql was missing,
-- discovered by porting v1's (PostIT-web) proven cron dispatch logic rather
-- than reinventing it:
--
--   1. `locked_at` — atomic claim column for the dispatch cron. Without it,
--      two overlapping cron invocations can both pick up the same due post.
--      v1 hit this as a real bug (PostgREST OR-on-null is unreliable for
--      UPDATE — claim and stale-release are done as separate statements,
--      not combined into one OR condition).
--   2. `error` — v1 stores the human-readable failure reason on the row
--      itself so Settings/UI can show it. `post_status` having a 'failed'
--      value without an accompanying message is a silent failure.
--   3. `pending_confirmation` status — the X assisted-publish flow (v1:
--      "Copy & Post flow — manual confirm replaces X auto-posting", a
--      deliberate founder decision, not a placeholder to build past). A post
--      targeting an 'assisted' publish_mode platform lands here until the
--      user confirms they posted it manually.
--
-- Modeled as a follow-up migration, not an edit to 20260814000002, per this
-- project's own stated discipline once a migration is "shipped" (see
-- 20260814000011_user_sanctions.sql's header for precedent).
-- ============================================================================

alter table scheduled_posts add column locked_at timestamptz;
alter table scheduled_posts add column error text;

alter type post_status add value 'pending_confirmation' after 'publishing';

create index idx_scheduled_posts_locked_at on scheduled_posts(locked_at);

-- Note on platform_post_ids (jsonb, already on scheduled_posts): for a post
-- targeting multiple platforms, this is where per-platform outcome lives —
-- e.g. {"linkedin": {"status": "published", "id": "urn:..."}, "twitter":
-- {"status": "pending_confirmation"}}. `status` on the row itself is the
-- aggregate (published only once every target platform succeeds; failed if
-- any platform failed and none are still pending). This was a deliberate
-- choice over v1's one-row-per-platform `posts` table, now that a single
-- scheduled_posts row can target several platforms at once — kept as a code
-- convention here rather than a stricter schema because the shape of a
-- per-platform result can still change without another migration.
