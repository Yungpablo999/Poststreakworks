#!/usr/bin/env node
// npm run local — the whole PostStreak stack on this computer, one command.
//
//   database + sign-in  → a Supabase stack in Docker (migrations applied)
//   the four test users → free/Pro × new/existing, real rows in that database
//   stand-in providers  → TikTok, Instagram, Threads, Facebook and YouTube, on this machine,
//                         because the real ones can only call back to an https address
//   the API             → backend/apps/web (Next.js) on :3000
//   the app             → Expo web on :8081 (phone: see --lan)
//
// Flags:
//   --reseed        delete and recreate the four test users' data (default: only if missing)
//   --no-seed       never touch the test users
//   --no-app        start everything except the app (run `npx expo start` yourself)
//   --lan           make the app reachable from a phone on the same Wi-Fi
//   --real-providers   skip the stand-ins: connect to the real platforms with the keys in .env.local
//   --public-url=URL   with --real-providers: the https address that reaches this computer's app
//                      (an ngrok or Cloudflare tunnel to port 8081): Instagram, Threads, TikTok and
//                      Facebook only send people back to https addresses registered in their apps
//   --stop          stop the Docker stack and exit
//   --help
//
// Nothing here is ever sent anywhere: every key it writes belongs to the throwaway local
// database. Real provider keys you paste into backend/apps/web/.env.local are kept as they are.

import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = path.join(root, 'backend');
const apiDir = path.join(backend, 'apps/web');
const envFile = path.join(apiDir, '.env.local');
const isWin = process.platform === 'win32';

const SUPABASE_CLI = 'supabase@2.119.0';
// Parts of the Supabase stack the app doesn't use; leaving them out keeps start-up fast.
const EXCLUDE = 'studio,imgproxy,vector,logflare,edge-runtime,storage-api,realtime,postgres-meta,supavisor';
const PORT = { api: 3000, web: 8081, mocks: 4010 };

const args = new Set(process.argv.slice(2));
const publicUrl = process.argv.slice(2).find((a) => a.startsWith('--public-url='))?.slice('--public-url='.length).replace(/\/+$/, '');
if (publicUrl && !args.has('--real-providers')) {
  console.error('\n\x1b[31m✗ --public-url goes with --real-providers (the stand-ins don\u2019t need a public address).\x1b[0m\n');
  process.exit(1);
}
if (publicUrl && !/^https:\/\/[^/]+$/.test(publicUrl)) {
  console.error('\n\x1b[31m✗ --public-url must look like https://something.example (no path).\x1b[0m\n');
  process.exit(1);
}
if (args.has('--help')) {
  // the comment block at the top of this file
  const help = [];
  for (const line of readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1)) {
    if (!line.startsWith('//')) break;
    help.push(line.replace(/^\/\/ ?/, ''));
  }
  console.log(help.join('\n'));
  process.exit(0);
}

const say = (msg) => console.log(`\n\x1b[1m▸ ${msg}\x1b[0m`);
const note = (msg) => console.log(`  ${msg}`);
const die = (msg) => {
  console.error(`\n\x1b[31m✗ ${msg}\x1b[0m\n`);
  process.exit(1);
};

// ─── Docker ──────────────────────────────────────────────────────────────────

// Docker Desktop on Windows doesn't always put itself on PATH for non-interactive shells.
if (isWin) {
  const candidates = [
    path.join(process.env.LOCALAPPDATA ?? '', 'Programs/DockerDesktop/resources/bin'),
    'C:/Program Files/Docker/Docker/resources/bin',
  ].filter((p) => existsSync(p));
  process.env.PATH = [process.env.PATH, ...candidates].join(path.delimiter);
}

function run(command, opts = {}) {
  return spawnSync(command, { shell: true, encoding: 'utf8', cwd: opts.cwd ?? root, env: { ...process.env, ...opts.env }, stdio: opts.stdio ?? 'pipe' });
}

