import { describe, expect, it } from "vitest";
import {
  APP_PLATFORMS,
  appPlatformSchema,
  canonicalTimezone,
  nicheListSchema,
  timezoneSchema,
  toAppPlatform,
  toDbPlatform,
} from "./platforms";

describe("platform ids", () => {
  it("maps X to the database's 'twitter' and leaves the rest alone", () => {
    expect(toDbPlatform("x")).toBe("twitter");
    expect(toDbPlatform("tiktok")).toBe("tiktok");
    expect(toDbPlatform("instagram")).toBe("instagram");
  });

  it("round-trips every platform the app uses", () => {
    for (const platform of APP_PLATFORMS) {
      expect(toAppPlatform(toDbPlatform(platform))).toBe(platform);
    }
  });

  it("hides database platforms the app doesn't show", () => {
    expect(toAppPlatform("meta")).toBeNull();
    expect(toAppPlatform("myspace")).toBeNull();
  });

  it("only accepts platforms the app knows", () => {
    expect(appPlatformSchema.safeParse("threads").success).toBe(true);
    expect(appPlatformSchema.safeParse("twitter").success).toBe(false);
    expect(appPlatformSchema.safeParse("myspace").success).toBe(false);
  });
});

describe("time zones", () => {
  it("canonicalises case, which the database matches exactly", () => {
    expect(canonicalTimezone("africa/lagos")).toBe("Africa/Lagos");
    expect(canonicalTimezone("Africa/Lagos")).toBe("Africa/Lagos");
  });

  it("rejects things that are not zones", () => {
    expect(canonicalTimezone("Mars/Olympus_Mons")).toBeNull();
    expect(canonicalTimezone("")).toBeNull();
    expect(canonicalTimezone("'; drop table users; --")).toBeNull();
  });

  it("validates through the schema the API uses", () => {
    expect(timezoneSchema.parse("europe/london")).toBe("Europe/London");
    expect(timezoneSchema.safeParse("nowhere").success).toBe(false);
    expect(timezoneSchema.safeParse("x".repeat(100)).success).toBe(false);
  });
});

describe("niches", () => {
  it("removes duplicates and keeps order", () => {
    expect(nicheListSchema.parse(["food", "tech", "food"])).toEqual(["food", "tech"]);
  });

  it("accepts plain lowercase ids only", () => {
    expect(nicheListSchema.safeParse(["Tech & Business"]).success).toBe(false);
    expect(nicheListSchema.safeParse([""]).success).toBe(false);
    expect(nicheListSchema.safeParse(["a"]).success).toBe(false);
  });

  it("matches the database cap of 12", () => {
    const twelve = Array.from({ length: 12 }, (_, i) => `niche${i}`);
    expect(nicheListSchema.safeParse(twelve).success).toBe(true);
    expect(nicheListSchema.safeParse([...twelve, "niche12"]).success).toBe(false);
  });
});
