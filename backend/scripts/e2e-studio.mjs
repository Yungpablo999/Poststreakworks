// End-to-end check of the writing tools, on your machine: the real API, the real database with its
// row-level security, and the model stand-in that `npm run local` starts when there is no key (or your
// real key, if you pasted one: then only the checks that don't depend on its exact words matter).
// New throwaway creators sign in with real emailed codes and use scripts, hooks, captions, small caption
// edits, Repurpose and Ask Jarvis the way the app does; the script then looks at the allowance the
// server counted.
//
//   1. npm run local              (from the repository root; wait for "PostStreak is running")
//   2. cd backend && node scripts/e2e-studio.mjs
//
// It only runs against a database on this machine. The creators it makes are deleted at the end.
// Exits 1 if any check fails.
import { API, api, asCreatorDirect, asService, check, deleteCreators, finish, makePro, section, signIn } from './e2e-lib.mjs';

const stamp = Date.now();
const standIn = process.env.STAND_IN !== 'false'; // the failure checks need the stand-in's STANDIN_DOWN / STANDIN_JUNK

section('the stack');
{
  const api0 = await fetch(`${API}/api/v1/dev/login`).catch(() => null);
  check('the API is running', !!api0 && api0.status < 500, api0?.status);
}

section('three new creators (real emailed codes)');
const ada = await signIn(`studio-ada+${stamp}@example.com`); // free
const pro = await signIn(`studio-pro+${stamp}@example.com`);
const cleo = await signIn(`studio-cleo+${stamp}@example.com`); // free, for the weekly Repurpose checks
await makePro(pro.userId);
const A = api(ada.token);
const P = api(pro.token);
const C = api(cleo.token);
const created = [ada.userId, pro.userId, cleo.userId];
check('a free, a Pro and a second free creator', !!ada.token && !!pro.token && !!cleo.token);

section('what the server says it can do');
{
  const boot = await A('GET', '/api/v1/me/bootstrap');
  check('the writing tools are switched on (a key, or the stand-in)', boot.body?.capabilities?.ai === true, boot.body?.capabilities);
  check('and it says whether the words are a stand-in', typeof boot.body?.capabilities?.aiStandIn === 'boolean', boot.body?.capabilities);
}

const idea = 'My 5-minute morning reset';

// ─── Refusals before anything is spent ───────────────────────────────────────

section('what is refused, without costing anything');
{
  const anon = await fetch(`${API}/api/v1/studio/script`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idea }) });
  check('someone not signed in is refused (401)', anon.status === 401, anon.status);
  const cases = [
    ['no idea', '/api/v1/studio/script', {}, /what it's about/i],
    ['an idea over 300 characters', '/api/v1/studio/script', { idea: 'x'.repeat(301) }, /300/],
    ['a length that is not offered', '/api/v1/studio/script', { idea, length: 45 }, null],
    ['a kind of video that is not one', '/api/v1/studio/script', { idea, style: 'opera' }, null],
    ['a part that is not a part', '/api/v1/studio/script/part', { idea, part: 'intro', script: { hook: 'a', story: 'b', lesson: 'c', cta: 'd' } }, null],
    ['no tones', '/api/v1/studio/captions', { topic: idea, tones: [] }, null],
    ['a caption edit with no caption', '/api/v1/studio/captions/edit', { caption: '  ', action: 'rewrite' }, /caption/i],
    ['Repurpose with no platform', '/api/v1/repurpose/generate', { text: idea, platforms: [] }, /platform/i],
    ['Repurpose for a platform we don’t write for', '/api/v1/repurpose/generate', { text: idea, platforms: ['myspace'] }, null],
  ];
  for (const [what, route, body, message] of cases) {
    const r = await A('POST', route, body);
    check(`${what} is refused (400), in words a person can read`, r.status === 400 && typeof r.body?.message === 'string' && !r.body.message.startsWith('[') && (!message || message.test(r.body.message)), r);
  }
  const usage = await A('GET', '/api/v1/studio/usage');
  check('none of that was counted', usage.status === 200 && usage.body.generate.used === 0 && usage.body.edit.used === 0, usage.body);
  check('the free plan’s numbers: 3 writes and 10 edits a day', usage.body?.generate.limit === 3 && usage.body?.edit.limit === 10, usage.body);
}