const supabaseCli = (sub, opts) => run(`npx --yes ${SUPABASE_CLI} ${sub}`, { cwd: backend, ...opts });

// ─── Leftovers from a previous run ───────────────────────────────────────────
// The API, the app and the stand-ins are children of this script. Closing a terminal window
// can leave them running and holding their ports, so each run writes down what it started
// and the next one (or --stop) ends exactly those, after checking they are still ours.

const pidFile = path.join(root, '.expo', 'local-pids.json');

function commandLineOf(pid) {
  const res = isWin
    ? run(`powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}').CommandLine"`)
    : run(`ps -p ${pid} -o command=`);
  return res.status === 0 ? res.stdout.trim() : '';
}

function killTree(pid) {
  if (isWin) run(`taskkill /pid ${pid} /T /F`);
  else {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        // already gone
      }
    }
  }
}

function endLastRun() {
  if (!existsSync(pidFile)) return;
  let list = [];
  try {
    list = JSON.parse(readFileSync(pidFile, 'utf8'));
  } catch {
    // unreadable: nothing we can safely end
  }
  for (const { pid, marker } of list) {
    if (commandLineOf(pid).includes(marker)) {
      killTree(pid);
      note(`Ended the ${marker} left over from the last run`);
    }
  }
  rmSync(pidFile, { force: true });
}

if (args.has('--stop')) {
  say('Stopping');
  endLastRun();
  supabaseCli('stop', { stdio: 'inherit' });
  process.exit(0);
}
endLastRun();

say('Checking Docker');
if (run('docker info').status !== 0) die('Docker isn’t running. Start Docker Desktop, wait until it says it’s running, then run this again.');
note('Docker is running');

// ─── The database ────────────────────────────────────────────────────────────

function supabaseEnv() {
  const res = supabaseCli('status -o env');
  if (res.status !== 0) return null;
  const env = {};
  for (const line of res.stdout.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
    if (m) env[m[1]] = m[2];
  }
  return env.ANON_KEY && env.SERVICE_ROLE_KEY ? env : null;
}

say('Starting the database and sign-in (first time: a few minutes while Docker downloads images)');
let sb = supabaseEnv();
if (!sb) {
  const started = supabaseCli(`start -x ${EXCLUDE}`, { stdio: 'inherit' });
  if (started.status !== 0) die('The database didn’t start. The messages above say why.');
  sb = supabaseEnv();
  if (!sb) die('The database started but its keys couldn’t be read.');
}
note(`Database ready at ${sb.API_URL}`);

say('Applying database changes');
const migrated = supabaseCli('migration up', { stdio: 'inherit' });
if (migrated.status !== 0) die('Applying the migrations failed. The messages above say why.');

// ─── The API's settings ──────────────────────────────────────────────────────

const lanIp = (() => {
  if (!args.has('--lan')) return null;
  for (const list of Object.values(os.networkInterfaces())) {
    for (const nic of list ?? []) if (nic.family === 'IPv4' && !nic.internal) return nic.address;
  }
  return null;
})();
if (args.has('--lan') && !lanIp) die('--lan: this computer has no network address a phone could reach.');

const parseEnv = (file) => {
  const out = new Map();
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out.set(m[1], m[2]);
  }
  return out;
};

const env = parseEnv(envFile);
const webOrigins = [
  `http://localhost:${PORT.web}`,
  `http://127.0.0.1:${PORT.web}`,
  ...(lanIp ? [`http://${lanIp}:${PORT.web}`] : []),
  ...(publicUrl ? [publicUrl] : []),
];
// Where the platforms send a creator back to: <this>/auth/<platform>/callback
const appOrigin = publicUrl ?? (lanIp ? `http://${lanIp}:${PORT.web}` : webOrigins[0]);
const mocksHost = lanIp ?? '127.0.0.1';

