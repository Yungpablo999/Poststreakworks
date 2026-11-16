import { DEMO_SCREENS, isComingSoonScreen } from '../features';

describe('demo screens', () => {
  it('are covered while demo screens are off', () => {
    for (const s of ['quests', 'growth', 'voice-studio', 'audience-breakdown', 'platform-growth', 'post-performance', 'challenge-detail']) {
      expect(isComingSoonScreen(s, false)).toBe(true);
    }
  });
  it('are not covered when switched back on', () => {
    for (const s of DEMO_SCREENS) expect(isComingSoonScreen(s, true)).toBe(false);
  });
  it('never cover the real screens', () => {
    for (const s of ['dashboard', 'create', 'composer', 'schedule', 'platforms', 'jarvis-pro', 'caption']) {
      expect(isComingSoonScreen(s, false)).toBe(false);
    }
  });
});
