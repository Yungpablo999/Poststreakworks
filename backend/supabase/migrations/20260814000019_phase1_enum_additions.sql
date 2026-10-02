-- ============================================================================
-- Migration: Phase 1 enum additions
-- ============================================================================
--
-- Kept in its own file on purpose: Postgres can't use a newly added enum value
-- in the same transaction that adds it, and every migration runs in one
-- transaction. The next migration (…20_phase1_saved_work) uses these values.
--
-- Platforms: the finished app connects TikTok, Instagram, YouTube, Facebook
-- and Threads (src/config/features.ts STAGE_1_PLATFORMS). The original enum
-- only had linkedin / twitter / meta / tiktok. 'twitter' stays as the
-- database name for X; the API maps "x" <-> "twitter" at the boundary.
-- ============================================================================

alter type platform_type add value if not exists 'instagram';
alter type platform_type add value if not exists 'youtube';
alter type platform_type add value if not exists 'threads';
alter type platform_type add value if not exists 'facebook';

-- A daily check-in is now a qualifying streak action, alongside publishing,
-- completing a mission and completing a collaboration.
alter type streak_event_type add value if not exists 'check_in';
