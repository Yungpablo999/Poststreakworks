import { describe, expect, it } from "vitest";
import { handleSchema, saveOnboardingInput } from "./onboarding";

describe("handles", () => {
  it("are lower-cased and trimmed", () => {
    expect(handleSchema.parse("  PabloCreates ")).toBe("pablocreates");
  });

  it("allow letters, numbers and underscores, 3 to 30 characters", () => {
    for (const ok of ["abc", "a_b", "creator_2026", "x".repeat(30)]) {
      expect(handleSchema.safeParse(ok).success, ok).toBe(true);
    }
  });

  it("reject everything else", () => {
    for (const bad of ["ab", "x".repeat(31), "@pablo", "pa blo", "pablo!", "_pablo", "päblo", "a-b", ""]) {
      expect(handleSchema.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });
});

describe("saveOnboardingInput", () => {
  it("accepts any subset of the fields, including none", () => {
    expect(saveOnboardingInput.parse({})).toEqual({});
    expect(saveOnboardingInput.parse({ niches: ["food", "food", "tech"] })).toEqual({ niches: ["food", "tech"] });
    expect(saveOnboardingInput.parse({ timezone: "africa/lagos" })).toEqual({ timezone: "Africa/Lagos" });
  });

  it("normalises everything it keeps", () => {
    expect(
      saveOnboardingInput.parse({ displayName: "  Amara  ", handle: "Amara_Creates", niches: ["food"], timezone: "Africa/Lagos" }),
    ).toEqual({ displayName: "Amara", handle: "amara_creates", niches: ["food"], timezone: "Africa/Lagos" });
  });

  it("refuses bad values rather than saving them", () => {
    expect(saveOnboardingInput.safeParse({ displayName: "" }).success).toBe(false);
    expect(saveOnboardingInput.safeParse({ displayName: "x".repeat(51) }).success).toBe(false);
    expect(saveOnboardingInput.safeParse({ handle: "no spaces" }).success).toBe(false);
    expect(saveOnboardingInput.safeParse({ timezone: "Mars/Olympus" }).success).toBe(false);
    expect(saveOnboardingInput.safeParse({ niches: ["Tech & Business"] }).success).toBe(false);
  });
});
