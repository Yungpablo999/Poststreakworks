import { type NextRequest } from "next/server";
import { getCaller, withErrorHandling } from "@/lib/trpc/server-caller";

export const runtime = "nodejs";

// JarvisEngineService.generateScript sends {topic, angle}, expects back
// {hook, body, takeaway, cta} — contentStudio.generateScript takes
// {idea, length, style, cta} and returns {title, beats[], cta}, a
// structurally different shape (beats is an ordered array of
// {section, text, duration_seconds}, not fixed hook/body/takeaway fields).
// Adapts both directions rather than changing the underlying schema.
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const { topic, angle } = await request.json();
    const caller = await getCaller(request);
    const result = await caller.contentStudio.generateScript({
      idea: topic ?? "",
      length: "short",
      style: angle ?? "engaging",
      cta: "engage",
    });

    const findBeat = (section: string, fallbackIndex: number) =>
      result.script.beats.find((b) => b.section.toLowerCase().includes(section))?.text ??
      result.script.beats[fallbackIndex]?.text ??
      "";

    return {
      hook: findBeat("hook", 0),
      body: findBeat("body", 1),
      takeaway: findBeat("takeaway", 2),
      cta: result.script.cta,
    };
  });
}
