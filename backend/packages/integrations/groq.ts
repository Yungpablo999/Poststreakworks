import { geminiChat, geminiChatStream } from "./gemini";

const GROQ_API_URL = "https://api.groq.com/openai/v1";

type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GroqChatOptions = {
  model?: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};

async function groqChatOnly(options: GroqChatOptions) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // llama-3.3-70b-versatile was retired from Groq's lineup (404
      // model_not_found, confirmed live against /v1/models on 2026-09-11).
      // gpt-oss-120b is the closest general-purpose replacement; it's a
      // reasoning model, so give it enough max_tokens headroom (the default
      // below) or it can burn the whole budget on hidden reasoning and
      // return empty content — verified fine at 300+ tokens, empty at 10.
      model: options.model ?? "openai/gpt-oss-120b",
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1024,
      stream: options.stream ?? false,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq API error ${response.status}: ${body}`);
  }

  if (options.stream) {
    return response.body;
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? "";
}

// Groq is primary; Gemini is a fallback for when Groq errors or rate-limits
// (per founder direction — Groq stays the default, this only kicks in on
// failure, not for load-balancing or cost reasons).
export async function groqChat(options: GroqChatOptions) {
  try {
    return await groqChatOnly(options);
  } catch (err) {
    if (options.stream) throw err; // streaming fallback is handled in groqChatStream, not here
    console.error("Groq call failed, falling back to Gemini:", err instanceof Error ? err.message : err);
    return geminiChat(options);
  }
}

export async function* groqChatStream(options: GroqChatOptions) {
  let body: ReadableStream<Uint8Array> | null | undefined;
  try {
    body = await groqChatOnly({ ...options, stream: true });
  } catch (err) {
    console.error("Groq stream failed, falling back to Gemini:", err instanceof Error ? err.message : err);
    yield* geminiChatStream(options);
    return;
  }
  if (!body) return;

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // skip malformed chunks
      }
    }
  }
}
