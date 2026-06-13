import { groqChat, AI_MODELS, type GroqMessage } from "./groq-client";
import { GOOUTSIDE_TOOLS, executeTool, type ToolName } from "./tools";

const ACCRA_TIME = new Date().toLocaleString("en-GH", {
  weekday: "long", month: "long", day: "numeric",
  hour: "numeric", minute: "2-digit", hour12: true,
  timeZone: "Africa/Accra",
});

function buildSystemPrompt(validEventIds: string[] = []) {
  const idList = validEventIds.length
    ? `\nVALID EVENT IDs YOU MAY USE:\n${validEventIds.join("\n")}\n(Do not use any other IDs)`
    : "";

  return `You are GoOutside's AI — a sharp event guide for Ghana. Today is ${ACCRA_TIME}.

═══ NON-NEGOTIABLE RULES ═══

RULE 1 — ALWAYS CALL TOOLS FIRST. No exceptions.
Call at least one tool every turn. Never respond before calling tools.
Never ask for more info first. Never say "I'd love to help" — just call tools and answer.

RULE 2 — ALWAYS CALL get_user_profile IN PARALLEL with event searches.
This gives you the user's vibe, pulse score, city, and recent events so you can personalize.

RULE 3 — GO FAST. ACT IMMEDIATELY.
"what should I do tonight?" → get_user_profile + search_events (parallel)
"I have 200 GHS" → get_user_profile + get_budget_options (parallel)
"what's trending?" → get_user_profile + get_trending_events (parallel)
"good food / restaurants" → search_events with query="food" and category="food-drink"

RULE 4 — ONLY USE REAL DATA FROM TOOL RESULTS. NEVER INVENT EVENTS.
Reference ONLY event names, IDs, venues, prices that appear in your tool results.
If tools return 0 events, say so honestly — "No events matched that search right now."
If is_free was requested and tool returns only paid events, say "No free events found currently."
NEVER make up event names like "Rooftop Live" or "Live Band" if they aren't in the results.
NEVER fabricate slugs, IDs, or URLs.
${idList}

RULE 5 — followUps MUST BE 3-5 WORD ACTION CHIPS (not questions).
Good: "Free events only", "Earlier tonight", "Near East Legon", "Under GHS 100"
Bad: "What music do you like?", "Do you have a budget?"

═══ RESPONSE FORMAT (strict JSON) ═══
{
  "message": "2–4 sentence answer using REAL names/prices/times from tool results",
  "picks": [
    {
      "event_id": "EXACT uuid from tool result — NO fabrication",
      "title": "Exact event title from tool result",
      "reason": "One sentence why this fits this user"
    }
  ],
  "followUps": ["Chip 1", "Chip 2", "Chip 3"]
}

Max 4 picks. event_id must be a real uuid returned by a tool. Prices in "GHS 150" format.`;
}

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
    { role: "system", content: buildSystemPrompt() },
    ...history.slice(-10),
    { role: "user", content: userMessage },
  ];

  let turn1: Awaited<ReturnType<typeof groqChat>>;
  try {
    turn1 = await groqChat({
      model:       AI_MODELS.SMART,
      messages:    turn1Messages,
      tools:       GOOUTSIDE_TOOLS,
      temperature: 0.4,
      max_tokens:  1200,
    });
  } catch (err) {
    if (isGroqToolUseFailure(err)) {
      return runFallbackToolPlan(userMessage, history, clerkId);
    }
    throw err;
  }

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

  // Collect valid event IDs from tool results to prevent hallucination
  const validEventIds = collectEventIds(rawToolResults);

  // ── Turn 2: Feed tool results back, get final answer ────────────────────
  // IMPORTANT: tools are NOT included in turn 2 — prevents infinite loop
  const turn2Messages: GroqMessage[] = [
    { role: "system", content: buildSystemPrompt(validEventIds) },
    ...history.slice(-10),
    { role: "user", content: userMessage },
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
    temperature:     0.45,
    max_tokens:      900,
    response_format: { type: "json_object" },
  });

  const raw = turn2.choices[0]?.message?.content ?? "{}";
  return {
    ...parseFinalResponse(raw, toolNamesUsed, validEventIds),
    raw_tool_results: rawToolResults,
  };
}

function isGroqToolUseFailure(err: unknown) {
  if (!err || typeof err !== "object") return false;
  const record = err as Record<string, unknown>;
  const message = String(record.message ?? "").toLowerCase();
  return message.includes("tool_use_failed") || message.includes("failed to call a function");
}

async function runFallbackToolPlan(
  userMessage: string,
  history: GroqMessage[],
  clerkId: string,
): Promise<ExecutorResult> {
  const inferredCalls = inferToolCalls(userMessage, clerkId);
  const toolNamesUsed: string[] = [];
  const rawToolResults: Record<string, unknown> = {};

  await Promise.all(
    inferredCalls.map(async ({ name, args }) => {
      toolNamesUsed.push(name);
      try {
        rawToolResults[name] = await executeTool(name, args, clerkId);
      } catch (err) {
        rawToolResults[name] = { error: String(err) };
      }
    }),
  );

  const validEventIds = collectEventIds(rawToolResults);
  const context = JSON.stringify(rawToolResults);
  const finalMessages: GroqMessage[] = [
    { role: "system", content: buildSystemPrompt(validEventIds) },
    ...history.slice(-10),
    {
      role: "user",
      content: `${userMessage}\n\nTool results from GoOutside:\n${context}\n\nReturn the required JSON response using only these tool results.`,
    },
  ];

  try {
    const final = await groqChat({
      model:           AI_MODELS.SMART,
      messages:        finalMessages,
      temperature:     0.45,
      max_tokens:      900,
      response_format: { type: "json_object" },
    });
    const raw = final.choices[0]?.message?.content ?? "{}";
    return {
      ...parseFinalResponse(raw, toolNamesUsed, validEventIds),
      raw_tool_results: rawToolResults,
    };
  } catch {
    return {
      ...synthesizeFallbackResponse(rawToolResults, toolNamesUsed),
      raw_tool_results: rawToolResults,
    };
  }
}

