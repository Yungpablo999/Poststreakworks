import {
  claimStoredReferral,
  hasLandingParams,
  landingNotice,
  normaliseReferralCode,
  parseLandingParams,
  rememberReferral,
  stripLandingParams,
  type ReferralStore,
} from '../landingParams';

function memoryStore(initial: string | null = null): ReferralStore & { value: string | null } {
  const s = {
    value: initial,
    save(c: string) { s.value = c; },
    load() { return s.value; },
    clear() { s.value = null; },
  };
  return s;
}

describe('normaliseReferralCode', () => {
  it('accepts letters, digits, _ and - (4 to 40) and trims', () => {
    expect(normaliseReferralCode(' AB12-cd_3 ')).toBe('AB12-cd_3');
    expect(normaliseReferralCode('abcd')).toBe('abcd');
  });
  it('rejects anything else', () => {
    for (const v of ['abc', 'a'.repeat(41), 'ab cd', '<script>', 'a/b', '', null, undefined, 5]) expect(normaliseReferralCode(v)).toBeNull();
  });
});

describe('parseLandingParams', () => {
  it('reads a referral code', () => expect(parseLandingParams('?start=signup&ref=ABC123').ref).toBe('ABC123'));
  it('reads payment, cancelled, connected and a backend error code', () => {
    expect(parseLandingParams('?payment=success').payment).toBe('success');
    expect(parseLandingParams('cancelled=true').cancelled).toBe(true);
    expect(parseLandingParams('?connected=linkedin').connected).toBe('linkedin');
    expect(parseLandingParams('?error=tiktok_token_failed').error).toBe('tiktok_token_failed');
    expect(parseLandingParams('?error=auth_failed').error).toBe('auth_failed');
  });
  it('ignores unknown or lookalike values', () => {
    const p = parseLandingParams('?payment=failed&cancelled=yes&connected=myspace&error=access_denied&ref=<x>');
    expect(p).toEqual({ ref: null, payment: null, cancelled: false, connected: null, error: null });
    expect(hasLandingParams(p)).toBe(false);
  });
  it("does not claim Supabase's own OAuth errors", () => {
    expect(parseLandingParams('?error=access_denied&error_description=nope').error).toBeNull();
  });
});

describe('landingNotice', () => {
  it('says something for each kind', () => {
    expect(landingNotice(parseLandingParams('?payment=success'))).toMatch(/Payment received/);
    expect(landingNotice(parseLandingParams('?cancelled=true'))).toMatch(/cancelled/);
    expect(landingNotice(parseLandingParams('?connected=threads'))).toBe('Threads connected');
  });
  it('names the platform in connect errors, and covers each code', () => {
    expect(landingNotice(parseLandingParams('?error=linkedin_denied'))).toBe('You cancelled connecting LinkedIn.');
    expect(landingNotice(parseLandingParams('?error=youtube_state_invalid'))).toMatch(/YouTube connection expired/);
    expect(landingNotice(parseLandingParams('?error=facebook_token_failed'))).toBe('Could not connect Facebook. Please try again.');
    expect(landingNotice(parseLandingParams('?error=tiktok_unavailable'))).toBe('TikTok is not available yet.');
    expect(landingNotice(parseLandingParams('?error=auth_failed'))).toMatch(/Sign-in did not finish/);
  });
  it('an error wins over everything, and a bare referral says nothing', () => {
    expect(landingNotice(parseLandingParams('?payment=success&error=auth_failed'))).toMatch(/Sign-in/);
    expect(landingNotice(parseLandingParams('?ref=ABC123'))).toBeNull();
    expect(landingNotice(parseLandingParams(''))).toBeNull();
  });
});

describe('stripLandingParams', () => {
  it('removes only the handled params and keeps the rest, the path and the fragment', () => {
    const p = parseLandingParams('?start=signup&ref=ABC123&tour=1');
    expect(stripLandingParams('/?start=signup&ref=ABC123&tour=1#x', p)).toBe('/?start=signup&tour=1#x');
  });
  it('drops the whole query when nothing else is left', () => {
    const p = parseLandingParams('?payment=success');
    expect(stripLandingParams('/?payment=success', p)).toBe('/');
  });
  it("leaves a param it did not recognise alone (Supabase's ?error=)", () => {
    const p = parseLandingParams('?error=access_denied&ref=ABC123');
    expect(stripLandingParams('/?error=access_denied&ref=ABC123', p)).toBe('/?error=access_denied');
  });
  it('returns the input when there is nothing to remove', () => {
    expect(stripLandingParams('/?start=signin', parseLandingParams('?start=signin'))).toBe('/?start=signin');
    expect(stripLandingParams('/', parseLandingParams(''))).toBe('/');
  });
});

describe('rememberReferral', () => {
  it('keeps the code, and the first link wins', () => {
    const s = memoryStore();
    rememberReferral('FIRST1', s);
    rememberReferral('SECOND2', s);
    expect(s.value).toBe('FIRST1');
  });
  it('ignores a missing code', () => {
    const s = memoryStore();
    rememberReferral(null, s);
    expect(s.value).toBeNull();
  });
});

describe('claimStoredReferral', () => {
  const post = (res: { success: boolean; statusCode: number } | Error) => jest.fn(async () => { if (res instanceof Error) throw res; return res; });

  it('does nothing without a kept code', async () => {
    const p = post({ success: true, statusCode: 200 });
    expect(await claimStoredReferral({ store: memoryStore(), post: p })).toBe('none');
    expect(p).not.toHaveBeenCalled();
  });
  it('sends the code once and clears it when claimed', async () => {
    const s = memoryStore('ABC123');
    const p = post({ success: true, statusCode: 200 });
    expect(await claimStoredReferral({ store: s, post: p })).toBe('claimed');
    expect(p).toHaveBeenCalledWith('ABC123');
    expect(s.value).toBeNull();
  });
  it('clears an unusable code (400, 409) so it is not retried forever', async () => {
    for (const statusCode of [400, 409]) {
      const s = memoryStore('ABC123');
      expect(await claimStoredReferral({ store: s, post: post({ success: false, statusCode }) })).toBe('dropped');
      expect(s.value).toBeNull();
    }
  });
  it('keeps the code for a retry on 401, 404 (route not deployed yet), 500 or a network failure', async () => {
    for (const r of [{ success: false, statusCode: 401 }, { success: false, statusCode: 404 }, { success: false, statusCode: 500 }, { success: false, statusCode: 0 }, new Error('offline')]) {
      const s = memoryStore('ABC123');
      expect(await claimStoredReferral({ store: s, post: post(r) })).toBe('retry');
      expect(s.value).toBe('ABC123');
    }
  });
});
