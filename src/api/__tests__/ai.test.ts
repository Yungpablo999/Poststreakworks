import { ApiError, type AuthFetch } from '../createAuthFetch';
import {
  AGENT_HISTORY_LIMIT,
  AI_MESSAGES,
  AiEmptyError,
  AiInputError,
  askJarvis,
  captionBrief,
  cleanHooks,
  composeCaptionOptions,
  composePost,
  describeAiError,
  generateHooks,
  hookBrief,
  isSignedOutError,
  platformIdFor,
  splitCaption,
  trimHistory,
} from '../ai';

type Call = { path: string; options: Parameters<AuthFetch>[1] };

function json(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body), body: null } as unknown as Response;
}
/** A streamed text body: each chunk is one read() */
function stream(chunks: string[], status = 200) {
  const enc = new TextEncoder();
  let i = 0;
  return {
    ok: status < 300,
    status,
    json: async () => null,
    text: async () => chunks.join(''),
    body: { getReader: () => ({ read: async () => (i < chunks.length ? { done: false, value: enc.encode(chunks[i++]) } : { done: true, value: undefined }) }) },
  } as unknown as Response;
}
function fake(reply: (path: string, n: number) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const authFetch: AuthFetch = async (path, options) => {
    calls.push({ path, options });
    return reply(path, calls.length);
  };
  return { deps: { authFetch }, calls };
}

describe('wire contract', () => {
  it('hooks: POST /api/ai/hooks { topic } -> { hooks }', async () => {
    const { deps, calls } = fake(() => json({ hooks: ['a hook', 'b hook'] }));
    expect(await generateHooks('  my topic ', deps)).toEqual(['a hook', 'b hook']);
    expect(calls).toHaveLength(1);
    expect(calls[0].path).toBe('/api/ai/hooks');
    expect(calls[0].options).toEqual({ method: 'POST', body: { topic: 'my topic' } });
  });

  it('compose: POST /api/ai/compose { topic, platform } -> { content }, general platform when none is named', async () => {
    const { deps, calls } = fake(() => json({ content: '  Hello there  ' }));
    expect(await composePost('topic', undefined, deps)).toBe('Hello there');
    expect(await composePost('topic', 'threads', deps)).toBe('Hello there');
    expect(calls[0].path).toBe('/api/ai/compose');
    expect(calls[0].options?.body).toEqual({ topic: 'topic', platform: 'general' });
    expect(calls[1].options?.body).toEqual({ topic: 'topic', platform: 'threads' });
  });

  it('agent: POST /api/agent { message, conversationHistory } and reads the streamed text', async () => {
    const { deps, calls } = fake(() => stream(['Hel', 'lo ', 'there']));
    const seen: string[] = [];
    const text = await askJarvis('hi', [{ role: 'user', content: 'earlier' }], { onText: (t) => seen.push(t) }, deps);
    expect(text).toBe('Hello there');
    expect(calls[0].path).toBe('/api/agent');
    expect(calls[0].options?.method).toBe('POST');
    expect(calls[0].options?.body).toEqual({ message: 'hi', conversationHistory: [{ role: 'user', content: 'earlier' }] });
    // the reply so far grows with each chunk and ends on the full text
    expect(seen.slice(0, 3)).toEqual(['Hel', 'Hello ', 'Hello there']);
    expect(seen[seen.length - 1]).toBe('Hello there');
  });

  it('agent: reads the whole body when the runtime cannot stream', async () => {
    const whole = { ok: true, status: 200, json: async () => null, text: async () => ' All at once ', body: null } as unknown as Response;
    const { deps } = fake(() => whole);
    const seen: string[] = [];
    expect(await askJarvis('hi', [], { onText: (t) => seen.push(t) }, deps)).toBe('All at once');
    expect(seen).toEqual(['All at once']);
  });
});

