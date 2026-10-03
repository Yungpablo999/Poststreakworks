// A stand-in for Facebook Login + the Pages API for trying the connection on localhost. Same
// endpoints and shapes as far as PostStreak uses them (checked against developers.facebook.com
// on 2026-10-03):
//   GET  www.facebook.com/v25.0/dialog/oauth       a page where you pick which stand-in creator you are
//   GET  graph.facebook.com/v25.0/oauth/access_token   code → user token, and user token → long-lived (fb_exchange_token)
//   GET  graph.facebook.com/v25.0/me/accounts      the Pages the person manages, each with its own token
//   GET  graph.facebook.com/v25.0/me               with a Page token: the Page
//   GET  graph.facebook.com/v25.0/me/posts         the Page's posts, paged
//   GET  graph.facebook.com/v25.0/{id}/insights    post_media_view
// Each creator manages a big Page and a small old one, so choosing the right Page is exercised; one
// extra test person manages no Page at all. /_control/* breaks a connection on purpose.
import { creatorForKey } from './creators.mjs';
import { json, text } from './http.mjs';
import { NO_PAGE, pageIdFor, postsFor, profileFor } from './others.mjs';
import { consent, control, creatorOfCode, keyOfToken, metaError, metaPage, rand, route, serveCover } from './shared.mjs';

const SCOPES = ['pages_show_list', 'pages_read_engagement', 'read_insights'];
const broken = new Set();

const stamp = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, '+0000');
const firstName = (c) => c.name.split(' ')[0];

/** The Pages a creator manages: [0] is the real one; [1] a small old Page (listed first, as Facebook does not sort). */
function pagesOf(c, origin) {
  const p = profileFor(c, 'facebook');
  const main = { idx: 0, id: pageIdFor(c), name: `${c.name}`, username: p.handle, followers: p.followers, fans: Math.round(p.followers * 0.97), picture: `${origin}/cover/avatar-${c.key}-facebook.svg` };
  const old = { idx: 1, id: String(Number(pageIdFor(c)) + 1), name: `Old ${firstName(c)} page`, username: null, followers: 14, fans: 14, picture: `${origin}/cover/avatar-${c.key}-old.svg` };
  return [old, main];
}

/** The creator and (for a Page token) which Page, or an error reply has been sent. */
function whoIs(url, res) {
  const token = url.searchParams.get('access_token') ?? '';
  const prefix = ['FBP', 'FBU', 'FBS'].find((p) => token.startsWith(`${p}.`));
  const key = prefix ? keyOfToken(token, prefix) : null;
  const creator = creatorForKey(key);
  if (!creator) {
    metaError(res, 400, 190, 'Invalid OAuth access token - Cannot parse access token');
    return null;
  }
  if (broken.has(key)) {
    metaError(res, 400, 190, 'Error validating access token: Session has expired');
    return null;
  }
  return { creator, kind: prefix, pageIdx: prefix === 'FBP' ? Number(token.split('.')[2]) : null };
}

