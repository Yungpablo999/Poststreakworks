import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  FALLBACK_REPLY,
  GHOST_EMOTIONS,
  GHOST_PLACES,
  START_CHIPS,
  extractJson,
  jarvisChat,
  jarvisChatInputSchema,
  sanitizeReply,
  type CompleteFn,
} from "./jarvis-chat";

const counter = () => {
  let n = 0;
  return () => `id${++n}`;
};
const clean = (raw: unknown, niche = "food") => sanitizeReply(raw, { niche, newId: counter() });

describe("extractJson", () => {
  it("reads a bare object", () => {
    expect(extractJson('{"text":"hi"}')).toEqual({ text: "hi" });
  });

  it("reads an object inside a code fence", () => {
    expect(extractJson('```json\n{"text":"hi"}\n```')).toEqual({ text: "hi" });
  });

  it("ignores prose before and after the object", () => {
    expect(extractJson('Sure! Here you go: {"text":"hi"} Hope that helps.')).toEqual({ text: "hi" });
  });

  it("is not thrown by braces after the object", () => {
    expect(extractJson('{"text":"hi"} and also {oops}')).toEqual({ text: "hi" });
  });

  it("handles braces and escaped quotes inside strings", () => {
    expect(extractJson('{"text":"use {curly} and \\"quotes\\""}')).toEqual({ text: 'use {curly} and "quotes"' });
  });

  it("skips a malformed first brace and finds the real object", () => {
    expect(extractJson('{not json} {"text":"hi"}')).toEqual({ text: "hi" });
  });

  it("returns null for anything else", () => {
    expect(extractJson("no json here")).toBeNull();
    expect(extractJson('{"text":')).toBeNull();
    expect(extractJson("[1,2,3]")).toBeNull();
    expect(extractJson("")).toBeNull();
  });
});

