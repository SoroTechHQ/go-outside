import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { GOOUTSIDE_TOOLS, executeTool, type ToolName } from "../../../../lib/ai-core/tools";
import { groqChat, groqChatStream, AI_MODELS, type GroqMessage } from "../../../../lib/ai-core/groq-client";
import {
  getOrCreateChat,
  saveUserMessage,
  saveAssistantMessage,
  getChatWithMessages,
  toGroqHistory,
} from "../../../../lib/ai-core/chat-history";

// ── SSE helper ────────────────────────────────────────────────────────────────

function sseEvent(type: string, data: unknown): string {
  return `data: ${JSON.stringify({ type, ...((typeof data === "object" && data !== null) ? data : { value: data }) })}\n\n`;
}

// ── Message field extractor for streaming JSON ────────────────────────────────

class MessageExtractor {
  private buf = "";
  private extracted = 0;
  private state: "searching" | "in_message" | "done" = "searching";
  private inEscape = false;

  consume(chunk: string): string {
    this.buf += chunk;
    if (this.state === "done") return "";

    if (this.state === "searching") {
      for (const opener of ['"message":"', '"message": "']) {
        const idx = this.buf.indexOf(opener);
        if (idx !== -1) {
          this.state = "in_message";
          this.extracted = idx + opener.length;
          break;
        }
      }
      if (this.state === "searching") return "";
    }

    const newPart = this.buf.slice(this.extracted);
    let result = "";
    let consumed = 0;

    for (let i = 0; i < newPart.length; i++) {
      if (this.inEscape) { this.inEscape = false; consumed++; result += newPart[i]; continue; }
      if (newPart[i] === "\\") { this.inEscape = true; consumed++; continue; }
      if (newPart[i] === '"') { this.state = "done"; this.extracted += consumed; return result; }
      consumed++;
      result += newPart[i];
    }

    this.extracted += consumed;
    return result;
  }

  isDone() { return this.state === "done"; }
}

// ── Collect valid event IDs from tool results ─────────────────────────────────

function collectEventIds(rawToolResults: Record<string, unknown>): string[] {
  const ids: string[] = [];
  for (const result of Object.values(rawToolResults)) {
    if (!result || typeof result !== "object") continue;
    const evs = (result as { events?: unknown[] }).events;
    if (!Array.isArray(evs)) continue;
    for (const ev of evs) {
      const id = (ev as Record<string, unknown>)?.id;
      if (typeof id === "string") ids.push(id);
    }
  }
  return ids;
}

function buildSystemPrompt(validEventIds: string[] = []) {
  const now = new Date().toLocaleString("en-GH", {
    weekday: "long", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "Africa/Accra",
  });
  const idList = validEventIds.length
    ? `\nVALID EVENT IDs (only use these):\n${validEventIds.join("\n")}`
    : "";

  return `You are GoOutside's AI — a sharp event guide for Ghana. Today is ${now}.

NON-NEGOTIABLE RULES:

1. ALWAYS CALL TOOLS FIRST. Never respond before calling tools. Never ask for more info first.
2. ALWAYS CALL get_user_profile IN PARALLEL with event searches.
3. ACT IMMEDIATELY — "food near me" → search_events(query="food", category="food-drink")
4. NEVER INVENT EVENTS. Only use data from tool results. If tools return 0 events, say so honestly.
   NEVER make up event names, venues, IDs, or slugs.${idList}
5. followUps = 3-5 word action chips (not questions). "Free events only", "Near Osu", "Under GHS 100"

TOOL STRATEGY:
- General query → get_user_profile + search_events (parallel)
- Budget query → get_user_profile + get_budget_options (parallel)
- Trending → get_user_profile + get_trending_events (parallel)
- Friends → get_friends_activity + get_user_profile

RESPONSE FORMAT (strict JSON):
{"message":"2-4 sentences with REAL event names/prices from tools","picks":[{"event_id":"exact uuid from tools","title":"exact title","reason":"why this fits user"}],"followUps":["Chip 1","Chip 2","Chip 3"]}

Max 4 picks. Prices: "GHS 150" format.`;
}

