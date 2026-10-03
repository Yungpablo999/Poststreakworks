// The same four stand-in creators on Instagram, Threads, Facebook and YouTube. Their audience on
// each is a fraction of their TikTok one, they post a different amount, and views add up
// differently, so the connected screens show believable, different numbers per platform.
// Local testing only: nothing here is ever used by a deployed server.
import { CREATORS, DAY, TITLES, followersToday, rng } from './creators.mjs';

const SCALE = {
  instagram: { followers: 0.8, posts: 0.9, views: 0.7, likeRate: 0.07, idBase: 17_900_000_000_000_000n },
  threads: { followers: 0.35, posts: 1.1, views: 0.4, likeRate: 0.06, idBase: 18_100_000_000_000_000n },
  facebook: { followers: 0.5, posts: 0.6, views: 0.5, likeRate: 0.03, idBase: 0n },
  youtube: { followers: 0.25, posts: 0.35, views: 0.9, likeRate: 0.04, idBase: 0n },
};

/** The @handle on a platform, e.g. ada_creates. */
export const handleFor = (c, platform) => `${c.key.split('_')[0]}_${platform === 'youtube' ? 'channel' : platform === 'facebook' ? 'studio' : 'creates'}`;

/** A Facebook Page id for the creator. */
export const pageIdFor = (c) => String(1_000_000_000_000 + c.followers * 31 + c.key.length);
/** The Instagram / Threads user id for the creator. */
export const userIdFor = (c, platform) =>
  String((platform === 'threads' ? 26_000_000_000_000_000n : 17_841_000_000_000_000n) + BigInt(c.followers) * 17n + BigInt(c.key.length));
/** The YouTube channel id for the creator (24 characters starting UC). */
export const channelIdFor = (c) =>
  `UC${Buffer.from(`${c.key}:channel`).toString('base64url').replace(/[^A-Za-z0-9]/g, 'x').padEnd(22, 'q').slice(0, 22)}`;

const YT_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

/** The creator's posts on a platform, newest first, with their numbers. */
export function postsFor(c, platform, now = Date.now()) {
  const s = SCALE[platform];
  const titles = TITLES[c.niche] ?? TITLES.lifestyle;
  const r = rng(`${c.key}:${platform}:posts`);
  const count = Math.max(2, Math.round(c.videos * s.posts));
  const out = [];
  let ageDays = 0.6 + r() * 1.6;
  for (let i = 0; i < count; i++) {
    const popularity = 0.35 + r() * 1.9 + (r() < 0.12 ? 2.5 : 0);
    const maturity = 1 - Math.exp(-ageDays / 4);
    const views = Math.round(c.viewsBase * s.views * popularity * (0.25 + maturity));
    const base = titles[(i + platform.length) % titles.length];
    let id;
    if (platform === 'youtube') {
      const rr = rng(`${c.key}:yt:${i}`);
      id = Array.from({ length: 11 }, () => YT_ALPHABET[Math.floor(rr() * 64)]).join('');
    } else if (platform === 'facebook') {
      id = `${pageIdFor(c)}_${100_000_000 + i * 7919 + c.followers}`;
    } else {
      id = String(s.idBase + BigInt(i * 7919 + c.followers * 13));
    }
    out.push({
      id,
      title: i < titles.length ? base : `${base} (part ${Math.floor(i / titles.length) + 1})`,
      publishedAt: now - ageDays * DAY,
      durationSeconds: platform === 'youtube' ? 90 + Math.floor(r() * 500) : 12 + Math.floor(r() * 48),
      views,
      likes: Math.round(views * s.likeRate * (0.6 + r() * 1.2)),
      comments: Math.round(views * (0.002 + r() * 0.006)),
      shares: Math.round(views * (0.003 + r() * 0.01)),
      saves: Math.round(views * (0.004 + r() * 0.012)),
    });
    ageDays += (platform === 'youtube' ? 3 : 1.1) + r() * 3.2;
  }
  return out;
}

/** Account-level numbers on a platform, today. */
export function profileFor(c, platform, now = Date.now()) {
  return {
    handle: handleFor(c, platform),
    followers: Math.max(1, Math.round(followersToday(c, now) * SCALE[platform].followers)),
    following: 60 + ((c.key.length * 7) % 140),
    posts: postsFor(c, platform, now).length,
  };
}

/**
 * People who start connecting but can't finish, so you can see what the app says: a Facebook
 * account that manages no Page, a Google account with no YouTube channel.
 */
export const NO_PAGE = { key: 'nopage', name: 'Eze Okafor (manages no Facebook Page)', niche: 'lifestyle', followers: 0, perDay: 0, videos: 0, viewsBase: 0 };
export const NO_CHANNEL = { key: 'nochannel', name: 'Funmi Ade (no YouTube channel)', niche: 'lifestyle', followers: 0, perDay: 0, videos: 0, viewsBase: 0 };

export { CREATORS };
