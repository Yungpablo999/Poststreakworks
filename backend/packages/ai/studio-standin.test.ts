import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type AddressInfo } from "node:net";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { aiMode } from "@poststreak/integrations";
import { jarvisChat } from "./jarvis-chat";
import { StudioError, editCaption, repurposeText, rewriteScriptPart, writeCaptions, writeHooks, writeScript } from "./studio";

// Every writing tool, through the local stand-in model (backend/scripts/mocks/ai.mjs) over real HTTP and
// through the real checks on a reply. The stand-in is what `npm run local` uses when there is no key, so
// this is what keeps it from drifting away from what the tools accept. (It says nothing about how a real
// model behaves: that needs a real key.)

let server: ChildProcess;
let origin: string;
const before = { mock: process.env.AI_MOCK_ORIGIN, groq: process.env.GROQ_API_KEY, gemini: process.env.GEMINI_API_KEY };

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address() as AddressInfo;
      probe.close(() => resolve(port));
    });
  });

beforeAll(async () => {
  const port = await freePort();
  origin = `http://127.0.0.1:${port}`;
  const script = fileURLToPath(new URL("../../scripts/mock-providers.mjs", import.meta.url));
  server = spawn(process.execPath, [script], { env: { ...process.env, MOCK_PROVIDERS_PORT: String(port) }, stdio: ["ignore", "pipe", "inherit"] });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.once("exit", (code) => reject(new Error(`the stand-ins stopped (exit ${code})`)));
    server.stdout!.on("data", (chunk: Buffer) => {
      if (chunk.toString().includes("stand-in platforms on")) resolve();
    });
  });
  process.env.AI_MOCK_ORIGIN = `${origin}/ai`;
  delete process.env.GROQ_API_KEY;
  delete process.env.GEMINI_API_KEY;
}, 30_000);

afterAll(() => {
  server?.removeAllListeners("exit");
  server?.kill();
  for (const [key, value] of [["AI_MOCK_ORIGIN", before.mock], ["GROQ_API_KEY", before.groq], ["GEMINI_API_KEY", before.gemini]] as const) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("the stand-in model", () => {
  it("is used when asked for, and the server says so", () => {
    expect(aiMode()).toBe("stand-in");
  });

  it("writes a script in four parts from the creator's idea", async () => {
    const script = await writeScript({ idea: "my morning reset", length: 30, style: "talking" });
    expect(Object.keys(script).sort()).toEqual(["cta", "hook", "lesson", "story"]);
    expect(script.hook).toMatch(/\[stand-in\].*my morning reset/);
    for (const part of Object.values(script)) expect(part.length).toBeGreaterThan(5);
  });

  it("rewrites one part", async () => {
    const script = { hook: "a", story: "b", lesson: "c", cta: "d" };
    const longer = await rewriteScriptPart({ idea: "my morning reset", part: "story", direction: "different", length: 30, style: "talking", script });
    expect(longer.text).toMatch(/story for my morning reset/);
    const shorter = await rewriteScriptPart({ idea: "my morning reset", part: "story", direction: "shorter", length: 30, style: "talking", script });
    expect(shorter.text.length).toBeLessThan(longer.text.length);
  });

  it("writes three different hooks, and three more when asked for another round", async () => {
    const first = await writeHooks({ idea: "my morning reset", style: "talking", angle: "question", avoid: [] });
    expect(new Set(first.hooks).size).toBe(3);
    const second = await writeHooks({ idea: "my morning reset", style: "talking", angle: "question", avoid: first.hooks });
    expect(second.hooks.some((h) => first.hooks.includes(h))).toBe(false);
  });

  it("writes three caption options with tidy hashtags, and different ones the next round", async () => {
    const first = await writeCaptions({ topic: "morning routines that stick", goal: "saves", tones: ["Helpful"], avoid: [] });
    expect(first.options).toHaveLength(3);
    expect(first.options[0]!.hashtags.every((t) => /^#[\p{L}\p{N}_]+$/u.test(t))).toBe(true);
    const second = await writeCaptions({ topic: "morning routines that stick", goal: "saves", tones: ["Helpful"], avoid: first.options.map((o) => o.caption.split("\n")[0]!) });
    expect(second.options.map((o) => o.label)).not.toEqual(first.options.map((o) => o.label));
  });

  it("changes a caption: rewrite, shorten, ask a question, and suggest tags", async () => {
    const caption = "I stopped checking my phone first thing in the morning and it changed how my whole day starts.";
    const rewritten = await editCaption({ caption, action: "rewrite" });
    expect("caption" in rewritten && rewritten.caption).toMatch(/\[stand-in\]/);
    const shorter = await editCaption({ caption, action: "shorten" });
    expect("caption" in shorter && shorter.caption.length).toBeLessThan(caption.length);
    const asked = await editCaption({ caption, action: "ask" });
    expect("caption" in asked && asked.caption).toMatch(/\?$/);
    const tags = await editCaption({ caption, action: "tags" });
    expect("tags" in tags && tags.tags.length).toBeGreaterThanOrEqual(3);
  });

  it.each(["video", "carousel", "text"] as const)("repurposes for every platform, preferring %s", async (prefer) => {
    const platforms = ["tiktok", "instagram", "youtube", "threads", "facebook"] as const;
    const out = await repurposeText({ text: "3 mistakes new creators make", platforms: [...platforms], prefer });
    expect(out.versions.map((v) => v.platform)).toEqual([...platforms]);
    for (const v of out.versions) {
      if (v.format === "carousel") expect(v.slides!.length).toBeGreaterThanOrEqual(2);
      if (v.format === "thread") expect(v.posts!.length).toBeGreaterThanOrEqual(2);
    }
    if (prefer === "carousel") expect(out.versions.find((v) => v.platform === "instagram")!.format).toBe("carousel");
    if (prefer === "text") expect(out.versions.find((v) => v.platform === "threads")!.format).toBe("thread");
  });

  it("answers Ask Jarvis in the shape the app renders, with ideas and jobs for Ghost", async () => {
    const context = { persona: "new" as const, niches: ["lifestyle"], platforms: ["tiktok"] };
    const ideas = await jarvisChat({ message: "give me post ideas", history: [], context });
    expect(ideas.degraded).toBe(false);
    expect(ideas.reply.ideas).toHaveLength(3);
    const open = await jarvisChat({ message: "when should I post? open my schedule", history: [], context });
    expect(open.reply.tasks?.[0]?.job).toEqual({ kind: "open", place: "schedule" });
    const compose = await jarvisChat({ message: "write a post about budgeting", history: [], context });
    expect(compose.reply.tasks?.[0]?.job.kind).toBe("compose");
  });

  it("is a failure the creator can understand when it cannot be reached", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const keep = process.env.AI_MOCK_ORIGIN;
    process.env.AI_MOCK_ORIGIN = "http://127.0.0.1:1/ai"; // nothing is listening
    try {
      await expect(writeScript({ idea: "x", length: 30, style: "talking" })).rejects.toMatchObject({ kind: "unavailable" });
      await expect(writeScript({ idea: "x", length: 30, style: "talking" })).rejects.toBeInstanceOf(StudioError);
      const chat = await jarvisChat({ message: "hello", history: [], context: { persona: "new", niches: [], platforms: [] } });
      expect(chat.degraded).toBe(true);
    } finally {
      process.env.AI_MOCK_ORIGIN = keep;
      spy.mockRestore();
    }
  });
});
