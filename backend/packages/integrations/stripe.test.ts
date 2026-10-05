import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signStripePayload, verifyStripeSignature } from "./stripe";

const SECRET = "whsec_test_secret";
const body = JSON.stringify({ id: "evt_1", type: "invoice.paid" });
const now = 1_790_000_000_000;
const t = Math.floor(now / 1000);

let saved: string | undefined;
beforeEach(() => {
  saved = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
});
afterEach(() => {
  if (saved === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
  else process.env.STRIPE_WEBHOOK_SECRET = saved;
});

describe("verifyStripeSignature", () => {
  it("accepts what Stripe signs", () => {
    expect(verifyStripeSignature(body, signStripePayload(body, SECRET, t), now)).toBe(true);
  });

  it("refuses a changed body, another secret, or a missing signature", () => {
    expect(verifyStripeSignature(body.replace("evt_1", "evt_2"), signStripePayload(body, SECRET, t), now)).toBe(false);
    expect(verifyStripeSignature(body, signStripePayload(body, "whsec_other", t), now)).toBe(false);
    expect(verifyStripeSignature(body, `t=${t}`, now)).toBe(false);
    expect(verifyStripeSignature(body, "", now)).toBe(false);
    expect(verifyStripeSignature(body, "t=abc,v1=00", now)).toBe(false);
  });

  it("refuses an old (replayed) or far-future event", () => {
    expect(verifyStripeSignature(body, signStripePayload(body, SECRET, t - 301), now)).toBe(false);
    expect(verifyStripeSignature(body, signStripePayload(body, SECRET, t + 301), now)).toBe(false);
    expect(verifyStripeSignature(body, signStripePayload(body, SECRET, t - 299), now)).toBe(true);
  });

  it("accepts any of several v1 signatures (while a secret is being rolled)", () => {
    const good = signStripePayload(body, SECRET, t).split(",")[1];
    const old = signStripePayload(body, "whsec_old", t).split(",")[1];
    expect(verifyStripeSignature(body, `t=${t},${old},${good}`, now)).toBe(true);
  });

  it("refuses everything when no webhook secret is set (instead of crashing)", () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(verifyStripeSignature(body, signStripePayload(body, SECRET, t), now)).toBe(false);
  });
});