// Always follow the running stack (its keys change if the stack is recreated)
const managed = {
  NEXT_PUBLIC_SUPABASE_URL: sb.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: sb.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: sb.SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL: `http://localhost:${PORT.api}`,
  CORS_ALLOWED_ORIGINS: webOrigins.join(','),
  DEV_LOGIN: 'true',
  APP_WEB_URL: appOrigin,
};
// Generated once and then kept: sealed tokens in the database can only be opened with the same key
const generated = {
  TOKEN_ENCRYPTION_KEY: () => randomBytes(32).toString('base64'),
  CRON_SECRET: () => randomBytes(16).toString('hex'),
};
const tokenKeyBefore = env.get('TOKEN_ENCRYPTION_KEY');
for (const [k, v] of Object.entries(managed)) env.set(k, v);
for (const [k, make] of Object.entries(generated)) if (!env.get(k)) env.set(k, make());

// The five platforms, by the settings the API reads for each (packages/integrations/providers/index.ts)
const PROVIDERS = [
  { id: 'tiktok', keyVar: 'TIKTOK_CLIENT_KEY', secretVar: 'TIKTOK_CLIENT_SECRET', mockVar: 'TIKTOK_MOCK_ORIGIN', redirectVar: 'TIKTOK_REDIRECT_URI' },
  { id: 'instagram', keyVar: 'INSTAGRAM_APP_ID', secretVar: 'INSTAGRAM_APP_SECRET', mockVar: 'INSTAGRAM_MOCK_ORIGIN', redirectVar: 'INSTAGRAM_REDIRECT_URI' },
  { id: 'threads', keyVar: 'THREADS_APP_ID', secretVar: 'THREADS_APP_SECRET', mockVar: 'THREADS_MOCK_ORIGIN', redirectVar: 'THREADS_REDIRECT_URI' },
  { id: 'facebook', keyVar: 'FACEBOOK_APP_ID', secretVar: 'FACEBOOK_APP_SECRET', mockVar: 'FACEBOOK_MOCK_ORIGIN', redirectVar: 'FACEBOOK_REDIRECT_URI' },
  { id: 'youtube', keyVar: 'GOOGLE_CLIENT_ID', secretVar: 'GOOGLE_CLIENT_SECRET', mockVar: 'YOUTUBE_MOCK_ORIGIN', redirectVar: 'YOUTUBE_REDIRECT_URI' },
];
const STAND_IN_PREFIX = 'local-stand-in';

// Settings the API process gets on top of the file: throwaway keys for platforms you haven't pasted real keys for.
const standInEnv = {};

if (!args.has('--real-providers')) {
  // Stand-ins for the platforms, on this machine (backend/scripts/mock-providers.mjs). Real keys you
  // pasted stay as they are (and are only ever sent to the stand-ins, on this computer); a platform
  // without keys gets throwaway ones for this run only, and they are not written down.
  for (const p of PROVIDERS) {
    env.set(p.mockVar, `http://${mocksHost}:${PORT.mocks}/${p.id}`);
    env.delete(p.redirectVar); // follows APP_WEB_URL
    if (!env.get(p.keyVar) || String(env.get(p.keyVar)).startsWith(STAND_IN_PREFIX)) {
      env.delete(p.keyVar);
      env.delete(p.secretVar);
      standInEnv[p.keyVar] = `${STAND_IN_PREFIX}-${p.id}-key`;
      standInEnv[p.secretVar] = `${STAND_IN_PREFIX}-${p.id}-secret`;
    }
  }
} else {
  // The real platforms: nothing of the stand-ins stays behind, and throwaway keys from earlier runs go
  for (const p of PROVIDERS) {
    env.delete(p.mockVar);
    env.delete(p.redirectVar);
    for (const v of [p.keyVar, p.secretVar]) if (String(env.get(v) ?? '').startsWith(STAND_IN_PREFIX)) env.delete(v);
  }
}

