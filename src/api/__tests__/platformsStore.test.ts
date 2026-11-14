import { createPlatformsStore } from '../platformsStore';
import type { PlatformsApi } from '../platforms';

const li = { platform: 'linkedin', expires_at: '2027-01-01T00:00:00Z' };
const tt = { platform: 'tiktok', expires_at: null };

function fakeApi(over: Partial<PlatformsApi> = {}): PlatformsApi & { list: jest.Mock; disconnect: jest.Mock } {
  return { list: jest.fn(async () => [li, tt]), disconnect: jest.fn(async () => {}), ...over } as never;
}

describe('platforms store', () => {
  it('starts loading, then holds the list', async () => {
    const s = createPlatformsStore(fakeApi());
    expect(s.getSnapshot()).toEqual({ platforms: [], loading: true, error: null });
    await s.refresh();
    expect(s.getSnapshot()).toEqual({ platforms: [li, tt], loading: false, error: null });
  });

  it('shares one request between overlapping refreshes', async () => {
    const api = fakeApi();
    const s = createPlatformsStore(api);
    await Promise.all([s.refresh(), s.refresh()]);
    expect(api.list).toHaveBeenCalledTimes(1);
  });

  it('reports a failed load without throwing, and keeps the old list', async () => {
    const api = fakeApi();
    const s = createPlatformsStore(api);
    await s.refresh();
    api.list.mockRejectedValueOnce(new Error('Unauthorized'));
    await s.refresh();
    expect(s.getSnapshot()).toEqual({ platforms: [li, tt], loading: false, error: 'Unauthorized' });
  });

  it('removes a platform after a successful disconnect', async () => {
    const api = fakeApi();
    const s = createPlatformsStore(api);
    await s.refresh();
    await expect(s.disconnect('linkedin')).resolves.toBe(true);
    expect(api.disconnect).toHaveBeenCalledWith('linkedin');
    expect(s.getSnapshot().platforms).toEqual([tt]);
  });

  it('keeps the platform and sets error when disconnect fails', async () => {
    const api = fakeApi({ disconnect: jest.fn(async () => { throw new Error('boom'); }) });
    const s = createPlatformsStore(api);
    await s.refresh();
    await expect(s.disconnect('linkedin')).resolves.toBe(false);
    expect(s.getSnapshot().platforms).toEqual([li, tt]);
    expect(s.getSnapshot().error).toBe('boom');
  });

  it('notifies subscribers and stops after unsubscribe', async () => {
    const s = createPlatformsStore(fakeApi());
    const l = jest.fn();
    const off = s.subscribe(l);
    await s.refresh();
    expect(l).toHaveBeenCalled();
    off();
    l.mockClear();
    s.reset();
    expect(l).not.toHaveBeenCalled();
  });
});
