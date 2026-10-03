// A stand-in for Google sign-in + the YouTube Data API for trying the connection on localhost.
// Same endpoints and shapes as far as PostStreak uses them (checked against developers.google.com
// on 2026-10-03):
//   GET  accounts.google.com/o/oauth2/v2/auth        a page where you pick which stand-in creator you are
//   POST oauth2.googleapis.com/token                 authorization_code and refresh_token grants
//   POST oauth2.googleapis.com/revoke
//   GET  www.googleapis.com/youtube/v3/channels      the signed-in person's channel (mine=true)
//   GET  www.googleapis.com/youtube/v3/playlistItems the channel's uploads, paged
//   GET  www.googleapis.com/youtube/v3/videos        titles, numbers and durations for up to 50 videos
// One extra test person has a Google account without a YouTube channel. /_control/expire makes
// Google refuse the creator's refresh token ("Token has been expired or revoked"), which is what
// happens after a week to anyone connected while the Google consent screen is still in Testing.
import { CREATORS, creatorForKey } from './creators.mjs';
import { json, readForm, text } from './http.mjs';
import { NO_CHANNEL, channelIdFor, handleFor, postsFor, profileFor } from './others.mjs';
import { consent, control, creatorOfCode, keyOfToken, rand, route, serveCover } from './shared.mjs';

const SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';
const broken = new Set();
const revoked = new Set();

const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
const duration = (s) => `PT${Math.floor(s / 60)}M${s % 60}S`;

const googleError = (res, status, reason, message, googleStatus) =>
  json(res, status, { error: { code: status, message, errors: [{ message, domain: 'global', reason }], status: googleStatus } });

/** The creator behind the Bearer token, or an error reply has been sent. */
function whoIs(req, res) {
  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  const key = keyOfToken(token, 'ya29');
  const creator = creatorForKey(key) ?? (key === NO_CHANNEL.key ? NO_CHANNEL : null);
  if (!creator || broken.has(key)) {
    googleError(res, 401, 'authError', 'Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential.', 'UNAUTHENTICATED');
    return null;
  }
  return creator;
}

export async function handle(req, res, url, origin) {
  if (control(res, url, broken)) return;
  if (req.method === 'GET' && url.pathname.startsWith('/cover/')) return serveCover(res, url);

  const { host, path } = route(url);

  if (req.method === 'GET' && host === 'accounts.google.com' && path === '/o/oauth2/v2/auth') {
    const scope = url.searchParams.get('scope') ?? SCOPE;
    return consent(res, url, {
      provider: 'Google (YouTube)',
      scopes: scope.split(/\s+/).filter(Boolean),
      codeFor: (c) => `mockcode.${c.key}.${rand()}`,
      extra: [NO_CHANNEL],
      extraParams: { scope },
    });
  }

  if (host === 'oauth2.googleapis.com' && req.method === 'POST' && path === '/token') {
    const form = await readForm(req);
    if (form.grant_type === 'authorization_code') {
      const creator = creatorOfCode(form.code, [NO_CHANNEL]);
      if (!creator) return json(res, 400, { error: 'invalid_grant', error_description: 'Malformed auth code.' });
      broken.delete(creator.key);
      return json(res, 200, { access_token: `ya29.${creator.key}.${rand()}`, expires_in: 3599, refresh_token: `YTR.${creator.key}.${rand()}`, scope: SCOPE, token_type: 'Bearer' });
    }
    if (form.grant_type === 'refresh_token') {
      const key = keyOfToken(form.refresh_token, 'YTR');
      if (!key || revoked.has(form.refresh_token) || broken.has(key)) return json(res, 400, { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' });
      return json(res, 200, { access_token: `ya29.${key}.${rand()}`, expires_in: 3599, scope: SCOPE, token_type: 'Bearer' });
    }
    return json(res, 400, { error: 'unsupported_grant_type' });
  }

  if (host === 'oauth2.googleapis.com' && req.method === 'POST' && path === '/revoke') {
    const form = await readForm(req);
    if (!keyOfToken(form.token, 'YTR') && !keyOfToken(form.token, 'ya29')) return json(res, 400, { error: 'invalid_token', error_description: 'Token expired or revoked' });
    revoked.add(form.token);
    return json(res, 200, {});
  }

  if (host !== 'www.googleapis.com' || req.method !== 'GET') return text(res, 404, 'not found');
  const c = whoIs(req, res);
  if (!c) return;

  if (path === '/youtube/v3/channels') {
    if (c === NO_CHANNEL) return json(res, 200, { kind: 'youtube#channelListResponse', pageInfo: { totalResults: 0, resultsPerPage: 5 } });
    const p = profileFor(c, 'youtube');
    const posts = postsFor(c, 'youtube');
    const avatar = `${origin}/cover/avatar-${c.key}-youtube.svg`;
    return json(res, 200, {
      kind: 'youtube#channelListResponse',
      pageInfo: { totalResults: 1, resultsPerPage: 5 },
      items: [
        {
          kind: 'youtube#channel',
          id: channelIdFor(c),
          snippet: { title: c.name, customUrl: `@${handleFor(c, 'youtube')}`, thumbnails: { default: { url: avatar }, medium: { url: avatar }, high: { url: avatar } } },
          statistics: { viewCount: String(posts.reduce((n, x) => n + x.views, 0)), subscriberCount: String(p.followers), hiddenSubscriberCount: false, videoCount: String(posts.length) },
        },
      ],
    });
  }

  if (path === '/youtube/v3/playlistItems') {
    const playlist = url.searchParams.get('playlistId') ?? '';
    const owner = Object.values(CREATORS).find((x) => channelIdFor(x).replace(/^UC/, 'UU') === playlist);
    if (!owner) return googleError(res, 404, 'playlistNotFound', 'The playlist identified with the request\'s <code>playlistId</code> parameter cannot be found.', 'NOT_FOUND');
    const all = postsFor(owner, 'youtube');
    const start = Number(url.searchParams.get('pageToken') ?? 0) || 0;
    const size = Math.min(Number(url.searchParams.get('maxResults') ?? 5) || 5, 50);
    const slice = all.slice(start, start + size);
    const end = start + slice.length;
    return json(res, 200, {
      kind: 'youtube#playlistItemListResponse',
      pageInfo: { totalResults: all.length, resultsPerPage: size },
      ...(end < all.length && { nextPageToken: String(end) }),
      items: slice.map((v) => ({ kind: 'youtube#playlistItem', contentDetails: { videoId: v.id, videoPublishedAt: iso(v.publishedAt) } })),
    });
  }

  if (path === '/youtube/v3/videos') {
    const ids = (url.searchParams.get('id') ?? '').split(',').filter(Boolean).slice(0, 50);
    const posts = postsFor(c, 'youtube').filter((v) => ids.includes(v.id)).reverse(); // the API does not promise an order
    return json(res, 200, {
      kind: 'youtube#videoListResponse',
      pageInfo: { totalResults: posts.length, resultsPerPage: posts.length },
      items: posts.map((v) => {
        const thumb = `${origin}/cover/${v.id}.svg?t=${encodeURIComponent(v.title)}`;
        return {
          kind: 'youtube#video',
          id: v.id,
          snippet: { publishedAt: iso(v.publishedAt), title: v.title, thumbnails: { default: { url: thumb }, medium: { url: thumb }, high: { url: thumb } } },
          contentDetails: { duration: duration(v.durationSeconds) },
          statistics: { viewCount: String(v.views), likeCount: String(v.likes), commentCount: String(v.comments) },
        };
      }),
    });
  }

  return text(res, 404, 'not found');
}
