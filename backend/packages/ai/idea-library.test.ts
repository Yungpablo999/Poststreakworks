import { describe, expect, it } from "vitest";
import { IDEA_GOALS, formatFor, ideaFeed, normalizeNiches, starterIdeas, topicIdeas } from "./idea-library";

describe("idea library", () => {
  it("knows a creator's topics by id or by the name the profile shows", () => {
    expect(normalizeNiches(["tech", "Fitness"])).toEqual(["tech", "fitness"]);
    expect(normalizeNiches(["Tech & AI", "Beauty & Fashion", "Storytelling"])).toEqual(["tech", "beauty"]);
    expect(normalizeNiches([])).toEqual([]);
  });

  it("starts with ideas for the creator's own topics, mixed, then general starters", () => {
    const ideas = starterIdeas(["tech", "food"], ["tiktok"]);
    expect(ideas.slice(0, 4).map((i) => i.niche)).toEqual(["tech", "food", "tech", "food"]);
    expect(ideas.slice(-3).every((i) => i.niche === "general")).toBe(true);
    expect(new Set(ideas.map((i) => i.id)).size).toBe(ideas.length);
  });

  it("offers general starters to a creator who hasn't picked topics yet", () => {
    expect(starterIdeas([], []).map((i) => i.niche)).toEqual(["general", "general", "general"]);
  });

  it("suits the format to where the creator posts", () => {
    expect(formatFor(["tiktok"])).toBe("30-second Reel");
    expect(formatFor(["youtube"])).toBe("YouTube Short");
    expect(formatFor(["threads"])).toBe("Text post");
    expect(starterIdeas(["food"], ["youtube"])[0]!.format).toBe("YouTube Short");
  });

  it("writes ideas for each goal, with a reason that matches it", () => {
    for (const goal of IDEA_GOALS) {
      const ideas = ideaFeed(["lifestyle"], goal, ["instagram"]);
      expect(ideas.length).toBeGreaterThanOrEqual(3);
      expect(ideas.every((i) => i.title && i.hook && i.why)).toBe(true);
    }
    expect(ideaFeed(["lifestyle"], "saves")[0]!.format).toBe("Carousel");
    expect(ideaFeed(["lifestyle"], "often")[0]!.format).toBe("15-second video");
  });

  it("never asks a creator to post a carousel on a text-only platform", () => {
    expect(ideaFeed(["tech"], "saves", ["threads"]).every((i) => i.format === "Text post")).toBe(true);
  });

  it("turns a topic the creator typed into ideas, and moves on when asked for more", () => {
    const first = topicIdeas("Budget meal prep.", "saves");
    const next = topicIdeas("Budget meal prep.", "saves", "30-second Reel", 1);
    expect(first).toHaveLength(3);
    expect(first[0]!.title).toContain("budget meal prep");
    expect(next.map((i) => i.title)).not.toEqual(first.map((i) => i.title));
    expect(topicIdeas("Budget meal prep.", "saves")).toEqual(first); // same inputs, same ideas
  });
});
