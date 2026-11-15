const mockLimit = jest.fn();
const mockOr = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();
const mockPost = jest.fn();

jest.mock('../../auth/supabase', () => ({
  getSupabase: () => ({ from: mockFrom }),
}));
jest.mock('../authFetch', () => ({
  api: { post: (...args: unknown[]) => mockPost(...args) },
}));

import { cancelQueuePost, getQueueState, refreshQueue, resetQueue, type QueueRow } from '../queue';

const NOW = Date.now();
const iso = (offsetH: number) => new Date(NOW + offsetH * 3600000).toISOString();
const row = (over: Partial<QueueRow>): QueueRow => ({
  id: 'r',
  content: 'Post',
  platform: 'linkedin',
  status: 'scheduled',
  scheduled_at: iso(5),
  posted_at: null,
  error: null,
  created_at: iso(-5),
  ...over,
});

function mockRows(data: QueueRow[] | null, error: { message: string } | null = null) {
  mockLimit.mockResolvedValue({ data, error });
  mockOr.mockReturnValue({ order: () => ({ limit: mockLimit }) });
  mockSelect.mockReturnValue({ or: mockOr });
  mockFrom.mockReturnValue({ select: mockSelect });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetQueue();
});

describe('refreshQueue', () => {
  it('reads only the posts table with an explicit column list and a limit', async () => {
    mockRows([row({ id: 'a' }), row({ id: 'b', status: 'published', scheduled_at: iso(-2) })]);
    await refreshQueue();
    expect(mockFrom).toHaveBeenCalledWith('posts');
    expect(mockFrom).not.toHaveBeenCalledWith('user_tokens');
    const cols = mockSelect.mock.calls[0][0] as string;
    expect(cols).not.toContain('*');
    expect(cols).not.toMatch(/token/i);
    expect(mockLimit).toHaveBeenCalledWith(500);
    const s = getQueueState();
    expect(s.posts.map((p) => p.id)).toEqual(['b', 'a']);
    expect(s).toMatchObject({ loaded: true, loading: false, error: null });
  });

  it('empty queue -> loaded with no posts (screens show their empty states)', async () => {
    mockRows([]);
    await refreshQueue();
    expect(getQueueState()).toMatchObject({ posts: [], loaded: true, error: null });
  });

  it('null data is treated as empty', async () => {
    mockRows(null);
    await refreshQueue();
    expect(getQueueState().posts).toEqual([]);
  });

  it('surfaces a Supabase error and keeps previously loaded posts', async () => {
    mockRows([row({ id: 'a' })]);
    await refreshQueue();
    mockRows(null, { message: 'boom' });
    await refreshQueue();
    expect(getQueueState()).toMatchObject({ error: 'boom', loaded: true, loading: false });
    expect(getQueueState().posts.map((p) => p.id)).toEqual(['a']);
  });

  it('shares one in-flight request', async () => {
    mockRows([]);
    await Promise.all([refreshQueue(), refreshQueue()]);
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });
});

describe('cancelQueuePost', () => {
  beforeEach(async () => {
    mockRows([row({ id: 'sched' }), row({ id: 'done', status: 'published', scheduled_at: iso(-3) }), row({ id: 'bad', status: 'failed', scheduled_at: iso(-4) })]);
    await refreshQueue();
  });

  it('POSTs /api/post/cancel and removes the post locally on success', async () => {
    mockPost.mockResolvedValue({ success: true });
    await expect(cancelQueuePost('sched')).resolves.toEqual({ ok: true });
    expect(mockPost).toHaveBeenCalledWith('/api/post/cancel', { postId: 'sched' });
    expect(getQueueState().posts.map((p) => p.id)).toEqual(['bad', 'done']);
  });

  it('keeps the post and returns the error when the request fails', async () => {
    mockPost.mockRejectedValue(new Error('Network down'));
    await expect(cancelQueuePost('sched')).resolves.toEqual({ ok: false, error: 'Network down' });
    expect(getQueueState().posts.map((p) => p.id)).toContain('sched');
  });

  it('keeps the post when the server answers success: false', async () => {
    mockPost.mockResolvedValue({ success: false });
    expect((await cancelQueuePost('sched')).ok).toBe(false);
    expect(getQueueState().posts.map((p) => p.id)).toContain('sched');
  });

  it('refuses to cancel published or failed posts without calling the server', async () => {
    expect((await cancelQueuePost('done')).ok).toBe(false);
    expect((await cancelQueuePost('bad')).ok).toBe(false);
    expect(mockPost).not.toHaveBeenCalled();
    expect(getQueueState().posts).toHaveLength(3);
  });
});
