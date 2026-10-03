// End-to-end check of planning and posting, on your machine: the real API, the real database
// with its row-level security, and the cron that makes a planned post "ready to post". New
// throwaway creators sign in with real emailed codes, plan posts the way the app does, and the
// script then looks at what the API, the calendar, the bell and the database say.
//
//   1. npm run local              (from the repository root; wait for "PostStreak is running")
//   2. cd backend && node scripts/e2e-posts.mjs
//
// It only runs against a database on this machine. The creators it makes are deleted at the end.
// Exits 1 if any check fails.
import { API, SB, ANON, asCreatorDirect, asService, api, check, deleteCreators, env, finish, json, section, signIn, sleep } from './e2e-lib.mjs';

const stamp = Date.now();
const minutes = (n) => new Date(Date.now() + n * 60_000).toISOString();
const days = (n) => new Date(Date.now() + n * 86_400_000).toISOString();
const dispatch = (secret = env.CRON_SECRET) => fetch(`${API}/api/cron/dispatch`, { headers: secret ? { authorization: `Bearer ${secret}` } : {} });

section('the stack');
{
  const api0 = await fetch(`${API}/api/v1/dev/login`).catch(() => null);
  check('the API is running', !!api0 && api0.status < 500, api0?.status);
  check('the cron secret is set for the API', !!env.CRON_SECRET);
}

section('two new creators (real emailed codes)');
const ada = await signIn(`posts-ada+${stamp}@example.com`);
const bayo = await signIn(`posts-bayo+${stamp}@example.com`);
const A = api(ada.token);
const B = api(bayo.token);
const direct = asCreatorDirect(ada.token);
const created = [ada.userId, bayo.userId];
check('two creators', !!ada.token && !!bayo.token);
{
  const boot = await A('GET', '/api/v1/me/bootstrap');
  check('the first starts as a new creator, with no post made', boot.body?.persona === 'new', boot.body?.persona);
}

// ─── Nobody writes a post but the server ─────────────────────────────────────

section('a creator cannot write posts themselves');
{
  const row = { user_id: ada.userId, content: 'never happened', target_platforms: ['tiktok'], scheduled_at: new Date().toISOString(), status: 'published', published_at: new Date().toISOString() };
  const mint = await direct('POST', 'scheduled_posts', row);
  check('inserting a "published" post straight into the database is refused', mint.status === 401 || mint.status === 403, mint);
  const made = await asService('GET', `scheduled_posts?user_id=eq.${ada.userId}&select=id`);
  check('and nothing was stored', made.body.length === 0, made.body);

  const planned = await A('POST', '/api/v1/posts', { caption: 'A real one', platforms: ['tiktok'], when: 'schedule', at: minutes(120) });
  check('a post made through the API is stored', planned.status === 200 && planned.body?.id, planned);
  const patch = await direct('PATCH', `scheduled_posts?id=eq.${planned.body.id}`, { status: 'published' });
  check('marking it published straight in the database is refused', patch.status === 401 || patch.status === 403, patch);
  const del = await direct('DELETE', `scheduled_posts?id=eq.${planned.body.id}`);
  check('deleting it straight in the database is refused', del.status === 401 || del.status === 403, del);
  const still = await asService('GET', `scheduled_posts?id=eq.${planned.body.id}&select=status,content`);
  check('it is untouched', still.body?.[0]?.status === 'scheduled' && still.body[0].content === 'A real one', still.body);

  const read = await direct('GET', 'scheduled_posts?select=content');
  check('a creator can read their own posts', read.status === 200 && read.body.length === 1, read);
  const bayoRead = await asCreatorDirect(bayo.token)('GET', 'scheduled_posts?select=content');
  check('and no one else’s', bayoRead.status === 200 && bayoRead.body.length === 0, bayoRead);

  const rel = await direct('POST', 'rpc/release_due_posts', {});
  const conf = await direct('POST', 'rpc/confirm_post_platform', { p_user_id: ada.userId, p_post_id: planned.body.id, p_platform: 'tiktok' });
  check('the database functions that move a post along are not theirs to call', [rel.status, conf.status].every((s) => s === 401 || s === 403 || s === 404), [rel.status, conf.status]);
  await A('DELETE', `/api/v1/posts/${planned.body.id}`);
}

