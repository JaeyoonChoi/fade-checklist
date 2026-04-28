import "server-only";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatOptions = {
  model?: string;
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
};

export async function chat(options: ChatOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local 또는 Vercel 환경변수에 추가하세요."
    );
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: options.model ?? "claude-sonnet-4-6",
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.4,
      system: options.system,
      messages: options.messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API 오류 (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = (data.content ?? [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Anthropic 응답이 비어 있습니다.");
  }
  return text;
}

export function extractJson<T = unknown>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("AI 응답에서 JSON 객체를 찾지 못했습니다.");
  }
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice) as T;
  } catch (e) {
    throw new Error(
      `AI 응답 JSON 파싱 실패: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}