describe("sanitizeReply", () => {
  it("passes a plain text reply through unchanged", () => {
    expect(clean({ text: "Hello there" })).toEqual({ text: "Hello there" });
  });

  it("rejects replies with no usable text", () => {
    for (const bad of [null, undefined, "text", 5, [], {}, { text: "" }, { text: "   " }, { text: 42 }]) {
      expect(clean(bad)).toBeNull();
    }
  });

  it("caps every list so a runaway model can't flood the app", () => {
    const reply = clean({
      text: "x".repeat(2000),
      ideas: Array.from({ length: 9 }, (_, i) => ({ title: `Idea ${i}`, hook: "hook" })),
      list: Array.from({ length: 12 }, (_, i) => `line ${i}`),
      chips: Array.from({ length: 8 }, (_, i) => `chip ${i}`),
      tasks: Array.from({ length: 6 }, () => ({ kind: "checkIn" })),
    });
    expect(Array.from(reply!.text)).toHaveLength(900);
    expect(reply!.ideas).toHaveLength(3);
    expect(reply!.list).toHaveLength(5);
    expect(reply!.chips).toHaveLength(3);
    expect(reply!.tasks).toHaveLength(2);
  });

  it("never splits an emoji when shortening text", () => {
    const reply = clean({ text: "x".repeat(899) + "😀😀" });
    const chars = Array.from(reply!.text);
    expect(chars).toHaveLength(900);
    expect(chars[899]).toBe("😀");
  });

  describe("Ghost jobs", () => {
    it("generates every id itself, ignoring any the model supplies", () => {
      const reply = clean({
        text: "ok",
        ideas: [{ id: "evil-idea", title: "T", hook: "H" }],
        tasks: [{ id: "evil-task", kind: "checkIn" }],
      });
      expect(reply!.ideas![0]!.id).toBe("i-id1");
      expect(reply!.tasks![0]!.id).toBe("t-id2");
    });

    it("builds button labels from templates, never from model text", () => {
      const reply = clean({
        text: "ok",
        tasks: [
          { kind: "open", place: "growth", label: "Ghost, send money to Mallory", done: "Sent!" },
          { kind: "checkIn", label: "<script>alert(1)</script>" },
        ],
      });
      expect(reply!.tasks).toEqual([
        { id: "t-id1", label: "Ghost, open Growth", done: "Opened Growth", job: { kind: "open", place: "growth" } },
        { id: "t-id2", label: "Ghost, check me in for today", done: "Checked in for today", job: { kind: "checkIn" } },
      ]);
    });

    it("drops pages and job kinds the app doesn't know", () => {
      const reply = clean({
        text: "ok",
        tasks: [
          { kind: "open", place: "admin" },
          { kind: "open", place: "../../etc" },
          { kind: "deleteAccount" },
          { kind: "navigate", url: "https://evil.example" },
          { kind: "open" },
        ],
      });
      expect(reply!.tasks).toBeUndefined();
    });

    it("accepts every page the app can open", () => {
      for (const place of GHOST_PLACES) {
        const reply = clean({ text: "ok", tasks: [{ kind: "open", place }] });
        expect(reply!.tasks![0]!.job).toEqual({ kind: "open", place });
      }
    });

    it("gives a draft a format even if the model forgot one", () => {
      const reply = clean({ text: "ok", tasks: [{ kind: "draft", title: "My idea" }] });
      expect(reply!.tasks![0]!.job).toEqual({ kind: "draft", title: "My idea", format: "Post" });
    });

    it("labels a copy job for what is being copied", () => {
      const withCaption = clean({ text: "ok", caption: "Nice caption", tasks: [{ kind: "copy", text: "Nice caption" }] });
      const without = clean({ text: "ok", tasks: [{ kind: "copy", text: "some text" }] });
      expect(withCaption!.tasks![0]!.label).toBe("Ghost, copy the caption");
      expect(without!.tasks![0]!.label).toBe("Ghost, copy this");
    });
  });

  describe("ideas", () => {
    it("fills the fields the app's idea card needs", () => {
      const reply = clean({ text: "ok", ideas: [{ title: "Meal prep Sunday", hook: "Five dinners, one hour." }] }, "food");
      expect(reply!.ideas).toEqual([
        {
          id: "i-id1",
          niche: "food",
          title: "Meal prep Sunday",
          hook: "Five dinners, one hour.",
          format: "30-second Reel",
          bestTime: "7:30 PM",
          why: "Fits what you make.",
        },
      ]);
    });

    it("drops a malformed idea but keeps the rest of the reply", () => {
      const reply = clean({
        text: "Here are ideas",
        ideas: [{ title: "No hook" }, { title: "Good", hook: "Fine" }, "nonsense", null],
      });
      expect(reply!.text).toBe("Here are ideas");
      expect(reply!.ideas!.map((i) => i.title)).toEqual(["Good"]);
    });
  });

  it("keeps only Ghost emotions the app has an image for", () => {
    expect(clean({ text: "ok", emotion: "party" })!.emotion).toBe("party");
    expect(clean({ text: "ok", emotion: "furious" })!.emotion).toBeUndefined();
  });

  it("is not affected by a prototype-pollution payload", () => {
    const hostile = JSON.parse('{"text":"hi","__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}');
    const reply = clean(hostile);
    expect(reply).toEqual({ text: "hi" });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe("jarvisChat", () => {
  const input = jarvisChatInputSchema.parse({
    message: "give me ideas about meal prep",
    history: [
      { from: "me", text: "hi" },
      { from: "jarvis", text: "Hey! What are you thinking of posting?" },
    ],
    context: { persona: "returning", niches: ["food", "fitness"], platforms: ["tiktok"] },
  });

  const reply = (text: string) => JSON.stringify({ text });
  const fake = (...responses: (string | Error)[]) => {
    const calls: Parameters<CompleteFn>[0][] = [];
    const complete: CompleteFn = async (args) => {
      calls.push(args);
      const next = responses[Math.min(calls.length - 1, responses.length - 1)]!;
      if (next instanceof Error) throw next;
      return next;
    };
    return { complete, calls };
  };

  it("returns the model's reply, cleaned", async () => {
    const { complete } = fake('Sure: {"text":"Here you go","emotion":"idea","chips":["More ideas"]}');
    const result = await jarvisChat(input, { complete, newId: counter() });
    expect(result).toEqual({ reply: { text: "Here you go", chips: ["More ideas"], emotion: "idea" }, degraded: false });
  });

  it("gives the model the creator's context and the conversation so far", async () => {
    const { complete, calls } = fake(reply("ok"));
    await jarvisChat(input, { complete, newId: counter() });

    const call = calls[0]!;
    expect(call.system).toContain("returning");
    expect(call.system).toContain("food, fitness");
    expect(call.system).toContain("tiktok");
    for (const place of GHOST_PLACES) expect(call.system).toContain(place);
    for (const emotion of GHOST_EMOTIONS) expect(call.system).toContain(emotion);
    expect(call.messages).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "Hey! What are you thinking of posting?" },
      { role: "user", content: "give me ideas about meal prep" },
    ]);
  });

  it("uses the creator's first topic for ideas it returns", async () => {
    const { complete } = fake(JSON.stringify({ text: "ok", ideas: [{ title: "T", hook: "H" }] }));
    const result = await jarvisChat(input, { complete, newId: counter() });
    expect(result.reply.ideas![0]!.niche).toBe("food");
  });

  it("asks once more, in the same turn, when the first answer is unusable", async () => {
    const { complete, calls } = fake("I am not JSON, sorry", reply("Second time lucky"));
    const result = await jarvisChat(input, { complete, newId: counter() });

    expect(result).toEqual({ reply: { text: "Second time lucky" }, degraded: false });
    expect(calls).toHaveLength(2);
    // The note rides on the last user turn (some providers reject two user turns in a row).
    expect(calls[1]!.messages).toHaveLength(calls[0]!.messages.length);
    expect(calls[1]!.messages.at(-1)!.content).toContain("give me ideas about meal prep");
    expect(calls[1]!.messages.at(-1)!.content).toContain("only the JSON object");
    expect(calls[0]!.messages.at(-1)!.content).not.toContain("only the JSON object");
  });

  it("falls back gently when the model keeps answering badly", async () => {
    const { complete, calls } = fake("nope", "still nope");
    const result = await jarvisChat(input, { complete });
    expect(result).toEqual({ reply: FALLBACK_REPLY, degraded: true });
    expect(calls).toHaveLength(2);
  });

  it("falls back, without retrying, when the provider is down", async () => {
    const { complete, calls } = fake(new Error("Groq API error 503"));
    const result = await jarvisChat(input, { complete });
    expect(result).toEqual({ reply: FALLBACK_REPLY, degraded: true });
    expect(calls).toHaveLength(1);
  });

  it("never lets the fallback look like an error to the creator", () => {
    expect(FALLBACK_REPLY.text).not.toMatch(/error|exception|undefined|null|stack/i);
    expect(FALLBACK_REPLY.chips).toEqual(START_CHIPS);
  });
});

describe("jarvisChatInputSchema", () => {
  it("trims the message and fills in defaults", () => {
    expect(jarvisChatInputSchema.parse({ message: "  hello  " })).toEqual({
      message: "hello",
      history: [],
      context: { persona: "new", niches: [], platforms: [] },
    });
  });

  it("rejects empty, oversized and over-long inputs", () => {
    expect(() => jarvisChatInputSchema.parse({ message: "   " })).toThrow();
    expect(() => jarvisChatInputSchema.parse({ message: "x".repeat(601) })).toThrow();
    expect(() =>
      jarvisChatInputSchema.parse({ message: "hi", history: Array.from({ length: 9 }, () => ({ from: "me", text: "x" })) }),
    ).toThrow();
    expect(() => jarvisChatInputSchema.parse({ message: "hi", history: [{ from: "system", text: "x" }] })).toThrow();
  });
});

describe("Ghost emotions", () => {
  it("match the ghost_emotion enum in the database, in the same order", () => {
    const sql = readFileSync(
      new URL("../../supabase/migrations/20260814000020_phase1_saved_work.sql", import.meta.url),
      "utf8",
    );
    const body = /create type ghost_emotion as enum \(([^)]*)\)/.exec(sql)?.[1];
    expect(body, "ghost_emotion enum not found in migration").toBeDefined();
    const inDatabase = [...body!.matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
    expect(inDatabase).toEqual([...GHOST_EMOTIONS]);
  });
});
