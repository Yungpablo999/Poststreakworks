// Pieces the Instagram, Threads, Facebook and YouTube stand-ins share.
//
// Every stand-in receives requests under the real platform's host name: a call meant for
// https://graph.instagram.com/v25.0/me arrives as /graph.instagram.com/v25.0/me. `route` splits
// that apart. Tokens carry who they belong to (<prefix>.<creator key>.<random>), so connections
// made before this process restarted keep working; only "expired on purpose" is remembered.
import { randomBytes } from 'node:crypto';
import { CREATORS, coverSvg, creatorForKey } from './creators.mjs';
import { consentPage, json, text } from './http.mjs';

export const rand = () => randomBytes(9).toString('base64url');

/** { host, path } of a request the API sent to the stand-in. */
export function route(url) {
  const [, host = '', ...rest] = url.pathname.split('/');
  return { host, path: '/' + rest.join('/') };
}

/** Who a token belongs to: the key between its first and second dot, or null. */
export function keyOfToken(token, prefix) {
  if (!token || !token.startsWith(`${prefix}.`)) return null;
  return token.split('.')[1] ?? null;
}

export const bearer = (req) => (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');

/**
 * The "Allow PostStreak?" page. `extra` adds people who can't finish connecting. Every account's
 * link goes back to the app's redirect address with a code (and the state, untouched), exactly as
 * the real platform does; Cancel goes back with the platform's own "denied" parameters.
 */
export function consent(res, url, { provider, scopes, codeFor, extra = [], denied = { error: 'access_denied' }, fragment = '', extraParams = {} }) {
  const redirectUri = url.searchParams.get('redirect_uri') ?? '';
  const state = url.searchParams.get('state') ?? '';
  const back = (params) => {
    const to = new URL(redirectUri);
    for (const [k, v] of Object.entries(params)) to.searchParams.set(k, v);
    if (state) to.searchParams.set('state', state);
    return to.toString() + fragment;
  };
  const people = [...Object.values(CREATORS), ...extra];
  return consentPage(res, {
    provider,
    scopes,
    clientKey: url.searchParams.get('client_id') ?? '',
    accounts: people.map((c) => ({
      label: c.name,
      detail: c.followers ? c.niche : 'will not be able to finish',
      allow: back({ ...extraParams, code: codeFor(c) }),
    })),
    cancel: back(denied),
  });
}

/** The creator (or a can't-finish person from `extra`) behind a code like mockcode.<key>.<random>. */
export function creatorOfCode(code, extra = []) {
  const m = /^mockcode\.([^.]+)\./.exec(code ?? '');
  if (!m) return null;
  return creatorForKey(m[1]) ?? extra.find((c) => c.key === m[1]) ?? null;
}

/** Page through a list the way the Meta APIs do: { data, paging: { cursors, next } }. */
export function metaPage(all, url, origin, mapItem) {
  const start = Number(url.searchParams.get('after') ?? 0) || 0;
  const size = Math.min(Number(url.searchParams.get('limit') ?? 25) || 25, 50);
  const slice = all.slice(start, start + size);
  const end = start + slice.length;
  const body = { data: slice.map(mapItem) };
  if (slice.length) {
    body.paging = { cursors: { before: String(start), after: String(end) } };
    if (end < all.length) body.paging.next = `${origin}${url.pathname}?after=${end}`;
  }
  return body;
}

/** Meta's error reply. */
export const metaError = (res, status, code, message, type = 'OAuthException') =>
  json(res, status, { error: { message, type, code, fbtrace_id: 'mock' } });

/** Cover and avatar pictures: a gradient with the title on it. */
export function serveCover(res, url) {
  const title = url.searchParams.get('t') ?? url.pathname.split('/').pop().replace(/\.svg$/, '');
  res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'max-age=3600', 'access-control-allow-origin': '*' });
  res.end(coverSvg(title, url.pathname));
}

/** /_control/expire?account=<key> and /_control/reset: break and fix connections on purpose. Returns true when it answered. */
export function control(res, url, broken) {
  if (url.pathname === '/_control/expire') {
    const key = url.searchParams.get('account');
    if (!creatorForKey(key)) {
      text(res, 404, 'no such creator');
      return true;
    }
    broken.add(key);
    text(res, 200, `${key}'s connection is now rejected until they connect again`);
    return true;
  }
  if (url.pathname === '/_control/reset') {
    broken.clear();
    text(res, 200, 'ok');
    return true;
  }
  return false;
}
