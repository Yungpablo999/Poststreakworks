// A stand-in for the model behind Jarvis, for trying the whole product on localhost when there is no real
// key. It speaks the same /chat/completions that Groq speaks and answers in the shapes each writing tool
// asks for, so everything around the model (the prompts, the checks on its reply, the daily allowance,
// the screens) can be walked through for real.
//
// What it writes is NOT an AI's writing. It is placeholder text built from the creator's own words and
// tagged "[stand-in]", so nobody mistakes it for something to post. With a real GROQ_API_KEY (or
// GEMINI_API_KEY) in backend/apps/web/.env.local the runner doesn't start using this at all.
//
// To check what happens when a model fails, a request whose text contains STANDIN_DOWN gets a server error
// (the model can't be reached) and one containing STANDIN_JUNK gets a reply that is not usable (the model
// answered badly). Nothing else in a request is ever looked at for such words.
//
// The tool is told apart by the first line of the system prompt ("PostStreak task: <id> (v1.0.0)", see
// packages/ai/prompts/studio.ts). A test (packages/ai/studio-standin.test.ts) sends every tool through this
// server and through the real checks on a reply, so the two can't drift apart.
import { json, readJson, text } from './http.mjs';

export const TAG = '[stand-in]';

const creatorText = (user) => /<creator_text>([\s\S]*?)<\/creator_text>/.exec(user)?.[1]?.trim() ?? '';
/** How many lines the creator has already been shown ("- …" bullets): another round gets other lines. */
const shown = (user) => (user.match(/^- /gm) ?? []).length;
const untag = (s) => s.replace(/^\[stand-in\]\s*/i, '');
const topicWords = (s) => [...new Set((s.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) ?? []).map((w) => w.replace(/\p{N}+/gu, '')).filter((w) => w.length >= 4))];

const TASKS = {
  script(system, user) {
    const idea = creatorText(user);
    return {
      hook: `${TAG} The honest truth about ${idea}`,
      story: `${TAG} A real moment from your own life about ${idea}. Tell it the way you would tell a friend.`,
      lesson: `${TAG} The one thing worth keeping from ${idea}.`,
      cta: `${TAG} Tell me if you have tried it.`,
    };
  },

  'script-part'(system, user) {
    const part = /Rewrite the (\w+)\./.exec(user)?.[1] ?? 'part';
    const idea = creatorText(user.split('The script so far:')[0] ?? user);
    const shorter = /about half the length/.test(system);
    return { text: shorter ? `${TAG} A shorter ${part}.` : `${TAG} A different ${part} for ${idea}.` };
  },

  hooks(system, user) {
    const idea = creatorText(user);
    const round = shown(user);
    const pool = [
      `${TAG} Why does nobody talk about ${idea}?`,
      `${TAG} I got ${idea} wrong for a whole year.`,
      `${TAG} ${idea}, in ten seconds.`,
      `${TAG} Stop doing ${idea} this way.`,
      `${TAG} The first time I tried ${idea}.`,
      `${TAG} What ${idea} really costs you.`,
      `${TAG} Before and after ${idea}.`,
      `${TAG} Is ${idea} worth your time?`,
      `${TAG} Nobody warned me about ${idea}.`,
    ];
    return { hooks: [0, 1, 2].map((i) => pool[(round + i) % pool.length]) };
  },

  captions(system, user) {
    const topic = creatorText(user);
    const round = shown(user);
    const tags = topicWords(topic).slice(0, 3);
    const hashtags = [...tags, 'creator', 'consistency'].slice(0, 5);
    const sets = [
      [
        ['Honest story', `${TAG} The honest story behind ${topic}.\n\nWhat I wish I had known sooner.`],
        ['Quick tip', `${TAG} One small thing about ${topic} that helped me.\n\nTry it once and see.`],
        ['Question', `${TAG} ${topic}: where are you with it right now?\n\nTell me below.`],
      ],
      [
        ['Looking back', `${TAG} Looking back at ${topic}.\n\nThe part nobody sees.`],
        ['Simple steps', `${TAG} ${topic} in three simple steps.\n\nSave this for later.`],
        ['Your turn', `${TAG} Your turn: what is your take on ${topic}?`],
      ],
    ];
    return { options: sets[round % sets.length].map(([label, caption]) => ({ label, caption, hashtags })) };
  },

  'caption-edit'(system, user) {
    const caption = untag(creatorText(user.split('\n\nThe idea:')[0] ?? user));
    if (/at about half the length/.test(system)) {
      const words = caption.split(/\s+/);
      return { caption: `${TAG} ${words.slice(0, Math.max(1, Math.ceil(words.length / 2))).join(' ')}` };
    }
    if (/end it with one natural question/.test(system)) return { caption: `${TAG} ${caption}\n\nWhat would you add?` };
    return { caption: `${TAG} ${caption}` };
  },

  'caption-tags'(system, user) {
    const caption = creatorText(user.split('\n\nThe idea:')[0] ?? user);
    const tags = [...topicWords(caption).slice(0, 5)];
    for (const filler of ['creator', 'consistency', 'poststreak', 'contentcreator']) if (tags.length < 5 && !tags.includes(filler)) tags.push(filler);
    return { tags };
  },

  repurpose(system, user) {
    const source = creatorText(user);
    const prefer = /prefer an? (video|carousel|text)/.exec(system)?.[1] ?? 'video';
    const lines = [...system.matchAll(/^- (\w+): choose one of (.+)$/gm)];
    const versions = lines.map(([, platform, list]) => {
      const allowed = [...list.matchAll(/"(\w+)"/g)].map((m) => m[1]);
      const pick = (...wanted) => wanted.find((w) => allowed.includes(w)) ?? allowed[0];
      const format = prefer === 'carousel' ? pick('carousel', 'video', 'reel', 'short') : prefer === 'text' ? pick('thread', 'post', 'community') : pick('video', 'reel', 'short');
      const base = { platform, format, title: `${TAG} ${source.slice(0, 60)}`, body: `${TAG} ${source.slice(0, 200)}` };
      if (format === 'carousel') return { ...base, slides: [`${TAG} ${source.slice(0, 40)}`, 'The first point', 'The second point', 'What to do next'] };
      if (format === 'thread') return { ...base, posts: [`${TAG} ${source.slice(0, 120)}`, 'The first point.', 'The second point.'] };
      return base;
    });
    return { versions };
  },
};

