import Groq from "groq-sdk";

// ── Model constants ───────────────────────────────────────────────────────────
export const AI_MODELS = {
  // Use for tool calling, budget reasoning, multi-step decisions
  SMART: "llama-3.3-70b-versatile",
  // Use for fast, short-output tasks (Why This? explanations)
  FAST: "llama-3.1-8b-instant",
} as const;

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

// ── Active key ────────────────────────────────────────────────────────────────
// For now we use one active Groq key only. The GROQ_API_KEY_1..4 slots are
// intentionally inactive placeholders so rotation can be re-enabled later.
const ACTIVE_GROQ_API_KEY =
  process.env.GROQ_API_KEY ?? process.env.GROQ_API_KEY_PROD_1 ?? "";

// ── Core executor ────────────────────────────────────────────────────────────
export async function callGroq<T>(
  fn: (client: Groq) => Promise<T>,
): Promise<T> {
  if (!ACTIVE_GROQ_API_KEY) {
    throw new Error("No Groq API key configured. Set GROQ_API_KEY in env.");
  }

  const client = new Groq({ apiKey: ACTIVE_GROQ_API_KEY });
  return fn(client);
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
