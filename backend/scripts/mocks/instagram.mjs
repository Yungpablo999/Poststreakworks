// A stand-in for "Instagram API with Instagram Login" for trying the connection on localhost. It
// answers the same endpoints, with the same shapes, as far as PostStreak uses them (checked
// against developers.facebook.com/docs/instagram-platform on 2026-10-03):
//   GET  www.instagram.com/oauth/authorize        a page where you pick which stand-in creator you are
//   POST api.instagram.com/oauth/access_token     code → short-lived token
//   GET  graph.instagram.com/access_token         short-lived → 60-day token   (ig_exchange_token)
//   GET  graph.instagram.com/refresh_access_token extend a 60-day token        (ig_refresh_token)
//   GET  graph.instagram.com/v25.0/me             profile and counts
//   GET  graph.instagram.com/v25.0/me/media       posts, paged
//   GET  graph.instagram.com/v25.0/{id}/insights  views, reach, saved, shares
// plus /_control/* to break a connection on purpose, and /cover/* for pictures.
import { creatorForKey } from './creators.mjs';
import { json, readForm, text } from './http.mjs';
import { postsFor, profileFor, userIdFor } from './others.mjs';
import { consent, control, creatorOfCode, keyOfToken, metaError, metaPage, rand, route, serveCover } from './shared.mjs';

const SCOPES = ['instagram_business_basic', 'instagram_business_manage_insights'];
const broken = new Set(); // creator keys whose tokens are rejected until they connect again

const stamp = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, '+0000');

/** The creator behind `?access_token=`, or an error reply has been sent. */
function whoIs(url, res) {
  const token = url.searchParams.get('access_token') ?? '';
  const key = keyOfToken(token, 'IGL') ?? keyOfToken(token, 'IGS');
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

const longLived = (key) => ({ access_token: `IGL.${key}.${rand()}`, token_type: 'bearer', expires_in: 5_184_000 });

export async function handle(req, res, url, origin) {
  if (control(res, url, broken)) return;
  if (req.method === 'GET' && url.pathname.startsWith('/cover/')) return serveCover(res, url);

  const { host, path } = route(url);

  if (req.method === 'GET' && host === 'www.instagram.com' && path === '/oauth/authorize') {
    return consent(res, url, {
      provider: 'Instagram',
      scopes: (url.searchParams.get('scope') ?? SCOPES.join(',')).split(/[,\s]+/).filter(Boolean),
      codeFor: (c) => `mockcode.${c.key}.${rand()}`,
      fragment: '#_', // Instagram adds this to the address it sends people back to
    });
  }

  if (req.method === 'POST' && host === 'api.instagram.com' && path === '/oauth/access_token') {
    const form = await readForm(req);
    const creator = form.grant_type === 'authorization_code' ? creatorOfCode(form.code) : null;
    if (!creator) return json(res, 400, { error_type: 'OAuthException', code: 400, error_message: 'Invalid authorization code' });
    broken.delete(creator.key); // connecting again fixes an expired connection
    return json(res, 200, {
      data: [{ access_token: `IGS.${creator.key}.${rand()}`, user_id: userIdFor(creator, 'instagram'), permissions: SCOPES.join(',') }],
    });
  }

  if (host === 'graph.instagram.com' && req.method === 'GET') {
    if (path === '/access_token') {
      const key = keyOfToken(url.searchParams.get('access_token'), 'IGS');
      if (url.searchParams.get('grant_type') !== 'ig_exchange_token' || !creatorForKey(key)) return metaError(res, 400, 190, 'Invalid OAuth access token');
      return json(res, 200, longLived(key));
    }
    if (path === '/refresh_access_token') {
      const c = whoIs(url, res);
      if (!c) return;
      if (url.searchParams.get('grant_type') !== 'ig_refresh_token') return metaError(res, 400, 100, 'Invalid grant_type', 'IGApiException');
      return json(res, 200, longLived(c.key));
    }

    const sub = /^\/v\d+\.\d+(\/.*)$/.exec(path)?.[1];
    if (sub) {
      const c = whoIs(url, res);
      if (!c) return;

      if (sub === '/me') {
        const p = profileFor(c, 'instagram');
        const fields = (url.searchParams.get('fields') ?? 'user_id,username').split(',');
        const all = {
          id: userIdFor(c, 'instagram'),
          user_id: userIdFor(c, 'instagram'),
          username: p.handle,
          name: c.name,
          account_type: 'CREATOR',
          profile_picture_url: `${origin}/cover/avatar-${c.key}-instagram.svg`,
          followers_count: p.followers,
          follows_count: p.following,
          media_count: p.posts,
        };
        return json(res, 200, Object.fromEntries(Object.entries(all).filter(([k]) => k === 'id' || fields.includes(k))));
      }

      if (sub === '/me/media') {
        const posts = postsFor(c, 'instagram');
        return json(
          res,
          200,
          metaPage(posts, url, origin, (post) => {
            const i = posts.indexOf(post);
            const isImage = i % 3 === 2;
            return {
              id: post.id,
              caption: `${post.title}\n#${c.niche}`,
              media_type: isImage ? 'IMAGE' : 'VIDEO',
              media_product_type: isImage ? 'FEED' : 'REELS',
              permalink: `https://www.instagram.com/${isImage ? 'p' : 'reel'}/${post.id.slice(-11)}/`,
              ...(isImage ? { media_url: `${origin}/cover/${post.id}.svg?t=${encodeURIComponent(post.title)}` } : { thumbnail_url: `${origin}/cover/${post.id}.svg?t=${encodeURIComponent(post.title)}` }),
              timestamp: stamp(post.publishedAt),
              like_count: post.likes,
              comments_count: post.comments,
            };
          }),
        );
      }

      const insights = /^\/([^/]+)\/insights$/.exec(sub);
      if (insights) {
        const post = postsFor(c, 'instagram').find((x) => x.id === insights[1]);
        if (!post) return metaError(res, 400, 100, 'Unsupported get request. Object does not exist.', 'GraphMethodException');
        const values = { views: post.views, reach: Math.round(post.views * 0.8), saved: post.saves, shares: post.shares };
        const metrics = (url.searchParams.get('metric') ?? '').split(',').filter((m) => m in values);
        return json(res, 200, {
          data: metrics.map((name) => ({ name, period: 'lifetime', values: [{ value: values[name] }], title: name, description: name, id: `${post.id}/insights/${name}/lifetime` })),
        });
      }
    }
  }

  return text(res, 404, 'not found');
}
