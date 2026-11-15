import { TEXT_ONLY_NOTE, joinNames, mixedTextOnlyNote, IMAGES_COMING_SOON, isTextOnlySelection, textOnlyPlatforms, acceptsMedia, POST_PLATFORMS, POST_PLATFORM_IDS, formatsAllowedFor, isTextPlatform, mediaRequiredFor, recommendedFormatFor, resolveFormat } from '../platforms';
import { STAGE_1_PLATFORMS, canAutoPost, isProTier, isStage1Platform, showAutoPostUpsell } from '../features';

describe('platform list', () => {
  it('covers all six platforms, LinkedIn included', () => {
    expect(POST_PLATFORMS.map((p) => p.id)).toEqual([...POST_PLATFORM_IDS]);
    expect(POST_PLATFORM_IDS).toHaveLength(6);
    for (const id of POST_PLATFORM_IDS) expect(isStage1Platform(id)).toBe(true);
    expect(STAGE_1_PLATFORMS).toContain('linkedin');
  });
});

describe('mediaRequiredFor', () => {
  it('needs nothing for text platforms', () => {
    expect(mediaRequiredFor(['linkedin'])).toBe('none');
    expect(mediaRequiredFor(['linkedin', 'threads', 'facebook'])).toBe('none');
    expect(mediaRequiredFor([])).toBe('none');
  });
  it('needs a video for YouTube and TikTok', () => {
    expect(mediaRequiredFor(['youtube'])).toBe('video');
    expect(mediaRequiredFor(['linkedin', 'tiktok'])).toBe('video');
    expect(mediaRequiredFor(['instagram', 'tiktok'])).toBe('video');
  });
  it('needs a photo or video for Instagram', () => {
    expect(mediaRequiredFor(['instagram'])).toBe('image_or_video');
    expect(mediaRequiredFor(['threads', 'instagram'])).toBe('image_or_video');
  });
});

describe('formatsAllowedFor', () => {
  it('allows only text for text platforms (images wait on the backend)', () => {
    expect(formatsAllowedFor(['linkedin'])).toEqual(['text']);
  });
  it('drops text when a media platform is chosen', () => {
    expect(formatsAllowedFor(['linkedin', 'instagram'])).not.toContain('text');
    expect(formatsAllowedFor(['instagram'])).toContain('image');
    expect(formatsAllowedFor(['tiktok'])).toEqual(['short_video', 'long_video']);
    expect(formatsAllowedFor(['linkedin', 'youtube'])).not.toContain('image');
  });
  it('allows everything with nothing chosen', () => {
    expect(formatsAllowedFor([])).toHaveLength(5);
  });
});

describe('recommendedFormatFor / resolveFormat', () => {
  it('recommends text for text-only selections, video otherwise', () => {
    expect(recommendedFormatFor(['linkedin'])).toBe('text');
    expect(recommendedFormatFor(['threads', 'facebook'])).toBe('text');
    expect(recommendedFormatFor(['linkedin', 'tiktok'])).toBe('short_video');
    expect(recommendedFormatFor([])).toBe('short_video');
  });
  it('moves off a format the selection cannot use', () => {
    expect(resolveFormat('text', ['tiktok'])).toBe('short_video');
    expect(resolveFormat('text', ['linkedin'])).toBe('text');
    expect(resolveFormat('image', ['linkedin'])).toBe('text');
  });
  it('knows text platforms', () => {
    expect(['linkedin', 'threads', 'facebook'].every(isTextPlatform)).toBe(true);
    expect(['instagram', 'youtube', 'tiktok'].some(isTextPlatform)).toBe(false);
  });
});

describe('beta gate', () => {
  it('lets everyone post while payments are off, keeps the Pro gate behind the flag', () => {
    expect(canAutoPost(false, false)).toBe(true);
    expect(canAutoPost(true, false)).toBe(true);
    expect(canAutoPost(false, true)).toBe(false);
    expect(canAutoPost(true, true)).toBe(true);
  });
  it('shows the Pro upsell only with payments on and a free plan', () => {
    expect(showAutoPostUpsell(false, false)).toBe(false);
    expect(showAutoPostUpsell(false, true)).toBe(true);
    expect(showAutoPostUpsell(true, true)).toBe(false);
  });
  it('reads pro and founding as Pro', () => {
    expect(isProTier('pro')).toBe(true);
    expect(isProTier('founding')).toBe(true);
    expect(isProTier('free')).toBe(false);
    expect(isProTier(undefined)).toBe(false);
  });
});

describe('text-only platforms (no media in the backend yet)', () => {
  it('LinkedIn, Threads and Facebook take no media; the others do', () => {
    expect(['linkedin', 'threads', 'facebook'].some(acceptsMedia)).toBe(false);
    expect(['instagram', 'youtube', 'tiktok'].every(acceptsMedia)).toBe(true);
  });
  it('a selection of only text platforms is text-only and offers only the text format', () => {
    expect(isTextOnlySelection(['linkedin'])).toBe(true);
    expect(isTextOnlySelection(['linkedin', 'threads', 'facebook'])).toBe(true);
    expect(formatsAllowedFor(['linkedin', 'facebook'])).toEqual(['text']);
    expect(resolveFormat('image', ['linkedin'])).toBe('text');
    expect(resolveFormat('short_video', ['threads'])).toBe('text');
  });
  it('mixed or empty selections are not text-only, and media still goes to the media platforms', () => {
    expect(isTextOnlySelection([])).toBe(false);
    expect(isTextOnlySelection(['linkedin', 'tiktok'])).toBe(false);
    expect(textOnlyPlatforms(['linkedin', 'tiktok', 'facebook'])).toEqual(['linkedin', 'facebook']);
    expect(formatsAllowedFor(['linkedin', 'tiktok'])).toEqual(['short_video', 'long_video']);
  });
  it('has the note text', () => {
    expect(IMAGES_COMING_SOON).toBe('Images coming soon');
  });
});

describe('text-only notes', () => {
  it('joins names naturally', () => {
    expect(joinNames(['LinkedIn'])).toBe('LinkedIn');
    expect(joinNames(['LinkedIn', 'Threads'])).toBe('LinkedIn and Threads');
    expect(joinNames(['LinkedIn', 'Threads', 'Facebook'])).toBe('LinkedIn, Threads and Facebook');
  });
  it('the text-only note always names Facebook too', () => {
    expect(TEXT_ONLY_NOTE).toBe('LinkedIn, Threads and Facebook are text only for now. Images coming soon.');
  });
  it('the mixed note names the chosen ones', () => {
    expect(mixedTextOnlyNote(['Facebook', 'LinkedIn'])).toBe('Facebook and LinkedIn will post your caption only. Images coming soon.');
  });
});