// ─── Making a post ───────────────────────────────────────────────────────────

section('planning a post: what is refused');
{
  const refusals = [
    ['no caption', { caption: '   ', platforms: ['tiktok'], when: 'schedule', at: minutes(60) }, /caption/i],
    ['no platform', { caption: 'x', platforms: [], when: 'schedule', at: minutes(60) }, /platform/i],
    ['a platform PostStreak does not post for', { caption: 'x', platforms: ['linkedin'], when: 'schedule', at: minutes(60) }, /TikTok, Instagram/],
    ['a time that has passed', { caption: 'x', platforms: ['tiktok'], when: 'schedule', at: minutes(-5) }, /already passed/],
    ['no time', { caption: 'x', platforms: ['tiktok'], when: 'schedule' }, /day and time/],
    ['a time more than a year away', { caption: 'x', platforms: ['tiktok'], when: 'schedule', at: days(400) }, /year/],
    ['a format that is not one', { caption: 'x', platforms: ['tiktok'], when: 'now', format: 'podcast' }, /format/],
    ['neither now nor a time', { caption: 'x', platforms: ['tiktok'], when: 'someday' }, null],
    ['a caption over 5,000 characters', { caption: 'x'.repeat(5001), platforms: ['tiktok'], when: 'now' }, /5,000/],
  ];
  for (const [what, body, message] of refusals) {
    const r = await A('POST', '/api/v1/posts', body);
    check(`${what} is refused (400)`, r.status === 400 && (!message || message.test(r.body?.message ?? '')), r);
  }
  const noJson = await fetch(`${API}/api/v1/posts`, { method: 'POST', headers: { authorization: `Bearer ${ada.token}`, 'content-type': 'application/json' }, body: '{nope' });
  check('a request that is not JSON is refused (400)', noJson.status === 400, noJson.status);
  const anon = await fetch(`${API}/api/v1/posts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  check('and so is someone not signed in (401)', anon.status === 401, anon.status);
  check('nothing was stored by any of that', (await asService('GET', `scheduled_posts?user_id=eq.${ada.userId}&select=id`)).body.length === 0);
}

section('planning a post: a post for a time');
let adaPost;
{
  const r = await A('POST', '/api/v1/posts', {
    caption: '  My morning reset\nThe three things I do before my phone.  ',
    tags: ['habits', '#Habits', ' # Daily Routine ', '#morning'],
    platforms: ['tiktok', 'instagram'],
    format: 'short_video',
    when: 'schedule',
    at: minutes(180),
  });
  adaPost = r.body;
  check('it is made (200)', r.status === 200 && adaPost?.id, r);
  check('the caption is tidied and the tags are normalised, each once', adaPost?.caption.startsWith('My morning reset\n') && adaPost.tags.join(' ') === '#habits #DailyRoutine #morning', adaPost);
  check('it waits for its time, on each platform', adaPost?.state === 'scheduled' && adaPost.platforms.map((p) => `${p.platform}:${p.state}`).join() === 'tiktok:waiting,instagram:waiting', adaPost?.platforms);
  check('it keeps its format and is due when asked', adaPost?.format === 'short_video' && Math.abs(Date.parse(adaPost.at) - Date.now() - 180 * 60_000) < 60_000, adaPost?.at);

  const got = await A('GET', `/api/v1/posts/${adaPost.id}`);
  check('it can be read back (200)', got.status === 200 && got.body.caption === adaPost.caption, got.status);
  const stranger = await B('GET', `/api/v1/posts/${adaPost.id}`);
  check('another creator cannot read it (404)', stranger.status === 404, stranger);
  const notReady = await A('GET', '/api/v1/posts?state=ready');
  check('it is not ready yet', notReady.status === 200 && notReady.body.posts.length === 0, notReady);
  const bad = await A('GET', '/api/v1/posts');
  check('asking for the list without saying which is refused (400)', bad.status === 400, bad.status);

  const cal = await A('GET', `/api/v1/calendar?from=${encodeURIComponent(days(-1))}&to=${encodeURIComponent(days(2))}`);
  const mine = (cal.body?.items ?? []).filter((i) => i.id === adaPost.id);
  check('the calendar shows it once for each platform, as scheduled', cal.status === 200 && mine.length === 2 && mine.every((i) => i.status === 'scheduled' && i.kind === 'scheduled'), cal.body);
}

section('planning a post: a draft becomes the post');
{
  const key = `post-e2e-${stamp}`;
  const saved = await A('PUT', `/api/v1/drafts/${encodeURIComponent(key)}`, { title: 'From a draft', kind: 'post', format: 'Short Video', platform: 'tiktok', payload: { caption: 'Draft words' } });
  check('a draft is saved with its words', saved.status === 200, saved);
  const post = await A('POST', '/api/v1/posts', { caption: 'Draft words', platforms: ['tiktok'], when: 'schedule', at: minutes(240), fromDraft: key });
  check('the post is made from it', post.status === 200, post);
  const left = await asService('GET', `drafts?user_id=eq.${ada.userId}&client_key=eq.${encodeURIComponent(key)}&select=id`);
  check('and the draft is gone', left.body.length === 0, left.body);
  await A('DELETE', `/api/v1/posts/${post.body.id}`);
}

// ─── The time comes ──────────────────────────────────────────────────────────

section('the time comes (the cron)');
let readyPost;
{
  const soon = await A('POST', '/api/v1/posts', { caption: 'Due in a moment', platforms: ['tiktok'], when: 'schedule', at: new Date(Date.now() + 3000).toISOString() });
  readyPost = soon.body;
  check('a post due in three seconds is made', soon.status === 200, soon);
  const early = await dispatch();
  check('the cron runs with its secret (200)', early.status === 200, early.status);
  check('before its time it is still waiting', (await A('GET', `/api/v1/posts/${readyPost.id}`)).body?.state === 'scheduled');

  await sleep(3500);
  const ran = await dispatch();
  const body = await json(ran);
  check('the cron runs and reports what it did', ran.status === 200 && typeof body?.posts?.processed === 'number', body);
  const now = await A('GET', `/api/v1/posts/${readyPost.id}`);
  check('it is now ready to post', now.body?.state === 'ready' && now.body.platforms[0].state === 'ready', now.body);

  const ready = await A('GET', '/api/v1/posts?state=ready');
  check('and is on the list of posts ready to post', ready.body?.posts?.length === 1 && ready.body.posts[0].id === readyPost.id, ready.body);

  const feed = await A('GET', '/api/v1/notifications');
  const notes = (feed.body?.items ?? []).filter((n) => n.title === 'Time to post');
  check('the bell has one "Time to post" note, which opens Schedule', notes.length === 1 && notes[0].action?.target === 'schedule' && /Due in a moment/.test(notes[0].body) && /TikTok/.test(notes[0].body), notes);

  await dispatch();
  const again = await A('GET', '/api/v1/notifications');
  check('running the cron again changes nothing and adds no second note', (again.body?.items ?? []).filter((n) => n.title === 'Time to post').length === 1);

  const denied = await dispatch('wrong');
  const none = await dispatch(null);
  check('the cron refuses anyone without its secret (401)', denied.status === 401 && none.status === 401, [denied.status, none.status]);

  const cal = await A('GET', `/api/v1/calendar?from=${encodeURIComponent(days(-1))}&to=${encodeURIComponent(days(2))}`);
  check('the calendar shows it as ready to post', (cal.body?.items ?? []).some((i) => i.id === readyPost.id && i.status === 'ready'), cal.body);
}

section('remind me later');
{
  const moved = await A('PATCH', `/api/v1/posts/${readyPost.id}`, { at: new Date(Date.now() + 3000).toISOString() });
  check('a ready post can be moved to a later time (200)', moved.status === 200 && moved.body.state === 'scheduled' && moved.body.platforms[0].state === 'waiting', moved.body);
  await sleep(3500);
  await dispatch();
  const back = await A('GET', `/api/v1/posts/${readyPost.id}`);
  check('it comes due again', back.body?.state === 'ready', back.body?.state);
  const feed = await A('GET', '/api/v1/notifications');
  check('and the bell reminds again, with a second note', (feed.body?.items ?? []).filter((n) => n.title === 'Time to post').length === 2, (feed.body?.items ?? []).map((n) => n.title));
  const past = await A('PATCH', `/api/v1/posts/${readyPost.id}`, { at: minutes(-1) });
  check('a time that has passed is refused (400)', past.status === 400, past);
}

// ─── Changing a post ─────────────────────────────────────────────────────────

section('changing a post');
{
  const edit = await A('PATCH', `/api/v1/posts/${adaPost.id}`, { caption: 'Better words', tags: ['one', 'two'], format: 'carousel', platforms: ['instagram', 'youtube'] });
  check('caption, tags, format and platforms change (200)', edit.status === 200 && edit.body.caption === 'Better words' && edit.body.tags.join() === '#one,#two' && edit.body.format === 'carousel' && edit.body.platforms.map((p) => p.platform).join() === 'instagram,youtube', edit);
  const empty = await A('PATCH', `/api/v1/posts/${adaPost.id}`, {});
  check('sending nothing changes nothing (200)', empty.status === 200 && empty.body.caption === 'Better words', empty);
  const blank = await A('PATCH', `/api/v1/posts/${adaPost.id}`, { caption: ' ' });
  check('a blank caption is refused (400)', blank.status === 400, blank);
  const theirs = await B('PATCH', `/api/v1/posts/${adaPost.id}`, { caption: 'hijacked' });
  check('another creator cannot change it (404)', theirs.status === 404, theirs);
  check('and it was not changed', (await A('GET', `/api/v1/posts/${adaPost.id}`)).body?.caption === 'Better words');
}

// ─── "I posted it" ───────────────────────────────────────────────────────────

section('"I posted it"');
let streakAfterFirst;
{
  const wrongHost = await A('POST', `/api/v1/posts/${readyPost.id}/posted`, { platform: 'tiktok', url: 'https://www.instagram.com/reel/abc/' });
  check('a link that is not that platform’s is refused (400)', wrongHost.status === 400 && /TikTok link/.test(wrongHost.body?.message ?? ''), wrongHost);
  const wrongPlatform = await A('POST', `/api/v1/posts/${readyPost.id}/posted`, { platform: 'youtube' });
  check('a platform the post was not for is refused (400)', wrongPlatform.status === 400, wrongPlatform);
  const noPlatform = await A('POST', `/api/v1/posts/${readyPost.id}/posted`, {});
  check('and so is no platform (400)', noPlatform.status === 400, noPlatform);
  const theirs = await B('POST', `/api/v1/posts/${readyPost.id}/posted`, { platform: 'tiktok' });
  check('another creator cannot say it was posted (404)', theirs.status === 404, theirs);
  check('none of that posted it', (await A('GET', `/api/v1/posts/${readyPost.id}`)).body?.state === 'ready');

  const done = await A('POST', `/api/v1/posts/${readyPost.id}/posted`, { platform: 'tiktok', url: 'https://www.tiktok.com/@ada/video/7001' });
  check('saying it was posted works (200)', done.status === 200 && done.body.post.state === 'posted' && done.body.post.platforms[0].state === 'posted', done);
  check('and keeps the link and the time', done.body?.post?.platforms[0].url === 'https://www.tiktok.com/@ada/video/7001' && !!done.body.post.platforms[0].postedAt, done.body?.post?.platforms);
  streakAfterFirst = done.body?.streak;
  check('the first post of the day starts the streak', streakAfterFirst?.qualified === true && streakAfterFirst.newStreak === 1, streakAfterFirst);

  const again = await A('POST', `/api/v1/posts/${readyPost.id}/posted`, { platform: 'tiktok', url: 'https://www.tiktok.com/@ada/video/9999' });
  check('saying it twice is harmless: nothing changes and the streak is not counted again', again.status === 200 && again.body.streak === null && again.body.post.platforms[0].url === 'https://www.tiktok.com/@ada/video/7001', again.body);

  const stored = await asService('GET', `scheduled_posts?id=eq.${readyPost.id}&select=status,published_at,platform_post_ids`);
  check('the database says posted, with when', stored.body?.[0]?.status === 'published' && !!stored.body[0].published_at, stored.body);

  const boot = await A('GET', '/api/v1/me/bootstrap');
  check('a creator who has posted is a returning creator', boot.body?.persona === 'returning', boot.body?.persona);
  check('and the post is in their count', (boot.body?.profile?.postsCount ?? 0) >= 1, boot.body?.profile?.postsCount);

  const edit = await A('PATCH', `/api/v1/posts/${readyPost.id}`, { caption: 'rewriting history' });
  check('a post that was posted cannot be changed (409)', edit.status === 409, edit);
  const del = await A('DELETE', `/api/v1/posts/${readyPost.id}`);
  check('or removed (409)', del.status === 409, del);
  const late = await A('POST', `/api/v1/posts/${readyPost.id}/posted`, { platform: 'instagram' });
  check('or posted to somewhere it was not meant for (400)', late.status === 400, late);
}

section('a post for several platforms is posted when all of them are');
{
  const r = await A('POST', '/api/v1/posts', { caption: 'Everywhere at once', platforms: ['tiktok', 'instagram', 'youtube'], when: 'now' });
  const id = r.body?.id;
  check('"post now" makes it ready this moment, on each platform', r.status === 200 && r.body.state === 'ready' && r.body.platforms.every((p) => p.state === 'ready'), r);

  const first = await A('POST', `/api/v1/posts/${id}/posted`, { platform: 'tiktok' });
  check('after TikTok it is still ready, TikTok posted', first.body?.post?.state === 'ready' && first.body.post.platforms.map((p) => p.state).join() === 'posted,ready,ready', first.body?.post);
  check('and the streak does not count a second time today', first.body?.streak?.qualified === false, first.body?.streak);
  const cal = await A('GET', `/api/v1/calendar?from=${encodeURIComponent(days(-1))}&to=${encodeURIComponent(days(2))}`);
  const items = (cal.body?.items ?? []).filter((i) => i.id === id).map((i) => `${i.platform}:${i.status}`).sort();
  check('the calendar shows each platform where it stands', items.join() === 'instagram:ready,tiktok:posted,youtube:ready', items);

  const widen = await A('PATCH', `/api/v1/posts/${id}`, { platforms: ['tiktok'] });
  check('platforms can’t be taken away once one is posted (409)', widen.status === 409, widen);

  await A('POST', `/api/v1/posts/${id}/posted`, { platform: 'instagram' });
  const last = await A('POST', `/api/v1/posts/${id}/posted`, { platform: 'youtube', url: 'https://youtu.be/abc123' });
  check('after the last one it is posted', last.body?.post?.state === 'posted' && last.body.post.platforms.every((p) => p.state === 'posted'), last.body?.post);
  check('and each platform counts as a post made', (await asService('POST', 'rpc/creator_posts', { p_user_id: ada.userId })).body?.length === 4);
}

section('posting early');
{
  const r = await A('POST', '/api/v1/posts', { caption: 'Posted before its time', platforms: ['threads'], when: 'schedule', at: minutes(300) });
  const early = await A('POST', `/api/v1/posts/${r.body.id}/posted`, { platform: 'threads' });
  check('a creator who posted early can say so (200)', early.status === 200 && early.body.post.state === 'posted', early);
  await dispatch();
  check('and the cron leaves it alone', (await A('GET', `/api/v1/posts/${r.body.id}`)).body?.state === 'posted');
}

section('one post, not two: found by a sync after the creator said they posted it');
{
  const r = await A('POST', '/api/v1/posts', { caption: 'Seen on the account', platforms: ['facebook'], when: 'now' });
  await A('POST', `/api/v1/posts/${r.body.id}/posted`, { platform: 'facebook' });
  const before = (await asService('POST', 'rpc/creator_posts', { p_user_id: ada.userId })).body.length;
  await asService('POST', 'post_stats', {
    user_id: ada.userId, platform: 'facebook', platform_post_id: `fb-${stamp}`, title: 'Seen on the account', posted_at: new Date().toISOString(),
    share_url: 'https://www.facebook.com/reel/777', views: 10, likes: 1, comments: 0, shares: 0,
  });
  const after = (await asService('POST', 'rpc/creator_posts', { p_user_id: ada.userId })).body.length;
  check('the account’s own record of it is the same post: the count does not move', after === before, [before, after]);
  const cal = await A('GET', `/api/v1/calendar?from=${encodeURIComponent(days(-1))}&to=${encodeURIComponent(days(2))}`);
  const seen = (cal.body?.items ?? []).filter((i) => i.platform === 'facebook');
  check('and the calendar shows it once, with the platform’s link', seen.length === 1 && seen[0].url === 'https://www.facebook.com/reel/777', seen);
}

// ─── Removing a post ─────────────────────────────────────────────────────────

section('removing a post');
{
  const r = await A('POST', '/api/v1/posts', { caption: 'Changed my mind', platforms: ['tiktok'], when: 'schedule', at: minutes(60) });
  const theirs = await B('DELETE', `/api/v1/posts/${r.body.id}`);
  check('another creator cannot remove it (404)', theirs.status === 404, theirs);
  const del = await A('DELETE', `/api/v1/posts/${r.body.id}`);
  check('a planned post can be removed (200)', del.status === 200 && del.body.removed === true, del);
  check('and is gone (404)', (await A('GET', `/api/v1/posts/${r.body.id}`)).status === 404);
  check('removing it again says it is gone (404)', (await A('DELETE', `/api/v1/posts/${r.body.id}`)).status === 404);

  const soon = await A('POST', '/api/v1/posts', { caption: 'Ready then removed', platforms: ['instagram'], when: 'now' });
  await dispatch();
  await A('DELETE', `/api/v1/posts/${soon.body.id}`);
  const ready = await A('GET', '/api/v1/posts?state=ready');
  check('a ready post that is removed leaves the ready list', !(ready.body?.posts ?? []).some((p) => p.id === soon.body.id));
}

// ─── The cap ─────────────────────────────────────────────────────────────────

section('too many at once');
{
  const open = (await asService('GET', `scheduled_posts?user_id=eq.${bayo.userId}&status=in.(scheduled,pending_confirmation)&select=id`)).body.length;
  const rows = Array.from({ length: 100 - open }, (_, i) => ({ user_id: bayo.userId, content: `filler ${i}`, target_platforms: ['tiktok'], scheduled_at: days(30), status: 'scheduled' }));
  await asService('POST', 'scheduled_posts', rows);
  const over = await B('POST', '/api/v1/posts', { caption: 'one too many', platforms: ['tiktok'], when: 'now' });
  check('at 100 posts waiting, planning another is refused with a clear message (400)', over.status === 400 && /100 posts waiting/.test(over.body?.message ?? ''), over);
}

await deleteCreators(created);
finish();
