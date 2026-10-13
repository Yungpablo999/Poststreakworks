import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';

const mockSignInWithOtp = jest.fn();
const mockVerifyOtp = jest.fn();
const mockGetSupabase = jest.fn(() => ({ auth: { signInWithOtp: mockSignInWithOtp, verifyOtp: mockVerifyOtp } }));

jest.mock('../supabase', () => ({ getSupabase: () => mockGetSupabase() }));

import { EMAIL_OTP_MESSAGES, normalizeCode, normalizeEmail, sendEmailOtp, verifyEmailOtp } from '../email';

const CODE = '482913';

describe('normalizeEmail / normalizeCode', () => {
  it('trims and lower-cases emails, rejects junk', () => {
    expect(normalizeEmail('  Ada@Example.COM ')).toBe('ada@example.com');
    expect(normalizeEmail('not-an-email')).toBeNull();
    expect(normalizeEmail('')).toBeNull();
  });
  it('accepts 6–10 digits, stripping pasted spaces/dashes', () => {
    expect(normalizeCode('482 913')).toBe('482913');
    expect(normalizeCode('1234-5678')).toBe('12345678');
    expect(normalizeCode('12345')).toBeNull();
    expect(normalizeCode('12345678901')).toBeNull();
    expect(normalizeCode('12a456')).toBeNull();
  });
});

describe('sendEmailOtp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks Supabase to email a code, creating the account if needed', async () => {
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });
    await expect(sendEmailOtp(' Ada@Example.com', { username: 'ada' })).resolves.toEqual({ status: 'sent' });
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'ada@example.com',
      options: { shouldCreateUser: true, data: { username: 'ada' } },
    });
  });

  it('sends no user data when there is no username (sign-in)', async () => {
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });
    await sendEmailOtp('ada@example.com');
    expect(mockSignInWithOtp).toHaveBeenCalledWith({ email: 'ada@example.com', options: { shouldCreateUser: true } });
  });

  it('explains a rate limit without leaking the server message', async () => {
    mockSignInWithOtp.mockResolvedValue({
      data: {},
      error: new AuthApiError('email rate limit exceeded (internal detail)', 429, 'over_email_send_rate_limit'),
    });
    await expect(sendEmailOtp('ada@example.com')).resolves.toEqual({
      status: 'error',
      message: EMAIL_OTP_MESSAGES.rateLimited,
    });
  });

  it('reports network failures plainly', async () => {
    mockSignInWithOtp.mockRejectedValue(new TypeError('Network request failed'));
    await expect(sendEmailOtp('ada@example.com')).resolves.toEqual({ status: 'error', message: EMAIL_OTP_MESSAGES.network });
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: new AuthRetryableFetchError('fetch failed', 0) });
    await expect(sendEmailOtp('ada@example.com')).resolves.toEqual({ status: 'error', message: EMAIL_OTP_MESSAGES.network });
  });

  it('rejects an invalid email before touching Supabase', async () => {
    await expect(sendEmailOtp('nope')).resolves.toEqual({ status: 'error', message: EMAIL_OTP_MESSAGES.invalidEmail });
    expect(mockGetSupabase).not.toHaveBeenCalled();
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it('lets a missing Supabase setting throw loudly', async () => {
    mockGetSupabase.mockImplementationOnce(() => {
      throw new Error('EXPO_PUBLIC_SUPABASE_URL is not set.');
    });
    await expect(sendEmailOtp('ada@example.com')).rejects.toThrow('EXPO_PUBLIC_SUPABASE_URL');
  });
});

describe('verifyEmailOtp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('verifies the code and signs in (supabase-js saves the session)', async () => {
    mockVerifyOtp.mockResolvedValue({ data: { session: { access_token: 'tok' }, user: { id: 'u1' } }, error: null });
    await expect(verifyEmailOtp('Ada@Example.com ', CODE)).resolves.toEqual({ status: 'signedIn' });
    expect(mockVerifyOtp).toHaveBeenCalledWith({ email: 'ada@example.com', token: CODE, type: 'email' });
  });

  it('treats a wrong or expired code the same, with a clear message', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { session: null, user: null },
      error: new AuthApiError('Token has expired or is invalid', 403, 'otp_expired'),
    });
    await expect(verifyEmailOtp('ada@example.com', CODE)).resolves.toEqual({
      status: 'error',
      message: EMAIL_OTP_MESSAGES.wrongOrExpired,
    });
  });

  it('fails if Supabase returns no session', async () => {
    mockVerifyOtp.mockResolvedValue({ data: { session: null, user: null }, error: null });
    await expect(verifyEmailOtp('ada@example.com', CODE)).resolves.toEqual({
      status: 'error',
      message: EMAIL_OTP_MESSAGES.verifyFailed,
    });
  });

  it('rejects an invalid email or code before touching Supabase', async () => {
    await expect(verifyEmailOtp('bad', CODE)).resolves.toMatchObject({ message: EMAIL_OTP_MESSAGES.invalidEmail });
    await expect(verifyEmailOtp('ada@example.com', '12')).resolves.toMatchObject({ message: EMAIL_OTP_MESSAGES.invalidCode });
    expect(mockGetSupabase).not.toHaveBeenCalled();
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });

  it('never logs the code or tokens', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      jest.spyOn(console, m).mockImplementation(() => {}),
    );
    try {
      mockVerifyOtp.mockResolvedValueOnce({ data: { session: { access_token: 'secret-tok' } }, error: null });
      await verifyEmailOtp('ada@example.com', CODE);
      mockVerifyOtp.mockResolvedValueOnce({ data: {}, error: new AuthApiError(`bad ${CODE}`, 403, 'otp_expired') });
      const failed = await verifyEmailOtp('ada@example.com', CODE);
      mockVerifyOtp.mockRejectedValueOnce(new TypeError('Network request failed'));
      await verifyEmailOtp('ada@example.com', CODE);

      expect(JSON.stringify(failed)).not.toContain(CODE);
      for (const spy of spies) {
        const logged = JSON.stringify(spy.mock.calls);
        expect(logged).not.toContain(CODE);
        expect(logged).not.toContain('secret-tok');
      }
    } finally {
      spies.forEach((s) => s.mockRestore());
    }
  });
});
