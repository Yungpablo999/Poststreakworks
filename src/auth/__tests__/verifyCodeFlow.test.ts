import { resendCode, submitCode, type SubmitCodeDeps, type ResendCodeDeps } from '../verifyCodeFlow';

// The decision logic behind src/screens/VerifyCodeScreen.tsx.

const flush = () => new Promise<void>((r) => setImmediate(() => r()));

function submitDeps(over: Partial<SubmitCodeDeps> = {}) {
  const d = {
    codeLength: 6,
    status: 'entering' as const,
    checkMs: 700,
    celebrateMs: 1100,
    email: 'ada@example.com',
    onSuccess: jest.fn(),
    setStatus: jest.fn(),
    setCode: jest.fn(),
    blurInput: jest.fn(),
    focusInput: jest.fn(),
    celebrate: jest.fn(),
    schedule: jest.fn((fn: () => void, ms: number) => setTimeout(fn, ms)),
    ...over,
  };
  return d;
}

function resendDeps(over: Partial<ResendCodeDeps> = {}) {
  return {
    secondsLeft: 0,
    resendSeconds: 45,
    tapFeedback: jest.fn(),
    setCode: jest.fn(),
    setSecondsLeft: jest.fn(),
    setResentNote: jest.fn(),
    focusInput: jest.fn(),
    ...over,
  };
}

describe('submitCode without onVerify (mock, unchanged behaviour)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('accepts any 6 digits after 700ms, celebrates, then calls onSuccess after 1100ms', () => {
    const d = submitDeps();
    submitCode('000000', d);
    expect(d.setStatus).toHaveBeenLastCalledWith('checking');
    expect(d.blurInput).toHaveBeenCalled();
    expect(d.schedule).toHaveBeenCalledWith(expect.any(Function), 700);

    jest.advanceTimersByTime(699);
    expect(d.setStatus).not.toHaveBeenCalledWith('verified');
    jest.advanceTimersByTime(1);
    expect(d.setStatus).toHaveBeenLastCalledWith('verified');
    expect(d.celebrate).toHaveBeenCalled();
    expect(d.onSuccess).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1100);
    expect(d.onSuccess).toHaveBeenCalledWith('ada@example.com');
    expect(d.setCode).not.toHaveBeenCalled();
  });

  it('ignores short codes and codes submitted while already checking', () => {
    const d = submitDeps();
    submitCode('12345', d);
    submitCode('123456', submitDeps({ ...d, status: 'checking' }));
    expect(d.setStatus).not.toHaveBeenCalled();
  });
});

describe('submitCode with onVerify', () => {
  it('passes the code to onVerify and calls onSuccess(email) when it resolves true', async () => {
    jest.useFakeTimers();
    try {
      const onVerify = jest.fn().mockResolvedValue(true);
      const d = submitDeps({ onVerify });
      submitCode('482913', d);
      expect(onVerify).toHaveBeenCalledWith('482913');
      expect(d.schedule).not.toHaveBeenCalledWith(expect.any(Function), 700);
      await Promise.resolve();
      await Promise.resolve();
      expect(d.setStatus).toHaveBeenLastCalledWith('verified');
      jest.advanceTimersByTime(1100);
      expect(d.onSuccess).toHaveBeenCalledWith('ada@example.com');
    } finally {
      jest.useRealTimers();
    }
  });

  it('on false: no onSuccess, code cleared, back to entering', async () => {
    const d = submitDeps({ onVerify: jest.fn().mockResolvedValue(false) });
    submitCode('111111', d);
    await flush();
    expect(d.onSuccess).not.toHaveBeenCalled();
    expect(d.setCode).toHaveBeenCalledWith('');
    expect(d.setStatus).toHaveBeenLastCalledWith('entering');
    expect(d.focusInput).toHaveBeenCalled();
    expect(d.celebrate).not.toHaveBeenCalled();
  });

  it('treats a rejected or throwing onVerify as a wrong code', async () => {
    const rejected = submitDeps({ onVerify: jest.fn().mockRejectedValue(new Error('boom')) });
    submitCode('111111', rejected);
    const thrown = submitDeps({
      onVerify: jest.fn(() => {
        throw new Error('boom');
      }),
    });
    submitCode('111111', thrown);
    await flush();
    for (const d of [rejected, thrown]) {
      expect(d.onSuccess).not.toHaveBeenCalled();
      expect(d.setStatus).toHaveBeenLastCalledWith('entering');
    }
  });
});

describe('resendCode', () => {
  it('without onResend: resets the screen and shows "New code sent" straight away (unchanged)', () => {
    const d = resendDeps();
    resendCode(d);
    expect(d.tapFeedback).toHaveBeenCalled();
    expect(d.setCode).toHaveBeenCalledWith('');
    expect(d.setSecondsLeft).toHaveBeenCalledWith(45);
    expect(d.setResentNote).toHaveBeenCalledWith(true);
    expect(d.focusInput).toHaveBeenCalled();
  });

  it('does nothing during the countdown', () => {
    const onResend = jest.fn();
    const d = resendDeps({ secondsLeft: 10, onResend });
    resendCode(d);
    expect(onResend).not.toHaveBeenCalled();
    expect(d.setCode).not.toHaveBeenCalled();
  });

  it('with onResend: calls it, and shows the note only once it succeeded', async () => {
    const ok = resendDeps({ onResend: jest.fn().mockResolvedValue(true) });
    resendCode(ok);
    expect(ok.onResend).toHaveBeenCalledTimes(1);
    expect(ok.setResentNote).not.toHaveBeenCalled();
    await flush();
    expect(ok.setResentNote).toHaveBeenCalledWith(true);

    const failed = resendDeps({ onResend: jest.fn().mockResolvedValue(false) });
    resendCode(failed);
    await flush();
    expect(failed.setResentNote).toHaveBeenCalledWith(false);
    expect(failed.setResentNote).not.toHaveBeenCalledWith(true);
  });
});
