// End-to-end check of the whole backend on your machine: real Supabase Auth (6-digit email
// codes), the real Next.js API, real Postgres with row-level security. Two creators sign in,
// so the isolation checks are real. 55 checks; exits 1 if any fail.
//
// What you need running first (see STAGING_RUNBOOK.md, "Check it all on your machine"):
//   1. cd backend && npx supabase start -x studio,imgproxy,vector,logflare,edge-runtime,storage-api,realtime,postgres-meta,supavisor
//   2. the API:   cd backend/apps/web && cp ../../.env.example .env.local
//                 (fill in the Supabase URL and keys from `npx supabase status -o env`, plus a
//                 TOKEN_ENCRYPTION_KEY and CRON_SECRET; the TikTok values can be made up locally)
//                 node_modules/.bin/next dev -p 3000
//   3. then:      ANON=<anon key> SERVICE=<service_role key> node scripts/e2e-local.mjs
//
// It reads the sign-in codes from the local mail catcher (http://127.0.0.1:54324), so it only
// works against the local stack, never against a hosted project.
//
// Usage: ANON=... SERVICE=... node scripts/e2e-local.mjs   (API, SB, MAIL override the addresses)
const API = process.env.API ?? 'http://localhost:3000';
const SB = process.env.SB ?? 'http://127.0.0.1:54321';
const MAIL = process.env.MAIL ?? 'http://127.0.0.1:54324';
const ANON = process.env.ANON;
const SERVICE = process.env.SERVICE;
if (!ANON || !SERVICE) throw new Error('set ANON and SERVICE');

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

async function json(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

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
  const otp = await fetch(`${SB}/auth/v1/otp`, {
    method: 'POST',
    headers: { apikey: ANON, 'content-type': 'application/json' },
    body: JSON.stringify({ email, create_user: true }),
  });
  if (!otp.ok) throw new Error(`otp ${otp.status} ${await otp.text()}`);
  const token = await newestCode(email, started);
  const res = await fetch(`${SB}/auth/v1/verify`, {
    method: 'POST',
    headers: { apikey: ANON, 'content-type': 'application/json' },
    body: JSON.stringify({ email, token, type: 'email' }),
  });
  const body = await json(res);
  if (!res.ok || !body?.access_token) throw new Error(`verify ${res.status} ${JSON.stringify(body)}`);
  return { token: body.access_token, userId: body.user.id };
}

const api = (token) => async (method, path, body) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await json(res) };
};

