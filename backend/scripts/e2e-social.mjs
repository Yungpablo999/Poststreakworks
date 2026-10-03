// End-to-end check of connecting social platforms, on your machine: the real API, the real
// database with its row-level security, and the stand-in platforms (TikTok, Instagram, Threads,
// Facebook, YouTube) that `npm run local` starts. New throwaway creators sign in with real emailed
// codes, connect each platform the way the app does (authorize → the platform's sign-in page →
// callback), and the script then looks in the database to check what was stored, sealed and wiped.
//
//   1. npm run local              (from the repository root; wait for "PostStreak is running")
//   2. cd backend && node scripts/e2e-social.mjs
//
// It only runs against a database on this machine. The creators it makes are deleted at the end.
// Exits 1 if any check fails.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(here, '../apps/web/.env.local');
if (!existsSync(envFile)) throw new Error('No backend/apps/web/.env.local: run `npm run local` first.');
const env = Object.fromEntries(
  readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);

const API = process.env.API ?? 'http://localhost:3000';
const SB = process.env.SB ?? env.NEXT_PUBLIC_SUPABASE_URL;
const MAIL = process.env.MAIL ?? 'http://127.0.0.1:54324';
const MOCKS = process.env.MOCKS ?? 'http://127.0.0.1:4010';
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB || !ANON || !SERVICE) throw new Error('The Supabase settings are missing from .env.local.');
if (!/^https?:\/\/(localhost|127\.0\.0\.1)[:/]/.test(SB)) throw new Error(`Refusing to run against ${SB}: this only runs against the database on this machine.`);

const PROVIDERS = ['tiktok', 'instagram', 'threads', 'facebook', 'youtube'];
const NAME = { tiktok: 'TikTok', instagram: 'Instagram', threads: 'Threads', facebook: 'Facebook', youtube: 'YouTube' };
const SEALED_REFRESH = { tiktok: true, instagram: false, threads: false, facebook: false, youtube: true };

let passed = 0;
const failures = [];
function check(name, ok, detail) {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL  ${name}${detail !== undefined ? `  -> ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const section = (title) => console.log(`\n== ${title}`);

async function json(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

// ─── Creators ────────────────────────────────────────────────────────────────

async function newestCode(email, notBefore) {
  for (let i = 0; i < 40; i++) {
    const list = await json(await fetch(`${MAIL}/api/v1/messages?limit=50`));
    const mine = (list?.messages ?? [])
      .filter((m) => (m.To ?? []).some((t) => (t.Address ?? '').toLowerCase() === email.toLowerCase()))
      .filter((m) => new Date(m.Created).getTime() >= notBefore)
      .sort((a, b) => new Date(b.Created) - new Date(a.Created));
    if (mine[0]) {
      const full = await json(await fetch(`${MAIL}/api/v1/message/${mine[0].ID}`));
      const m = `${full.Text ?? ''} ${full.HTML ?? ''}`.match(/\b(\d{6})\b/);
      if (m) return m[1];
    }
    await sleep(500);
  }
  throw new Error(`no code arrived for ${email}`);
}

async function signIn(email) {
  const started = Date.now() - 2000;
  const otp = await fetch(`${SB}/auth/v1/otp`, { method: 'POST', headers: { apikey: ANON, 'content-type': 'application/json' }, body: JSON.stringify({ email, create_user: true }) });
  if (!otp.ok) throw new Error(`otp ${otp.status} ${await otp.text()}`);
  const token = await newestCode(email, started);
  const res = await fetch(`${SB}/auth/v1/verify`, { method: 'POST', headers: { apikey: ANON, 'content-type': 'application/json' }, body: JSON.stringify({ email, token, type: 'email' }) });
  const body = await json(res);
  if (!res.ok || !body?.access_token) throw new Error(`verify ${res.status} ${JSON.stringify(body)}`);
  return { token: body.access_token, userId: body.user.id };
}

const asService = async (method, pathAndQuery, body) => {
  const res = await fetch(`${SB}/rest/v1/${pathAndQuery}`, {
    method,
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, 'content-type': 'application/json', prefer: 'return=representation' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await json(res) };
};

const api = (token) => async (method, route, body) => {
  const res = await fetch(`${API}${route}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await json(res) };
};

