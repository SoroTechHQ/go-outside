import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { runAICore } from "../../../../lib/ai-core/executor";
import {
  getOrCreateChat,
  saveUserMessage,
  saveAssistantMessage,
  getChatWithMessages,
  toGroqHistory,
} from "../../../../lib/ai-core/chat-history";

export async function POST(req: NextRequest) {
  let body: { message?: string; chat_id?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  // Auth — AI works for anon users too, just without personalization
  const clerk = await currentUser();
  const clerkId = clerk?.id ?? "";

  let userId = "";
  if (clerkId) {
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", clerkId)
      .maybeSingle();
    userId = user?.id ?? "";
  }

  // Load or create chat session
  let history: import("../../../../lib/ai-core/groq-client").GroqMessage[] = [];
  let chatId = body.chat_id ?? "";

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

  // Run the AI Core
  let result: Awaited<ReturnType<typeof runAICore>>;
  try {
    result = await runAICore(message, history, clerkId);
  } catch (err) {
    console.error("[api/ai/ask] executor_failed", err);
    return NextResponse.json({
      chat_id:         chatId || null,
      message:         "I couldn't connect to the AI right now. Try again in a moment.",
      picks:           [],
      followUps:       ["What's trending tonight?", "Show me free events", "Events under GHS 100"],
      tool_names_used: [],
    });
  }

  // Enrich picks with full event objects from tool results
  const enrichedPicks = await enrichPicks(result.picks, result.raw_tool_results);

  // Persist assistant message
  if (clerkId && userId && chatId) {
    await saveAssistantMessage(
      chatId,
      result.message,
      enrichedPicks,
      result.followUps,
      result.tool_names_used,
    );
  }

  return NextResponse.json({
    chat_id:         chatId || null,
    message:         result.message,
    picks:           enrichedPicks,
    followUps:       result.followUps,
    tool_names_used: result.tool_names_used,
  });
}

// ── Enrich picks with full event data from tool results ───────────────────────
async function enrichPicks(
  picks: Array<{ event_id: string; title: string; reason: string }>,
  rawToolResults?: Record<string, unknown>,
): Promise<Array<{ event_id: string; title: string; reason: string; event: Record<string, unknown> | null }>> {
  if (!picks.length) return [];

  // Build a map of event_id → event from all tool results
  const eventMap = new Map<string, Record<string, unknown>>();

  if (rawToolResults) {
    for (const toolResult of Object.values(rawToolResults)) {
      const result = toolResult as { events?: unknown[] } | null;
      if (!result?.events) continue;
      for (const ev of result.events) {
        const e = ev as Record<string, unknown>;
        if (e.id) eventMap.set(e.id as string, e);
      }
    }
  }

  // For any picks not in tool results, fetch from DB
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

  return picks.map((p) => ({
    ...p,
    event: eventMap.get(p.event_id) ?? null,
  }));
}
