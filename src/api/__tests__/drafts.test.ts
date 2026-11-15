import { ApiError } from '../createAuthFetch';
import { DRAFT_MESSAGES, describeDraftError, draftTitle } from '../drafts';
import { createDraftsStore } from '../draftsStore';
import type { Draft, DraftsApi } from '../drafts';

const d = (id: string, content = 'hello'): Draft => ({
  id,
  content,
  platforms: ['linkedin'],
  format: 'text',
  media_key: null,
  created_at: '2026-11-15T10:00:00Z',
  updated_at: '2026-11-15T10:00:00Z',
});

function fakeApi(over: Partial<DraftsApi> = {}): DraftsApi & { list: jest.Mock; create: jest.Mock; remove: jest.Mock } {
  return {
    list: jest.fn(async () => [d('a'), d('b')]),
    create: jest.fn(async (input) => ({ ...d('new'), ...input }) as Draft),
    update: jest.fn(async (id) => d(id)),
    remove: jest.fn(async () => {}),
    ...over,
  } as never;
}

describe('describeDraftError', () => {
  it('says drafts are unavailable on the backend 503 (migration not applied)', () => {
    expect(describeDraftError(new ApiError(503, { code: 'drafts_unavailable' }))).toBe(DRAFT_MESSAGES.unavailable);
    expect(describeDraftError(new ApiError(503, null))).toBe(DRAFT_MESSAGES.unavailable);
  });
  it('maps signed out, full and bad requests', () => {
    expect(describeDraftError(new ApiError(401, { error: 'Unauthorized' }))).toBe(DRAFT_MESSAGES.signedOut);
    expect(describeDraftError(new ApiError(409, {}))).toBe(DRAFT_MESSAGES.full);
    expect(describeDraftError(new ApiError(400, { error: 'content is too long.' }))).toBe('content is too long.');
    expect(describeDraftError(new ApiError(500, {}))).toBe(DRAFT_MESSAGES.generic);
  });
  it('treats anything else as a network problem', () => {
    expect(describeDraftError(new TypeError('Failed to fetch'))).toBe(DRAFT_MESSAGES.network);
  });
});

describe('draftTitle', () => {
  it('uses the first non-empty line, trimmed and shortened', () => {
    expect(draftTitle({ content: '\n  First line  \nsecond' })).toBe('First line');
    expect(draftTitle({ content: 'x'.repeat(80) })).toBe(`${'x'.repeat(57)}...`);
    expect(draftTitle({ content: '   ' })).toBe('Untitled post');
  });
});

describe('drafts store', () => {
  it('starts loading, then holds the list; overlapping refreshes share one request', async () => {
    const api = fakeApi();
    const s = createDraftsStore(api);
    expect(s.getSnapshot()).toEqual({ drafts: [], loading: true, error: null });
    await Promise.all([s.refresh(), s.refresh()]);
    expect(api.list).toHaveBeenCalledTimes(1);
    expect(s.getSnapshot().drafts.map((x) => x.id)).toEqual(['a', 'b']);
    expect(s.getSnapshot().loading).toBe(false);
  });

  it('reports a failed load as a sentence and keeps the old list', async () => {
    const api = fakeApi();
    const s = createDraftsStore(api);
    await s.refresh();
    api.list.mockRejectedValueOnce(new ApiError(503, { code: 'drafts_unavailable' }));
    await s.refresh();
    expect(s.getSnapshot().error).toBe(DRAFT_MESSAGES.unavailable);
    expect(s.getSnapshot().drafts).toHaveLength(2);
  });

  it('save puts the new draft on top and returns it', async () => {
    const s = createDraftsStore(fakeApi());
    await s.refresh();
    const r = await s.save({ content: 'fresh', platforms: ['tiktok'] });
    expect(r.ok).toBe(true);
    expect(s.getSnapshot().drafts[0].id).toBe('new');
    expect(s.getSnapshot().drafts).toHaveLength(3);
  });

  it('save never throws: a failure comes back as a message and the list is unchanged', async () => {
    const api = fakeApi({ create: jest.fn(async () => { throw new ApiError(503, { code: 'drafts_unavailable' }); }) });
    const s = createDraftsStore(api);
    await s.refresh();
    const r = await s.save({ content: 'x' });
    expect(r).toEqual({ ok: false, message: DRAFT_MESSAGES.unavailable });
    expect(s.getSnapshot().drafts).toHaveLength(2);
  });

  it('remove drops the draft, or sets an error and keeps it on failure', async () => {
    const api = fakeApi();
    const s = createDraftsStore(api);
    await s.refresh();
    expect(await s.remove('a')).toBe(true);
    expect(s.getSnapshot().drafts.map((x) => x.id)).toEqual(['b']);
    api.remove.mockRejectedValueOnce(new ApiError(500, {}));
    expect(await s.remove('b')).toBe(false);
    expect(s.getSnapshot().drafts).toHaveLength(1);
    expect(s.getSnapshot().error).toBe(DRAFT_MESSAGES.generic);
  });

  it('reset forgets everything', async () => {
    const s = createDraftsStore(fakeApi());
    await s.refresh();
    s.reset();
    expect(s.getSnapshot()).toEqual({ drafts: [], loading: true, error: null });
  });
});
