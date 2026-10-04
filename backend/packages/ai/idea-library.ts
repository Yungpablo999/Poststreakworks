// The PostStreak idea library: hand-written post ideas for each topic, and the templates that turn a
// creator's own topic into ideas for the goal they picked. It needs no AI and no keys, so a creator
// always has something real to start from, whether or not Jarvis (the writing tools in studio.ts) is on.
//
// Pure functions: the same inputs give the same ideas, so they are tested without a database.

export type IdeaGoal = "followers" | "saves" | "comments" | "often";

export const IDEA_GOALS: readonly IdeaGoal[] = ["followers", "saves", "comments", "often"];

/** The topics creators pick in onboarding (the ids the app stores). */
export const NICHE_LABELS: Record<string, string> = {
  lifestyle: "Lifestyle",
  comedy: "Comedy",
  education: "Education",
  beauty: "Beauty & Fashion",
  food: "Food",
  fitness: "Fitness",
  tech: "Tech & Business",
  music: "Music & Dance",
};

export type LibraryIdea = {
  id: string;
  niche: string;
  title: string;
  hook: string;
  format: string;
  /** A time of day to try posting this kind of idea. A suggestion for the topic, not a reading of the creator's audience. */
  bestTime: string;
  why: string;
};

type Seed = { title: string; hook: string; bestTime: string };

const IDEAS_BY_NICHE: Record<string, Seed[]> = {
  lifestyle: [
    { title: "My 5-minute morning reset", hook: "I stopped scrolling first thing in the morning. Here is what I do instead.", bestTime: "7:30 AM" },
    { title: "A day in my life, honestly", hook: "Not the aesthetic version. The real one.", bestTime: "6:00 PM" },
    { title: "3 small habits that changed my week", hook: "None of these take more than two minutes.", bestTime: "8:00 PM" },
  ],
  comedy: [
    { title: "When the group chat goes silent", hook: "Everyone has sent this exact message at least once.", bestTime: "8:30 PM" },
    { title: "Things my mum says, ranked", hook: "Number one is non-negotiable.", bestTime: "7:00 PM" },
    { title: "Me trying to be productive", hook: "Step one: make a to-do list. Step two: lose it.", bestTime: "9:00 PM" },
  ],
  education: [
    { title: "One thing school never taught you", hook: "I wish someone told me this at 16.", bestTime: "7:00 PM" },
    { title: "Explain it like I am five", hook: "The simplest way to understand this in 30 seconds.", bestTime: "6:30 PM" },
    { title: "3 myths people still believe", hook: "Number two surprised me too.", bestTime: "8:00 PM" },
  ],
  beauty: [
    { title: "My 3-product everyday look", hook: "Five minutes, three products, done.", bestTime: "7:30 AM" },
    { title: "Outfit formula that always works", hook: "Use this when you have nothing to wear.", bestTime: "6:00 PM" },
    { title: "Budget swap vs. the real thing", hook: "Can you spot the difference?", bestTime: "8:00 PM" },
  ],
  food: [
    { title: "A 10-minute dinner I make weekly", hook: "Cheap, fast, and better than takeaway.", bestTime: "5:30 PM" },
    { title: "Rating the viral recipe honestly", hook: "Is it actually worth it?", bestTime: "7:00 PM" },
    { title: "What I eat in a busy day", hook: "Real food for a real schedule.", bestTime: "12:30 PM" },
  ],
  fitness: [
    { title: "A 10-minute workout, no equipment", hook: "You can do this in your bedroom tonight.", bestTime: "6:30 AM" },
    { title: "One mistake beginners make", hook: "I did this for a year before I noticed.", bestTime: "7:00 PM" },
    { title: "What I eat after training", hook: "Simple, filling and it actually helps.", bestTime: "6:00 PM" },
  ],
  tech: [
    { title: "3 apps that save me an hour a day", hook: "Number three is free.", bestTime: "8:00 AM" },
    { title: "How I plan my week in 10 minutes", hook: "The Sunday system that keeps me on track.", bestTime: "7:00 PM" },
    { title: "A money lesson I learned late", hook: "I wish I started this in my first job.", bestTime: "8:30 PM" },
  ],
  music: [
    { title: "Learn this 8-count in 30 seconds", hook: "Slow version first, then full speed.", bestTime: "7:00 PM" },
    { title: "The song stuck in my head this week", hook: "My cover, one take, no edits.", bestTime: "8:30 PM" },
    { title: "Behind the scenes of my practice", hook: "What an hour of practice really looks like.", bestTime: "6:00 PM" },
  ],
};

