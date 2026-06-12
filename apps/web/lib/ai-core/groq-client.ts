import Groq from "groq-sdk";

// ── Model constants ───────────────────────────────────────────────────────────
export const AI_MODELS = {
  // Use for tool calling, budget reasoning, multi-step decisions
  SMART: "llama-3.3-70b-versatile",
  // Use for fast, short-output tasks (Why This? explanations)
  FAST: "llama-3.1-8b-instant",
} as const;

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

// ── Key pool ──────────────────────────────────────────────────────────────────
// Keys are tried in order. On rate-limit (429) or quota error, the next key
// is tried automatically. All 4 slots are optional — use however many you have.
const KEY_POOL: string[] = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  // Legacy key as final fallback
  process.env.GROQ_API_KEY_PROD_1,
  process.env.GROQ_API_KEY,
]
  .filter((k): k is string => typeof k === "string" && k.length > 0)
  .filter((k, i, arr) => arr.indexOf(k) === i); // dedupe

function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  const status = e.status as number | undefined;
  const message = String(e.message ?? "").toLowerCase();
  return (
    status === 429 ||
    status === 413 ||
    message.includes("rate limit") ||
    message.includes("quota") ||
    message.includes("tokens per") ||
    message.includes("requests per")
  );
}

// ── Core executor with automatic key rotation ─────────────────────────────────
export async function callGroq<T>(
  fn: (client: Groq) => Promise<T>,
): Promise<T> {
  if (KEY_POOL.length === 0) {
    throw new Error("No Groq API keys configured. Set GROQ_API_KEY_1 (or GROQ_API_KEY) in env.");
  }

  let lastErr: unknown;

  for (const key of KEY_POOL) {
    const client = new Groq({ apiKey: key });
    try {
      return await fn(client);
    } catch (err) {
      lastErr = err;
      if (isQuotaError(err)) {
        // Rate limited on this key — try next
        continue;
      }
      // Non-quota error (bad request, model not found, etc.) — don't rotate
      throw err;
    }
  }

  // All keys exhausted
  console.error("[groq-client] All API keys exhausted or rate-limited", lastErr);
  throw lastErr;
}

// ── Chat completions helper ───────────────────────────────────────────────────
export type GroqMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
};

export type GroqTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ChatOptions = {
  model: AIModel;
  messages: GroqMessage[];
  tools?: GroqTool[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
};

export async function groqChat(options: ChatOptions) {
  return callGroq((client) =>
    client.chat.completions.create({
      model:           options.model,
      messages:        options.messages as Parameters<typeof client.chat.completions.create>[0]["messages"],
      tools:           options.tools as Parameters<typeof client.chat.completions.create>[0]["tools"],
      temperature:     options.temperature ?? 0.5,
      max_tokens:      options.max_tokens ?? 800,
      response_format: options.response_format,
    })
  );
}
