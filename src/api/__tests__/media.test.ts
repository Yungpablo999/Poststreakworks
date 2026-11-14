import { MEDIA_MESSAGES, MediaUploadError, checkMedia, uploadMedia, type MediaDeps } from '../media';

const blob = (type: string, size: number) => ({ type, size }) as unknown as Blob;
const target = {
  uploadUrl: 'https://r2.test/put?sig=1',
  method: 'PUT',
  headers: { 'Content-Type': 'image/jpeg', 'Content-Length': '10' },
  key: 'u/user/2026/11/abc.jpg',
  publicUrl: 'https://media.test/u/user/2026/11/abc.jpg',
};

function deps(over: Partial<MediaDeps> = {}) {
  const fetchImpl = jest.fn(async () => ({ ok: true }) as Response);
  const requestUploadUrl = jest.fn(async () => target);
  return { requestUploadUrl, fetchImpl, ...over } as MediaDeps & { requestUploadUrl: jest.Mock; fetchImpl: jest.Mock };
}

describe('checkMedia', () => {
  it('accepts allowed types within limits', () => {
    expect(checkMedia('image/jpeg', 1)).toBeNull();
    expect(checkMedia('video/mp4', 500 * 1024 * 1024)).toBeNull();
  });
  it('rejects other types and oversize files', () => {
    expect(checkMedia('image/gif', 1)).toBe(MEDIA_MESSAGES.unsupportedType);
    expect(checkMedia('image/png', 21 * 1024 * 1024)).toBe(MEDIA_MESSAGES.imageTooBig);
    expect(checkMedia('video/quicktime', 2 * 1024 ** 3)).toBe(MEDIA_MESSAGES.videoTooBig);
  });
});

describe('uploadMedia', () => {
  it('asks for a URL, PUTs the file with the signed headers, and returns the key', async () => {
    const d = deps();
    const body = blob('image/jpeg', 10);
    await expect(uploadMedia({ body }, d)).resolves.toEqual({ mediaKey: target.key, publicUrl: target.publicUrl });
    expect(d.requestUploadUrl).toHaveBeenCalledWith({ contentType: 'image/jpeg', sizeBytes: 10 });
    expect(d.fetchImpl).toHaveBeenCalledWith(target.uploadUrl, { method: 'PUT', headers: target.headers, body });
  });

  it('refuses a bad file before any request', async () => {
    const d = deps();
    await expect(uploadMedia({ body: blob('image/gif', 5) }, d)).rejects.toThrow(MEDIA_MESSAGES.unsupportedType);
    expect(d.requestUploadUrl).not.toHaveBeenCalled();
  });

  it('maps 429 and 503 from the backend to friendly messages', async () => {
    const rate = deps({ requestUploadUrl: jest.fn(async () => { throw Object.assign(new Error('rate_limited'), { status: 429 }); }) });
    await expect(uploadMedia({ body: blob('image/png', 5) }, rate)).rejects.toThrow(MEDIA_MESSAGES.rateLimited);
    const off = deps({ requestUploadUrl: jest.fn(async () => { throw Object.assign(new Error('x'), { status: 503 }); }) });
    await expect(uploadMedia({ body: blob('image/png', 5) }, off)).rejects.toThrow(MEDIA_MESSAGES.notConfigured);
  });

  it('reports a failed PUT (network error or non-2xx) as a MediaUploadError', async () => {
    const bad = deps({ fetchImpl: jest.fn(async () => ({ ok: false }) as Response) });
    await expect(uploadMedia({ body: blob('image/jpeg', 10) }, bad)).rejects.toBeInstanceOf(MediaUploadError);
    const down = deps({ fetchImpl: jest.fn(async () => { throw new TypeError('offline'); }) });
    await expect(uploadMedia({ body: blob('image/jpeg', 10) }, down)).rejects.toThrow(MEDIA_MESSAGES.failed);
  });
});
