import { groqChat, groqChatStream } from "@poststreak/integrations/groq";
import {
  ideaBuilderPrompt,
  hookLabPrompt,
  scriptBuilderPrompt,
  captionStudioPrompt,
} from "./prompts";

// ============================================================================
// AI Content Studio — four confirmed modules
// All synchronous, streamed Groq calls. No async queue needed.
// ============================================================================

function parseJsonResponse<T>(text: string): T {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```json\n?/i, "")
    .replace(/^```\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

// ----------------------------------------------------------------------------
// Idea Builder
// niche/goal/topic/platform/audience -> 5 content ideas
// ----------------------------------------------------------------------------

export type IdeaBuilderInput = {
  niche: string;
  goal: string;
  topic: string;
  platform: string;
  audience: string;
};

export type ContentIdea = {
  title: string;
  description: string;
};

export async function generateIdeas(
  input: IdeaBuilderInput,
): Promise<ContentIdea[]> {
  const prompt = ideaBuilderPrompt(input);

  const response = await groqChat({
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    temperature: prompt.temperature,
    max_tokens: 1024,
  });

  return parseJsonResponse<ContentIdea[]>(response);
}

// ----------------------------------------------------------------------------
// Hook Lab
// topic/tone/format -> 7 opening hooks
// ----------------------------------------------------------------------------

export type HookLabInput = {
  topic: string;
  tone: string;
  format: string;
};

export async function generateHooks(input: HookLabInput): Promise<string[]> {
  const prompt = hookLabPrompt(input);

  const response = await groqChat({
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    temperature: prompt.temperature,
    max_tokens: 512,
  });

  return parseJsonResponse<string[]>(response);
}

// ----------------------------------------------------------------------------
// Script Builder
// idea/length/style/CTA -> short-form video script
// ----------------------------------------------------------------------------

export type ScriptBuilderInput = {
  idea: string;
  length: string;
  style: string;
  cta: string;
};

export type ScriptBeat = {
  section: string;
  text: string;
  duration_seconds: number;
};

export type ScriptOutput = {
  title: string;
  duration_estimate: string;
  beats: ScriptBeat[];
  cta: string;
};

export async function generateScript(
  input: ScriptBuilderInput,
): Promise<ScriptOutput> {
  const prompt = scriptBuilderPrompt(input);

  const response = await groqChat({
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    temperature: prompt.temperature,
    max_tokens: 1536,
  });

  return parseJsonResponse<ScriptOutput>(response);
}

// ----------------------------------------------------------------------------
// Caption Studio
// content summary/voice/platform -> captions
// ----------------------------------------------------------------------------

export type CaptionStudioInput = {
  contentSummary: string;
  voice: string;
  platform: string;
  includeHashtags: boolean;
};

export type CaptionOutput = {
  caption: string;
  first_line_hook: string;
  hashtags?: string[];
};

export async function generateCaption(
  input: CaptionStudioInput,
): Promise<CaptionOutput> {
  const prompt = captionStudioPrompt(input);

  const response = await groqChat({
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    temperature: prompt.temperature,
    max_tokens: 768,
  });

  return parseJsonResponse<CaptionOutput>(response);
}

// ----------------------------------------------------------------------------
// Streaming variants for real-time UI feedback
// ----------------------------------------------------------------------------

export async function generateIdeasStream(input: IdeaBuilderInput) {
  const prompt = ideaBuilderPrompt(input);
  return groqChatStream({
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    temperature: prompt.temperature,
    max_tokens: 1024,
    stream: true,
  });
}

export async function generateHooksStream(input: HookLabInput) {
  const prompt = hookLabPrompt(input);
  return groqChatStream({
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    temperature: prompt.temperature,
    max_tokens: 512,
    stream: true,
  });
}

export async function generateScriptStream(input: ScriptBuilderInput) {
  const prompt = scriptBuilderPrompt(input);
  return groqChatStream({
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    temperature: prompt.temperature,
    max_tokens: 1536,
    stream: true,
  });
}

export async function generateCaptionStream(input: CaptionStudioInput) {
  const prompt = captionStudioPrompt(input);
  return groqChatStream({
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    temperature: prompt.temperature,
    max_tokens: 768,
    stream: true,
  });
}
