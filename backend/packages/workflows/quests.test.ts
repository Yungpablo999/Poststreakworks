import { describe, expect, it } from "vitest";
import { evaluateList, periodKey, todaySteps, type QuestFacts } from "./quests";
import { personaFor } from "./persona";
import { viewsMilestone } from "./everyday-notes";

const NOTHING: QuestFacts = {
  today: "2026-10-03",
  weekStart: "2026-09-28",
  dayStartAt: "2026-10-02T23:00:00Z",
  weekStartAt: "2026-09-27T23:00:00Z",
  draftsToday: 0,
  scriptDraftsToday: 0,
  postDraftsToday: 0,
  draftsEver: 0,
  hooksToday: 0,
  hooksEver: 0,
  hooksSameIdeaThisWeek: 0,
  ideaPicksToday: 0,
  scheduledToday: 0,
  scheduledThisWeek: 0,
  scheduledEver: 0,
  postsToday: 0,
  postsThisWeek: 0,
  postsEver: 0,
  connections: 0,
  repurposesThisWeek: 0,
};
const facts = (patch: Partial<QuestFacts>): QuestFacts => ({ ...NOTHING, ...patch });
const done = (steps: ReturnType<typeof todaySteps>) => steps.map((s) => s.done);

describe("today's quest", () => {
  it("starts with nothing done", () => {
    expect(done(todaySteps(NOTHING, "new"))).toEqual([false, false, false]);
    expect(done(todaySteps(NOTHING, "returning"))).toEqual([false, false, false]);
  });

  it("new creators: an idea, then a script, then a saved post", () => {
    expect(done(todaySteps(facts({ ideaPicksToday: 1 }), "new"))).toEqual([true, false, false]);
    expect(done(todaySteps(facts({ draftsToday: 1, scriptDraftsToday: 1 }), "new"))).toEqual([true, true, false]);
    expect(done(todaySteps(facts({ draftsToday: 2, scriptDraftsToday: 1, postDraftsToday: 1 }), "new"))).toEqual([true, true, true]);
  });

  it("new creators can finish by scheduling instead of saving a draft", () => {
    expect(done(todaySteps(facts({ ideaPicksToday: 1, scriptDraftsToday: 1, scheduledToday: 1 }), "new"))).toEqual([true, true, true]);
  });

  it("creators who post: the last step is a post that is really out, not a draft", () => {
    const plannedOnly = facts({ ideaPicksToday: 1, postDraftsToday: 1, scheduledToday: 1 });
    expect(done(todaySteps(plannedOnly, "returning"))).toEqual([true, true, false]);
    expect(done(todaySteps({ ...plannedOnly, postsToday: 1 }, "returning"))).toEqual([true, true, true]);
  });

  it("never claims a step is automatic when it has no rule", () => {
    for (const persona of ["new", "returning"] as const) {
      const steps = todaySteps(NOTHING, persona);
      expect(steps).toHaveLength(3);
      expect(steps.every((s) => s.title.length > 0 && s.body.length > 0)).toBe(true);
    }
  });
});

describe("the quest list", () => {
  it("offers new creators the starter quests and nothing else", () => {
    const { list, pro } = evaluateList(NOTHING, "new", "free");
    expect(list.map((q) => q.key)).toEqual(["starter.connect", "starter.first_idea", "starter.first_schedule", "starter.first_post"]);
    expect(pro).toBeNull();
  });

  it("offers creators who post this week's quests", () => {
    const { list } = evaluateList(NOTHING, "returning", "free");
    expect(list.map((q) => q.key)).toEqual(["daily.idea", "weekly.schedule", "weekly.repurpose"]);
  });

  it("shows Pro quests only on a Pro plan", () => {
    expect(evaluateList(NOTHING, "returning", "free").pro).toBeNull();
    expect(evaluateList(NOTHING, "returning", "pro").pro?.map((q) => q.key)).toEqual(["pro.openings"]);
    expect(evaluateList(NOTHING, "new", "founding").pro?.map((q) => q.key)).toEqual(["pro.openings"]);
  });

  it("finishes a quest only when its rows exist", () => {
    const f = facts({ connections: 1, draftsEver: 1, scheduledEver: 0 });
    const byKey = Object.fromEntries(evaluateList(f, "new", "free").list.map((q) => [q.key, q.done]));
    expect(byKey).toEqual({ "starter.connect": true, "starter.first_idea": true, "starter.first_schedule": false, "starter.first_post": false });
  });

  it("counts the three openings towards the Pro quest, capped at three", () => {
    const quest = (n: number) => evaluateList(facts({ hooksSameIdeaThisWeek: n }), "returning", "pro").pro![0]!;
    expect(quest(2)).toMatchObject({ done: false, progress: { done: 2, of: 3 } });
    expect(quest(7)).toMatchObject({ done: true, progress: { done: 3, of: 3 } });
  });

  it("pays each quest once per its own period", () => {
    expect(periodKey("daily", NOTHING)).toBe("D:2026-10-03");
    expect(periodKey("weekly", NOTHING)).toBe("W:2026-09-28");
    expect(periodKey("once", NOTHING)).toBe("O");
  });
});

describe("new or returning", () => {
  it("is returning after three days in a row, or after a post", () => {
    expect(personaFor({ longestStreakDays: 0, postsMade: 0 })).toBe("new");
    expect(personaFor({ longestStreakDays: 2, postsMade: 0 })).toBe("new");
    expect(personaFor({ longestStreakDays: 3, postsMade: 0 })).toBe("returning");
    expect(personaFor({ longestStreakDays: 0, postsMade: 1 })).toBe("returning");
  });
});

describe("views milestones", () => {
  it("names the round number a post has passed", () => {
    expect(viewsMilestone(999)).toBeNull();
    expect(viewsMilestone(1_000)).toBe(1_000);
    expect(viewsMilestone(14_200)).toBe(10_000);
    expect(viewsMilestone(2_300_000)).toBe(1_000_000);
  });
});