async function makePro(userId) {
  const plan = await asService('GET', 'subscription_plans?slug=eq.pro&select=id');
  const now = Date.now();
  const made = await asService('POST', 'subscriptions', {
    user_id: userId,
    plan_id: plan.body[0].id,
    status: 'active',
    processor: 'stripe',
    processor_subscription_id: `sub_e2e_${userId.slice(0, 8)}`,
    currency: 'USD',
    current_period_start: new Date(now - 86_400_000).toISOString(),
    current_period_end: new Date(now + 29 * 86_400_000).toISOString(),
    cancel_at_period_end: false,
  });
  if (made.status >= 300) throw new Error(`could not make the pro creator: ${JSON.stringify(made.body)}`);
}

// ─── Going through a platform's sign-in, the way the app does ────────────────

/** The address the stand-in's sign-in page sends the person back to when they tap the account whose label contains `who`. */
async function approvedReturn(authorizeUrl, who) {
  const html = await (await fetch(authorizeUrl)).text();
  const links = [...html.matchAll(/<a class="who" href="([^"]*)"><b>([^<]*)<\/b>/g)].map((m) => ({ href: m[1].replace(/&amp;/g, '&'), label: m[2] }));
  const link = links.find((l) => l.label.includes(who));
  return link ? new URL(link.href) : null;
}

/** authorize → sign-in page → callback. Returns every step so a check can look at any of them. */
async function connect(A, provider, who, client = 'web') {
  const authorize = await A('POST', `/api/v1/platforms/${provider}/authorize`, { client });
  if (authorize.status !== 200) return { authorize };
  const back = await approvedReturn(authorize.body.url, who);
  const callback = await A('POST', `/api/v1/platforms/${provider}/callback`, { code: back?.searchParams.get('code') ?? '', state: back?.searchParams.get('state') ?? '' });
  return { authorize, back, callback };
}

const stand = (provider, route) => fetch(`${MOCKS}/${provider}${route}`);

// ─── Start ───────────────────────────────────────────────────────────────────

const stamp = Date.now();
section('the stack');
{
  const health = await fetch(`${MOCKS}/health`).then((r) => r.json()).catch(() => null);
  check('the stand-in platforms are running', PROVIDERS.every((p) => health?.platforms?.includes(p)), health);
  const api0 = await fetch(`${API}/api/v1/dev/login`).catch(() => null);
  check('the API is running', !!api0 && api0.status < 500, api0?.status);
}

section('three new creators (real emailed codes)');
const free = await signIn(`social-free+${stamp}@example.com`);
const pro = await signIn(`social-pro+${stamp}@example.com`);
const other = await signIn(`social-other+${stamp}@example.com`);
await makePro(pro.userId);
const F = api(free.token);
const P = api(pro.token);
const O = api(other.token);
const created = [free.userId, pro.userId, other.userId];
check('a free, a Pro and a third creator', !!free.token && !!pro.token && !!other.token);
{
  const boot = await P('GET', '/api/v1/me/bootstrap');
  check('the Pro creator really is Pro', boot.body?.profile?.tier === 'pro', boot.body?.profile?.tier);
  check('and starts with nothing connected', boot.body?.accounts?.length === 0, boot.body?.accounts);
}

section('what this server can connect');
{
  const boot = await F('GET', '/api/v1/me/bootstrap');
  const caps = boot.body?.capabilities?.platforms ?? {};
  for (const p of PROVIDERS) check(`${NAME[p]} is offered`, caps[p] === true, caps);
  check('TikTok is also offered under the old name the main branch reads', boot.body?.capabilities?.tiktok === true, boot.body?.capabilities);
}

