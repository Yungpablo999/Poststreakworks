#!/usr/bin/env node
// Creates the four local test accounts (see frontend/shared/constants/devAccounts.json):
//
//   Free · New        just signed up, nothing done yet
//   Free · Existing   weeks of history: streak, drafts, hooks, posts, a connected TikTok
//   Pro  · New        just upgraded, nothing done yet
//   Pro  · Existing   Pro with weeks of history and a connected TikTok
//
// Replaces the preview switches the sample app had: instead of flipping a switch to see another
// kind of creator, you sign in as one. Every account is made of real rows in the local database,
// so every screen shows exactly what the server holds. Running it again resets the four accounts
// to a fresh start (it deletes and recreates them); nobody else's data is touched.
//
//   node scripts/seed-test-users.mjs
//
// LOCAL ONLY. It refuses to run unless the database is on this machine.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CREATORS, followersToday, videosFor } from './mocks/creators.mjs';
import { sealToken } from '../packages/integrations/token-vault.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const ACCOUNTS = JSON.parse(readFileSync(path.join(here, '../../frontend/shared/constants/devAccounts.json'), 'utf8')).accounts;

// ─── Settings ───────────────────────────────────────────────────────────────
function readEnvFile(file) {
  const out = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) out[m[1]] = m[2];
  }
  return out;
}
const env = { ...readEnvFile(path.join(here, '../apps/web/.env.local')), ...process.env };
const SB = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const KEY = env.TOKEN_ENCRYPTION_KEY;
if (!SB || !SERVICE || !KEY) throw new Error('Run this after `npm run local` has written backend/apps/web/.env.local (Supabase URL, service key and TOKEN_ENCRYPTION_KEY).');
if (!['localhost', '127.0.0.1'].includes(new URL(SB).hostname)) throw new Error(`Refusing to seed test accounts on ${SB}: this script is for the database on this machine only.`);
const MOCK_ORIGIN = env.TIKTOK_MOCK_ORIGIN ?? 'http://127.0.0.1:4010/tiktok';

// ─── Talking to the database (as the server, bypassing row-level security) ──
const headers = (extra = {}) => ({ apikey: SERVICE, authorization: `Bearer ${SERVICE}`, 'content-type': 'application/json', ...extra });