describe('failures', () => {
  it('rejects empty input before any request', async () => {
    const { deps, calls } = fake(() => json({}));
    await expect(generateHooks('  ', deps)).rejects.toBeInstanceOf(AiInputError);
    await expect(composePost('', undefined, deps)).rejects.toBeInstanceOf(AiInputError);
    await expect(askJarvis(' ', [], {}, deps)).rejects.toBeInstanceOf(AiInputError);
    expect(calls).toHaveLength(0);
  });

  it('turns a non-2xx reply into an ApiError carrying the status and body', async () => {
    const { deps } = fake(() => json({ error: 'Unauthorized' }, 401));
    const err = await generateHooks('x', deps).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
    expect(isSignedOutError(err)).toBe(true);
    const agentErr = await askJarvis('x', [], {}, fake(() => json({ error: 'nope' }, 500)).deps).catch((e) => e);
    expect(agentErr).toBeInstanceOf(ApiError);
    expect(agentErr.status).toBe(500);
  });

  it('empty answers are an error, not a blank result', async () => {
    await expect(composePost('x', undefined, fake(() => json({ content: '   ' })).deps)).rejects.toBeInstanceOf(AiEmptyError);
    await expect(generateHooks('x', fake(() => json({ hooks: [] })).deps)).rejects.toBeInstanceOf(AiEmptyError);
    await expect(askJarvis('x', [], {}, fake(() => stream([' '])).deps)).rejects.toBeInstanceOf(AiEmptyError);
  });

  it('describeAiError gives one short sentence', () => {
    expect(describeAiError(new ApiError(401, { error: 'Unauthorized' }))).toBe(AI_MESSAGES.signedOut);
    expect(describeAiError(new ApiError(429, null))).toBe(AI_MESSAGES.tooMany);
    expect(describeAiError(new ApiError(400, { error: 'Topic required' }))).toBe('Topic required');
    expect(describeAiError(new ApiError(500, { error: 'boom stack trace' }))).toBe(AI_MESSAGES.generic);
    expect(describeAiError(new AiInputError('Add a topic first.'))).toBe('Add a topic first.');
    expect(describeAiError(new AiEmptyError())).toBe(AI_MESSAGES.empty);
    expect(describeAiError(new TypeError('Network request failed'))).toBe(AI_MESSAGES.network);
  });
});

describe('hooks', () => {
  it('tidies numbering, quotes and duplicates the route can return', () => {
    expect(cleanHooks(['1. "Stop doing this."', '- Why does this work?', 'Why does this work?', '', 5, '“Quoted”'])).toEqual([
      'Stop doing this.',
      'Why does this work?',
      'Quoted',
    ]);
    expect(cleanHooks('nope')).toEqual([]);
  });
  it('says what is wanted', () => {
    expect(hookBrief(' My idea ', 'A question', true)).toContain('My idea (open with a question).');
    expect(hookBrief('x', 'A bold take', false)).toContain('on the first frame');
  });
});

describe('captions', () => {
  it('splits body, closing question and hashtags', () => {
    expect(splitCaption('Start small.\n\nKeep it short.\n\nWhat will you try first?\n\n#Tips #Creators')).toEqual({
      body: 'Start small.\n\nKeep it short.',
      ending: 'What will you try first?',
      hashtags: '#Tips #Creators',
    });
    expect(splitCaption('Just one paragraph?')).toEqual({ body: 'Just one paragraph?', ending: '', hashtags: '' });
  });
  it('builds the brief from the idea, goal, tones and instruction', () => {
    expect(captionBrief(' Idea ', { goal: 'comments', tones: ['Helpful', 'Honest'], instruction: ' Be short. ' })).toBe(
      'Idea Goal: comments. Tone: Helpful, Honest. Be short.',
    );
    expect(captionBrief('Idea')).toBe('Idea');
  });
  it('maps a platform label to the backend id', () => {
    expect(platformIdFor('Instagram · Reel')).toBe('instagram');
    expect(platformIdFor('YouTube · Short')).toBe('youtube');
    expect(platformIdFor('Snapchat')).toBeUndefined();
    expect(platformIdFor(undefined)).toBeUndefined();
  });
  it('writes three options with three different asks, one call each', async () => {
    const { deps, calls } = fake((_p, n) => json({ content: `Caption ${n}\n\nYour turn?` }));
    const options = await composeCaptionOptions('Idea', { goal: 'saves', tones: ['Helpful'], idPrefix: 'p' }, deps);
    expect(calls).toHaveLength(3);
    expect(new Set(calls.map((c) => (c.options?.body as { topic: string }).topic)).size).toBe(3);
    expect(options.map((o) => o.id)).toEqual(['p-0', 'p-1', 'p-2']);
    expect(options[0]).toMatchObject({ label: 'Question', ending: 'Your turn?', hashtags: '' });
  });
  it('keeps the options that came back, and fails only when all failed', async () => {
    const partial = fake((_p, n) => (n === 2 ? json({ error: 'x' }, 500) : json({ content: 'ok' })));
    expect((await composeCaptionOptions('Idea', {}, partial.deps)).map((o) => o.id)).toEqual(['ai-0', 'ai-2']);
    const none = fake(() => json({ error: 'Unauthorized' }, 401));
    await expect(composeCaptionOptions('Idea', {}, none.deps)).rejects.toMatchObject({ status: 401 });
  });
});

describe('chat history', () => {
  it('drops blanks and keeps the most recent turns', () => {
    const turns = Array.from({ length: 30 }, (_, i) => ({ role: (i % 2 ? 'assistant' : 'user') as 'user' | 'assistant', content: `m${i}` }));
    const out = trimHistory([{ role: 'user', content: '  ' }, ...turns]);
    expect(out).toHaveLength(AGENT_HISTORY_LIMIT);
    expect(out[out.length - 1].content).toBe('m29');
  });
});
