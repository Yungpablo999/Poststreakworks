import { ApiError } from '../createAuthFetch';
import { MediaUploadError } from '../media';
import {
  POST_MESSAGES,
  PostInputError,
  describePostError,
  describeSummary,
  nextOccurrence,
  publishNow,
  schedulePost,
  textLengthFor,
  type LocalMedia,
  type PostDeps,
} from '../posts';

const NOW = new Date('2030-01-01T12:00:00Z');
const FUTURE = new Date('2030-01-02T12:00:00Z');
const video: LocalMedia = { uri: 'file:///v.mp4', kind: 'video', mimeType: 'video/mp4' };
const image: LocalMedia = { uri: 'file:///i.jpg', kind: 'image', mimeType: 'image/jpeg' };

function makeDeps(over: Partial<PostDeps> = {}) {
  let n = 0;
  const calls: Array<{ path: string; body: any }> = [];
  const deps: PostDeps = {
    post: jest.fn(async (path: string, body: unknown) => {
      calls.push({ path, body });
      return { success: true, postId: `p${++n}` } as never;
    }),
    readBlob: jest.fn(async () => new Blob(['x'], { type: 'video/mp4' })),
    upload: jest.fn(async () => ({ mediaKey: `key${++n}` })),
    now: () => NOW,
    ...over,
  };
  return { deps, calls };
}

const apiErr = (status: number, body: unknown) => new ApiError(status, body);