async function rest(method, table, { query = '', body, prefer } = {}) {
  const res = await fetch(`${SB}/rest/v1/${table}${query}`, {
    method,
    headers: headers(prefer ? { prefer } : {}),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${table}${query} -> ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}
// A batch must have the same columns in every row, so rows that leave out different columns go in separate batches
// (the database fills in whatever a row leaves out).
async function insert(table, rows) {
  const groups = new Map();
  for (const row of rows) {
    const signature = Object.keys(row).sort().join(',');
    groups.set(signature, [...(groups.get(signature) ?? []), row]);
  }
  const out = [];
  for (const batch of groups.values()) out.push(...(await rest('POST', table, { body: batch, prefer: 'return=representation' })));
  return out;
}
const upsert = (table, rows, onConflict) => rest('POST', table, { query: `?on_conflict=${onConflict}`, body: rows, prefer: 'resolution=merge-duplicates,return=representation' });

async function authAdmin(method, p, body) {
  const res = await fetch(`${SB}/auth/v1/admin/${p}`, { method, headers: headers(), body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok && res.status !== 404) throw new Error(`auth ${method} ${p} -> ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

// ─── Dates (all in the creators' own time zone, Africa/Lagos) ───────────────
const TZ = 'Africa/Lagos';
const DAY = 86_400_000;
const NOW = Date.now();
const localDate = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(ms)); // YYYY-MM-DD
const daysAgo = (n, hour = 12) => new Date(Date.UTC(...localDate(NOW - n * DAY).split('-').map((x, i) => (i === 1 ? Number(x) - 1 : Number(x))), hour - 1, 0, 0)).toISOString();
const inDays = (n, hour) => daysAgo(-n, hour);

// ─── What each account looks like ───────────────────────────────────────────
const NICHE_LABEL = { lifestyle: 'Lifestyle', food: 'Food', tech: 'Tech & Business', education: 'Education', fitness: 'Fitness', music: 'Music & Dance', beauty: 'Beauty & Fashion', comedy: 'Comedy' };

const BIO = {
  free_existing: ['Productivity and tech for people who work a lot. Building in public from Lagos.', 'Tech tips for busy creators'],
  pro_existing: ['Beauty, braids and honest reviews. Funny when the camera is on.', 'Beauty and comedy creator'],
  free_new: ['', ''],
  pro_new: ['', ''],
};

// A run of check-in days ending `endAgo` days ago, `length` long.
const run = (endAgo, length) => Array.from({ length }, (_, i) => endAgo + i);

const HISTORY = {
  // current run of 12 ending yesterday, a gap, then an earlier run of 15
  bayo_free_existing: { checkInDays: [...run(1, 12), ...run(15, 15)], xp: { missions: 14, quests: 4 }, tourDoneAgo: 24, tips: ['create', 'quests', 'growth', 'schedule', 'hook-studio'], joinedAgo: 41 },
  // current run of 27 ending yesterday, a gap, then an earlier run of 41
  dami_pro_existing: { checkInDays: [...run(1, 27), ...run(31, 41)], xp: { missions: 46, quests: 11 }, tourDoneAgo: 70, tips: ['create', 'quests', 'growth', 'schedule', 'repurpose', 'hook-studio', 'voice-studio'], joinedAgo: 74 },
};

const DRAFT_BANK = {
  tech: [
    ['3 apps that save me an hour a day', 'post', '30-second Reel', 'tiktok', 'Number three is free. Here is the setup in thirty seconds.'],
    ['How I plan my week in one note', 'script', 'Script', 'tiktok', 'Open with the messy before, then the single page that fixed it.'],
    ['Phone settings you should change today', 'post', 'Caption', 'tiktok', 'Four toggles, one minute, less noise. Which one are you changing first?'],
    ['Free tools every creator should know', 'post', '30-second Reel', 'instagram', 'No subscription needed: here are the five I actually use.'],
    ['Automate your inbox in ten minutes', 'script', 'Script', 'youtube', 'Show the inbox at 400 unread, then the three filters.'],
  ],
  beauty: [
    ['Soft glam in five products', 'post', '30-second Reel', 'tiktok', 'Everything under 3000 naira. Which product would you swap?'],
    ['Skincare mistakes to drop', 'script', 'Script', 'tiktok', 'Start with the one everyone does at night.'],
    ['Braids that last a month', 'post', 'Caption', 'instagram', 'How I prep, how I sleep, how I wash. Save this for your next appointment.'],
    ['Foundation for deeper skin tones', 'script', 'Script', 'youtube', 'Swatch five shades, say the undertone out loud.'],
    ['Get ready with me: wedding guest', 'post', '30-second Reel', 'tiktok', 'Full face in one minute, with the hair reveal at the end.'],
    ['Lip combos under 3000 naira', 'post', 'Caption', 'instagram', 'Three combos, one tutorial. Comment the one you want next.'],
    ['Nail shapes explained', 'script', 'Script', 'tiktok', 'Hold up the shapes, say which suits which hand.'],
    ['Hair wash day routine', 'post', '30-second Reel', 'tiktok', 'The full routine in real time, no skips.'],
  ],
};

const HOOKS = {
  tech: [
    ['Nobody tells you this about your phone.', 'talking', '3 phone settings'],
    ['I deleted 400 emails in ten minutes.', 'talking', 'Inbox zero'],
    ['Stop. You are using this app wrong.', 'text', 'App tips'],
    ['Watch me automate my whole morning.', 'skit', 'Morning automation'],
    ['This costs nothing and saves an hour.', 'talking', 'Free tools'],
    ['The mistake every beginner makes with notes.', 'text', 'Notes setup'],
  ],
  beauty: [
    ['This is the product I would never go back from.', 'talking', 'Foundation'],
    ['POV: you finally found your shade.', 'skit', 'Shade match'],
    ['Do not wash your hair like this.', 'text', 'Wash day'],
    ['Five minutes, full face. Watch.', 'talking', 'Soft glam'],
    ['Your braids are lasting two weeks for this reason.', 'text', 'Braids'],
    ['I tried the viral lip combo so you do not have to.', 'skit', 'Lip combo'],
    ['Skincare in the wrong order? Here is the fix.', 'talking', 'Skincare order'],
  ],
};

const POST_CAPTIONS = {
  tech: ['3 apps that save me an hour a day. Number three is free.', 'How I plan my week in one note. Steal the template.', 'Phone settings you should change today.', 'Free tools every creator should know.', 'Stop using these shortcuts. Do this instead.', 'Automate your inbox in ten minutes.', 'The laptop mistake everyone makes.', 'Build a habit tracker in ten minutes.'],
  beauty: ['Soft glam in five products. Which one would you swap?', 'Skincare mistakes to drop this year.', 'Braids that last a month: my prep list.', 'Foundation for deeper skin tones: swatches.', 'Get ready with me: wedding guest edition.', 'Lip combos under 3000 naira.', 'Nail shapes explained in one minute.', 'Hair wash day routine, no skips.'],
};

// ─── Seeding ────────────────────────────────────────────────────────────────
async function createUser(a) {
  const found = await authAdmin('GET', 'users?per_page=200');
  for (const u of found?.users ?? []) if (u.email?.toLowerCase() === a.email) await authAdmin('DELETE', `users/${u.id}`);
  const created = await authAdmin('POST', 'users', { email: a.email, email_confirm: true, user_metadata: { full_name: a.displayName } });
  return created.id;
}

async function seedProfile(id, a) {
  const existing = a.stage === 'existing';
  const key = a.handle;
  const [bio, niche] = BIO[`${a.plan}_${a.stage}`];
  const h = HISTORY[key];
  await rest('PATCH', 'users', {
    query: `?id=eq.${id}`,
    body: {
      display_name: a.displayName,
      timezone: TZ,
      country: 'NG',
      locale: 'en-NG',
      onboarding_completed: true,
      // New accounts still have the welcome tour ahead of them; existing ones have done it and seen their tips.
      tour_done_at: existing ? daysAgo(h.tourDoneAgo) : null,
      tips_seen: existing ? h.tips : [],
      created_at: existing ? daysAgo(h.joinedAgo) : new Date(NOW).toISOString(),
    },
  });
  await upsert('creator_profiles', [{ user_id: id, slug: a.handle, bio: bio || null, niche: niche || null, niches: a.niches, is_public: true }], 'user_id');
}

async function seedPlan(id, a) {
  if (a.plan !== 'pro') return;
  const [plan] = await rest('GET', 'subscription_plans', { query: '?slug=eq.pro&select=id' });
  const started = a.stage === 'existing' ? 18 : 1;
  await insert('subscriptions', [{
    user_id: id,
    plan_id: plan.id,
    status: 'active',
    processor: 'stripe',
    processor_subscription_id: `sub_local_${a.handle}`,
    currency: 'USD',
    current_period_start: daysAgo(started),
    current_period_end: inDays(30 - started, 12),
    cancel_at_period_end: false,
  }]);
}

async function seedStreak(id, a) {
  const h = HISTORY[a.handle];
  if (!h) return;
  const days = [...new Set(h.checkInDays)].sort((x, y) => x - y); // days ago, ascending = most recent first
  await insert('streak_events', days.map((d) => ({ user_id: id, event_type: 'check_in', event_date: localDate(NOW - d * DAY), created_at: daysAgo(d, 9) })));
  // Longest and current run, worked out the way the database does
  const sorted = [...days].sort((x, y) => y - x); // oldest first
  let best = 0;
  let cur = 0;
  let prev = null;
  for (const d of sorted) {
    cur = prev !== null && prev - d === 1 ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = d;
  }
  const latest = Math.min(...days);
  const current = days.includes(1) || days.includes(0) ? cur : 0;
  await upsert('streak_states', [{ user_id: id, current_streak: current, longest_streak: best, last_qualifying_day: localDate(NOW - latest * DAY), weekly_target: 3 }], 'user_id');
  // Milestones reached: the streak points the database awards at 7, 14, 30, 50, 100
  const reached = [7, 14, 30, 50, 100].filter((m) => m <= best);
  await insert('milestones', reached.map((m, i) => ({ user_id: id, milestone_type: `${m}_day_streak`, achieved_at: daysAgo(Math.max(1, h.joinedAgo - m - i * 3)) })));
  await insert('credits', reached.map((m, i) => ({ user_id: id, type: 'earn', amount: m * 2, source: 'streak_milestone', description: `${m}-day streak milestone`, created_at: daysAgo(Math.max(1, h.joinedAgo - m - i * 3)) })));
}

async function seedXp(id, a) {
  const h = HISTORY[a.handle];
  if (!h) return;
  const rows = [];
  for (let i = 0; i < h.xp.missions; i++) rows.push({ user_id: id, type: 'earn', amount: 40 + ((i * 7) % 5) * 10, source: 'mission_complete', description: 'Finished the day’s mission', created_at: daysAgo(1 + Math.floor((i * h.joinedAgo) / h.xp.missions), 18) });
  for (let i = 0; i < h.xp.quests; i++) rows.push({ user_id: id, type: 'earn', amount: 50 + (i % 3) * 25, source: 'quest_complete', description: 'Finished a quest', created_at: daysAgo(2 + Math.floor((i * h.joinedAgo) / h.xp.quests), 15) });
  await insert('credits', rows);
}

async function seedSavedWork(id, a) {
  if (a.stage !== 'existing') return;
  const niche = a.niches[0] === 'tech' ? 'tech' : 'beauty';
  const drafts = DRAFT_BANK[niche].map(([title, kind, format, platform, body], i) => ({
    user_id: id,
    client_key: `${kind}-${title}`,
    title,
    kind,
    format,
    platform,
    payload: kind === 'script' ? { hook: title, story: body, lesson: '', cta: 'Follow for the next one.' } : { caption: body, tags: ['#creator', `#${niche}`] },
    created_at: daysAgo(2 + i * 3),
    updated_at: daysAgo(1 + i * 2, 20),
  }));
  await insert('drafts', drafts);
  await insert('saved_hooks', HOOKS[niche].map(([line, style, idea], i) => ({ user_id: id, line, style, idea, created_at: daysAgo(1 + i * 4) })));
}

async function seedTikTok(id, a) {
  if (a.stage !== 'existing') return;
  const c = CREATORS[a.handle];
  const videos = videosFor(c);
  await insert('platform_connections', [{
    user_id: id,
    platform: 'tiktok',
    publish_mode: 'assisted',
    platform_user_id: `mock-open-id-${c.key}`,
    // Sealed the way the server seals real tokens, so the server can open and use them against the local stand-in TikTok
    access_token: sealToken(`act.${c.key}.seeded`, `${id}:tiktok:access`, { TOKEN_ENCRYPTION_KEY: KEY }),
    refresh_token: sealToken(`rft.${c.key}.seeded`, `${id}:tiktok:refresh`, { TOKEN_ENCRYPTION_KEY: KEY }),
    token_expires_at: inDays(1, 12),
    refresh_token_expires_at: inDays(364, 12),
    scopes: ['user.info.basic', 'user.info.stats', 'video.list'],
    account_name: c.name,
    avatar_url: `${MOCK_ORIGIN}/cover/avatar-${c.key}.svg`,
    status: 'connected',
    connected_at: daysAgo(HISTORY[a.handle].joinedAgo - 2),
    last_synced_at: new Date(NOW - 3 * 3600_000).toISOString(),
  }]);
  // A daily snapshot of the account for the past 60 days, ending with today's numbers
  const stats = [];
  for (let d = 60; d >= 0; d--) {
    const at = NOW - d * DAY;
    stats.push({
      user_id: id,
      platform: 'tiktok',
      day: localDate(at),
      followers: followersToday(c, at),
      following: 180 + (c.key.length % 90),
      likes: Math.round(videos.reduce((n, v) => n + v.like_count, 0) * (1 - d / 140)),
      videos: videos.filter((v) => v.create_time * 1000 <= at).length,
      recorded_at: new Date(at).toISOString(),
    });
  }
  await insert('account_stats', stats);
  await insert('post_stats', videos.map((v) => ({
    user_id: id,
    platform: 'tiktok',
    platform_post_id: v.id,
    title: v.title,
    posted_at: new Date(v.create_time * 1000).toISOString(),
    cover_url: `${MOCK_ORIGIN}/cover/${v.id}.svg?t=${encodeURIComponent(v.title)}`,
    share_url: `https://www.tiktok.com/@${c.key}/video/${v.id}`,
    duration_seconds: v.duration,
    views: v.view_count,
    likes: v.like_count,
    comments: v.comment_count,
    shares: v.share_count,
    last_synced_at: new Date(NOW - 3 * 3600_000).toISOString(),
  })));
  return videos;
}

async function seedPosts(id, a, videos) {
  if (a.stage !== 'existing' || !videos) return;
  const niche = a.niches[0] === 'tech' ? 'tech' : 'beauty';
  const captions = POST_CAPTIONS[niche];
  const rows = [];
  // Published: the creator's most recent videos, as PostStreak had scheduled them
  videos.slice(0, 8).forEach((v, i) => {
    rows.push({
      user_id: id,
      content: captions[i % captions.length],
      target_platforms: ['tiktok'],
      scheduled_at: new Date(v.create_time * 1000).toISOString(),
      status: 'published',
      published_at: new Date(v.create_time * 1000).toISOString(),
      platform_post_ids: { tiktok: v.id },
      created_at: new Date(v.create_time * 1000 - 2 * DAY).toISOString(),
    });
  });
  // Coming up: the next few days at the creator's usual time
  [[1, 19], [2, 8], [4, 19], [6, 12]].forEach(([d, hour], i) => {
    rows.push({ user_id: id, content: captions[(i + 3) % captions.length], target_platforms: i === 1 ? ['tiktok', 'instagram'] : ['tiktok'], scheduled_at: inDays(d, hour), status: 'scheduled', created_at: daysAgo(1) });
  });
  // Time to post, by hand: TikTok posting is assisted, so it waits for the creator to confirm
  rows.push({ user_id: id, content: captions[1], target_platforms: ['tiktok'], scheduled_at: new Date(NOW - 2 * 3600_000).toISOString(), status: 'pending_confirmation', created_at: daysAgo(2) });
  // One that didn't go out
  rows.push({ user_id: id, content: captions[5], target_platforms: ['instagram'], scheduled_at: daysAgo(5, 19), status: 'failed', error: 'Instagram is not connected', created_at: daysAgo(7) });
  await insert('scheduled_posts', rows);
}

async function seedRepurpose(id, a) {
  if (a.stage !== 'existing') return;
  const rows = [];
  // This week's free Repurpose is already used (so the limit shows); older weeks used it too
  const weekly = a.plan === 'free' ? [0, 8, 15, 22] : [0, 1, 2, 4, 6, 9, 11, 14, 18, 22, 25, 30];
  weekly.forEach((d, i) => rows.push({
    user_id: id,
    source: { kind: 'idea', text: DRAFT_BANK[a.niches[0] === 'tech' ? 'tech' : 'beauty'][i % 5][0] },
    versions: [{ platform: 'tiktok', format: 'video' }, { platform: 'instagram', format: 'carousel' }, { platform: 'youtube', format: 'video' }],
    created_at: daysAgo(d, 10),
  }));
  await insert('repurpose_jobs', rows);
}

async function seedNotifications(id, a) {
  const rows = [];
  const add = (type, title, body, ago, extra = {}) => rows.push({ user_id: id, type, title, body, created_at: daysAgo(ago, 9), ...extra });
  if (a.stage === 'new') {
    add('system', 'Hi, I’m Jarvis', 'Whenever you have an idea, I’ll help you shape it into a post.', 0, { action_text: 'Start a post', metadata: { target: 'create', kind: 'jarvis' } });
    add('system', 'Connect where you post', 'Link TikTok to see your stats here.', 0, { action_text: 'Connect an account', metadata: { target: 'accounts', kind: 'link' } });
    if (a.plan === 'pro') add('system', 'Welcome to Pro', 'Unlimited ideas and repurposing are ready for you.', 0, { action_text: 'See what’s in Pro', metadata: { target: 'jarvis-pro', kind: 'pro' } });
  } else {
    const c = CREATORS[a.handle];
    add('growth', `${(followersToday(c) - followersToday(c, NOW - 7 * DAY)).toLocaleString('en')} new followers this week`, 'On TikTok, since last week.', 0, { action_text: 'See your growth', metadata: { target: 'platform-growth', kind: 'growth' } });
    add('growth', 'One of your posts passed 10K views', `“${videosFor(c).sort((x, y) => y.view_count - x.view_count)[0].title}” is your top post right now.`, 1, { action_text: 'See how it did', metadata: { target: 'post-performance', kind: 'star' } });
    add('quest', 'This week’s challenge is open', 'Post 3 times this week, at your own pace.', 2, { action_text: 'See the challenge', metadata: { target: 'challenge', kind: 'flag' }, read: true });
    add('streak', 'A 7-day streak', 'A week of check-ins. Nice rhythm.', 6, { metadata: { kind: 'star' }, read: true });
    add('system', 'Your TikTok is connected', 'PostStreak reads your numbers once a day.', 20, { metadata: { kind: 'link' }, read: true });
    if (a.plan === 'pro') add('system', 'Welcome to Pro', 'Unlimited ideas and repurposing are ready for you.', 18, { action_text: 'See what’s in Pro', metadata: { target: 'jarvis-pro', kind: 'pro' }, read: true });
  }
  await insert('notifications', rows.map((r) => ({ read: false, ...r })));
}

// ─── Run ────────────────────────────────────────────────────────────────────
console.log(`Seeding the test accounts on ${SB}`);
for (const a of ACCOUNTS) {
  const id = await createUser(a);
  await seedProfile(id, a);
  await seedPlan(id, a);
  await seedStreak(id, a);
  await seedXp(id, a);
  await seedSavedWork(id, a);
  const videos = await seedTikTok(id, a);
  await seedPosts(id, a, videos);
  await seedRepurpose(id, a);
  await seedNotifications(id, a);
  console.log(`  ${a.label.padEnd(16)} ${a.email}`);
}
console.log('Done. Sign in with the emailed code (http://127.0.0.1:54324) or the one-tap test accounts on the sign-in screen.');