// The model behind Jarvis (scripts, captions, hooks, Repurpose, chat). A real key you pasted is used as it is.
// Without one, a stand-in on this machine answers (placeholder text tagged "[stand-in]", and the app says so),
// so every tool can be walked through; it is never used once a real key is there, or with --real-providers.
const hasKey = ['GROQ_API_KEY', 'GEMINI_API_KEY'].some((v) => String(env.get(v) ?? '').trim() !== '');
if (!args.has('--real-providers') && !hasKey) env.set('AI_MOCK_ORIGIN', `http://${mocksHost}:${PORT.mocks}/ai`);
else env.delete('AI_MOCK_ORIGIN');

writeFileSync(
  envFile,
  [
    '# Written by `npm run local`. The Supabase values follow the local stack; the rest is kept as you left it.',
    '# Paste real provider keys (GROQ_API_KEY, GEMINI_API_KEY, INSTAGRAM_APP_ID, …) here yourself. This file is not committed.',
    ...[...env].map(([k, v]) => `${k}=${v}`),
    '',
  ].join('\n'),
);
note(`Settings written to ${path.relative(root, envFile)}`);
const keyChanged = tokenKeyBefore !== undefined && tokenKeyBefore !== env.get('TOKEN_ENCRYPTION_KEY');

// ─── The test users ──────────────────────────────────────────────────────────

async function testUsersExist() {
  try {
    const res = await fetch(`${sb.API_URL}/auth/v1/admin/users?per_page=200`, {
      headers: { apikey: sb.SERVICE_ROLE_KEY, Authorization: `Bearer ${sb.SERVICE_ROLE_KEY}` },
    });
    const json = await res.json();
    const emails = new Set((json.users ?? []).map((u) => u.email));
    return ['free.new', 'free.existing', 'pro.new', 'pro.existing'].every((n) => emails.has(`${n}@example.com`));
  } catch {
    return false;
  }
}

if (!args.has('--no-seed')) {
  say('Test users');
  if (args.has('--reseed') || keyChanged || !(await testUsersExist())) {
    const seeded = run('node scripts/seed-test-users.mjs', { cwd: backend, env: { NODE_NO_WARNINGS: '1' }, stdio: 'inherit' });
    if (seeded.status !== 0) die('Creating the test users failed. The messages above say why.');
  } else {
    note('Already there (use --reseed to put their data back to the start)');
  }
}

// ─── Servers ─────────────────────────────────────────────────────────────────

const children = [];
function remember() {
  mkdirSync(path.dirname(pidFile), { recursive: true });
  writeFileSync(pidFile, JSON.stringify(children.map((c) => ({ pid: c.child.pid, marker: c.marker }))));
}
function stopAll() {
  children.forEach(({ child }) => child.exitCode === null && killTree(child.pid));
  rmSync(pidFile, { force: true });
}
process.on('SIGINT', () => {
  stopAll();
  console.log('\nStopped the API, the app and the stand-ins. The database is still up (npm run local -- --stop to stop it).');
  process.exit(0);
});
process.on('exit', stopAll);

function start(label, command, marker, opts = {}) {
  const child = spawn(command, { shell: true, cwd: opts.cwd ?? root, env: { ...process.env, ...opts.env }, stdio: ['ignore', 'pipe', 'pipe'], detached: !isWin });
  children.push({ child, marker });
  remember();
  const pipe = (stream) =>
    stream.on('data', (chunk) => {
      for (const line of String(chunk).split(/\r?\n/)) if (line.trim()) console.log(`  \x1b[2m[${label}]\x1b[0m ${line}`);
    });
  pipe(child.stdout);
  pipe(child.stderr);
  child.on('exit', (code) => {
    if (code) console.log(`  \x1b[31m[${label}] stopped (exit ${code})\x1b[0m`);
  });
  return child;
}

async function waitFor(url, label, ms = 180_000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  die(`${label} didn’t come up within ${Math.round(ms / 1000)} seconds.`);
}

