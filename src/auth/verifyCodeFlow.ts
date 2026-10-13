// What the email-code screen (src/screens/VerifyCodeScreen.tsx) does when a code
// is submitted or "Resend code" is pressed, kept free of React so it can be
// unit-tested. The screen supplies its state setters and side effects.
//
// Without onVerify / onResend the screen behaves as before (the mock): any code
// of the right length is accepted after a short pause, and resend only resets
// the screen. With them, the code is checked for real and the screen only moves
// on when onVerify resolves true.

export type VerifyStatus = 'entering' | 'checking' | 'verified';

export interface SubmitCodeDeps {
  codeLength: number;
  status: VerifyStatus;
  checkMs: number;
  celebrateMs: number;
  email: string;
  /** Real check; resolves true when the code is right. Absent: mock (always accepts). */
  onVerify?: (code: string) => Promise<boolean>;
  onSuccess: (email: string) => void;
  setStatus: (s: VerifyStatus) => void;
  setCode: (code: string) => void;
  blurInput: () => void;
  focusInput: () => void;
  /** Haptics + mascot celebration */
  celebrate: () => void;
  /** setTimeout that the screen clears when it unmounts */
  schedule: (fn: () => void, ms: number) => void;
}

export function submitCode(value: string, d: SubmitCodeDeps): void {
  if (value.length !== d.codeLength || d.status !== 'entering') return;
  d.setStatus('checking');
  d.blurInput();

  const succeed = () => {
    d.setStatus('verified');
    d.celebrate();
    d.schedule(() => d.onSuccess(d.email), d.celebrateMs);
  };

  if (!d.onVerify) {
    // Mock: any code of the right length passes
    d.schedule(succeed, d.checkMs);
    return;
  }

  const reject = () => {
    d.setCode('');
    d.setStatus('entering');
    d.focusInput();
  };
  let check: Promise<boolean>;
  try {
    check = d.onVerify(value);
  } catch {
    reject();
    return;
  }
  Promise.resolve(check).then(
    (ok) => (ok ? succeed() : reject()),
    () => reject(),
  );
}

export interface ResendCodeDeps {
  secondsLeft: number;
  resendSeconds: number;
  /** Real resend; resolves true when a new code was sent. Absent: mock. */
  onResend?: () => Promise<boolean>;
  tapFeedback: () => void;
  setCode: (code: string) => void;
  setSecondsLeft: (s: number) => void;
  setResentNote: (shown: boolean) => void;
  focusInput: () => void;
}

export function resendCode(d: ResendCodeDeps): void {
  if (d.secondsLeft > 0) return;
  d.tapFeedback();
  d.setCode('');
  d.setSecondsLeft(d.resendSeconds);
  if (!d.onResend) {
    d.setResentNote(true);
  } else {
    // Only say "New code sent" once it really was
    let sent: Promise<boolean>;
    try {
      sent = d.onResend();
    } catch {
      sent = Promise.resolve(false);
    }
    Promise.resolve(sent).then(
      (ok) => d.setResentNote(ok),
      () => d.setResentNote(false),
    );
  }
  d.focusInput();
}