/** Ask Jarvis: the chat panel's reply, in the shape packages/ai/jarvis-chat.ts checks. */
function chat(system, messages) {
  const said = messages.filter((m) => m.role === 'user').at(-1)?.content ?? '';
  const topic = said.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).slice(0, 6).join(' ') || 'your next post';
  if (/\bidea/i.test(said)) {
    return {
      text: `${TAG} Here are three ideas to start from.`,
      ideas: [1, 2, 3].map((n) => ({ title: `${TAG} Idea ${n} about ${topic}`, hook: `${TAG} The first line of idea ${n}.`, format: '30-second Reel', bestTime: '7:30 PM', why: 'A starting point.' })),
      chips: ['Write me a caption', 'When should I post?'],
      emotion: 'idea',
    };
  }
  if (/\bcaption/i.test(said)) return { text: `${TAG} Here is a caption to start from.`, caption: `${TAG} A caption about ${topic}.\n\nWhat do you think?`, emotion: 'happy' };
  if (/schedul|calendar|when/i.test(said)) {
    return { text: `${TAG} Your Schedule has your plans.`, tasks: [{ kind: 'open', place: 'schedule' }], chips: ['Give me post ideas'], emotion: 'calm' };
  }
  if (/\b(post|write|compose|make)\b/i.test(said)) {
    return { text: `${TAG} Let's start a post.`, tasks: [{ kind: 'compose', title: topic.slice(0, 100) }], emotion: 'excited' };
  }
  return { text: `${TAG} I am a stand-in for Jarvis, running on this computer. A real model answers once a key is set.`, chips: ['Give me post ideas', 'Write me a caption'], emotion: 'thinking' };
}

/** The reply for a request: an object (for the tools that ask for JSON) or plain text. */
export function answer(system, user, messages = []) {
  const task = /PostStreak task: ([\w-]+)/.exec(system)?.[1];
  if (task && TASKS[task]) return TASKS[task](system, user);
  if (/You are Jarvis, the AI brain inside PostStreak/.test(system)) return chat(system, messages);
  if (/content safety classifier/.test(system)) return { flagged: false, categories: [], severity: 'low', confidence: 0.1, reason: 'stand-in: nothing was checked' };
  return `${TAG} A stand-in answered this.`;
}

export async function handle(req, res, url) {
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) return json(res, 200, { ok: true, model: 'stand-in' });
  if (req.method === 'POST' && url.pathname === '/chat/completions') {
    const body = await readJson(req);
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const system = messages.find((m) => m.role === 'system')?.content ?? '';
    const user = messages.filter((m) => m.role === 'user').at(-1)?.content ?? '';
    if (/STANDIN_DOWN/.test(user)) return text(res, 500, 'the stand-in model is pretending to be down');
    const reply = /STANDIN_JUNK/.test(user) ? 'I am sorry, I cannot help with that.' : answer(system, user, messages);
    return json(res, 200, {
      id: 'stand-in',
      object: 'chat.completion',
      model: body.model ?? 'stand-in',
      choices: [{ index: 0, message: { role: 'assistant', content: typeof reply === 'string' ? reply : JSON.stringify(reply) }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  }
  return text(res, 404, 'no such stand-in endpoint');
}