// ─── The free plan's day ─────────────────────────────────────────────────────

section('a free creator’s day of writing');
let script;
let options;
{
  const s1 = await A('POST', '/api/v1/studio/script', { idea, length: 30, style: 'talking' });
  script = s1.body?.script;
  check('a script comes back in four parts (200)', s1.status === 200 && ['hook', 'story', 'lesson', 'cta'].every((k) => typeof script?.[k] === 'string' && script[k].length > 0), s1);
  check('and says one of the day’s three is used', s1.body?.usage?.used === 1 && s1.body.usage.limit === 3, s1.body?.usage);

  const part = await A('POST', '/api/v1/studio/script/part', { idea, part: 'hook', script, length: 30, style: 'talking', direction: 'shorter' });
  check('one part can be written again (200)', part.status === 200 && typeof part.body?.text === 'string' && part.body.text.length > 0, part);
  check('and that is an edit, not a new write', part.body?.usage?.used === 1 && part.body.usage.limit === 10, part.body?.usage);

  const c1 = await A('POST', '/api/v1/studio/captions', { topic: idea, goal: 'saves', tones: ['Helpful', 'Honest'], platform: 'instagram' });
  options = c1.body?.options;
  check('three caption options come back (200), each with an id, a label, a caption and hashtags', c1.status === 200 && options?.length === 3 && options.every((o) => o.id && o.label && o.caption && Array.isArray(o.hashtags)), c1);
  check('their hashtags are one word each', options?.every((o) => o.hashtags.every((t) => /^#[\p{L}\p{N}_]+$/u.test(t))), options?.map((o) => o.hashtags));
  check('and it is the second write of the day', c1.body?.usage?.used === 2, c1.body?.usage);

  const hooks = await A('POST', '/api/v1/studio/hooks', { idea, style: 'talking', angle: 'bold' });
  check('Hook Studio is a Pro tool: a free creator is told so (403, UPGRADE_REQUIRED)', hooks.status === 403 && hooks.body?.code === 'UPGRADE_REQUIRED', hooks);
  check('and that cost nothing', (await A('GET', '/api/v1/studio/usage')).body?.generate.used === 2);

  const c2 = await A('POST', '/api/v1/studio/captions', { topic: 'a second look', goal: 'comments', tones: ['Funny'], avoid: options.map((o) => o.caption.split('\n')[0]) });
  check('a third write is allowed (200)', c2.status === 200 && c2.body?.usage?.used === 3, c2);

  const over = await A('POST', '/api/v1/studio/script', { idea });
  check('a fourth is refused with the upgrade prompt (429, UPGRADE_REQUIRED)', over.status === 429 && over.body?.code === 'UPGRADE_REQUIRED' && !!over.body?.upsell, over);
  check('in words that say when it comes back', /come back tomorrow/.test(over.body?.message ?? ''), over.body?.message);
  check('and the count stays at three', (await A('GET', '/api/v1/studio/usage')).body?.generate.used === 3);
}

section('small edits to a caption');
{
  const caption = options[0].caption;
  const rewritten = await A('POST', '/api/v1/studio/captions/edit', { caption, action: 'rewrite', platform: 'instagram' });
  check('rewrite gives a caption (200)', rewritten.status === 200 && typeof rewritten.body?.caption === 'string' && rewritten.body.caption.length > 0, rewritten);
  const shorter = await A('POST', '/api/v1/studio/captions/edit', { caption, action: 'shorten' });
  check('shorten gives a caption (200)', shorter.status === 200 && typeof shorter.body?.caption === 'string', shorter);
  const asked = await A('POST', '/api/v1/studio/captions/edit', { caption, action: 'ask' });
  check('"ask viewers" gives a caption (200)', asked.status === 200 && typeof asked.body?.caption === 'string', asked);
  const tags = await A('POST', '/api/v1/studio/captions/edit', { caption, action: 'tags', idea });
  check('tags gives hashtags (200)', tags.status === 200 && Array.isArray(tags.body?.tags) && tags.body.tags.length >= 3 && tags.body.tags.every((t) => t.startsWith('#')), tags);
  check('each counted as an edit; the day’s new writing was not touched', tags.body?.usage?.limit === 10 && tags.body.usage.used === 5 && (await A('GET', '/api/v1/studio/usage')).body.generate.used === 3, tags.body?.usage);

  for (let i = 0; i < 5; i++) await A('POST', '/api/v1/studio/captions/edit', { caption, action: 'shorten' });
  const tooMany = await A('POST', '/api/v1/studio/captions/edit', { caption, action: 'shorten' });
  check('after ten edits the eleventh is refused (429, UPGRADE_REQUIRED)', tooMany.status === 429 && tooMany.body?.code === 'UPGRADE_REQUIRED' && /quick edits/.test(tooMany.body?.message ?? ''), tooMany);
}

// ─── A failure costs nothing ─────────────────────────────────────────────────

section('when the model fails, the creator is not charged');
if (standIn) {
  const before = (await C('GET', '/api/v1/studio/usage')).body;
  const junk = await C('POST', '/api/v1/studio/script', { idea: 'STANDIN_JUNK a script that cannot be written' });
  check('a reply the tool can’t use is a 502 with a message a person can read', junk.status === 502 && /couldn.t write/i.test(junk.body?.message ?? ''), junk);
  check('and does not leak the model’s own words', !/sorry|cannot help/i.test(junk.body?.message ?? ''), junk.body?.message);
  const down = await C('POST', '/api/v1/studio/captions', { topic: 'STANDIN_DOWN a caption that cannot be written', tones: ['Helpful'] });
  check('a model that can’t be reached is a 503', down.status === 503 && /try again/i.test(down.body?.message ?? ''), down);
  const after = (await C('GET', '/api/v1/studio/usage')).body;
  check('neither was counted', after.generate.used === before.generate.used && after.edit.used === before.edit.used, [before, after]);
  const rows = await asService('GET', `ai_usage?user_id=eq.${cleo.userId}&select=id`);
  check('nothing is left in the database either', rows.body.length === 0, rows.body);
} else {
  console.log('  (skipped: needs the stand-in model)');
}

// ─── Pro ─────────────────────────────────────────────────────────────────────

section('a Pro creator has no limit, and Hook Studio');
{
  const usage0 = await P('GET', '/api/v1/studio/usage');
  check('their limits are none', usage0.body?.generate.limit === null && usage0.body?.edit.limit === null, usage0.body);
  let ok = 0;
  for (let i = 0; i < 5; i++) {
    const r = await P('POST', '/api/v1/studio/captions', { topic: `topic ${i}`, tones: ['Helpful'] });
    if (r.status === 200) ok++;
  }
  check('five writes in a day all work', ok === 5, ok);
  const hooks = await P('POST', '/api/v1/studio/hooks', { idea, style: 'dance', angle: 'result' });
  check('Hook Studio gives three hooks (200)', hooks.status === 200 && hooks.body?.hooks?.length === 3 && new Set(hooks.body.hooks).size === 3, hooks);
  const more = await P('POST', '/api/v1/studio/hooks', { idea, style: 'dance', angle: 'result', avoid: hooks.body.hooks });
  check('another round gives three that are new', more.status === 200 && more.body.hooks.every((h) => !hooks.body.hooks.includes(h)), more.body);
  const usage = await P('GET', '/api/v1/studio/usage');
  check('every one was still counted', usage.body?.generate.used === 7, usage.body);
}

// ─── Repurpose ───────────────────────────────────────────────────────────────

section('Repurpose: one a week on the free plan');
{
  const platforms = ['tiktok', 'instagram', 'youtube', 'threads', 'facebook'];
  const allowance0 = await C('GET', '/api/v1/repurpose');
  check('a free creator starts with the week’s one unused', allowance0.body?.usedThisWeek === 0 && allowance0.body.weeklyLimit === 1, allowance0.body);

  const first = await C('POST', '/api/v1/repurpose/generate', { text: '3 mistakes new creators make', platforms, prefer: 'carousel' });
  check('it writes a version for each platform, in order (200)', first.status === 200 && first.body?.versions?.map((v) => v.platform).join() === platforms.join(), first);
  check('each in a format that platform has, with what the format needs', first.body?.versions?.every((v) => v.body && v.formatLabel && (v.format !== 'carousel' || v.slides?.length >= 2) && (v.format !== 'thread' || v.posts?.length >= 2)), first.body?.versions);
  check('and says the week’s one is used', first.body?.usedThisWeek === 1 && first.body.weeklyLimit === 1, first.body);

  const second = await C('POST', '/api/v1/repurpose/generate', { text: 'another idea', platforms: ['tiktok'] });
  check('a second one is refused with the upgrade prompt (429, UPGRADE_REQUIRED)', second.status === 429 && second.body?.code === 'UPGRADE_REQUIRED' && /Monday/.test(second.body?.message ?? ''), second);
  const kept = await asService('GET', `repurpose_jobs?user_id=eq.${cleo.userId}&select=source,versions`);
  check('the work is kept with the run', kept.body?.length === 1 && kept.body[0].versions.length === 5 && kept.body[0].source.text === '3 mistakes new creators make', kept.body?.[0]?.source);

  if (standIn) {
    const junk = await A('POST', '/api/v1/repurpose/generate', { text: 'STANDIN_JUNK an idea', platforms: ['tiktok', 'threads'] });
    check('a failed run is a 502', junk.status === 502, junk);
    check('and is not spent', (await A('GET', '/api/v1/repurpose')).body?.usedThisWeek === 0 && (await asService('GET', `repurpose_jobs?user_id=eq.${ada.userId}&select=id`)).body.length === 0);
    const good = await A('POST', '/api/v1/repurpose/generate', { text: 'An idea that works', platforms: ['tiktok', 'threads'], prefer: 'text' });
    check('so the week’s one is still there to use (200)', good.status === 200 && good.body.usedThisWeek === 1, good);
  }

  const unlimited = [];
  for (let i = 0; i < 3; i++) unlimited.push((await P('POST', '/api/v1/repurpose/generate', { text: `idea ${i}`, platforms: ['instagram', 'youtube'] })).status);
  check('a Pro creator can go on (200 each time)', unlimited.every((s) => s === 200), unlimited);
}

// ─── Ask Jarvis ──────────────────────────────────────────────────────────────

section('Ask Jarvis');
{
  const chat = await A('POST', '/api/v1/jarvis/chat', { message: 'give me post ideas', history: [], context: { persona: 'new', niches: ['lifestyle'], platforms: ['tiktok'] } });
  check('it answers (200), not as a fallback', chat.status === 200 && chat.body?.degraded === false && typeof chat.body.text === 'string', chat);
  if (standIn) check('with ideas the app can show', chat.body?.ideas?.length === 3 && chat.body.ideas.every((i) => i.id && i.title && i.hook), chat.body?.ideas);
}

// ─── Nobody else's, and nobody's own to change ───────────────────────────────

section('the allowance is the server’s');
{
  const own = await asCreatorDirect(ada.token)('GET', 'ai_usage?select=kind,tool');
  check('a creator can read their own usage straight from the database', own.status === 200 && own.body.length > 0, own);
  const other = await asCreatorDirect(cleo.token)('GET', `ai_usage?user_id=eq.${ada.userId}&select=id`);
  check('and not anyone else’s', other.status === 200 && other.body.length === 0, other);
  const wipe = await asCreatorDirect(ada.token)('DELETE', 'ai_usage?kind=eq.generate');
  check('deleting their own usage to get the day back is refused', wipe.status === 401 || wipe.status === 403, wipe);
  const invent = await asCreatorDirect(ada.token)('POST', 'ai_usage', { user_id: ada.userId, kind: 'edit', tool: 'x' });
  check('so is writing it', invent.status === 401 || invent.status === 403, invent);
  const spend = await asCreatorDirect(ada.token)('POST', 'rpc/refund_ai', { p_user_id: ada.userId, p_id: '00000000-0000-0000-0000-000000000000' });
  check('and calling the database functions that count it', [401, 403, 404].includes(spend.status), spend.status);
  check('their count is what it was', (await A('GET', '/api/v1/studio/usage')).body.generate.used === 3);
}

await deleteCreators(created);
finish();