function parseFinalResponse(
  raw: string,
  toolNamesUsed: string[],
  validEventIds: string[],
): { message: string; picks: Array<{ event_id: string; title: string; reason: string }>; followUps: string[]; tool_names_used: string[] } {
  let parsed: {
    message?: string;
    picks?: Array<{ event_id?: string; title?: string; reason?: string }>;
    followUps?: string[];
  } = {};

  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    return {
      message: raw.trim() || "I couldn't find matching events right now.",
      picks: [],
      followUps: ["What's trending?", "Free events only", "Under GHS 100"],
      tool_names_used: toolNamesUsed,
    };
  }

  const allowed = new Set(validEventIds);
  const picks = (parsed.picks ?? [])
    .filter((p) => p.event_id && (allowed.size === 0 || allowed.has(p.event_id)))
    .slice(0, 4)
    .map((p) => ({ event_id: p.event_id!, title: p.title ?? "", reason: p.reason ?? "" }));

  return {
    message: parsed.message?.trim() || "Here's what I found.",
    picks,
    followUps: (parsed.followUps ?? []).slice(0, 3),
    tool_names_used: toolNamesUsed,
  };
}

// ── Enrich picks with full event data ────────────────────────────────────────

async function enrichPicks(
  picks: Array<{ event_id: string; title: string; reason: string }>,
  rawToolResults: Record<string, unknown>,
) {
  if (!picks.length) return [];

  const eventMap = new Map<string, Record<string, unknown>>();
  for (const toolResult of Object.values(rawToolResults)) {
    const result = toolResult as { events?: unknown[] } | null;
    if (!result?.events) continue;
    for (const ev of result.events) {
      const e = ev as Record<string, unknown>;
      if (e.id) eventMap.set(e.id as string, e);
    }
  }

  const missingIds = picks.map((p) => p.event_id).filter((id) => !eventMap.has(id));
  if (missingIds.length > 0) {
    const { data } = await supabaseAdmin
      .from("events")
      .select("id, title, slug, short_description, banner_url, start_datetime, categories(name,slug), venues(name,city), ticket_types(price,price_type,is_active)")
      .in("id", missingIds);
    for (const ev of data ?? []) {
      const e = ev as Record<string, unknown>;
      eventMap.set(e.id as string, e);
    }
  }

  return picks.map((p) => ({ ...p, event: eventMap.get(p.event_id) ?? null }));
}

// ── Main handler ─────────────────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 2000;

