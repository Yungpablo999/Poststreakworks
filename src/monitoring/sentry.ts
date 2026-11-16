/**
 * Error reporting to Sentry, with no PII (same reporter as the backend's src/lib/sentry.ts).
 *
 * A small fetch-based reporter instead of the full SDK: it works the same on the web export and
 * on native, needs no config plugin and adds almost nothing to the bundle. It is OFF unless
 * EXPO_PUBLIC_SENTRY_DSN is set (a DSN is a public ingest key by design). Only the error type,
 * message, stack and screen name are sent. No user, cookies, headers or query strings are attached,
 * and emails, bearer tokens and JWTs inside messages or stacks are redacted first.
 */

export type SentryEvent = {
  event_id: string
  timestamp: number
  platform: 'javascript'
  level: 'error'
  environment?: string
  message?: string
  exception?: { values: Array<{ type: string; value: string; stacktrace?: { frames: Array<{ filename?: string; function?: string; lineno?: number; colno?: number }> } }> }
  tags?: Record<string, string>
  request?: Record<string, unknown>
  user?: Record<string, unknown>
  [k: string]: unknown
}

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi
const JWT = /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]*/g
const LONG_SECRET = /\b(?:sk|pk|rk|whsec|sb_secret|sbp)_[A-Za-z0-9_]{12,}/g
const QUERY = /\?[^\s"')]*/g

/** Redacts anything in a string that looks like an email, token or secret key */
export function scrubString(s: string): string {
  return s.replace(BEARER, 'Bearer [redacted]').replace(JWT, '[redacted-jwt]').replace(LONG_SECRET, '[redacted-key]').replace(EMAIL, '[redacted-email]')
}

/** Strips URL query strings (they can carry tokens and codes) and redacts the rest */
export function scrubUrl(s: string): string {
  return scrubString(s.replace(QUERY, ''))
}

/** Removes every field that can carry personal data, and redacts the text that stays */
export function scrubEvent<T extends SentryEvent>(event: T): T {
  const out = { ...event } as SentryEvent
  delete out.user
  delete out.request
  delete out.server_name
  delete out.contexts
  delete out.breadcrumbs
  delete out.extra
  if (typeof out.message === 'string') out.message = scrubString(out.message)
  if (out.exception) {
    out.exception = {
      values: out.exception.values.map((v) => ({
        ...v,
        value: scrubString(v.value ?? ''),
        stacktrace: v.stacktrace
          ? { frames: v.stacktrace.frames.map((f) => ({ ...f, filename: f.filename ? scrubUrl(f.filename) : f.filename })) }
          : undefined,
      })),
    }
  }
  if (out.tags) {
    out.tags = Object.fromEntries(Object.entries(out.tags).map(([k, v]) => [k, scrubUrl(String(v))]))
  }
  return out as T
}

export function parseDsn(dsn: string | undefined): { endpoint: string; key: string } | null {
  if (!dsn) return null
  try {
    const u = new URL(dsn)
    const projectId = u.pathname.replace(/^\/+/, '').split('/').pop()
    if (!u.username || !projectId || !/^\d+$/.test(projectId)) return null
    return { endpoint: `${u.protocol}//${u.host}/api/${projectId}/envelope/`, key: u.username }
  } catch {
    return null
  }
}

function parseStack(stack: string | undefined) {
  if (!stack) return undefined
  const frames = stack
    .split('\n')
    .slice(1, 30)
    .map((line) => {
      const m = line.match(/at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/)
      return m ? { function: m[1], filename: m[2], lineno: Number(m[3]), colno: Number(m[4]) } : null
    })
    .filter((f): f is NonNullable<typeof f> => f !== null)
    .reverse() // Sentry wants the oldest frame first
  return frames.length ? { frames } : undefined
}

export function buildEvent(err: unknown, route?: string, environment?: string): SentryEvent {
  const e = err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Unknown error')
  const id = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  return {
    event_id: id,
    timestamp: Date.now() / 1000,
    platform: 'javascript',
    level: 'error',
    environment,
    exception: { values: [{ type: e.name || 'Error', value: e.message, stacktrace: parseStack(e.stack) }] },
    tags: route ? { route } : undefined,
  }
}

type Deps = { dsn?: string; fetchFn?: typeof fetch; environment?: string }

/** Sends one error. Never throws. Returns whether it was sent. */
export async function captureException(err: unknown, route?: string, deps: Deps = {}): Promise<boolean> {
  try {
    const dsn = parseDsn(deps.dsn ?? process.env.EXPO_PUBLIC_SENTRY_DSN)
    if (!dsn) return false
    const event = scrubEvent(buildEvent(err, route ? scrubUrl(route) : undefined, deps.environment ?? process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? 'production'))
    const body =
      JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString() }) + '\n' +
      JSON.stringify({ type: 'event' }) + '\n' +
      JSON.stringify(event)
    const res = await (deps.fetchFn ?? fetch)(dsn.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope', 'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${dsn.key}, sentry_client=poststreak-app-lite/1.0` },
      body,
      
    })
    return res.ok
  } catch {
    return false
  }
}

let installed = false
let lastSent = 0

/** Reports uncaught errors and unhandled promise rejections, at most one per second. Call once at startup. */
export function initMonitoring(): void {
  if (installed || !parseDsn(process.env.EXPO_PUBLIC_SENTRY_DSN)) return
  installed = true
  const report = (err: unknown) => {
    const now = Date.now()
    if (now - lastSent < 1000) return
    lastSent = now
    void captureException(err, 'app')
  }
  const g = globalThis as any
  if (typeof g.addEventListener === 'function' && typeof g.document !== 'undefined') {
    g.addEventListener('error', (e: any) => report(e?.error ?? e?.message))
    g.addEventListener('unhandledrejection', (e: any) => report(e?.reason))
  } else if (g.ErrorUtils?.setGlobalHandler) {
    const prev = g.ErrorUtils.getGlobalHandler?.()
    g.ErrorUtils.setGlobalHandler((e: unknown, fatal?: boolean) => {
      report(e)
      prev?.(e, fatal)
    })
  }
}
