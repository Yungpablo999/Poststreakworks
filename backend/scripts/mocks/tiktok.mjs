// A stand-in for TikTok (Login Kit + Display API v2) for trying the connection on localhost.
// It speaks the same endpoints the real one does, as far as PostStreak uses them:
//   GET  /v2/auth/authorize/   a sign-in page where you pick which stand-in creator you are
//   POST /v2/oauth/token/      authorization_code and refresh_token grants (refresh tokens rotate, as TikTok's can)
//   POST /v2/oauth/revoke/
//   GET  /v2/user/info/        profile and counts
//   POST /v2/video/list/       the creator's videos with their numbers
// plus /_control/* to break things on purpose (expire a connection) and /cover/* for cover images.
import { randomBytes } from 'node:crypto';
import { CREATORS, coverSvg, creatorForKey, followersToday, videosFor } from './creators.mjs';
import { consentPage, json, readForm, readJson, redirect, text } from './http.mjs';

const SCOPES = 'user.info.basic,user.info.stats,video.list';

// Connections the stand-in has handed out: access token → who, and which are "expired" on purpose.
const access = new Map(); // token → { key, expires }
const refresh = new Map(); // token → { key }
const broken = new Set(); // creator keys whose tokens are rejected until they connect again

const rand = () => randomBytes(9).toString('base64url');
const ok = { code: 'ok', message: '', log_id: 'mock' };
const err = (res, status, code, message = code) => json(res, status, { error: { code, message, log_id: 'mock' } });

function issue(key) {
  const a = `act.${key}.${rand()}`;
  const r = `rft.${key}.${rand()}`;
  access.set(a, { key });
  refresh.set(r, { key });
  return {
    access_token: a,
    refresh_token: r,
    open_id: `mock-open-id-${key}`,
    scope: SCOPES,
    expires_in: 86_400,
    refresh_expires_in: 31_536_000,
    token_type: 'Bearer',
  };
}

/** Which creator a bearer token belongs to, or an error reply has been sent. */
function whoIs(req, res) {
  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  const entry = access.get(token) ?? (token.startsWith('act.') ? { key: token.split('.')[1] } : null); // tokens sealed by the seed script
  if (!entry || !creatorForKey(entry.key)) {
    err(res, 401, 'access_token_invalid', 'The access token is invalid or not found in the request.');
    return null;
  }
  if (broken.has(entry.key)) {
    err(res, 401, 'access_token_invalid', 'The access token has expired.');
    return null;
  }
  return creatorForKey(entry.key);
}

export async function handle(req, res, url, origin) {
  const path = url.pathname;

  if (req.method === 'GET' && path === '/v2/auth/authorize/') {
    const redirectUri = url.searchParams.get('redirect_uri') ?? '';
    const state = url.searchParams.get('state') ?? '';
    const go = (params) => {
      const to = new URL(redirectUri);
      for (const [k, v] of Object.entries(params)) to.searchParams.set(k, v);
      if (state) to.searchParams.set('state', state);
      return to.toString();
    };
    return consentPage(res, {
      provider: 'TikTok',
      scopes: (url.searchParams.get('scope') ?? SCOPES).split(','),
      clientKey: url.searchParams.get('client_key') ?? '',
      accounts: Object.values(CREATORS).map((c) => ({
        label: c.name,
        detail: `${followersToday(c).toLocaleString('en')} followers · ${c.niche}`,
        allow: go({ code: `mockcode.${c.key}.${rand()}` }),
      })),
      cancel: go({ error: 'access_denied', error_description: 'The user denied the authorization request.' }),
    });
  }

  if (req.method === 'POST' && path === '/v2/oauth/token/') {
    const form = await readForm(req);
    if (form.grant_type === 'authorization_code') {
      const m = /^mockcode\.([^.]+)\./.exec(form.code ?? '');
      if (!m || !creatorForKey(m[1])) return json(res, 400, { error: 'invalid_grant', error_description: 'Authorization code is expired or invalid.' });
      broken.delete(m[1]); // connecting again fixes an expired connection
      return json(res, 200, issue(m[1]));
    }
    if (form.grant_type === 'refresh_token') {
      const entry = refresh.get(form.refresh_token) ?? (/^rft\.([^.]+)\./.test(form.refresh_token ?? '') ? { key: form.refresh_token.split('.')[1] } : null);
      if (!entry || !creatorForKey(entry.key) || broken.has(entry.key)) {
        return json(res, 400, { error: 'invalid_grant', error_description: 'Refresh token is invalid or expired.' });
      }
      refresh.delete(form.refresh_token); // rotated: the old one is dead
      return json(res, 200, issue(entry.key));
    }
    return json(res, 400, { error: 'unsupported_grant_type' });
  }

  if (req.method === 'POST' && path === '/v2/oauth/revoke/') {
    const form = await readForm(req);
    access.delete(form.token);
    return json(res, 200, {});
  }

  if (req.method === 'GET' && path === '/v2/user/info/') {
    const c = whoIs(req, res);
    if (!c) return;
    const fields = (url.searchParams.get('fields') ?? '').split(',');
    const v = videosFor(c);
    const user = {};
    if (fields.includes('open_id')) user.open_id = `mock-open-id-${c.key}`;
    if (fields.includes('display_name')) user.display_name = c.name;
    if (fields.includes('avatar_url')) user.avatar_url = `${origin}/cover/avatar-${c.key}.svg`;
    if (fields.includes('follower_count')) user.follower_count = followersToday(c);
    if (fields.includes('following_count')) user.following_count = 180 + (c.key.length % 90);
    if (fields.includes('likes_count')) user.likes_count = v.reduce((n, x) => n + x.like_count, 0);
    if (fields.includes('video_count')) user.video_count = v.length;
    return json(res, 200, { data: { user }, error: ok });
  }

  if (req.method === 'POST' && path === '/v2/video/list/') {
    const c = whoIs(req, res);
    if (!c) return;
    const body = await readJson(req);
    const all = videosFor(c);
    const start = Number(body.cursor ?? 0);
    const size = Math.min(Number(body.max_count ?? 20), 20);
    const page = all.slice(start, start + size).map((x) => ({
      ...x,
      cover_image_url: `${origin}/cover/${x.id}.svg?t=${encodeURIComponent(x.title)}`,
      share_url: `https://www.tiktok.com/@${c.key}/video/${x.id}`,
    }));
    const next = start + size;
    return json(res, 200, { data: { videos: page, cursor: next, has_more: next < all.length }, error: ok });
  }

  if (req.method === 'GET' && path.startsWith('/cover/')) {
    const title = url.searchParams.get('t') ?? path.split('/').pop().replace(/\.svg$/, '');
    res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'max-age=3600', 'access-control-allow-origin': '*' });
    return res.end(coverSvg(title, path));
  }

  // ─── Break things on purpose ─────────────────────────────────────────────
  if (path === '/_control/expire') {
    const key = url.searchParams.get('account');
    if (!creatorForKey(key)) return text(res, 404, 'no such creator');
    broken.add(key);
    return text(res, 200, `${key}'s connection is now rejected until they connect again`);
  }
  if (path === '/_control/reset') {
    broken.clear();
    return text(res, 200, 'ok');
  }

  return text(res, 404, 'not found');
}
