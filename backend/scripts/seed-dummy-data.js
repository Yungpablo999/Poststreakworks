#!/usr/bin/env node
// Seeds rich, realistic data for two dummy creator accounts so every wired
// screen and REST route has something real to render end to end.
//
// Usage:
//   1. Create the two accounts first (they don't exist yet on a fresh DB):
//        curl -X POST http://localhost:3000/api/v1/auth/sign-up -H "Content-Type: application/json" \
//          -d '{"name":"Amara Demo","email":"demo@poststreak.app","password":"<pick one>","niche":"lifestyle"}'
//        curl -X POST http://localhost:3000/api/v1/auth/sign-up -H "Content-Type: application/json" \
//          -d '{"name":"Kwame Creates","email":"demo-creator-2@poststreak.app","password":"<pick one>","niche":"tech"}'
//      (needs AUTH_DEV_AUTOCONFIRM=true in backend/apps/web/.env.local, see PROJECT_STATE.md §3)
//   2. Update PRIMARY/COUNTERPARTY below with the two real user ids the sign-up responses returned.
//   3. npm install pg   (not a project dependency — this is a standalone admin tool, run once)
//   4. node backend/scripts/seed-dummy-data.js '<your Supabase DB password>'
//
// Safe to inspect before running — every value here is fabricated demo
// content, nothing derived from real user data. Not idempotent: re-running
// against the same two accounts will fail on unique-constraint conflicts
// (creator_profiles slug, etc.) — drop the rows first if you need to reseed.
const { Client } = require("pg");

const PRIMARY = "e1ddbf37-e250-43ca-8ac4-ee9730e1dc58"; // Amara Demo — demo@poststreak.app
const COUNTERPARTY = "fa26b7f0-23d8-43d7-975c-05667c8e734b"; // Kwame Creates — demo-creator-2@poststreak.app

