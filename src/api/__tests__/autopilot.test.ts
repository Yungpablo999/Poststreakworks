import { ApiError } from '../createAuthFetch';
import {
  AUTOPILOT_MESSAGES,
  MAX_TOPICS,
  MAX_TOPIC_LENGTH,
  addTopic,
  cleanTopic,
  describeAutopilotError,
  normalizeConfig,
  setupProblem,
  toggleItem,
} from '../autopilot';

describe('describeAutopilotError', () => {
  it('tells a signed-out caller to sign in', () => {
    expect(describeAutopilotError(new ApiError(401, { error: 'Unauthorized' }))).toBe(AUTOPILOT_MESSAGES.signedOut);
  });
  it('separates the daily cap from the per-IP limit (both are 429)', () => {
    expect(describeAutopilotError(new ApiError(429, { code: 'ai_daily_cap' }))).toBe(AUTOPILOT_MESSAGES.capReached);
    expect(describeAutopilotError(new ApiError(429, { code: 'ai_rate_limited' }))).toBe(AUTOPILOT_MESSAGES.tooFast);
    expect(describeAutopilotError(new ApiError(429, null))).toBe(AUTOPILOT_MESSAGES.tooFast);
  });
  it('words a 503 from the quota check and passes 400 sentences through', () => {
    expect(describeAutopilotError(new ApiError(503, { code: 'ai_quota_unavailable' }))).toBe(AUTOPILOT_MESSAGES.unavailable);
    expect(describeAutopilotError(new ApiError(400, { error: 'Add at least one topic first.' }))).toBe('Add at least one topic first.');
    expect(describeAutopilotError(new ApiError(500, {}))).toBe(AUTOPILOT_MESSAGES.generic);
  });
  it('treats a failed fetch as a network problem', () => {
    expect(describeAutopilotError(new TypeError('Failed to fetch'))).toBe(AUTOPILOT_MESSAGES.network);
  });
});

describe('normalizeConfig', () => {
  it('fills defaults and drops platforms autopilot cannot write for', () => {
    expect(normalizeConfig(null)).toEqual({ topics: [], platforms: [], frequency: 1, mode: 'suggest', enabled: false, last_run_at: null });
    const c = normalizeConfig({ topics: ['a', '  ', 3 as never], platforms: ['linkedin', 'x', 'tiktok', 'threads'], mode: 'auto', enabled: true });
    expect(c.topics).toEqual(['a']);
    expect(c.platforms).toEqual(['linkedin', 'threads']);
    expect(c.mode).toBe('auto');
    expect(c.enabled).toBe(true);
  });
  it('maps an unknown mode to suggest', () => {
    expect(normalizeConfig({ mode: 'weird' as never }).mode).toBe('suggest');
  });
});

describe('topics', () => {
  it('cleans spacing and length', () => {
    expect(cleanTopic('  build   in\npublic ')).toBe('build in public');
    expect(cleanTopic('x'.repeat(200))).toHaveLength(MAX_TOPIC_LENGTH);
  });
  it('adds once, ignoring blanks, repeats (any case) and a full list', () => {
    expect(addTopic([], '  ')).toEqual([]);
    expect(addTopic(['Pricing'], 'pricing')).toEqual(['Pricing']);
    expect(addTopic(['a'], ' b ')).toEqual(['a', 'b']);
    const full = Array.from({ length: MAX_TOPICS }, (_, i) => `t${i}`);
    expect(addTopic(full, 'new')).toBe(full);
  });
  it('toggles list items', () => {
    expect(toggleItem(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleItem(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe('setupProblem', () => {
  it('needs a topic, then a platform', () => {
    expect(setupProblem({ topics: [], platforms: ['linkedin'] })).toMatch(/topic/);
    expect(setupProblem({ topics: ['a'], platforms: [] })).toMatch(/platform/);
    expect(setupProblem({ topics: ['a'], platforms: ['linkedin'] })).toBeNull();
  });
});
