const mockSignInWithOAuth = jest.fn();
const mockExchange = jest.fn();
const mockOpenAuthSession = jest.fn();

jest.mock('../supabase', () => ({
  getSupabase: () => ({ auth: { signInWithOAuth: mockSignInWithOAuth, exchangeCodeForSession: mockExchange } }),
}));
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: (...args: unknown[]) => mockOpenAuthSession(...args),
}));
jest.mock('expo-linking', () => ({ createURL: (path: string) => `poststreak://${path}` }));

import { Platform } from 'react-native';
import { googleRedirectUrl, signInWithGoogle } from '../google';

// jest-expo's default preset runs as iOS, i.e. the phone flow.
describe('signInWithGoogle (phone)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignInWithOAuth.mockResolvedValue({ data: { url: 'https://supabase.test/authorize?provider=google' }, error: null });
  });

  it('opens Google in an auth session and exchanges the returned code', async () => {
    mockOpenAuthSession.mockResolvedValue({ type: 'success', url: 'poststreak://auth/callback?code=c0de' });
    mockExchange.mockResolvedValue({ data: { session: { access_token: 't' } }, error: null });

    await expect(signInWithGoogle()).resolves.toEqual({ status: 'signedIn' });
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'poststreak://auth/callback', skipBrowserRedirect: true },
    });
    expect(mockOpenAuthSession).toHaveBeenCalledWith(
      'https://supabase.test/authorize?provider=google',
      'poststreak://auth/callback',
    );
    expect(mockExchange).toHaveBeenCalledWith('c0de');
  });

  it('reports a closed browser as cancelled without exchanging anything', async () => {
    mockOpenAuthSession.mockResolvedValue({ type: 'cancel' });
    await expect(signInWithGoogle()).resolves.toEqual({ status: 'cancelled' });
    expect(mockExchange).not.toHaveBeenCalled();
  });

  it('passes on an error from the redirect', async () => {
    mockOpenAuthSession.mockResolvedValue({
      type: 'success',
      url: 'poststreak://auth/callback?error=access_denied&error_description=Denied',
    });
    await expect(signInWithGoogle()).resolves.toEqual({ status: 'error', message: 'Denied' });
  });
});

describe('googleRedirectUrl', () => {
  it('is the poststreak:// callback on phones', () => {
    expect(googleRedirectUrl()).toBe('poststreak://auth/callback');
  });

  it('is <origin>/auth/callback on web, never the bare origin', () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    (globalThis as { window?: unknown }).window = { location: { origin: 'https://app.poststreak.app' } };
    try {
      expect(googleRedirectUrl()).toBe('https://app.poststreak.app/auth/callback');
    } finally {
      delete (globalThis as { window?: unknown }).window;
      jest.restoreAllMocks();
    }
  });
});