const GENERAL_IDEAS: Seed[] = [
  { title: "Why I started creating", hook: "This is the reason I finally hit post.", bestTime: "7:30 PM" },
  { title: "One thing I wish I knew before I started", hook: "Perfection is the enemy of posting.", bestTime: "7:00 PM" },
  { title: "Introduce yourself in 30 seconds", hook: "Hi, I am new here. Here is what to expect.", bestTime: "6:30 PM" },
];

/** The app's topic ids from either ids ("tech") or the names the profile shows ("Tech & AI"). */
export function normalizeNiches(input: readonly string[] = []): string[] {
  const ids = Object.keys(NICHE_LABELS);
  const out = input
    .map((raw) => {
      const v = raw.trim().toLowerCase();
      if (ids.includes(v)) return v;
      const first = v.split(/[\s&]+/)[0] ?? "";
      return ids.find((id) => id === first || NICHE_LABELS[id]!.toLowerCase().startsWith(first)) ?? null;
    })
    .filter((x): x is string => !!x);
  return Array.from(new Set(out));
}

/** The kind of post each platform is mostly used for. */
export function formatFor(platforms: readonly string[]): string {
  if (platforms.includes("tiktok") || platforms.includes("instagram")) return "30-second Reel";
  if (platforms.includes("youtube")) return "YouTube Short";
  if (platforms.includes("threads")) return "Text post";
  if (platforms.includes("facebook")) return "Short video";
  return "30-second Reel";
}

/** Ideas for the creator's topics first, then general starters. */
export function starterIdeas(niches: readonly string[], platforms: readonly string[]): LibraryIdea[] {
  const format = formatFor(platforms);
  const why = WHY_BY_GOAL.followers;
  const fromNiches = normalizeNiches(niches).flatMap((n) =>
    (IDEAS_BY_NICHE[n] ?? []).map((idea, i) => ({ ...idea, id: `${n}-${i}`, niche: n, format, why })),
  );
  // Interleave topics so moving on to the next idea moves between them
  const byIndex = [0, 1, 2].flatMap((i) => fromNiches.filter((idea) => idea.id.endsWith(`-${i}`)));
  const general = GENERAL_IDEAS.map((idea, i) => ({ ...idea, id: `general-${i}`, niche: "general", format, why }));
  return [...byIndex, ...general];
}

const WHY_BY_GOAL: Record<IdeaGoal, string> = {
  followers: "Relatable ideas get shared, which puts you in front of new people.",
  saves: "Useful and quick to follow, so people save it for later.",
  comments: "Ends on a question people actually want to answer.",
  often: "Fast to film and easy to post today.",
};

// Topics per niche: the goal turns these into its own kind of idea
const NICHE_TOPICS: Record<string, string[]> = {
  lifestyle: ["morning routines", "staying organised", "slow weekends"],
  comedy: ["group chats", "work meetings", "family dinners"],
  education: ["studying", "learning faster", "note taking"],
  beauty: ["skincare", "everyday makeup", "outfit ideas"],
  food: ["quick dinners", "meal prep", "cheap eats"],
  fitness: ["home workouts", "staying consistent at the gym", "stretching"],
  tech: ["productivity apps", "side hustles", "working from home"],
  music: ["dance trends", "learning choreography", "practice sessions"],
};

type Template = { title: (t: string, cap: string) => string; hook: (t: string) => string };

