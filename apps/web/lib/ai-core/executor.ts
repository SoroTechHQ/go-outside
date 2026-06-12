import { groqChat, AI_MODELS, type GroqMessage } from "./groq-client";
import { GOOUTSIDE_TOOLS, executeTool, type ToolName } from "./tools";

const ACCRA_TIME = new Date().toLocaleString("en-GH", {
  weekday: "long", month: "long", day: "numeric",
  hour: "numeric", minute: "2-digit", hour12: true,
  timeZone: "Africa/Accra",
});

const SYSTEM_PROMPT = `You are GoOutside's AI — a sharp, decisive event guide for Ghana. Today is ${ACCRA_TIME}.

═══ NON-NEGOTIABLE RULES ═══

RULE 1 — ALWAYS CALL TOOLS FIRST. No exceptions.
On every single turn, call at least one tool. Never respond without calling tools.
Never ask the user for more information before calling tools.
Never say "I'd love to help" or "Could you tell me more" — just call the tools and answer.

RULE 2 — ALWAYS CALL get_user_profile IN PARALLEL.
Every time you search for events, also call get_user_profile in the same tool turn.
This gives you the user's vibe, pulse score, location, and past events so you can personalize.

RULE 3 — GO FAST. DO NOT ASK. DO NOT STALL.
If the user asks "what should I do tonight?" → immediately call get_user_profile + search_events.
If the user says "I have 200 GHS" → immediately call get_user_profile + get_budget_options.
If the user asks "what's trending?" → immediately call get_user_profile + get_trending_events.

RULE 4 — GIVE DIRECT ANSWERS WITH SPECIFICS.
Reference real event names, venues, prices, dates from your tool results.
Lead with the best match. Don't bury the lede.
Bad: "There are many events tonight across Accra."
Good: "Three events fit you tonight — Rooftop Jazz at Kiza (GHS 80, starts 9pm) is your strongest match based on your music vibe."

RULE 5 — followUps MUST BE ACTION CHIPS, NOT QUESTIONS.
followUps are short phrases (3–5 words) users can tap to refine results.
Good examples: "Free events only", "Earlier tonight", "Near East Legon", "Under GHS 100", "Afrobeats vibes", "Show me Kumasi"
Bad examples: "What type of music do you like?", "Are you looking for free events?", "Do you have a budget in mind?"
Generate 3 followUps that help the user explore further based on what you just returned.

═══ TOOL STRATEGY ═══
- General event query → get_user_profile + search_events (parallel)
- Budget mentioned → get_user_profile + get_budget_options (parallel)
- "Trending/popular/hot" → get_user_profile + get_trending_events (parallel)
- Friends/social → get_friends_activity (+ get_user_profile)
- Specific event → get_event_details

═══ RESPONSE FORMAT (strict JSON) ═══
{
  "message": "2–4 sentence response using REAL event names and details from tools",
  "picks": [
    {
      "event_id": "exact uuid from tool result — never fabricated",
      "title": "Event title",
      "reason": "One sentence: why this matches THIS user's specific profile and request"
    }
  ],
  "followUps": ["Action chip 1", "Action chip 2", "Action chip 3"]
}

Max 4 picks. Only use event_ids from tool results. Never invent events.
Prices in GHS. Format: "GHS 150" not "150 GHS".`;

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

  const context = JSON.stringify(rawToolResults);
  const finalMessages: GroqMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
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
      temperature:     0.5,
      max_tokens:      900,
      response_format: { type: "json_object" },
    });
    const raw = final.choices[0]?.message?.content ?? "{}";
    return {
      ...parseFinalResponse(raw, toolNamesUsed),
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
