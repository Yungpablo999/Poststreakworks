import {
  TIKTOK_BRANDED_CONTENT_POLICY_URL,
  TIKTOK_CREATOR_INFO_ERROR,
  TIKTOK_MUSIC_USAGE_URL,
  emptyTikTokForm,
  nicknameInitials,
  creatorInfoErrorMessage,
  parseCreatorInfo,
  parseTikTokPostOptions,
  privacyLevelDisabledReason,
  tiktokConsent,
  tiktokDisclosureNote,
  tiktokFormProblem,
  toTikTokPostOptions,
  updateTikTokForm,
  type TikTokCreatorInfo,
  type TikTokForm,
} from '../tiktok';

const creator: TikTokCreatorInfo = {
  nickname: 'yourhandle',
  avatarUrl: null,
  privacyLevelOptions: ['PUBLIC_TO_EVERYONE', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY'],
  commentDisabled: false,
  duetDisabled: true,
  stitchDisabled: false,
  maxVideoPostDurationSec: 600,
};
const ctx = { creator, videoDurationSec: 30 };
const filled = (change: Partial<TikTokForm> = {}) => updateTikTokForm(emptyTikTokForm(), { privacyLevel: 'PUBLIC_TO_EVERYONE', ...change });

describe('form defaults', () => {
  it('has no privacy level and everything off', () => {
    expect(emptyTikTokForm()).toEqual({
      privacyLevel: '', allowComment: false, allowDuet: false, allowStitch: false,
      commercial: false, yourBrand: false, brandedContent: false,
    });
    expect(tiktokFormProblem(emptyTikTokForm(), ctx)).toBe('Choose who can view this video');
    expect(toTikTokPostOptions(emptyTikTokForm(), ctx)).toBeNull();
  });
});

describe('tiktokFormProblem', () => {
  it('waits for the creator info', () => {
    expect(tiktokFormProblem(filled(), { creator: null, videoDurationSec: null })).toBe('Waiting for your TikTok account details');
  });
  it('rejects a level the account does not offer', () => {
    expect(tiktokFormProblem(filled({ privacyLevel: 'MUTUAL_FOLLOW_FRIENDS' }), ctx)).toMatch(/can't post with this visibility/);
  });
  it('requires a box once disclosure is on', () => {
    expect(tiktokFormProblem(filled({ commercial: true }), ctx)).toBe('Choose "Your brand", "Branded content" or both');
    expect(tiktokFormProblem(filled({ commercial: true, yourBrand: true }), ctx)).toBeNull();
    expect(tiktokFormProblem(filled({ commercial: true, brandedContent: true }), ctx)).toBeNull();
  });
  it('checks the duration against the account limit', () => {
    expect(tiktokFormProblem(filled(), { creator, videoDurationSec: 601 })).toBe('This video is longer than your TikTok account allows (10 min)');
    expect(tiktokFormProblem(filled(), { creator, videoDurationSec: 600 })).toBeNull();
    expect(tiktokFormProblem(filled(), { creator, videoDurationSec: null })).toBeNull();
    expect(tiktokFormProblem(filled(), { creator: { ...creator, maxVideoPostDurationSec: null }, videoDurationSec: 9999 })).toBeNull();
    expect(tiktokFormProblem(filled(), { creator: { ...creator, maxVideoPostDurationSec: 45 }, videoDurationSec: 50 })).toMatch(/45 s/);
  });
});

describe('branded content and privacy', () => {
  it('blocks Only me while branded content is ticked', () => {
    const f = filled({ commercial: true, brandedContent: true });
    expect(privacyLevelDisabledReason('SELF_ONLY', f)).toMatch(/can't be set to private/);
    expect(privacyLevelDisabledReason('PUBLIC_TO_EVERYONE', f)).toBeNull();
    expect(privacyLevelDisabledReason('SELF_ONLY', filled({ commercial: true, yourBrand: true }))).toBeNull();
  });
  it('clears Only me when branded content is ticked', () => {
    const f = updateTikTokForm(filled({ privacyLevel: 'SELF_ONLY', commercial: true }), { brandedContent: true });
    expect(f.privacyLevel).toBe('');
    expect(updateTikTokForm(filled({ privacyLevel: 'SELF_ONLY' }), { commercial: true, yourBrand: true }).privacyLevel).toBe('SELF_ONLY');
  });
  it('turning disclosure off clears both boxes', () => {
    const f = updateTikTokForm(filled({ commercial: true, yourBrand: true, brandedContent: true }), { commercial: false });
    expect(f.yourBrand).toBe(false);
    expect(f.brandedContent).toBe(false);
  });
});

describe('toTikTokPostOptions', () => {
  it('sends all five booleans and the level', () => {
    const o = toTikTokPostOptions(filled({ allowComment: true, commercial: true, yourBrand: true }), ctx);
    expect(o).toEqual({
      privacyLevel: 'PUBLIC_TO_EVERYONE', allowComment: true, allowDuet: false, allowStitch: false, yourBrand: true, brandedContent: false,
    });
    expect(parseTikTokPostOptions(o).ok).toBe(true);
  });
  it('sends switches the creator turned off in TikTok as off', () => {
    const o = toTikTokPostOptions(filled({ allowComment: true, allowDuet: true, allowStitch: true }), ctx);
    expect(o).toMatchObject({ allowComment: true, allowDuet: false, allowStitch: true });
  });
  it('is null while incomplete', () => {
    expect(toTikTokPostOptions(filled({ commercial: true }), ctx)).toBeNull();
  });
});

describe('parseTikTokPostOptions', () => {
  const ok = { privacyLevel: 'SELF_ONLY', allowComment: false, allowDuet: false, allowStitch: false, yourBrand: false, brandedContent: false };
  it('accepts a full body and rejects missing or bad fields', () => {
    expect(parseTikTokPostOptions(ok).ok).toBe(true);
    expect(parseTikTokPostOptions(null).ok).toBe(false);
    expect(parseTikTokPostOptions({ ...ok, privacyLevel: '' }).ok).toBe(false);
    expect(parseTikTokPostOptions({ ...ok, allowDuet: undefined }).ok).toBe(false);
    expect(parseTikTokPostOptions({ ...ok, brandedContent: true }).ok).toBe(false);
  });
});

describe('consent and disclosure note', () => {
  it('music only by default, with the branded policy when branded content is on', () => {
    expect(tiktokConsent(filled())).toEqual({ policy: 'music', links: [{ label: 'Music Usage Confirmation', href: TIKTOK_MUSIC_USAGE_URL }] });
    const c = tiktokConsent(filled({ commercial: true, brandedContent: true }));
    expect(c.policy).toBe('branded-and-music');
    expect(c.links.map((l) => l.href)).toEqual([TIKTOK_BRANDED_CONTENT_POLICY_URL, TIKTOK_MUSIC_USAGE_URL]);
    expect(tiktokConsent(filled({ commercial: true, yourBrand: true })).policy).toBe('music');
  });
  it('labels the video', () => {
    expect(tiktokDisclosureNote(filled())).toBeNull();
    expect(tiktokDisclosureNote(filled({ commercial: true }))).toBeNull();
    expect(tiktokDisclosureNote(filled({ commercial: true, yourBrand: true }))).toBe('Your video will be labeled "Promotional content". This cannot be changed once your video is posted.');
    expect(tiktokDisclosureNote(filled({ commercial: true, yourBrand: true, brandedContent: true }))).toContain('"Paid partnership"');
  });
});

describe('parseCreatorInfo', () => {
  it('reads the backend body', () => {
    const info = parseCreatorInfo({
      success: true,
      data: { nickname: 'a', avatarUrl: 'https://x/y.jpg', privacyLevelOptions: ['SELF_ONLY', 'BOGUS'], commentDisabled: true, maxVideoPostDurationSec: 300 },
    });
    expect(info).toEqual({
      nickname: 'a', avatarUrl: 'https://x/y.jpg', privacyLevelOptions: ['SELF_ONLY'],
      commentDisabled: true, duetDisabled: false, stitchDisabled: false, maxVideoPostDurationSec: 300,
    });
  });
  it('rejects bad bodies', () => {
    expect(parseCreatorInfo(null)).toBeNull();
    expect(parseCreatorInfo({ success: false })).toBeNull();
    expect(parseCreatorInfo({ success: true, data: { nickname: '' } })).toBeNull();
  });
});

describe('nicknameInitials', () => {
  it('makes one or two letters', () => {
    expect(nicknameInitials('@yourhandle')).toBe('YO');
    expect(nicknameInitials('Jane Doe')).toBe('JD');
    expect(nicknameInitials('')).toBe('?');
  });
});

describe('creator-info wire contract (poststreak-web GET /api/tiktok/creator-info)', () => {
  // Same shape the backend sends: { success: true, data: TikTokCreatorInfo }
  const backendBody = {
    success: true,
    data: {
      nickname: 'yourhandle',
      avatarUrl: 'https://p16.tiktokcdn.com/a.jpg',
      privacyLevelOptions: ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'],
      commentDisabled: false,
      duetDisabled: true,
      stitchDisabled: false,
      maxVideoPostDurationSec: 600,
    },
  };

  it('reads every field the backend sends', () => {
    expect(parseCreatorInfo(backendBody)).toEqual(backendBody.data);
  });

  it('shows the backend message for a failed lookup, else the generic text', () => {
    const apiError = (error: string) => ({ status: 502, body: { success: false, error, code: 'provider_temporary_error' } });
    expect(creatorInfoErrorMessage(apiError("TikTok isn't letting this account post right now. Try again later."))).toBe(
      "TikTok isn't letting this account post right now. Try again later.",
    );
    expect(creatorInfoErrorMessage(new Error('offline'))).toBe(TIKTOK_CREATOR_INFO_ERROR);
    expect(creatorInfoErrorMessage({ body: { error: '  ' } })).toBe(TIKTOK_CREATOR_INFO_ERROR);
    expect(creatorInfoErrorMessage(null)).toBe(TIKTOK_CREATOR_INFO_ERROR);
  });
});
