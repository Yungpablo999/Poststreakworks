import { ApiError } from '../../api/createAuthFetch';
import { AI_MESSAGES } from '../../api/ai';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../mascot/mascot', () => ({ express: jest.fn(), react: jest.fn() }));
jest.mock('../../api/ai', () => ({ ...jest.requireActual('../../api/ai'), askJarvis: jest.fn() }));

import { askJarvis } from '../../api/ai';
import { ask, chipsFor, resetJarvis, tasksFor } from '../chat';
import * as chat from '../chat';

const askMock = askJarvis as jest.Mock;
// The store has no React-free getter, so make its hook read the snapshot directly
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return { ...actual, useSyncExternalStore: (_sub: unknown, get: () => unknown) => get() };
});
const state = () => chat.useJarvisChat();
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  askMock.mockReset();
  resetJarvis();
});

describe('ask', () => {
  it('sends the question with the earlier turns, streams the reply into one message, then adds Ghost jobs', async () => {
    askMock.mockImplementation(async (_q: string, _h: unknown, opts: { onText?: (t: string) => void }) => {
      await Promise.resolve();
      opts.onText?.('Here is');
      opts.onText?.('Here is a caption');
      return 'Here is a caption';
    });
    ask('write me a caption about mornings');
    expect(state().thinking).toBe(true);
    expect(state().messages.at(-1)).toMatchObject({ from: 'me', text: 'write me a caption about mornings' });
    await flush();
    const replies = state().messages.filter((m) => m.from === 'jarvis' && m.id !== 'intro');
    expect(replies).toHaveLength(1);
    expect(replies[0].text).toBe('Here is a caption');
    expect(replies[0].tasks?.map((t) => t.job.kind)).toEqual(['copy', 'compose']);
    expect(state().thinking).toBe(false);
    expect(askMock.mock.calls[0][0]).toBe('write me a caption about mornings');
    expect(askMock.mock.calls[0][1]).toEqual([]); // the intro is not part of the conversation
  });

  it('sends earlier turns as user / assistant', async () => {
    askMock.mockResolvedValue('First answer');
    ask('hello there');
    await flush();
    askMock.mockResolvedValue('Second answer');
    ask('and then?');
    await flush();
    expect(askMock.mock.calls[1][1]).toEqual([
      { role: 'user', content: 'hello there' },
      { role: 'assistant', content: 'First answer' },
    ]);
  });

  it('shows a short error with a retry chip, and "Try again" asks the same question', async () => {
    askMock.mockRejectedValueOnce(new ApiError(401, { error: 'Unauthorized' }));
    ask('give me hooks');
    await flush();
    const err = state().messages.at(-1)!;
    expect(err.text).toBe(AI_MESSAGES.signedOut);
    expect(err.chips).toEqual(['Try again']);
    expect(state().thinking).toBe(false);

    askMock.mockResolvedValueOnce('Hook one');
    ask('Try again');
    await flush();
    expect(askMock.mock.calls[1][0]).toBe('give me hooks');
    expect(state().messages.at(-1)!.text).toBe('Hook one');
  });

  it('ignores a second question while one is being answered', async () => {
    let finish!: (t: string) => void;
    askMock.mockImplementation(() => new Promise<string>((r) => (finish = r)));
    ask('first');
    ask('second');
    expect(askMock).toHaveBeenCalledTimes(1);
    finish('done');
    await flush();
  });

  it('drops an answer that arrives after "start over"', async () => {
    let finish!: (t: string) => void;
    askMock.mockImplementation(() => new Promise<string>((r) => (finish = r)));
    ask('something');
    resetJarvis();
    finish('late answer');
    await flush();
    expect(state().messages.map((m) => m.id)).toEqual(['intro']);
  });
});

describe('Ghost jobs and follow-ups', () => {
  it('offers the page the question is about', () => {
    expect(tasksFor('when should I post', 'Around 7:30').map((t) => t.job)).toEqual([{ kind: 'open', place: 'schedule' }]);
    expect(tasksFor('check me in', 'Sure').map((t) => t.job.kind)).toEqual(['checkIn']);
    expect(tasksFor('what is the weather', 'No idea')).toEqual([]);
  });
  it('picks follow-ups from the question', () => {
    expect(chipsFor('write a caption')).toContain('Make it funnier');
    expect(chipsFor('anything')).toEqual(['Give me post ideas', 'Give me hooks']);
  });
});
