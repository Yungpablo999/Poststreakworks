// What the end-to-end scripts (e2e-social.mjs, e2e-posts.mjs) have in common: the settings of the
// stack `npm run local` starts, new throwaway creators who sign in with real emailed codes, calls to
// the API as a creator or to the database as the server, and a tally of the checks.
//
// Everything here refuses to run against anything but the database on this machine.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(here, '../apps/web/.env.local');
if (!existsSync(envFile)) throw new Error('No backend/apps/web/.env.local: run `npm run local` first.');
export const env = Object.fromEntries(
  readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);

export const API = process.env.API ?? 'http://localhost:3000';
export const SB = process.env.SB ?? env.NEXT_PUBLIC_SUPABASE_URL;
export const MAIL = process.env.MAIL ?? 'http://127.0.0.1:54324';
export const MOCKS = process.env.MOCKS ?? 'http://127.0.0.1:4010';
export const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB || !ANON || !SERVICE) throw new Error('The Supabase settings are missing from .env.local.');
if (!/^https?:\/\/(localhost|127\.0\.0\.1)[:/]/.test(SB)) throw new Error(`Refusing to run against ${SB}: this only runs against the database on this machine.`);

// ─── Checks ──────────────────────────────────────────────────────────────────

const results = { passed: 0, failures: [] };

export function check(name, ok, detail) {
  if (ok) {
    results.passed++;
    console.log(`  PASS  ${name}`);
  } else {
    results.failures.push(name);
    console.log(`  FAIL  ${name}${detail !== undefined ? `  -> ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
  }
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const section = (title) => console.log(`\n== ${title}`);

/** Prints the tally and ends the script: exit code 1 if any check failed. */
export function finish() {
  console.log(`\n${results.passed} passed, ${results.failures.length} failed`);
  if (results.failures.length) {
    console.log('\nFailed:\n  - ' + results.failures.join('\n  - '));
    process.exit(1);
  }
}

export async function json(res) {
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

/** A new creator, signed in with the code that arrives in the local inbox. */
export async function signIn(email) {
  const started = Date.now() - 2000;
  const otp = await fetch(`${SB}/auth/v1/otp`, { method: 'POST', headers: { apikey: ANON, 'content-type': 'application/json' }, body: JSON.stringify({ email, create_user: true }) });
  if (!otp.ok) throw new Error(`otp ${otp.status} ${await otp.text()}`);
  const token = await newestCode(email, started);
  const res = await fetch(`${SB}/auth/v1/verify`, { method: 'POST', headers: { apikey: ANON, 'content-type': 'application/json' }, body: JSON.stringify({ email, token, type: 'email' }) });
  const body = await json(res);
  if (!res.ok || !body?.access_token) throw new Error(`verify ${res.status} ${JSON.stringify(body)}`);
  return { token: body.access_token, userId: body.user.id };
}

/** The database as the server sees it (the service role). */
export const asService = async (method, pathAndQuery, body) => {
  const res = await fetch(`${SB}/rest/v1/${pathAndQuery}`, {
    method,
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, 'content-type': 'application/json', prefer: 'return=representation' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await json(res) };
};

/** The database as the creator sees it, going straight to PostgREST with their own token (what anyone holding the public key can do). */
export const asCreatorDirect = (token) => async (method, pathAndQuery, body) => {
  const res = await fetch(`${SB}/rest/v1/${pathAndQuery}`, {
    method,
    headers: { apikey: ANON, authorization: `Bearer ${token}`, 'content-type': 'application/json', prefer: 'return=representation' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await json(res) };
};

/** Calls the PostStreak API as a creator. */
export const api = (token) => async (method, route, body) => {
  const res = await fetch(`${API}${route}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await json(res) };
};

export async function makePro(userId) {
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

/** Deletes the throwaway creators (and, by cascade, everything they made). */
export async function deleteCreators(ids) {
  for (const id of ids) {
    await fetch(`${SB}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}` } });
  }
}