export async function handle(req, res, url, origin) {
  if (control(res, url, broken)) return;
  if (req.method === 'GET' && url.pathname.startsWith('/cover/')) return serveCover(res, url);

  const { host, path } = route(url);

  if (req.method === 'GET' && host === 'www.facebook.com' && /^\/v\d+\.\d+\/dialog\/oauth$/.test(path)) {
    return consent(res, url, {
      provider: 'Facebook',
      scopes: (url.searchParams.get('scope') ?? SCOPES.join(',')).split(/[,\s]+/).filter(Boolean),
      codeFor: (c) => `mockcode.${c.key}.${rand()}`,
      extra: [NO_PAGE],
      denied: { error: 'access_denied', error_code: '200', error_description: 'Permissions error', error_reason: 'user_denied' },
      fragment: '#_=_', // Facebook adds this to the address it sends people back to
    });
  }

  if (host !== 'graph.facebook.com' || req.method !== 'GET') return text(res, 404, 'not found');
  const sub = /^\/v\d+\.\d+(\/.*)$/.exec(path)?.[1];
  if (!sub) return text(res, 404, 'not found');

  if (sub === '/oauth/access_token') {
    if (url.searchParams.get('grant_type') === 'fb_exchange_token') {
      const short = url.searchParams.get('fb_exchange_token') ?? '';
      const key = keyOfToken(short, 'FBS');
      if (!creatorForKey(key) && key !== NO_PAGE.key) return metaError(res, 400, 190, 'Invalid OAuth access token');
      return json(res, 200, { access_token: `FBU.${key}.${rand()}`, token_type: 'bearer', expires_in: 5_183_999 });
    }
    const creator = creatorOfCode(url.searchParams.get('code'), [NO_PAGE]);
    if (!creator) return metaError(res, 400, 100, 'This authorization code has been used.');
    broken.delete(creator.key);
    return json(res, 200, { access_token: `FBS.${creator.key}.${rand()}`, token_type: 'bearer', expires_in: 5000 });
  }

  // The no-Page person is a real Facebook user for /me/accounts, with nothing to list
  const token = url.searchParams.get('access_token') ?? '';
  if (sub === '/me/accounts' && keyOfToken(token, 'FBU') === NO_PAGE.key) return json(res, 200, { data: [] });

  const who = whoIs(url, res);
  if (!who) return;
  const { creator: c, kind, pageIdx } = who;

  if (sub === '/me/accounts') {
    if (kind !== 'FBU') return metaError(res, 400, 190, 'This call needs a user token');
    return json(res, 200, {
      data: pagesOf(c, origin).map((pg) => ({ id: pg.id, name: pg.name, access_token: `FBP.${c.key}.${pg.idx}.${rand()}`, followers_count: pg.followers, fan_count: pg.fans, category: 'Creator' })),
    });
  }

  if (kind !== 'FBP') return metaError(res, 400, 100, 'This call needs a Page token');
  const page = pagesOf(c, origin).find((pg) => pg.idx === pageIdx);

  if (sub === '/me') {
    const fields = (url.searchParams.get('fields') ?? 'id,name').split(',');
    const all = { id: page.id, name: page.name, username: page.username, followers_count: page.followers, fan_count: page.fans };
    const body = Object.fromEntries(Object.entries(all).filter(([k, v]) => v !== null && (k === 'id' || fields.includes(k))));
    if (fields.some((f) => f.startsWith('picture'))) body.picture = { data: { height: 200, width: 200, is_silhouette: false, url: page.picture } };
    return json(res, 200, body);
  }

  if (sub === '/me/posts') {
    const posts = page.idx === 0 ? postsFor(c, 'facebook') : [];
    return json(
      res,
      200,
      metaPage(posts, url, origin, (post) => ({
        id: post.id,
        message: `${post.title}\nTell me what you think below.`,
        created_time: stamp(post.publishedAt),
        permalink_url: `https://www.facebook.com/${post.id.replace('_', '/posts/')}`,
        full_picture: `${origin}/cover/${post.id}.svg?t=${encodeURIComponent(post.title)}`,
        shares: { count: post.shares },
        reactions: { data: [], summary: { total_count: post.likes, viewer_reaction: 'NONE' } },
        comments: { data: [], summary: { order: 'ranked', total_count: post.comments, can_comment: true } },
      })),
    );
  }

  const insights = /^\/([^/]+)\/insights$/.exec(sub);
  if (insights) {
    const post = postsFor(c, 'facebook').find((x) => x.id === insights[1]);
    if (!post) return metaError(res, 400, 100, 'Unsupported get request. Object does not exist.', 'GraphMethodException');
    const metrics = (url.searchParams.get('metric') ?? '').split(',').filter((m) => m === 'post_media_view');
    return json(res, 200, {
      data: metrics.map((name) => ({ name, period: 'lifetime', values: [{ value: post.views }], title: 'Media views', description: 'Media views', id: `${post.id}/insights/${name}/lifetime` })),
    });
  }

  return text(res, 404, 'not found');
}
