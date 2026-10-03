// A stand-in for the Threads API for trying the connection on localhost. Same endpoints and shapes
// as far as PostStreak uses them (checked against developers.facebook.com/docs/threads on 2026-10-03):
//   GET  threads.com/oauth/authorize                  a page where you pick which stand-in creator you are
//   POST graph.threads.com/oauth/access_token         code → short-lived token
//   GET  graph.threads.com/access_token               short-lived → 60-day token   (th_exchange_token)
//   GET  graph.threads.com/refresh_access_token       extend a 60-day token        (th_refresh_token)
//   GET  graph.threads.com/v1.0/me                    profile
//   GET  graph.threads.com/v1.0/{user}/threads_insights   followers_count
//   GET  graph.threads.com/v1.0/me/threads            posts, paged
//   GET  graph.threads.com/v1.0/{id}/insights         views, likes, replies, reposts, quotes, shares
// plus /_control/* to break a connection on purpose, and /cover/* for pictures.
import { creatorForKey } from './creators.mjs';
import { json, readForm, text } from './http.mjs';
import { postsFor, profileFor, userIdFor } from './others.mjs';
import { consent, control, creatorOfCode, keyOfToken, metaError, metaPage, rand, route, serveCover } from './shared.mjs';

const SCOPES = ['threads_basic', 'threads_manage_insights'];
const broken = new Set();

const stamp = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, '+0000');

function whoIs(url, res) {
  const token = url.searchParams.get('access_token') ?? '';
  const key = keyOfToken(token, 'THL') ?? keyOfToken(token, 'THS');
  const creator = creatorForKey(key);
  if (!creator) {
    metaError(res, 400, 190, 'Invalid OAuth access token - Cannot parse access token');
    return null;
  }
  if (broken.has(key)) {
    metaError(res, 400, 190, 'Error validating access token: Session has expired');
    return null;
  }
  return creator;
}

const longLived = (key) => ({ access_token: `THL.${key}.${rand()}`, token_type: 'bearer', expires_in: 5_184_000 });

export async function handle(req, res, url, origin) {
  if (control(res, url, broken)) return;
  if (req.method === 'GET' && url.pathname.startsWith('/cover/')) return serveCover(res, url);

  const { host, path } = route(url);

  if (req.method === 'GET' && host === 'threads.com' && path === '/oauth/authorize') {
    return consent(res, url, {
      provider: 'Threads',
      scopes: (url.searchParams.get('scope') ?? SCOPES.join(',')).split(/[,\s]+/).filter(Boolean),
      codeFor: (c) => `mockcode.${c.key}.${rand()}`,
      fragment: '#_',
    });
  }

  if (host !== 'graph.threads.com') return text(res, 404, 'not found');

  if (req.method === 'POST' && path === '/oauth/access_token') {
    const form = await readForm(req);
    const creator = form.grant_type === 'authorization_code' ? creatorOfCode(form.code) : null;
    if (!creator) return json(res, 400, { error_type: 'OAuthException', code: 400, error_message: 'Invalid authorization code' });
    broken.delete(creator.key);
    return json(res, 200, { access_token: `THS.${creator.key}.${rand()}`, user_id: userIdFor(creator, 'threads') });
  }

  if (req.method !== 'GET') return text(res, 404, 'not found');

  if (path === '/access_token') {
    const key = keyOfToken(url.searchParams.get('access_token'), 'THS');
    if (url.searchParams.get('grant_type') !== 'th_exchange_token' || !creatorForKey(key)) return metaError(res, 400, 190, 'Invalid OAuth access token');
    return json(res, 200, longLived(key));
  }
  if (path === '/refresh_access_token') {
    const c = whoIs(url, res);
    if (!c) return;
    if (url.searchParams.get('grant_type') !== 'th_refresh_token') return metaError(res, 400, 100, 'Invalid grant_type');
    return json(res, 200, longLived(c.key));
  }

  const sub = /^\/v\d+\.\d+(\/.*)$/.exec(path)?.[1];
  if (!sub) return text(res, 404, 'not found');
  const c = whoIs(url, res);
  if (!c) return;

  if (sub === '/me') {
    const p = profileFor(c, 'threads');
    const fields = (url.searchParams.get('fields') ?? 'id,username').split(',');
    const all = { id: userIdFor(c, 'threads'), username: p.handle, name: c.name, threads_profile_picture_url: `${origin}/cover/avatar-${c.key}-threads.svg` };
    return json(res, 200, Object.fromEntries(Object.entries(all).filter(([k]) => k === 'id' || fields.includes(k))));
  }

  const userInsights = /^\/([^/]+)\/threads_insights$/.exec(sub);
  if (userInsights) {
    if (userInsights[1] !== userIdFor(c, 'threads') && userInsights[1] !== 'me') return metaError(res, 400, 100, 'Unsupported get request. Object does not exist.', 'GraphMethodException');
    const wanted = (url.searchParams.get('metric') ?? '').split(',');
    const p = profileFor(c, 'threads');
    return json(res, 200, {
      data: wanted.includes('followers_count') ? [{ name: 'followers_count', period: 'lifetime', total_value: { value: p.followers }, title: 'Followers', description: 'Followers', id: `${userIdFor(c, 'threads')}/threads_insights/followers_count/lifetime` }] : [],
    });
  }

  if (sub === '/me/threads') {
    const posts = postsFor(c, 'threads');
    return json(
      res,
      200,
      metaPage(posts, url, origin, (post) => ({
        id: post.id,
        text: `${post.title}\nWhat do you think?`,
        media_type: 'TEXT_POST',
        permalink: `https://www.threads.com/@${profileFor(c, 'threads').handle}/post/${post.id.slice(-11)}`,
        timestamp: stamp(post.publishedAt),
      })),
    );
  }

  const insights = /^\/([^/]+)\/insights$/.exec(sub);
  if (insights) {
    const post = postsFor(c, 'threads').find((x) => x.id === insights[1]);
    if (!post) return metaError(res, 400, 100, 'Unsupported get request. Object does not exist.', 'GraphMethodException');
    const values = { views: post.views, likes: post.likes, replies: post.comments, reposts: Math.round(post.shares * 0.6), quotes: Math.round(post.shares * 0.2), shares: Math.round(post.shares * 0.2) };
    const metrics = (url.searchParams.get('metric') ?? '').split(',').filter((m) => m in values);
    return json(res, 200, {
      data: metrics.map((name) => ({ name, period: 'lifetime', values: [{ value: values[name] }], title: name, description: name, id: `${post.id}/insights/${name}/lifetime` })),
    });
  }

  return text(res, 404, 'not found');
}
