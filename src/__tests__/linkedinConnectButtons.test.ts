import { readFileSync } from 'fs';
import { join } from 'path';

const read = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

describe('LinkedIn connect buttons', () => {
  it('is the first row on the onboarding connect screen', () => {
    const src = read('screens/PlatformConnectScreen.tsx');
    const list = src.slice(src.indexOf('const PLATFORMS'));
    expect(list.indexOf("id: 'linkedin'")).toBeGreaterThan(-1);
    expect(list.indexOf("id: 'linkedin'")).toBeLessThan(list.indexOf("id: 'tiktok'"));
  });

  it('is in the profile Accounts tab, which uses the real connection state', () => {
    const src = read('components/UserProfileModal.tsx');
    const list = src.slice(src.indexOf('const ACCOUNTS'), src.indexOf('const BIO_MAX'));
    expect(list).toContain("id: 'linkedin'");
    expect(src).toMatch(/useConnect\(isConnected\)/);
  });

  it('is in the connect-accounts sheet', () => {
    const src = read('components/growth/ConnectAccountsSheet.tsx');
    const list = src.slice(src.indexOf('const STAGE1'), src.indexOf('type ProfileLike'));
    expect(list).toContain("id: 'linkedin'");
  });
});
