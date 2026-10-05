import { describe, expect, it } from "vitest";
import { TIER_LIMITS } from "./limits";
import { appReturnUrl, buildOffer } from "./billing-offer";

const plan = { name: "Jarvis Pro", price_usd: 999, price_ngn: null };
const stripe = { STRIPE_SECRET_KEY: "sk", STRIPE_WEBHOOK_SECRET: "whsec" };

describe("buildOffer", () => {
  it("shows the plan's own price, and no way to pay when no processor is set up", () => {
    const offer = buildOffer(plan, {});
    expect(offer.plan).toEqual({ name: "Jarvis Pro", priceUsdCents: 999, priceNgnKobo: null });
    expect(offer.processors).toEqual([]);
  });

  it("offers a processor only when its keys are set AND the plan has a price in its currency", () => {
    expect(buildOffer(plan, stripe).processors).toEqual(["stripe"]);
    expect(buildOffer(plan, { STRIPE_SECRET_KEY: "sk" }).processors).toEqual([]); // can't hear its webhooks
    expect(buildOffer(plan, { PAYSTACK_SECRET_KEY: "psk" }).processors).toEqual([]); // no naira price
    expect(buildOffer({ ...plan, price_ngn: 1_500_000 }, { ...stripe, PAYSTACK_SECRET_KEY: "psk" }).processors).toEqual(["stripe", "paystack"]);
  });

  it("nothing on sale: no plan and no way to pay", () => {
    expect(buildOffer(null, stripe)).toMatchObject({ plan: null, processors: [] });
  });

  it("states each plan's limits as the server enforces them (null = no limit)", () => {
    const { free, pro } = buildOffer(plan, {}).limits;
    expect(free).toEqual({
      aiWritesPerDay: TIER_LIMITS.free.aiGenerationsPerDay,
      aiEditsPerDay: TIER_LIMITS.free.aiEditsPerDay,
      repurposesPerWeek: TIER_LIMITS.free.repurposesPerWeek,
      jarvisChatsPerDay: TIER_LIMITS.free.jarvisChatPerDay,
      connectedPlatforms: TIER_LIMITS.free.maxConnectedPlatforms,
    });
    expect(pro).toMatchObject({ aiWritesPerDay: null, aiEditsPerDay: null, repurposesPerWeek: null, connectedPlatforms: null });
    expect(JSON.parse(JSON.stringify(pro))).toEqual(pro); // no Infinity (it would become null in JSON anyway)
  });
});

describe("appReturnUrl", () => {
  it("sends the creator back to the app, not to the API", () => {
    expect(appReturnUrl("success", { APP_WEB_URL: "http://localhost:8081/" })).toBe("http://localhost:8081/?payment=success");
    expect(appReturnUrl("cancelled", {})).toBe("https://app.poststreak.app/?payment=cancelled");
  });
});
