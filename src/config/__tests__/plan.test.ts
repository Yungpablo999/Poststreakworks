import { PRO_NOT_AVAILABLE, requestTierChange } from '../plan';

describe('requestTierChange: the app never sets the plan', () => {
  it('a free creator asking for Pro is refused with a message', () => {
    expect(requestTierChange('free', 'pro')).toEqual({ allowed: false, message: PRO_NOT_AVAILABLE });
  });
  it('a Pro creator asking for the Free view is ignored (no message, no change)', () => {
    expect(requestTierChange('pro', 'free')).toEqual({ allowed: false });
  });
  it('asking for the plan you have is a no-op', () => {
    expect(requestTierChange('pro', 'pro')).toEqual({ allowed: true });
    expect(requestTierChange('free', 'free')).toEqual({ allowed: true });
  });
});