describe('publishNow', () => {
  it('posts to each platform and reports success', async () => {
    const { deps, calls } = makeDeps();
    const r = await publishNow({ content: ' hello ', platforms: ['linkedin', 'threads'] }, deps);
    expect(r.allOk).toBe(true);
    expect(r.succeeded).toEqual(['linkedin', 'threads']);
    expect(calls.map((c) => c.path)).toEqual(['/api/post/now', '/api/post/now']);
    expect(calls[0].body).toEqual({ content: 'hello', platform: 'linkedin' });
    expect(deps.upload).not.toHaveBeenCalled();
  });

  it('reports partial failure with the reason per platform', async () => {
    const { deps } = makeDeps({
      post: jest.fn(async (_p: string, body: any) => {
        if (body.platform === 'threads') throw apiErr(503, { code: 'provider_temporary_error', error: 'x' });
        return { postId: 'ok' } as never;
      }),
    });
    const r = await publishNow({ content: 'hi', platforms: ['linkedin', 'threads', 'facebook'] }, deps);
    expect(r.succeeded).toEqual(['linkedin', 'facebook']);
    expect(r.failed).toEqual([{ platform: 'threads', message: 'Threads is having trouble right now. Try again soon.' }]);
    expect(r.anyOk).toBe(true);
    expect(r.allOk).toBe(false);
    expect(describeSummary(r, 'Posted')).toBe('Posted on LinkedIn, Facebook. Threads: Threads is having trouble right now. Try again soon.');
  });

  it('stops calling after a 401 and flags signedOut', async () => {
    const post = jest.fn(async () => {
      throw apiErr(401, { error: 'Unauthorized', code: 'validation_error' });
    });
    const { deps } = makeDeps({ post: post as never });
    const r = await publishNow({ content: 'hi', platforms: ['linkedin', 'threads'] }, deps);
    expect(post).toHaveBeenCalledTimes(1);
    expect(r.signedOut).toBe(true);
    expect(r.failed.map((f) => f.message)).toEqual([POST_MESSAGES.signedOut, POST_MESSAGES.signedOut]);
  });

  it('a provider 401 is a reconnect message, not a sign-out', async () => {
    const { deps } = makeDeps({
      post: jest.fn(async () => {
        throw apiErr(401, { code: 'provider_auth_error', error: 'LinkedIn rejected' });
      }) as never,
    });
    const r = await publishNow({ content: 'hi', platforms: ['linkedin'] }, deps);
    expect(r.signedOut).toBe(false);
    expect(r.failed[0].message).toBe('LinkedIn needs to be reconnected.');
  });

  it('shows the backend validation message', async () => {
    const { deps } = makeDeps({
      post: jest.fn(async () => {
        throw apiErr(400, { code: 'validation_error', error: 'Missing content or platform.' });
      }) as never,
    });
    const r = await publishNow({ content: 'hi', platforms: ['linkedin'] }, deps);
    expect(r.failed[0].message).toBe('Missing content or platform.');
  });

  it('fails a media-only platform without media, without calling the backend', async () => {
    const { deps } = makeDeps();
    const r = await publishNow({ content: 'hi', platforms: ['instagram', 'linkedin'] }, deps);
    expect(r.failed).toEqual([{ platform: 'instagram', message: 'Instagram posts need a photo or video.' }]);
    expect(r.succeeded).toEqual(['linkedin']);
    expect(deps.post).toHaveBeenCalledTimes(1);
  });

  it('uploads once per media platform and sends its own mediaKey; text platforms get no media', async () => {
    const { deps, calls } = makeDeps();
    const r = await publishNow({ content: 'hi', platforms: ['youtube', 'tiktok', 'linkedin'], media: video }, deps);
    expect(r.allOk).toBe(true);
    expect(deps.readBlob).toHaveBeenCalledTimes(1);
    expect(deps.upload).toHaveBeenCalledTimes(2);
    const keys = calls.map((c) => c.body.mediaKey);
    expect(keys[0]).toBeDefined();
    expect(keys[1]).toBeDefined();
    expect(keys[0]).not.toBe(keys[1]);
    expect(keys[2]).toBeUndefined();
  });

  it('fails a video-only platform given an image', async () => {
    const { deps } = makeDeps();
    const r = await publishNow({ content: 'hi', platforms: ['youtube'], media: image }, deps);
    expect(r.failed[0].message).toBe("YouTube can't post a photo.");
    expect(deps.upload).not.toHaveBeenCalled();
  });

  it('reports an upload failure per platform and does not post', async () => {
    const { deps } = makeDeps({
      upload: jest.fn(async () => {
        throw new MediaUploadError("Couldn't upload that file. Check your connection and try again.");
      }),
    });
    const r = await publishNow({ content: 'hi', platforms: ['instagram'], media: image }, deps);
    expect(r.anyOk).toBe(false);
    expect(r.failed[0].message).toMatch(/Couldn't upload/);
    expect(deps.post).not.toHaveBeenCalled();
  });

  it('throws before sending when the file type is unsupported', async () => {
    const { deps } = makeDeps();
    await expect(
      publishNow({ content: 'hi', platforms: ['instagram'], media: { uri: 'x', kind: 'image', mimeType: 'image/gif' } }, deps),
    ).rejects.toBeInstanceOf(MediaUploadError);
    expect(deps.post).not.toHaveBeenCalled();
  });

  it('rejects empty caption and no platforms', async () => {
    const { deps } = makeDeps();
    await expect(publishNow({ content: '  ', platforms: ['linkedin'] }, deps)).rejects.toThrow(POST_MESSAGES.noContent);
    await expect(publishNow({ content: 'hi', platforms: [] }, deps)).rejects.toThrow(POST_MESSAGES.noPlatform);
  });

  it('enforces the per-platform text limit (Threads counts emoji bytes)', async () => {
    expect(textLengthFor('threads', '😀')).toBe(4);
    expect(textLengthFor('linkedin', '😀')).toBe(2);
    const { deps } = makeDeps();
    const r = await publishNow({ content: 'a'.repeat(501), platforms: ['threads', 'linkedin'] }, deps);
    expect(r.failed[0].message).toBe('Too long for Threads (500 characters max).');
    expect(r.succeeded).toEqual(['linkedin']);
  });

  it('reports a network failure', async () => {
    const { deps } = makeDeps({
      post: jest.fn(async () => {
        throw new TypeError('Network request failed');
      }) as never,
    });
    const r = await publishNow({ content: 'hi', platforms: ['linkedin'] }, deps);
    expect(r.failed[0].message).toBe(POST_MESSAGES.network);
  });
});

describe('schedulePost', () => {
  it('rejects a time in the past or too close', async () => {
    const { deps } = makeDeps();
    await expect(schedulePost({ content: 'hi', platforms: ['linkedin'], scheduledAt: new Date('2029-12-31T00:00:00Z') }, deps)).rejects.toThrow(
      PostInputError,
    );
    await expect(schedulePost({ content: 'hi', platforms: ['linkedin'], scheduledAt: new Date(NOW.getTime() + 5000) }, deps)).rejects.toThrow(
      POST_MESSAGES.pastTime,
    );
    await expect(schedulePost({ content: 'hi', platforms: ['linkedin'], scheduledAt: new Date('nope') }, deps)).rejects.toThrow(PostInputError);
    expect(deps.post).not.toHaveBeenCalled();
  });

  it('uses /api/post/schedule for one platform', async () => {
    const { deps, calls } = makeDeps();
    const r = await schedulePost({ content: 'hi', platforms: ['linkedin'], scheduledAt: FUTURE }, deps);
    expect(r.allOk).toBe(true);
    expect(calls[0]).toEqual({
      path: '/api/post/schedule',
      body: { content: 'hi', platform: 'linkedin', scheduledAt: FUTURE.toISOString() },
    });
  });

  it('uses /api/schedule for several platforms and marks missing ones failed', async () => {
    const { deps, calls } = makeDeps({
      post: jest.fn(async () => ({ success: true, results: [{ platform: 'linkedin', postId: 'a' }] }) as never),
    });
    const r = await schedulePost({ content: 'hi', platforms: ['linkedin', 'threads'], scheduledAt: FUTURE }, deps);
    expect(deps.post).toHaveBeenCalledWith('/api/schedule', { content: 'hi', platforms: ['linkedin', 'threads'], scheduledAt: FUTURE.toISOString() });
    expect(calls).toHaveLength(0);
    expect(r.succeeded).toEqual(['linkedin']);
    expect(r.failed).toEqual([{ platform: 'threads', message: POST_MESSAGES.notScheduled }]);
  });

  it('maps per-platform errors when /api/schedule fails entirely', async () => {
    const { deps } = makeDeps({
      post: jest.fn(async () => {
        throw apiErr(400, {
          success: false,
          error: 'a, b',
          code: 'missing_token',
          errors: [
            { platform: 'linkedin', error: 'A LinkedIn access token is required.', code: 'missing_token' },
            { platform: 'threads', error: 'Threads is down', code: 'provider_temporary_error' },
          ],
        });
      }) as never,
    });
    const r = await schedulePost({ content: 'hi', platforms: ['linkedin', 'threads'], scheduledAt: FUTURE }, deps);
    expect(r.failed).toEqual([
      { platform: 'linkedin', message: "LinkedIn isn't connected. Connect it first." },
      { platform: 'threads', message: 'Threads is having trouble right now. Try again soon.' },
    ]);
  });

  it('handles a 401 on /api/schedule', async () => {
    const { deps } = makeDeps({
      post: jest.fn(async () => {
        throw apiErr(401, { error: 'Unauthorized', code: 'validation_error' });
      }) as never,
    });
    const r = await schedulePost({ content: 'hi', platforms: ['linkedin', 'threads'], scheduledAt: FUTURE }, deps);
    expect(r.signedOut).toBe(true);
    expect(r.failed[0].message).toBe(POST_MESSAGES.signedOut);
  });

  it('with media schedules each platform separately with its own upload', async () => {
    const { deps, calls } = makeDeps();
    const r = await schedulePost({ content: 'hi', platforms: ['youtube', 'tiktok'], scheduledAt: FUTURE, media: video }, deps);
    expect(r.allOk).toBe(true);
    expect(calls.map((c) => c.path)).toEqual(['/api/post/schedule', '/api/post/schedule']);
    expect(calls[0].body.mediaKey).not.toBe(calls[1].body.mediaKey);
  });

  it('media required but missing fails that platform only', async () => {
    const { deps } = makeDeps();
    const r = await schedulePost({ content: 'hi', platforms: ['tiktok', 'linkedin'], scheduledAt: FUTURE }, deps);
    expect(r.failed).toEqual([{ platform: 'tiktok', message: 'TikTok posts need a video.' }]);
    expect(r.succeeded).toEqual(['linkedin']);
  });

  it('reports an upload failure', async () => {
    const { deps } = makeDeps({
      upload: jest.fn(async () => {
        throw new MediaUploadError('Uploads are not available right now.');
      }),
    });
    const r = await schedulePost({ content: 'hi', platforms: ['youtube'], scheduledAt: FUTURE, media: video }, deps);
    expect(r.failed[0].message).toBe('Uploads are not available right now.');
    expect(deps.post).not.toHaveBeenCalled();
  });
});

describe('describePostError', () => {
  it('maps status and codes', () => {
    expect(describePostError(apiErr(401, { error: 'Unauthorized' }))).toBe(POST_MESSAGES.signedOut);
    expect(describePostError(apiErr(429, null))).toBe(POST_MESSAGES.tooMany);
    expect(describePostError(apiErr(500, null))).toBe(POST_MESSAGES.generic);
    expect(describePostError(apiErr(400, { code: 'expired_token' }), 'facebook')).toBe('Facebook needs to be reconnected.');
    expect(describePostError(apiErr(403, { code: 'not_found', error: 'nope' }))).toBe(POST_MESSAGES.generic);
    expect(describePostError(new Error('boom'))).toBe(POST_MESSAGES.network);
  });
});

describe('describeSummary and nextOccurrence', () => {
  it('describes a total failure with the single reason', async () => {
    const { deps } = makeDeps();
    const r = await publishNow({ content: 'hi', platforms: ['tiktok'] }, deps);
    expect(describeSummary(r, 'Posted')).toBe('TikTok posts need a video.');
  });

  it('picks today if far enough ahead, else tomorrow', () => {
    const now = new Date(2030, 0, 1, 12, 0, 0);
    expect(nextOccurrence(19, 30, now)).toEqual(new Date(2030, 0, 1, 19, 30));
    expect(nextOccurrence(12, 0, now)).toEqual(new Date(2030, 0, 2, 12, 0));
    expect(nextOccurrence(9, 0, now)).toEqual(new Date(2030, 0, 2, 9, 0));
  });
});