const rest = (token) => async (method, path, body) => {
  const res = await fetch(`${SB}/rest/v1/${path}`, {
    method,
    headers: { apikey: ANON, authorization: `Bearer ${token}`, 'content-type': 'application/json', prefer: 'return=representation' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await json(res) };
};

const stamp = Date.now();
const emailA = `alice+${stamp}@example.com`;
const emailB = `bob+${stamp}@example.com`;

console.log('\n== sign in (real email codes)');
const a = await signIn(emailA);
const b = await signIn(emailB);
check('creator A signed in with an emailed code', !!a.token);
check('creator B signed in with an emailed code', !!b.token);
const A = api(a.token);
const B = api(b.token);

console.log('\n== without a token');
{
  const res = await fetch(`${API}/api/v1/me/bootstrap`);
  check('bootstrap without a token is 401', res.status === 401, res.status);
  const bad = await fetch(`${API}/api/v1/me/bootstrap`, { headers: { authorization: 'Bearer not-a-token' } });
  check('bootstrap with a garbage token is 401', bad.status === 401, bad.status);
}

console.log('\n== a brand-new account');
let boot = await A('GET', '/api/v1/me/bootstrap');
check('bootstrap works', boot.status === 200, boot);
check('starts as a free account', boot.body?.profile?.tier === 'free', boot.body?.profile);
check('no name, topics, drafts or hooks yet', boot.body?.profile?.name === '' && boot.body?.profile?.niches?.length === 0 && boot.body?.drafts?.length === 0 && boot.body?.savedHooks?.length === 0, boot.body);
check('no check-ins; tour not done', boot.body?.checkIn?.currentDays === 0 && boot.body?.tour?.done === false, boot.body?.checkIn);
check('a full free repurpose allowance', boot.body?.repurpose?.usedThisWeek === 0 && boot.body?.repurpose?.weeklyLimit === 1, boot.body?.repurpose);

console.log('\n== sign-up details');
{
  const res = await A('PUT', '/api/v1/user/onboarding', { displayName: 'Alice A', niches: ['lifestyle', 'tech'], timezone: 'Africa/Lagos' });
  check('onboarding saved', res.status === 200, res);
  boot = await A('GET', '/api/v1/me/bootstrap');
  check('name, topics and time zone come back', boot.body.profile.name === 'Alice A' && boot.body.profile.niches.join() === 'lifestyle,tech' && boot.body.profile.timezone === 'Africa/Lagos', boot.body.profile);
  const handle = `alice_${stamp}`.slice(0, 30);
  const h1 = await A('PUT', '/api/v1/user/onboarding', { handle });
  check('a handle can be set', h1.status === 200, h1);
  const h2 = await B('PUT', '/api/v1/user/onboarding', { handle });
  check('the same handle is refused for someone else (409)', h2.status === 409, h2);
  const bad = await A('PUT', '/api/v1/user/onboarding', { timezone: 'Mars/Phobos' });
  check('a made-up time zone is refused (400)', bad.status === 400, bad);
}

console.log('\n== check-ins');
{
  const first = await A('POST', '/api/v1/check-ins');
  check('first check-in counts', first.status === 200 && first.body?.newlyCheckedIn === true && first.body?.summary?.currentDays === 1, first.body);
  const second = await A('POST', '/api/v1/check-ins');
  check('a second the same day is a normal no-op', second.status === 200 && second.body?.newlyCheckedIn === false && second.body?.summary?.currentDays === 1, second.body);
  const sum = await A('GET', '/api/v1/check-ins');
  check('summary says checked in today', sum.body?.checkedInToday === true && sum.body?.week?.length === 7, sum.body);
  const d = new Date();
  const month = await A('GET', `/api/v1/check-ins/month?year=${d.getFullYear()}&month=${d.getMonth()}`);
  check('the month lists today', month.status === 200 && month.body?.days?.length >= 1, month.body);
}

console.log('\n== drafts');
{
  const id = 'jarvis-My morning reset';
  const put = await A('PUT', `/api/v1/drafts/${encodeURIComponent(id)}`, { title: 'My morning reset', kind: 'post', format: '30-second Reel', platform: 'tiktok' });
  check('draft saved', put.status === 200, put);
  const put2 = await A('PUT', `/api/v1/drafts/${encodeURIComponent(id)}`, { title: 'My morning reset (v2)', kind: 'post', format: '30-second Reel' });
  check('saving again edits, not duplicates', put2.status === 200, put2);
  let list = await A('GET', '/api/v1/drafts');
  check('one draft, edited', list.body?.length === 1 && list.body[0].title === 'My morning reset (v2)' && list.body[0].id === id, list.body);
  check('creator B cannot see it', (await B('GET', '/api/v1/drafts')).body?.length === 0);
  const del = await B('DELETE', `/api/v1/drafts/${encodeURIComponent(id)}`);
  list = await A('GET', '/api/v1/drafts');
  check("creator B can't delete A's draft", list.body?.length === 1, { del, list: list.body });
  const bad = await A('PUT', '/api/v1/drafts/x', { title: '', kind: 'post', format: 'x' });
  check('an empty title is refused (400)', bad.status === 400, bad.status);
  await A('DELETE', `/api/v1/drafts/${encodeURIComponent(id)}`);
  list = await A('GET', '/api/v1/drafts');
  check('draft deleted', list.body?.length === 0, list.body);
}

console.log('\n== saved hooks');
{
  const body = { line: 'Nobody tells you this about starting.', style: 'talking', idea: 'Starting out' };
  const on = await A('POST', '/api/v1/hooks', body);
  check('hook saved', on.status === 200 && on.body?.saved === true, on.body);
  check('shows in the list', (await A('GET', '/api/v1/hooks')).body?.length === 1);
  check("B doesn't see it", (await B('GET', '/api/v1/hooks')).body?.length === 0);
  const off = await A('POST', '/api/v1/hooks', body);
  check('toggling again removes it', off.body?.saved === false, off.body);
}

console.log('\n== repurpose allowance (free: 1 a week)');
{
  const one = await A('POST', '/api/v1/repurpose/spend');
  check('first use allowed', one.status === 200 && one.body?.allowed === true && one.body?.usedThisWeek === 1, one.body);
  const two = await A('POST', '/api/v1/repurpose/spend');
  check('second use is a normal "not allowed" with the Pro prompt flag', two.status === 200 && two.body?.allowed === false && two.body?.upgradeRequired === true, two.body);
  const other = await B('POST', '/api/v1/repurpose/spend');
  check("B's count is their own", other.body?.allowed === true && other.body?.usedThisWeek === 1, other.body);
}

console.log('\n== tour and tips');
{
  await A('POST', '/api/v1/user/tips', { key: 'create' });
  await A('POST', '/api/v1/user/tips', { key: 'hook-studio' });
  await A('POST', '/api/v1/user/tour');
  boot = await A('GET', '/api/v1/me/bootstrap');
  check('tips and tour are remembered', boot.body.tipsSeen.includes('create') && boot.body.tipsSeen.includes('hook-studio') && boot.body.tour.done === true, boot.body.tipsSeen);
  const bad = await A('POST', '/api/v1/user/tips', { key: 'Not A Key!' });
  check('a malformed tip key is refused (400)', bad.status === 400, bad.status);
}

console.log('\n== Ask Jarvis');
{
  const res = await A('POST', '/api/v1/jarvis/chat', { message: 'give me post ideas about my morning routine' });
  check('Jarvis answers (a real AI reply or his gentle fallback)', res.status === 200 && typeof res.body?.text === 'string' && res.body.text.length > 0, res);
  const empty = await A('POST', '/api/v1/jarvis/chat', { message: '   ' });
  check('an empty message is refused (400)', empty.status === 400, empty.status);
}

console.log('\n== TikTok');
{
  const web = await A('POST', '/api/v1/platforms/tiktok/authorize', { client: 'web' });
  check('authorize gives TikTok sign-in address (or says it is not set up)', web.status === 200 || web.status === 503, web);
  if (web.status === 200) {
    const url = new URL(web.body.url);
    check('it points at TikTok', url.hostname === 'www.tiktok.com' && url.pathname.startsWith('/v2/auth/authorize'), web.body.url);
    check('with exactly the three scopes', url.searchParams.get('scope') === 'user.info.basic,user.info.stats,video.list', url.searchParams.get('scope'));
    check('and a web-tagged one-time state', (url.searchParams.get('state') ?? '').startsWith('w.'), url.searchParams.get('state'));
    check('and our redirect address', (url.searchParams.get('redirect_uri') ?? '').endsWith('/auth/tiktok/callback'), url.searchParams.get('redirect_uri'));
    const mobile = await A('POST', '/api/v1/platforms/tiktok/authorize', { client: 'mobile' });
    check('a phone-tagged state starts "m."', new URL(mobile.body.url).searchParams.get('state')?.startsWith('m.'), mobile.body);
    const forged = await B('POST', '/api/v1/platforms/tiktok/callback', { code: 'abc', state: url.searchParams.get('state') });
    check("someone else can't use A's state (400)", forged.status === 400, forged);
    const unknown = await A('POST', '/api/v1/platforms/tiktok/callback', { code: 'abc', state: 'w.' + 'x'.repeat(40) });
    check('an unknown state is refused (400)', unknown.status === 400, unknown);
  }
  const accounts = await A('GET', '/api/v1/platforms/accounts');
  check('no accounts connected yet', accounts.status === 200 && accounts.body?.length === 0, accounts.body);
  const tokenRead = await rest(a.token)('GET', 'platform_connections?select=access_token');
  check('the token column is unreadable even for the owner', tokenRead.status >= 400, tokenRead);
}

console.log('\n== row-level security with real tokens (talking to the database directly)');
{
  await A('PUT', '/api/v1/drafts/a-secret', { title: 'A only', kind: 'post', format: 'x' });
  const asB = await rest(b.token)('GET', 'drafts?select=title');
  check("B reading drafts through the database sees none of A's", asB.status === 200 && asB.body.every((r) => r.title !== 'A only'), asB.body);
  const denied = (r) => (r.status === 403 || r.status === 401) && r.body?.code === '42501';
  const today = new Date().toISOString().slice(0, 10);
  const forgeCredit = await rest(b.token)('POST', 'credits', { user_id: b.userId, type: 'earn', amount: 1000000, source: 'forged' });
  check('B cannot give themselves XP (permission denied)', denied(forgeCredit), forgeCredit);
  const plan = await rest(SERVICE)('GET', 'plans?select=id&limit=1');
  const forgeSub = await rest(b.token)('POST', 'subscriptions', { user_id: b.userId, plan_id: plan.body?.[0]?.id, status: 'active', processor: 'stripe', current_period_end: '2099-01-01T00:00:00Z' });
  check('B cannot give themselves Pro (permission denied)', denied(forgeSub), forgeSub);
  const forgeStreak = await rest(b.token)('POST', 'streak_events', { user_id: b.userId, event_type: 'check_in', event_date: today });
  check('B cannot write a streak event (permission denied)', denied(forgeStreak), forgeStreak);
  const role = await rest(b.token)('PATCH', `users?id=eq.${b.userId}`, { role: 'admin' });
  check('B cannot make themselves an admin', denied(role), role);
  const others = await rest(b.token)('GET', `users?select=id,email&id=neq.${b.userId}`);
  check("B cannot read other creators' accounts", others.status === 200 && others.body.length === 0, others.body);
  const analytics = await rest(b.token)('POST', 'analytics_events', { user_id: b.userId, event_name: 'forged' });
  check('B cannot write analytics events directly (permission denied)', denied(analytics), analytics);
}

console.log('\n== CORS');
{
  const pre = await fetch(`${API}/api/v1/me/bootstrap`, {
    method: 'OPTIONS',
    headers: { origin: 'http://localhost:8081', 'access-control-request-method': 'GET', 'access-control-request-headers': 'authorization' },
  });
  check('a preflight from the app is answered', pre.status === 204 && !!pre.headers.get('access-control-allow-origin'), pre.status);
  check('and never allows credentials', pre.headers.get('access-control-allow-credentials') === null);
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('Failed:\n - ' + failures.join('\n - '));
  process.exit(1);
}