const client = new Client({
  host: "aws-1-eu-west-1.pooler.supabase.com", port: 6543,
  user: "postgres.ngcbxdnbkxthvzximaez", password: process.argv[2],
  database: "postgres", ssl: { rejectUnauthorized: false },
});

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}
function daysFromNow(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}
function dateOnly(d) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  await client.connect();
  await client.query("BEGIN");

  // ---- Creator profiles (needed as FK target for matches/discovery).
  // Sign-up already upserted a minimal row (user_id + niche) via
  // /api/v1/auth/sign-up's own creator_profiles upsert — fill in the rest.
  const cp1 = await client.query(
    `insert into creator_profiles (user_id, bio, niche, city, languages, platform_links, collaboration_intent, is_public, slug)
     values ($1, $2, 'Lifestyle & Storytelling', 'Lagos', '{English,Yoruba}', $3, true, true, 'amara-demo')
     on conflict (user_id) do update set
       bio = excluded.bio, niche = excluded.niche, city = excluded.city,
       languages = excluded.languages, platform_links = excluded.platform_links,
       collaboration_intent = excluded.collaboration_intent, is_public = excluded.is_public,
       slug = excluded.slug
     returning id`,
    [PRIMARY, "Documenting the honest side of building a creative business in Lagos. 12-day streak and counting.",
      JSON.stringify({ instagram: "@amaracreates", tiktok: "@amaracreates" })],
  );
  const cp2 = await client.query(
    `insert into creator_profiles (user_id, bio, niche, city, languages, platform_links, collaboration_intent, is_public, slug)
     values ($1, 'Tech reviews and AI explainers for African creators.', 'Tech & AI', 'Accra', '{English}', $2, true, true, 'kwame-creates')
     on conflict (user_id) do update set
       bio = excluded.bio, niche = excluded.niche, city = excluded.city,
       languages = excluded.languages, platform_links = excluded.platform_links,
       collaboration_intent = excluded.collaboration_intent, is_public = excluded.is_public,
       slug = excluded.slug
     returning id`,
    [COUNTERPARTY, JSON.stringify({ youtube: "Kwame Creates", x: "@kwamecreates" })],
  );
  const primaryCpId = cp1.rows[0].id;
  const counterpartyCpId = cp2.rows[0].id;
  console.log("creator_profiles:", primaryCpId, counterpartyCpId);

  // ---- Platform connections (primary only) ----
  await client.query(
    `insert into platform_connections (user_id, platform, publish_mode, platform_user_id, access_token, connected_at)
     values
       ($1, 'linkedin', 'api', 'demo-linkedin-uid', 'dummy-token-linkedin', now() - interval '20 days'),
       ($1, 'twitter', 'assisted', 'demo-twitter-uid', 'dummy-token-twitter', now() - interval '15 days')`,
    [PRIMARY],
  );

  // ---- Global catalog: quests (was completely empty project-wide) ----
  const questRows = await client.query(
    `insert into quests (title, description, category, xp_reward, streak_protected, requirements, reward_badge, is_active)
     values
       ('Post 1 Reel Today', 'Publish one Reel to protect your streak and earn bonus XP.', 'daily', 60, true, '[{"type":"publish_count","count":1}]', null, true),
       ('Engage With 3 Creators', 'Comment or react on 3 posts from your niche.', 'daily', 30, false, '[{"type":"engagement_count","count":3}]', null, true),
       ('Complete Your Passport', 'Fill in your bio, niche and social links.', 'starter', 100, false, '[{"type":"profile_complete"}]', 'Profile Pro', true),
       ('Connect a Platform', 'Link at least one social platform to unlock scheduling.', 'starter', 80, false, '[{"type":"platform_connected","count":1}]', null, true),
       ('7-Day Streak Challenge', 'Publish 7 days in a row this week.', 'community', 250, true, '[{"type":"streak_length","count":7}]', 'Consistency Badge', true),
       ('Land a Brand Deal Pitch', 'Send a pitch through a brand campaign.', 'brand', 150, false, '[{"type":"pitch_sent","count":1}]', null, true)
     returning id, title, category`,
  );
  console.log("quests seeded:", questRows.rows.length);

  // ---- Global catalog: community challenges (was empty) ----
  const challengeRows = await client.query(
    `insert into community_challenges (title, description, target_posts, reward_badge, starts_at, ends_at, is_active)
     values
       ('Lagos Food Festival Coverage', 'Post 3 pieces of content covering the festival.', 3, 'Festival Creator', now() - interval '2 days', now() + interval '5 days', true),
       ('30-Day Consistency Sprint', 'Publish at least once a day for 30 days.', 30, 'Iron Streak', now() - interval '10 days', now() + interval '20 days', true)
     returning id, title`,
  );
  console.log("community_challenges seeded:", challengeRows.rows.length);

  // ---- Global catalog: brand campaigns (was empty) ----
  const campaignRows = await client.query(
    `insert into brand_campaigns (brand_name, title, payout, requirements_summary, min_readiness_score, is_active)
     values
       ('Glow Naturals', 'Skincare Routine Reel', 45000, 'Min 5k followers, 1 Reel + 1 Story, niche: lifestyle/beauty.', 60, true),
       ('Zenith Bank', 'Financial Literacy Series', 120000, 'Min 10k followers, 3-part educational series, niche: business/tech.', 75, true),
       ('Jumia', 'Unboxing + Review', 60000, 'Min 8k followers, unboxing video within 7 days of receiving product.', 65, true)
     returning id, brand_name, title, payout`,
  );
  console.log("brand_campaigns seeded:", campaignRows.rows.length);

  // ---- Scheduled posts (primary): mix of published/scheduled/draft ----
  const postContents = [
    ["Hello everyone! Day 1 of documenting my creator journey in Lagos 🇳🇬", "published", daysAgo(12)],
    ["3 things I wish I knew before going full-time as a creator.", "published", daysAgo(11)],
    ["Behind the scenes of today's shoot — messier than it looks on camera 😅", "published", daysAgo(9)],
    ["Q&A: how do you actually price a brand collab?", "published", daysAgo(7)],
    ["My honest take on the new content calendar tools everyone's using.", "published", daysAgo(5)],
    ["Streak update: 12 days and my consistency is finally paying off in reach.", "published", daysAgo(2)],
    ["Tomorrow's post: a full breakdown of my October analytics.", "scheduled", daysFromNow(1)],
    ["Draft — not ready yet, need better b-roll for this one.", "draft", daysFromNow(3)],
  ];
  const postIds = [];
  for (const [content, status, when] of postContents) {
    const isPublished = status === "published";
    const r = await client.query(
      `insert into scheduled_posts (user_id, content, target_platforms, scheduled_at, status, published_at)
       values ($1, $2, '{linkedin,twitter}', $3, $4, $5)
       returning id`,
      [PRIMARY, content, when.toISOString(), status, isPublished ? when.toISOString() : null],
    );
    postIds.push(r.rows[0].id);
  }
  console.log("scheduled_posts seeded:", postIds.length);

  // ---- Streak state + events (12-day active streak) ----
  await client.query(
    `insert into streak_states (user_id, current_streak, longest_streak, last_qualifying_day, weekly_target, jarvis_emotion)
     values ($1, 12, 18, $2, 5, 'happy')`,
    [PRIMARY, dateOnly(daysAgo(0))],
  );
  for (let i = 0; i < 12; i++) {
    await client.query(
      `insert into streak_events (user_id, event_type, event_date) values ($1, 'publish', $2)`,
      [PRIMARY, dateOnly(daysAgo(i))],
    );
  }
  await client.query(
    `insert into streak_freezes (user_id, frozen_at, expires_at, source) values ($1, now() - interval '20 days', now() - interval '13 days', 'milestone')`,
    [PRIMARY],
  );
  console.log("streak_states + 12 streak_events + 1 freeze seeded");

  // ---- Billing: pro subscription + a couple of dummy transactions ----
  const planRes = await client.query(`select id from subscription_plans where slug = 'pro' limit 1`);
  const planId = planRes.rows[0]?.id;
  let subId = null;
  if (planId) {
    const sub = await client.query(
      `insert into subscriptions (user_id, plan_id, status, processor, processor_subscription_id, currency, current_period_start, current_period_end)
       values ($1, $2, 'active', 'stripe', 'dummy_sub_demo123', 'USD', now() - interval '10 days', now() + interval '20 days')
       returning id`,
      [PRIMARY, planId],
    );
    subId = sub.rows[0].id;
    await client.query(
      `insert into payment_transactions (subscription_id, user_id, processor, processor_transaction_id, amount, currency, status)
       values ($1, $2, 'stripe', 'dummy_txn_demo123', 999, 'USD', 'success')`,
      [subId, PRIMARY],
    );
  }
  console.log("subscription + payment_transaction seeded:", !!subId);

  // ---- Earnings: events + income goal + credits ----
  // earnings_events.status is CHECK-constrained to pending/confirmed/paid;
  // credits.type to earn/redeem — verified against the live schema, not guessed.
  await client.query(
    `insert into earnings_events (user_id, type, amount, currency, status, metadata)
     values
       ($1, 'campaign_payout', 45000, 'USD', 'pending', '{"campaign":"Glow Naturals"}'),
       ($1, 'external_tracked', 12000, 'USD', 'confirmed', '{"source":"manual entry"}'),
       ($1, 'payout_completed', 30000, 'USD', 'paid', '{"processor":"paystack"}')`,
    [PRIMARY],
  );
  await client.query(
    `insert into income_goals (user_id, label, target_amount, is_active) values ($1, 'Q4 Brand Deals Goal', 500000, true)`,
    [PRIMARY],
  );
  await client.query(
    `insert into credits (user_id, type, amount, source, description)
     values
       ($1, 'earn', 250, 'quest_completion', '7-Day Streak Challenge reward'),
       ($1, 'earn', 500, 'referral_bonus', 'Kwame signed up using your code')`,
    [PRIMARY],
  );
  console.log("earnings_events + income_goal + credits seeded");

  // ---- Quest progress (link primary to 3 of the seeded quests) ----
  const q = questRows.rows;
  await client.query(
    `insert into quest_progress (user_id, quest_id, status, requirement_status, started_at, completed_at)
     values
       ($1, $2, 'completed', '{"publish_count":1}', now() - interval '1 day', now() - interval '20 hours'),
       ($1, $3, 'in_progress', '{"engagement_count":1}', now() - interval '3 hours', null),
       ($1, $4, 'not_started', '{}', null, null)`,
    [PRIMARY, q[0].id, q[1].id, q[4].id],
  );
  console.log("quest_progress seeded");

  // ---- Challenge participation ----
  await client.query(
    `insert into challenge_participants (challenge_id, user_id, current_posts) values ($1, $2, 2)`,
    [challengeRows.rows[0].id, PRIMARY],
  );

  // ---- Missions (linked to real posts) ----
  await client.query(
    `insert into missions (user_id, type, instructions, difficulty, status, source, target_date, linked_post_id, completed_at)
     values
       ($1, 'publishing', 'Publish today''s Reel before 11:30am to protect your streak.', 'medium', 'completed', 'rules', $2, $3, now() - interval '2 days'),
       ($1, 'engagement', 'Reply to 3 comments on your latest post within 24 hours.', 'easy', 'pending', 'ai', $4, null, null)`,
    [PRIMARY, dateOnly(daysAgo(2)), postIds[5], dateOnly(daysFromNow(0))],
  );
  await client.query(
    `insert into milestones (user_id, milestone_type) values ($1, 'first_10_day_streak'), ($1, 'first_brand_deal_pitch')`,
    [PRIMARY],
  );
  console.log("missions + milestones seeded");

  // ---- Duel vs counterparty ----
  await client.query(
    `insert into duels (user_a_id, user_b_id, start_date, end_date, status, reward_type, reward_amount)
     values ($1, $2, $3, $4, 'active', 'credits', 50)`,
    [PRIMARY, COUNTERPARTY, dateOnly(daysAgo(2)), dateOnly(daysFromNow(5))],
  );

  // ---- Squad ----
  const squad = await client.query(
    `insert into squads (name, description, type, created_by) values ('Lagos Creator Collective', 'Weekly accountability squad for Lagos-based creators.', 'city', $1) returning id`,
    [PRIMARY],
  );
  await client.query(
    `insert into squad_members (squad_id, user_id, role) values ($1, $2, 'leader'), ($1, $3, 'member')`,
    [squad.rows[0].id, PRIMARY, COUNTERPARTY],
  );
  console.log("duel + squad seeded");

  // ---- Match + conversation + messages ----
  const match = await client.query(
    `insert into matches (user_a_id, user_b_id, status) values ($1, $2, 'active') returning id`,
    [primaryCpId, counterpartyCpId],
  );
  const convo = await client.query(
    `insert into conversations (match_id) values ($1) returning id`,
    [match.rows[0].id],
  );
  await client.query(
    `insert into messages (conversation_id, sender_id, content, created_at)
     values
       ($1, $2, 'Hey! Loved your Q4 analytics breakdown, would you be up for a collab?', now() - interval '1 day'),
       ($1, $3, 'Definitely! I''ve been wanting to do a Lagos x Accra creator series.', now() - interval '20 hours'),
       ($1, $2, 'Perfect — let''s draft a brief this week.', now() - interval '18 hours')`,
    [convo.rows[0].id, PRIMARY, COUNTERPARTY],
  );
  await client.query(
    `insert into discovery_actions (actor_id, target_id, action)
     values ($1, $2, 'saved'), ($1, $2, 'interested')`,
    [primaryCpId, counterpartyCpId],
  );
  await client.query(
    `insert into collaboration_briefs (match_id, created_by, concept, roles, deliverables, start_date, end_date, status)
     values ($1, $2, 'Lagos x Accra: A Tale of Two Creator Scenes', '["host","co-host"]', '["1 joint Reel","1 LinkedIn article"]', $3, $4, 'proposed')`,
    [match.rows[0].id, PRIMARY, dateOnly(daysFromNow(7)), dateOnly(daysFromNow(14))],
  );
  console.log("match + conversation + messages + collaboration_brief seeded");

  // ---- Referral: mark primary's auto-generated referral (created by the
  // handle_new_user trigger at sign-up) as successfully used by counterparty ----
  await client.query(
    `update referrals set referred_user_id = $1, paid_at = now(), reward_granted_at = now()
     where referrer_user_id = $2 and referred_user_id is null`,
    [COUNTERPARTY, PRIMARY],
  );

  // ---- Notifications (varied types, mixed read state) ----
  await client.query(
    `insert into notifications (user_id, type, title, body, action_text, read, created_at)
     values
       ($1, 'streak', 'Streak Milestone!', 'You just hit a 12-day streak. Keep it going!', 'View Streak', false, now() - interval '2 hours'),
       ($1, 'match', 'New Match', 'Kwame Creates wants to collaborate with you.', 'View Match', false, now() - interval '20 hours'),
       ($1, 'quest', 'Quest Completed', 'You earned 60 XP for posting today''s Reel.', 'View Quests', true, now() - interval '1 day'),
       ($1, 'level', 'Level Up!', 'You reached Level 3 — Elite Storyteller unlocked.', null, true, now() - interval '3 days'),
       ($1, 'message', 'New Message', 'Kwame Creates sent you a message.', 'Open Chat', false, now() - interval '18 hours'),
       ($1, 'system', 'Welcome to PostStreak', 'Your account is set up. Connect a platform to get started.', null, true, now() - interval '25 days')`,
    [PRIMARY],
  );
  console.log("notifications seeded");

  // ---- Jarvis agent memory + autopilot config ----
  await client.query(
    `insert into agent_memory (user_id, key, value)
     values ($1, 'preferred_tone', 'Warm, direct, a little playful — avoid corporate language.'),
            ($1, 'top_performing_format', 'Behind-the-scenes Reels outperform polished posts 3:1.')`,
    [PRIMARY],
  );
  await client.query(
    `insert into autopilot_configs (user_id, topics, platforms, frequency, mode, enabled)
     values ($1, '{lifestyle,behind-the-scenes}', '{linkedin,twitter}', 3, 'suggest', false)`,
    [PRIMARY],
  );

  // ---- Analytics events ----
  const eventNames = ["app_opened", "post_published", "post_published", "quest_completed", "profile_viewed", "match_created"];
  for (const name of eventNames) {
    await client.query(
      `insert into analytics_events (user_id, event_name, properties) values ($1, $2, '{}')`,
      [PRIMARY, name],
    );
  }
  console.log("agent_memory + autopilot_configs + analytics_events seeded");

  await client.query("COMMIT");
  console.log("\n✅ ALL SEED DATA COMMITTED");
  console.log("Primary dummy user: demo@poststreak.app (id " + PRIMARY + ")");
  console.log("Counterparty: demo-creator-2@poststreak.app (id " + COUNTERPARTY + ")");
}

main()
  .catch(async (e) => {
    console.error("SEED FAILED, rolling back:", e.message);
    try { await client.query("ROLLBACK"); } catch {}
    process.exit(1);
  })
  .finally(() => client.end());