section('addresses and callers');
{
  const none = await fetch(`${API}/api/v1/platforms/instagram/authorize`, { method: 'POST' });
  check('authorize without a token is 401', none.status === 401, none.status);
  const unknown = await F('POST', '/api/v1/platforms/myspace/authorize', {});
  check('an unknown platform is 404', unknown.status === 404, unknown);
  const legacy = await F('POST', '/api/v1/platforms/instagram/connect', { authCodeOrHandle: 'my_handle' });
  check('the old "type your handle" connect no longer makes a connection', legacy.status >= 400, legacy);
}

// ─── Each platform, from sign-in to disconnect ───────────────────────────────

for (const provider of PROVIDERS) {
  const name = NAME[provider];
  section(`${name}: connect, read, break, fix, disconnect (Pro creator, as the seeded Chidi on the stand-in)`);

  const mobile = await P('POST', `/api/v1/platforms/${provider}/authorize`, { client: 'mobile' });
  check(`${name}: a phone sign-in gets its own state ("m.")`, mobile.status === 200 && new URL(mobile.body.url).searchParams.get('state')?.startsWith('m.'), mobile);

  const first = await connect(P, provider, 'Chidi');
  check(`${name}: the sign-in address is the (stand-in) platform's, with a web state`, first.authorize.status === 200 && first.authorize.body.url.startsWith(`${MOCKS}/${provider}/`) && first.back?.searchParams.get('state')?.startsWith('w.'), first.authorize);
  check(`${name}: the platform sends the person back to our callback address`, first.back?.pathname === `/auth/${provider}/callback`, first.back?.href);
  check(`${name}: connecting works`, first.callback.status === 200 && first.callback.body?.connected === true, first.callback);
  check(`${name}: it names the account, and it is connected`, first.callback.body?.account?.name === 'Chidi Nwosu' && first.callback.body?.account?.status === 'connected', first.callback.body);

  const replay = await P('POST', `/api/v1/platforms/${provider}/callback`, { code: first.back.searchParams.get('code'), state: first.back.searchParams.get('state') });
  check(`${name}: the same sign-in can't be used twice (400)`, replay.status === 400, replay);

  // Someone else can't finish a connection that was started for this creator
  const started = await P('POST', `/api/v1/platforms/${provider}/authorize`, { client: 'web' });
  const stolen = await approvedReturn(started.body.url, 'Chidi');
  const forged = await O('POST', `/api/v1/platforms/${provider}/callback`, { code: stolen.searchParams.get('code'), state: stolen.searchParams.get('state') });
  check(`${name}: another creator can't finish this creator's sign-in (400)`, forged.status === 400, forged);
  check(`${name}: and gets no connection from it`, (await asService('GET', `platform_connections?user_id=eq.${other.userId}&platform=eq.${provider}&disconnected_at=is.null`)).body.length === 0);

  // What is stored
  const row = (await asService('GET', `platform_connections?user_id=eq.${pro.userId}&platform=eq.${provider}&select=*`)).body?.[0];
  check(`${name}: the access token is stored sealed, never readable`, typeof row?.access_token === 'string' && row.access_token.startsWith('v1.'), row?.access_token?.slice(0, 12));
  check(`${name}: ${SEALED_REFRESH[provider] ? 'the refresh token is sealed too' : 'there is no refresh token (the platform renews the access token itself)'}`, SEALED_REFRESH[provider] ? row?.refresh_token?.startsWith('v1.') : row?.refresh_token === null, row?.refresh_token?.slice(0, 12));
  check(`${name}: scopes, name and status are recorded`, row?.scopes?.length > 0 && row?.account_name === 'Chidi Nwosu' && row?.status === 'connected' && !!row?.platform_user_id, { scopes: row?.scopes, name: row?.account_name, status: row?.status });
  const posts = (await asService('GET', `post_stats?user_id=eq.${pro.userId}&platform=eq.${provider}&select=platform_post_id,views,likes,title`)).body;
  check(`${name}: the creator's posts were read, with their numbers`, posts.length >= 2 && posts.every((x) => Number(x.views) > 0 && x.title), { count: posts.length });
  const snaps = (await asService('GET', `account_stats?user_id=eq.${pro.userId}&platform=eq.${provider}&select=day,followers`)).body;
  check(`${name}: today's follower count was recorded`, snaps.length === 1 && Number(snaps[0].followers) > 0, snaps);

  // What the creator can see — and what they can't
  const accounts = await P('GET', '/api/v1/platforms/accounts');
  const mine = accounts.body?.find((a) => a.platform === provider);
  check(`${name}: it is listed with its followers`, mine?.followers > 0 && mine?.status === 'connected', accounts.body);
  const boot = await P('GET', '/api/v1/me/bootstrap');
  check(`${name}: and in the app's bootstrap`, boot.body?.accounts?.some((a) => a.platform === provider), boot.body?.accounts);
  const peek = await fetch(`${SB}/rest/v1/platform_connections?select=access_token`, { headers: { apikey: ANON, authorization: `Bearer ${pro.token}` } });
  check(`${name}: the creator's own sign-in can't read the token column (denied)`, peek.status === 401 || peek.status === 403, peek.status);
  const fake = await fetch(`${SB}/rest/v1/platform_connections`, {
    method: 'POST',
    headers: { apikey: ANON, authorization: `Bearer ${other.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ user_id: other.userId, platform: provider, platform_user_id: 'claimed', status: 'connected' }),
  });
  check(`${name}: nobody can write a connection straight into the database (denied)`, fake.status === 401 || fake.status === 403, fake.status);

  // The same platform account can't be on two PostStreak accounts
  const dup = await connect(O, provider, 'Chidi');
  check(`${name}: the same ${name} account can't be linked to a second creator (409)`, dup.callback?.status === 409, dup.callback);

  // Refreshing
  const sync = await P('POST', `/api/v1/platforms/${provider}/sync`);
  check(`${name}: a sync now works`, sync.status === 200 && sync.body?.status === 'synced' && sync.body?.posts >= 2, sync);

  // The platform turns the connection down
  await stand(provider, '/_control/expire?account=chidi_pro_new');
  const broken = await P('POST', `/api/v1/platforms/${provider}/sync`);
  check(`${name}: when the platform refuses the connection, the sync says reconnect`, broken.body?.status === 'needs_reauth', broken);
  const afterBroken = await P('GET', '/api/v1/platforms/accounts');
  check(`${name}: the account shows it needs reconnecting`, afterBroken.body?.find((a) => a.platform === provider)?.status === 'needs_reauth', afterBroken.body);
  const notes = await P('GET', '/api/v1/notifications');
  check(`${name}: the bell tells the creator to reconnect`, notes.body?.items?.some((n) => n.title === `Reconnect your ${name}`), notes.body?.items?.map((n) => n.title));
  const again = await connect(P, provider, 'Chidi');
  check(`${name}: connecting again fixes it`, again.callback.status === 200 && again.callback.body?.account?.status === 'connected', again.callback);
  await stand(provider, '/_control/reset');
  const fixed = await P('GET', '/api/v1/platforms/accounts');
  check(`${name}: and it is healthy again`, fixed.body?.find((a) => a.platform === provider)?.status === 'connected', fixed.body);

  // Disconnect
  const bye = await P('POST', `/api/v1/platforms/${provider}/disconnect`);
  check(`${name}: disconnecting works`, bye.status === 200 && bye.body?.disconnected === true, bye);
  const after = await P('GET', '/api/v1/platforms/accounts');
  check(`${name}: it is gone from the list`, !after.body?.some((a) => a.platform === provider), after.body);
  const gone = (await asService('GET', `platform_connections?user_id=eq.${pro.userId}&platform=eq.${provider}&select=access_token,refresh_token,account_name,platform_user_id,disconnected_at`)).body?.[0];
  check(`${name}: the tokens, the name and the account id are wiped`, gone?.access_token === null && gone?.refresh_token === null && gone?.account_name === null && gone?.platform_user_id === null && !!gone?.disconnected_at, gone);
  check(`${name}: the numbers pulled from ${name} are deleted`, (await asService('GET', `post_stats?user_id=eq.${pro.userId}&platform=eq.${provider}`)).body.length === 0 && (await asService('GET', `account_stats?user_id=eq.${pro.userId}&platform=eq.${provider}`)).body.length === 0);
  const free1 = await connect(O, provider, 'Chidi');
  check(`${name}: once disconnected, the account can be linked elsewhere`, free1.callback?.status === 200, free1.callback);
  await O('POST', `/api/v1/platforms/${provider}/disconnect`);
}

// ─── The free plan's limit ───────────────────────────────────────────────────

section('free plan: two platforms');
{
  const one = await connect(F, 'instagram', 'Ada');
  const two = await connect(F, 'threads', 'Ada');
  check('a free creator connects a first and a second platform', one.callback?.status === 200 && two.callback?.status === 200, [one.callback, two.callback]);
  const three = await F('POST', '/api/v1/platforms/youtube/authorize', { client: 'web' });
  check('a third is refused with the upgrade prompt (403)', three.status === 403 && three.body?.code === 'UPGRADE_REQUIRED', three);
  check('and the prompt says what the limit is', /2 platforms/.test(three.body?.message ?? ''), three.body?.message);
  const redo = await F('POST', '/api/v1/platforms/instagram/authorize', { client: 'web' });
  check('reconnecting one they already have is still fine', redo.status === 200, redo);
  const proThree = await Promise.all(['instagram', 'threads', 'youtube'].map((p) => connect(P, p, 'Chidi')));
  check('a Pro creator connects as many as they like', proThree.every((x) => x.callback?.status === 200), proThree.map((x) => x.callback?.status));
}

// ─── People who can't finish ─────────────────────────────────────────────────

section('connecting that cannot finish');
{
  const noPage = await connect(O, 'facebook', 'no Facebook Page');
  check('Facebook: someone who manages no Page is told so (400)', noPage.callback?.status === 400 && /Page/.test(noPage.callback.body?.message ?? ''), noPage.callback);
  check('Facebook: and nothing is stored', (await asService('GET', `platform_connections?user_id=eq.${other.userId}&platform=eq.facebook&disconnected_at=is.null&select=id`)).body.length === 0);
  const noChannel = await connect(O, 'youtube', 'no YouTube channel');
  check('YouTube: a Google account with no channel is told so (400)', noChannel.callback?.status === 400 && /YouTube channel/.test(noChannel.callback.body?.message ?? ''), noChannel.callback);
  check('YouTube: and nothing is stored', (await asService('GET', `platform_connections?user_id=eq.${other.userId}&platform=eq.youtube&disconnected_at=is.null&select=id`)).body.length === 0);
  const bogus = await O('POST', '/api/v1/platforms/instagram/callback', { code: 'garbage', state: 'w.' + 'x'.repeat(43) });
  check('a made-up sign-in is refused (400)', bogus.status === 400, bogus);
}

// ─── The nightly job ─────────────────────────────────────────────────────────

section('the nightly job');
{
  const cron = await fetch(`${API}/api/cron/sync-platforms`, { headers: { authorization: `Bearer ${env.CRON_SECRET}` } });
  const body = await json(cron);
  check('it runs with the secret and reports every platform', cron.status === 200 && PROVIDERS.every((p) => p in (body ?? {})), body);
  const denied = await fetch(`${API}/api/cron/sync-platforms`);
  check('and refuses anyone without it (401)', denied.status === 401, denied.status);
}

// ─── Clean up ────────────────────────────────────────────────────────────────

for (const id of created) {
  await fetch(`${SB}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}` } });
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('\nFailed:\n  - ' + failures.join('\n  - '));
  process.exit(1);
}
