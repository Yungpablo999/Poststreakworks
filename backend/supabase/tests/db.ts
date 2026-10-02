// Test harness: an in-process Postgres (PGlite) that looks enough like a
// Supabase project to run the real migrations and exercise RLS as the real
// `authenticated` / `service_role` roles.
//
// What it stands in for, and what it doesn't:
//   + roles anon / authenticated / service_role, the auth.users table and
//     auth.uid(), and Supabase's default grants (so "RLS, not table privileges,
//     is the gate" holds exactly as on a real project);
//   + empty copies of the v1 tables the migrations read from (the live project
//     is v1's database; a fresh one has none of them);
//   - it is NOT a substitute for testing against a real Supabase project
//     (BACKEND_BUILD_PLAN Phase 7): no PostgREST, no JWT verification, no
//     Realtime, one connection.

import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const MIGRATIONS_DIR = fileURLToPath(new URL("../migrations", import.meta.url));

export const migrationFiles = () =>
  readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  create schema auth;
  create table auth.users (
    id                 uuid primary key default gen_random_uuid(),
    email              text,
    raw_user_meta_data jsonb default '{}',
    created_at         timestamptz not null default now()
  );
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

  grant usage on schema public, auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;

  -- Supabase's defaults: new tables, sequences AND functions in public are
  -- granted to the API roles. This is why migrations must revoke EXECUTE
  -- explicitly on anything that takes a user id.
  alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

  -- v1 (PostIT-web) tables the migrations read from or write to on signup.
  -- Empty here; on the live project they hold real data.
  create table user_plans   (user_id uuid primary key, plan text not null default 'free');
  create table user_streaks (
    user_id        uuid primary key,
    current_streak integer not null default 0,
    longest_streak integer not null default 0,
    last_post_date date,
    updated_at     timestamptz not null default now()
  );
  create table user_tokens (
    user_id uuid, platform text, access_token text, refresh_token text,
    expires_at timestamptz, created_at timestamptz not null default now()
  );
  create table posts (
    id uuid primary key default gen_random_uuid(), user_id uuid, content text, platform text,
    scheduled_at timestamptz, posted_at timestamptz, created_at timestamptz not null default now(),
    updated_at timestamptz, status text, postiz_id text, tweet_url text, is_thread boolean,
    thread_tweets text[], locked_at timestamptz, error text
  );
`;

export type Db = PGlite;

/** Applies one migration the way the Supabase CLI does: a single transaction. */
export async function applyMigration(db: Db, file: string): Promise<void> {
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
  try {
    await db.exec(`begin;\n${sql}\ncommit;`);
  } catch (err) {
    await db.exec("rollback;").catch(() => undefined);
    throw new Error(`${file}: ${(err as Error).message}`);
  }
}

/**
 * A fresh database. `through` stops after that migration (a prefix of its file
 * name, e.g. "20260814000019"), to test upgrading a database that already holds
 * data.
 */
export async function createDatabase(opts: { through?: string } = {}): Promise<Db> {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);
  for (const file of migrationFiles()) {
    await applyMigration(db, file);
    if (opts.through && file.startsWith(opts.through)) break;
  }
  return db;
}

/** Applies every migration after `through`. */
export async function applyRemaining(db: Db, through: string): Promise<void> {
  const files = migrationFiles();
  const index = files.findIndex((f) => f.startsWith(through));
  for (const file of files.slice(index + 1)) await applyMigration(db, file);
}

// ─── Acting as a role ───────────────────────────────────────────────────────

export async function asUser<T>(db: Db, userId: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${userId}';`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role; reset request.jwt.claim.sub;");
  }
}

export async function asService<T>(db: Db, fn: () => Promise<T>): Promise<T> {
  await db.exec("set role service_role;");
  try {
    return await fn();
  } finally {
    await db.exec("reset role;");
  }
}

// ─── Small helpers ──────────────────────────────────────────────────────────

export async function one<T = Record<string, unknown>>(db: Db, sql: string, params: unknown[] = []): Promise<T> {
  const { rows } = await db.query<T>(sql, params);
  const row = rows[0];
  if (row === undefined) throw new Error(`Expected a row from: ${sql}`);
  return row;
}

export async function count(db: Db, sql: string, params: unknown[] = []): Promise<number> {
  const row = await one<{ n: number }>(db, `select count(*)::int as n from (${sql}) q`, params);
  return row.n;
}

/** Inserting into auth.users fires the signup trigger, like a real signup. */
export async function createUser(db: Db, email?: string): Promise<string> {
  const row = await one<{ id: string }>(
    db,
    "insert into auth.users (email) values ($1) returning id",
    [email ?? `${crypto.randomUUID()}@example.com`],
  );
  return row.id;
}
