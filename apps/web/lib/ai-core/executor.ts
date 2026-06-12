import { groqChat, AI_MODELS, type GroqMessage } from "./groq-client";
import { GOOUTSIDE_TOOLS, executeTool, type ToolName } from "./tools";

const ACCRA_TIME = new Date().toLocaleString("en-GH", {
  weekday: "long", month: "long", day: "numeric",
  hour: "numeric", minute: "2-digit", hour12: true,
  timeZone: "Africa/Accra",
});

const SYSTEM_PROMPT = `You are GoOutside's AI assistant — the smartest event guide in Ghana.
You help people in Accra, Kumasi, and Takoradi discover events, plan nights out, and make the most of their social life.
Current date and time in Accra: ${ACCRA_TIME}.

HOW YOU WORK:
- You have tools that query live GoOutside data. Always call tools to get real event data — never guess or invent events.
- Call get_user_profile first when making personalized recommendations, so you know who you're talking to.
- Call get_budget_options (not search_events) when the user mentions a GHS amount or budget.
- You can call multiple tools in one turn when needed (e.g. get_user_profile + search_events in parallel).

HOW YOU RESPOND:
- Be conversational, warm, and specific — like a friend who knows Accra inside out.
- Always reference the actual event data (title, venue, price, date). Never be vague.
- For budget queries, always mention the cost breakdown (ticket + estimated extras).
- Keep responses to 3–5 sentences max for the intro. Let the event cards do the heavy lifting.
- Prices are in GHS. Format as "GHS 150" not "150 GHS".
- When you recommend events, your response JSON must include them in the picks array.

RESPONSE FORMAT (always valid JSON):
{
  "message": "Your conversational response here",
  "picks": [
    {
      "event_id": "uuid from tool result",
      "title": "Event title",
      "reason": "One sentence: why this fits this specific user or request"
    }
  ],
  "followUps": ["Short question 1", "Short question 2", "Short question 3"]
}

Keep picks to 0–4 events. followUps should be 3 short natural questions a user might ask next.
Only include event_ids from what the tools actually returned — never fabricate IDs.`;

export type ExecutorResult = {
  message: string;
  picks: Array<{ event_id: string; title: string; reason: string; event?: Record<string, unknown> }>;
  followUps: string[];
  tool_names_used: string[];
  raw_tool_results?: Record<string, unknown>;
};

export async function runAICore(
  userMessage: string,
  history: GroqMessage[],
  clerkId: string,
): Promise<ExecutorResult> {
  const toolNamesUsed: string[] = [];
  const rawToolResults: Record<string, unknown> = {};

  // ── Turn 1: LLM decides which tools to call ─────────────────────────────
  const turn1Messages: GroqMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-10),
    { role: "user", content: userMessage },
  ];

  const turn1 = await groqChat({
    model:       AI_MODELS.SMART,
    messages:    turn1Messages,
    tools:       GOOUTSIDE_TOOLS,
    temperature: 0.4,
    max_tokens:  1200,
  });

  const turn1Choice = turn1.choices[0];
  const finishReason = turn1Choice?.finish_reason;

  // If no tool calls, the LLM answered directly (parse as JSON)
  if (finishReason !== "tool_calls" || !turn1Choice?.message?.tool_calls?.length) {
    return parseFinalResponse(turn1Choice?.message?.content ?? "", toolNamesUsed);
  }

  const toolCalls = turn1Choice.message.tool_calls;

  // ── Execute all tool calls in parallel ─────────────────────────────────
  const toolResults = await Promise.all(
    toolCalls.map(async (tc) => {
      const name = tc.function.name as ToolName;
      toolNamesUsed.push(name);
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      } catch {
        // bad JSON args — use empty
      }

      const start = Date.now();
      let result: unknown;
      try {
        result = await executeTool(name, args, clerkId);
      } catch (err) {
        result = { error: String(err) };
      }
      const duration = Date.now() - start;

      rawToolResults[name] = result;
      console.log(`[ai-core] tool:${name} ${duration}ms`);

      return {
        tool_call_id: tc.id,
        result,
      };
    }),
  );

  // ── Turn 2: Feed tool results back, get final answer ────────────────────
  // IMPORTANT: tools are NOT included in turn 2 — prevents infinite loop
  const turn2Messages: GroqMessage[] = [
    ...turn1Messages,
    {
      role: "assistant",
      content: null,
      tool_calls: toolCalls.map((tc) => ({
        id:       tc.id,
        type:     "function" as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
    },
    ...toolResults.map((tr) => ({
      role:         "tool" as const,
      content:      JSON.stringify(tr.result),
      tool_call_id: tr.tool_call_id,
    })),
  ];

  const turn2 = await groqChat({
    model:           AI_MODELS.SMART,
    messages:        turn2Messages,
    // No tools in turn 2
    temperature:     0.55,
    max_tokens:      900,
    response_format: { type: "json_object" },
  });

  const raw = turn2.choices[0]?.message?.content ?? "{}";
  return {
    ...parseFinalResponse(raw, toolNamesUsed),
    raw_tool_results: rawToolResults,
  };
}

// ── Parse the LLM's JSON response and resolve event objects ─────────────────
function parseFinalResponse(raw: string, toolNamesUsed: string[]): ExecutorResult {
  let parsed: {
    message?: string;
    picks?: Array<{ event_id?: string; title?: string; reason?: string }>;
    followUps?: string[];
  } = {};

  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    return {
      message:        raw.trim() || "I found some options that might work for you.",
      picks:          [],
      followUps:      ["What's trending tonight?", "Show me free events", "Events under GHS 100"],
      tool_names_used: toolNamesUsed,
    };
  }

  return {
    message:    parsed.message?.trim() || "Here's what I found for you.",
    picks:      (parsed.picks ?? [])
      .filter((p) => p.event_id)
      .slice(0, 4)
      .map((p) => ({
        event_id: p.event_id!,
        title:    p.title ?? "",
        reason:   p.reason ?? "",
      })),
    followUps:  (parsed.followUps ?? []).slice(0, 3),
    tool_names_used: toolNamesUsed,
  };
}