export async function POST(req: NextRequest) {
  // ── Auth guard — must be signed in ─────────────────────────────────────────
  const clerk = await currentUser();
  if (!clerk) return new Response("Unauthorized", { status: 401 });
  const clerkId = clerk.id;

  let body: { message?: string; chat_id?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // ── Input validation ────────────────────────────────────────────────────────
  const rawMessage = (body.message ?? "").trim();
  if (!rawMessage) return new Response("message required", { status: 400 });
  if (rawMessage.length > MAX_MESSAGE_LENGTH) {
    return new Response(`Message too long (max ${MAX_MESSAGE_LENGTH} chars)`, { status: 413 });
  }
  const message = rawMessage;

  // ── chat_id must be UUID format if supplied ─────────────────────────────────
  const rawChatId = body.chat_id ?? "";
  if (rawChatId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawChatId)) {
    return new Response("Invalid chat_id", { status: 400 });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();
  const userId = user?.id ?? "";

  // ── Rate limit: 30 messages / 60 seconds ───────────────────────────────────
  if (userId) {
    const { data: withinLimit } = await supabaseAdmin.rpc("ai_check_rate_limit", { p_clerk_id: clerkId });
    if (withinLimit === false) {
      return new Response("Too many requests. Try again in a moment.", { status: 429 });
    }
  }

  let history: GroqMessage[] = [];
  let chatId = rawChatId;

  // 45-second hard timeout — prevent runaway SSE connections
  const timeout = setTimeout(() => { /* stream cancel handled by controller.close() */ }, 45_000);

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const emit = (type: string, data: unknown) => {
        controller.enqueue(enc.encode(sseEvent(type, data)));
      };

      try {
        // ── Resolve/create chat ─────────────────────────────────────────────
        if (clerkId && userId) {
          const chat = await getOrCreateChat(clerkId, userId, chatId || undefined, message);
          if (chat) {
            chatId = chat.id;
            if (body.chat_id) {
              const { messages } = await getChatWithMessages(chatId, clerkId);
              history = toGroqHistory(messages);
            }
            await saveUserMessage(chatId, message);
          }
        }

        emit("chat_id", { chat_id: chatId || null });

        // ── Turn 1: tool selection ──────────────────────────────────────────
        const turn1Messages: GroqMessage[] = [
          { role: "system", content: buildSystemPrompt() },
          ...history.slice(-10),
          { role: "user", content: message },
        ];

        let turn1Res: Awaited<ReturnType<typeof groqChat>>;
        try {
          turn1Res = await groqChat({
            model:       AI_MODELS.SMART,
            messages:    turn1Messages,
            tools:       GOOUTSIDE_TOOLS,
            temperature: 0.35,
            max_tokens:  800,
          });
        } catch {
          emit("error", { message: "AI couldn't connect. Try again." });
          controller.close();
          return;
        }

        const turn1Choice = turn1Res.choices[0];
        const toolCalls = turn1Choice?.message?.tool_calls ?? [];

        if (!toolCalls.length) {
          // LLM answered without tools — emit as plain text stream
          const txt = turn1Choice?.message?.content ?? "";
          emit("tools", { names: [] });
          for (const char of txt) emit("token", { text: char });
          emit("done", { picks: [], followUps: ["What's trending?", "Free events only", "Under GHS 100"], chat_id: chatId || null });
          controller.close();
          return;
        }

        // ── Execute tools in parallel ───────────────────────────────────────
        const toolNamesUsed: string[] = [];
        const rawToolResults: Record<string, unknown> = {};

        await Promise.all(
          toolCalls.map(async (tc) => {
            const name = tc.function.name as ToolName;
            toolNamesUsed.push(name);
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(tc.function.arguments) as Record<string, unknown>; } catch { /* empty */ }
            try {
              rawToolResults[name] = await executeTool(name, args, clerkId);
            } catch (err) {
              rawToolResults[name] = { error: String(err) };
            }
          }),
        );

        emit("tools", { names: toolNamesUsed });

        // ── Turn 2: streaming response ──────────────────────────────────────
        const validEventIds = collectEventIds(rawToolResults);

        const turn2Messages: GroqMessage[] = [
          { role: "system", content: buildSystemPrompt(validEventIds) },
          ...history.slice(-10),
          { role: "user", content: message },
          {
            role: "assistant",
            content: null,
            tool_calls: toolCalls.map((tc) => ({
              id: tc.id, type: "function" as const,
              function: { name: tc.function.name, arguments: tc.function.arguments },
            })),
          },
          ...toolCalls.map((tc) => ({
            role: "tool" as const,
            content: JSON.stringify(rawToolResults[tc.function.name] ?? {}),
            tool_call_id: tc.id,
          })),
        ];

        const turn2Stream = await groqChatStream({
          model:       AI_MODELS.SMART,
          messages:    turn2Messages,
          temperature: 0.45,
          max_tokens:  900,
        });

        const extractor = new MessageExtractor();
        let accumulated = "";

        for await (const chunk of turn2Stream) {
          const token = chunk.choices[0]?.delta?.content ?? "";
          if (!token) continue;
          accumulated += token;
          const visible = extractor.consume(token);
          if (visible) emit("token", { text: visible });
        }

        // Parse the full accumulated JSON for picks and followUps
        const parsed = parseFinalResponse(accumulated, toolNamesUsed, validEventIds);
        const enriched = await enrichPicks(parsed.picks, rawToolResults);

        // Persist to DB
        if (clerkId && userId && chatId) {
          await saveAssistantMessage(chatId, parsed.message, enriched, parsed.followUps, toolNamesUsed);
        }

        emit("done", {
          picks:    enriched,
          followUps: parsed.followUps,
          chat_id:  chatId || null,
        });
      } catch (err) {
        console.error("[api/ai/ask] stream_error", err);
        emit("error", { message: "Something went wrong. Try again." });
      } finally {
        clearTimeout(timeout);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection:      "keep-alive",
    },
  });
}