const TOPIC_TEMPLATES: Record<IdeaGoal, Template[]> = {
  followers: [
    { title: (t) => `Things nobody tells you about ${t}`, hook: (t) => `Nobody warned me about this part of ${t}.` },
    { title: (_t, T) => `${T}: the side nobody shows you`, hook: () => "Here’s what it really looks like behind the scenes." },
    { title: (t) => `POV: you’re new to ${t}`, hook: () => "If this is you right now, keep watching." },
    { title: (t) => `How ${t} changed my week`, hook: () => "I didn’t expect this to make such a difference." },
    { title: (t) => `Rating every tip on ${t} I tried`, hook: () => "Number three was a total waste of time." },
    { title: (t) => `The mistake everyone makes with ${t}`, hook: () => "I did this for months before I noticed." },
  ],
  saves: [
    { title: (t) => `5 tips on ${t} worth saving`, hook: () => "Save this so you have it next time." },
    { title: (t) => `My simple checklist for ${t}`, hook: () => "I use this every single time. Here it is." },
    { title: (_t, T) => `${T}, step by step for beginners`, hook: () => "Step one is the one most people skip." },
    { title: (t) => `The tools I use for ${t}`, hook: () => "All of these are free. Save the list." },
    { title: (t) => `A cheat sheet for ${t}`, hook: () => "Everything in one place. Screenshot this." },
    { title: (t) => `3 habits that made ${t} easier`, hook: () => "These are the only ones I kept doing." },
  ],
  comments: [
    { title: (t) => `Unpopular opinion about ${t}`, hook: () => "I know people will disagree with this one." },
    { title: (_t, T) => `${T}: which side are you on?`, hook: () => "Tell me in the comments which one you pick." },
    { title: (t) => `What I wish I’d known sooner about ${t}`, hook: () => "What would you add to this list?" },
    { title: (t) => `Tell me if I’m wrong about ${t}`, hook: () => "Be honest with me in the comments." },
    { title: (t) => `The question I get asked most about ${t}`, hook: () => "Drop your answer before you watch mine." },
    { title: (_t, T) => `${T}: overrated or worth it?`, hook: () => "I changed my mind on this one." },
  ],
  often: [
    { title: (t) => `One quick tip on ${t}, in 30 seconds`, hook: () => "Here’s one thing you can try today." },
    { title: (t) => `A day of ${t} in 3 short clips`, hook: () => "No talking, just the day." },
    { title: (_t, T) => `${T}: today’s small win`, hook: () => "Small win today, and here’s how." },
    { title: (_t, T) => `${T} in one photo and one line`, hook: () => "Today, in one picture." },
    { title: (_t, T) => `${T} in 5 minutes a day`, hook: () => "Five minutes, that’s all it takes." },
    { title: (t) => `Before and after: ${t}`, hook: () => "Here’s where I started." },
  ],
};

// Each goal suits a different format
function goalFormat(goal: IdeaGoal, base: string): string {
  if (goal === "saves") return base === "Text post" ? "Text post" : "Carousel";
  if (goal === "often") return base === "Text post" ? "Text post" : "15-second video";
  return base;
}

/** Ideas for the creator's topics, shaped by the goal they picked. */
export function ideaFeed(niches: readonly string[], goal: IdeaGoal, platforms: readonly string[] = []): LibraryIdea[] {
  const list = starterIdeas(niches.length ? niches : ["lifestyle"], platforms);
  const base = list[0]?.format ?? "30-second Reel";
  // Followers: the hand-written starter ideas are already built to be shared
  if (goal === "followers") return list.map((i) => ({ ...i, why: WHY_BY_GOAL[goal] }));
  // Other goals: ideas written for that goal from the creator's topics
  const ns = normalizeNiches(niches.length ? niches : ["lifestyle"]);
  const topics = ns.flatMap((n) => (NICHE_TOPICS[n] ?? []).map((t) => ({ n, t })));
  const pool = TOPIC_TEMPLATES[goal];
  const made: LibraryIdea[] = topics.flatMap(({ n, t }, ti) =>
    [0, 1].map((k) => {
      const tpl = pool[(ti * 2 + k) % pool.length]!;
      const cap = t.charAt(0).toUpperCase() + t.slice(1);
      return {
        id: `${goal}-${n}-${ti}-${k}`,
        niche: n,
        title: tpl.title(t, cap),
        hook: tpl.hook(t),
        format: goalFormat(goal, base),
        bestTime: list[ti % Math.max(1, list.length)]?.bestTime ?? "7:30 PM",
        why: WHY_BY_GOAL[goal],
      };
    }),
  );
  // Mix topics so the top pick and list move between them
  const byRound = [0, 1].flatMap((k) => made.filter((m) => m.id.endsWith(`-${k}`)));
  return byRound.length ? byRound : list.map((i) => ({ ...i, why: WHY_BY_GOAL[goal] }));
}

const TOPIC_WHY: Record<IdeaGoal, string> = {
  followers: "Relatable ideas get shared, which brings new people",
  saves: "Useful lists and steps are what people save",
  comments: "Opinions and questions get people talking",
  often: "Quick to make, so posting stays easy",
};

/** Three ideas about a topic the creator typed, for their goal. `round` moves on to the next three. */
export function topicIdeas(topic: string, goal: IdeaGoal, format = "30-second Reel", round = 0): LibraryIdea[] {
  const t = topic.trim().replace(/[.!?]+$/, "");
  const lower = t.charAt(0).toLowerCase() + t.slice(1);
  const cap = t.charAt(0).toUpperCase() + t.slice(1);
  const pool = TOPIC_TEMPLATES[goal];
  return [0, 1, 2].map((i) => {
    const tpl = pool[(round * 3 + i) % pool.length]!;
    return {
      id: `topic-${goal}-${round}-${i}`,
      niche: "topic",
      title: tpl.title(lower, cap),
      hook: tpl.hook(lower),
      format,
      bestTime: "7:30 PM",
      why: TOPIC_WHY[goal],
    };
  });
}
