// Fallback-only provider for groqChat/groqChatStream (see groq.ts) — not
// meant to be called directly by feature code. Mirrors GroqMessage's shape
// so the fallback in groq.ts can hand messages straight through.

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

type GeminiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GeminiChatOptions = {
  model?: string;
  messages: GeminiMessage[];
  temperature?: number;
  max_tokens?: number;
};

function toGeminiPayload(options: GeminiChatOptions) {
  const systemMessages = options.messages.filter((m) => m.role === "system");
  const turns = options.messages.filter((m) => m.role !== "system");

  return {
    systemInstruction: systemMessages.length
      ? { parts: [{ text: systemMessages.map((m) => m.content).join("\n\n") }] }
      : undefined,
    contents: turns.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.max_tokens ?? 1024,
    },
  };
}

export async function geminiChat(options: GeminiChatOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const model = options.model ?? "gemini-2.0-flash";
  const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toGeminiPayload(options)),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p: { text?: string }) => p.text ?? "").join("");
}

export async function* geminiChatStream(options: GeminiChatOptions) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const model = options.model ?? "gemini-2.0-flash";
  const response = await fetch(
    `${GEMINI_API_URL}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toGeminiPayload(options)),
    },
  );

  if (!response.ok || !response.body) {
    const body = response.body ? "" : await response.text();
    throw new Error(`Gemini API error ${response.status}: ${body}`);
  }

  const reader = response.body.getReader();
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
      try {
        const parsed = JSON.parse(line.slice(6));
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch {
        // skip malformed chunks
      }
    }
  }
}