function inferToolCalls(userMessage: string, clerkId: string): Array<{ name: ToolName; args: Record<string, unknown> }> {
  const norm = userMessage.toLowerCase();
  const calls: Array<{ name: ToolName; args: Record<string, unknown> }> = [];

  if (clerkId) {
    calls.push({ name: "get_user_profile", args: {} });
  }

  const budgetMatch = norm.match(/(?:ghs|₵|cedis?)\s*(\d+)|(\d+)\s*(?:ghs|₵|cedis?)/i);
  const date = inferDate(norm);
  const city = inferCity(norm);

  if (budgetMatch) {
    calls.push({
      name: "get_budget_options",
      args: {
        budget_ghs: Number(budgetMatch[1] ?? budgetMatch[2]),
        date,
        city,
      },
    });
    return calls;
  }

  if (/\b(trending|popular|hot|buzzing|viral)\b/.test(norm)) {
    calls.push({ name: "get_trending_events", args: { city, limit: 8 } });
    return calls;
  }

  if (/\b(friend|friends|people i follow|network)\b/.test(norm)) {
    calls.push({ name: "get_friends_activity", args: { upcoming_only: true } });
    return calls;
  }

  calls.push({
    name: "search_events",
    args: {
      query: userMessage,
      date,
      city,
      is_free: /\bfree\b/.test(norm) ? true : undefined,
      limit: 8,
    },
  });

  return calls;
}

function inferDate(norm: string) {
  if (/\b(tonight|today)\b/.test(norm)) return "tonight";
  if (/\btomorrow\b/.test(norm)) return "tomorrow";
  if (/\bweekend\b/.test(norm)) return "weekend";
  if (/\bthis week\b/.test(norm)) return "this week";
  return undefined;
}

function inferCity(norm: string) {
  if (norm.includes("kumasi")) return "Kumasi";
  if (norm.includes("takoradi")) return "Takoradi";
  return "Accra";
}

function synthesizeFallbackResponse(
  rawToolResults: Record<string, unknown>,
  toolNamesUsed: string[],
): ExecutorResult {
  const events = collectEvents(rawToolResults).slice(0, 4);
  return {
    message: events.length
      ? `I found ${events.length} options from live GoOutside data. Here are the strongest matches.`
      : "I checked live GoOutside data, but I couldn't find a strong match yet. Try a different vibe, day, or budget.",
    picks: events.map((event) => ({
      event_id: String(event.id),
      title: String(event.title ?? "Event"),
      reason: "This matches the timing and vibe from your request.",
    })),
    followUps: ["Show me free events", "What's trending this weekend?", "Find something near Osu"],
    tool_names_used: toolNamesUsed,
  };
}

function collectEvents(rawToolResults: Record<string, unknown>) {
  const events: Record<string, unknown>[] = [];
  for (const result of Object.values(rawToolResults)) {
    if (!result || typeof result !== "object") continue;
    const maybeEvents = (result as { events?: unknown[] }).events;
    if (!Array.isArray(maybeEvents)) continue;
    for (const event of maybeEvents) {
      if (event && typeof event === "object" && "id" in event) {
        events.push(event as Record<string, unknown>);
      }
    }
  }
  return events;
}

// ── Collect all event IDs from tool results ───────────────────────────────────
function collectEventIds(rawToolResults: Record<string, unknown>): string[] {
  const ids: string[] = [];
  for (const result of Object.values(rawToolResults)) {
    if (!result || typeof result !== "object") continue;
    const maybeEvents = (result as { events?: unknown[] }).events;
    if (!Array.isArray(maybeEvents)) continue;
    for (const event of maybeEvents) {
      const id = (event as Record<string, unknown>)?.id;
      if (typeof id === "string") ids.push(id);
    }
  }
  return ids;
}

// ── Parse the LLM's JSON response and resolve event objects ─────────────────
function parseFinalResponse(
  raw: string,
  toolNamesUsed: string[],
  validEventIds: string[] = [],
): ExecutorResult {
  let parsed: {
    message?: string;
    picks?: Array<{ event_id?: string; title?: string; reason?: string }>;
    followUps?: string[];
  } = {};

  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    return {
      message:         raw.trim() || "I couldn't parse a response. Try again.",
      picks:           [],
      followUps:       ["What's trending tonight?", "Free events only", "Under GHS 100"],
      tool_names_used: toolNamesUsed,
    };
  }

  // Only allow picks whose event_id was actually returned by a tool
  const allowedIds = new Set(validEventIds);
  const picks = (parsed.picks ?? [])
    .filter((p) => p.event_id && (allowedIds.size === 0 || allowedIds.has(p.event_id)))
    .slice(0, 4)
    .map((p) => ({
      event_id: p.event_id!,
      title:    p.title ?? "",
      reason:   p.reason ?? "",
    }));

  return {
    message:         parsed.message?.trim() || "Here's what I found.",
    picks,
    followUps:       (parsed.followUps ?? []).slice(0, 3),
    tool_names_used: toolNamesUsed,
  };
}
