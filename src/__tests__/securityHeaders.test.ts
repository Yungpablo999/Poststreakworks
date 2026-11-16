/// <reference types="node" />
import { readFileSync } from 'fs'
import { join } from 'path'

const src = readFileSync(join(__dirname, '../../public/_headers'), 'utf8')

describe('web security headers (public/_headers)', () => {
  it('applies to every path and sets the full header set', () => {
    expect(src.startsWith('/*\n')).toBe(true)
    for (const h of ['Content-Security-Policy-Report-Only', 'Strict-Transport-Security', 'X-Frame-Options: DENY', 'X-Content-Type-Options: nosniff', 'Referrer-Policy', 'Permissions-Policy']) {
      expect(src).toContain(h)
    }
  })
  it('sends the CSP as report-only (flip to enforce by dropping the suffix)', () => {
    expect(src).toMatch(/^  Content-Security-Policy-Report-Only: /m)
    expect(src).not.toMatch(/^  Content-Security-Policy: /m)
  })
  it('allows our services and nothing wildcard-wide for scripts', () => {
    for (const host of ['*.supabase.co', 'us.i.posthog.com', 'ingest.sentry.io', 'r2.cloudflarestorage.com', 'media.poststreak.app', '*.poststreak.app']) {
      expect(src).toContain(host)
    }
    expect(src).toContain("default-src 'self'")
    expect(src).toContain("frame-ancestors 'none'")
    expect(src).not.toContain('unsafe-eval')
    const script = src.match(/script-src ([^;]*);/)![1]
    expect(script).not.toMatch(/\*|https:\s|^https:$/)
  })
})