if (!args.has('--real-providers')) {
  say('Starting the stand-in platforms');
  start('stand-ins', `node scripts/mock-providers.mjs`, 'mock-providers', { cwd: backend, env: { MOCK_PROVIDERS_HOST: lanIp ? '0.0.0.0' : '127.0.0.1', MOCK_PROVIDERS_PORT: String(PORT.mocks), MOCK_PROVIDERS_PUBLIC: `http://${mocksHost}:${PORT.mocks}` } });
  await waitFor(`http://127.0.0.1:${PORT.mocks}/`, 'The stand-in platforms', 30_000);
}

say('Starting the API');
start('api', `node node_modules/next/dist/bin/next dev -p ${PORT.api}${lanIp ? ' -H 0.0.0.0' : ''}`, 'next', { cwd: apiDir, env: standInEnv });
await waitFor(`http://localhost:${PORT.api}/api/v1/dev/login`, 'The API', 300_000);
note(`API ready at http://localhost:${PORT.api}`);

// On Vercel the cron wakes every 15 minutes. Here it is poked every 30 seconds, so a post planned a minute
// ahead can be tried without waiting (it becomes "ready to post" and the bell gets its note).
const cronUrl = `http://localhost:${PORT.api}/api/cron/dispatch`;
setInterval(() => {
  fetch(cronUrl, { headers: { Authorization: `Bearer ${env.get('CRON_SECRET')}` } }).catch(() => {
    // the API is restarting; the next poke will do
  });
}, 30_000);

// ─── The app ─────────────────────────────────────────────────────────────────

const appHost = lanIp ?? 'localhost';
const appEnv = {
  EXPO_PUBLIC_API_URL: `http://${appHost}:${PORT.api}`,
  EXPO_PUBLIC_SUPABASE_URL: lanIp ? sb.API_URL.replace(/\/\/[^:/]+/, `//${lanIp}`) : sb.API_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: sb.ANON_KEY,
  EXPO_PUBLIC_DEV_LOGIN: 'true',
};

if (!args.has('--no-app')) {
  say('Starting the app');
  // Expo bakes EXPO_PUBLIC_* values into its cache, so a changed value needs a clean start.
  const stampFile = path.join(root, '.expo', 'local-env.stamp');
  const stamp = createHash('sha256').update(JSON.stringify(appEnv)).digest('hex');
  const fresh = !existsSync(stampFile) || readFileSync(stampFile, 'utf8') !== stamp;
  mkdirSync(path.dirname(stampFile), { recursive: true });
  writeFileSync(stampFile, stamp);
  start('app', `node node_modules/expo/bin/cli start --web --port ${PORT.web}${fresh ? ' --clear' : ''}${lanIp ? ' --lan' : ''}`, 'expo', {
    env: { ...appEnv, BROWSER: 'none', CI: undefined, EXPO_NO_TELEMETRY: '1' },
  });
  await waitFor(`http://localhost:${PORT.web}/`, 'The app', 600_000);
}

console.log(`
\x1b[1m\x1b[32m✓ PostStreak is running on this computer\x1b[0m

  App            http://${appHost}:${PORT.web}      ← open this, then tap a test account
  API            http://localhost:${PORT.api}
  Email codes    http://127.0.0.1:${sb.INBUCKET_URL ? new URL(sb.INBUCKET_URL).port : 54324}   (a sign-up code arrives here, not in a real inbox)
  Stand-ins      http://${mocksHost}:${PORT.mocks}   (TikTok and the other platforms, for connecting accounts)

  Test accounts  Free · New    Free · Existing    Pro · New    Pro · Existing
  Planned posts  become "ready to post" within 30 seconds of their time here (every 15 minutes on Vercel)
  Stop           Ctrl+C (the database keeps running; npm run local -- --stop stops it)
${lanIp ? `\n  Phone          open the app's dev build and enter http://${lanIp}:${PORT.web} (see backend/STAGING_RUNBOOK.md → Phone testing)\n` : ''}`);

// keep running until Ctrl+C
await new Promise(() => {});
