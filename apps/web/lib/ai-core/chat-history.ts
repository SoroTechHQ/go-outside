import { supabaseAdmin } from "../supabase";
import type { GroqMessage } from "./groq-client";

export type AiChat = {
  id: string;
  clerk_id: string;
  title: string | null;
  model: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_assistant_message?: string | null;
};

export type AiMessage = {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "tool";
  content: string | null;
  picks: unknown[] | null;
  follow_ups: string[] | null;
  tool_names_used: string[] | null;
  created_at: string;
};

// ── Create a new chat session ─────────────────────────────────────────────────
export async function createChat(clerkId: string, userId: string, firstMessage: string): Promise<AiChat | null> {
  const title = firstMessage.slice(0, 80).trim();
  const { data, error } = await supabaseAdmin
    .from("ai_chats")
    .insert({ clerk_id: clerkId, user_id: userId, title })
    .select()
    .single();

  if (error) { console.error("[chat-history] createChat", error); return null; }
  return data as AiChat;
}

// ── Get or create a chat ──────────────────────────────────────────────────────
export async function getOrCreateChat(clerkId: string, userId: string, chatId?: string, firstMessage?: string): Promise<AiChat | null> {
  if (chatId) {
    const { data } = await supabaseAdmin
      .from("ai_chats")
      .select("*")
      .eq("id", chatId)
      .eq("clerk_id", clerkId)
      .maybeSingle();
    if (data) return data as AiChat;
  }
  return createChat(clerkId, userId, firstMessage ?? "New chat");
}

// ── Save a user message ───────────────────────────────────────────────────────
export async function saveUserMessage(chatId: string, content: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("ai_messages")
    .insert({ chat_id: chatId, role: "user", content })
    .select("id")
    .single();

  if (error) { console.error("[chat-history] saveUserMessage", error); return null; }
  return data.id as string;
}

// ── Save an assistant message ─────────────────────────────────────────────────
export async function saveAssistantMessage(
  chatId: string,
  content: string,
  picks: unknown[],
  followUps: string[],
  toolNamesUsed: string[],
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("ai_messages")
    .insert({
      chat_id:         chatId,
      role:            "assistant",
      content,
      picks:           picks.length > 0 ? picks : null,
      follow_ups:      followUps.length > 0 ? followUps : null,
      tool_names_used: toolNamesUsed.length > 0 ? toolNamesUsed : null,
    })
    .select("id")
    .single();

  if (error) { console.error("[chat-history] saveAssistantMessage", error); return null; }
  return data.id as string;
}

// ── Log tool calls for analytics ──────────────────────────────────────────────
export async function logToolCalls(
  messageId: string,
  chatId: string,
  toolCalls: Array<{
    function_name: string;
    function_arguments: unknown;
    function_result: unknown;
    duration_ms?: number;
    error?: string;
  }>,
) {
  if (toolCalls.length === 0) return;
  await supabaseAdmin.from("ai_tool_calls").insert(
    toolCalls.map((tc) => ({
      message_id:          messageId,
      chat_id:             chatId,
      function_name:       tc.function_name,
      function_arguments:  tc.function_arguments,
      function_result:     tc.function_result,
      duration_ms:         tc.duration_ms,
      error:               tc.error,
    })),
  );
}

// ── List user's chats ─────────────────────────────────────────────────────────
export async function listChats(clerkId: string, limit = 20): Promise<AiChat[]> {
  // Try the view first (has last_assistant_message preview)
  const { data, error } = await supabaseAdmin
    .from("ai_chats_with_preview")
    .select("*")
    .eq("clerk_id", clerkId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (!error && data) return data as AiChat[];

  // View missing or permission issue — fall back to base table
  if (error) console.error("[listChats] view query failed, falling back:", error.message);

  const { data: fallback, error: fallbackError } = await supabaseAdmin
    .from("ai_chats")
    .select("id, clerk_id, user_id, title, model, created_at, updated_at")
    .eq("clerk_id", clerkId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (fallbackError) console.error("[listChats] fallback query failed:", fallbackError.message);
  return (fallback ?? []) as AiChat[];
}

// ── Get a single chat with all messages ───────────────────────────────────────
export async function getChatWithMessages(chatId: string, clerkId: string): Promise<{
  chat: AiChat | null;
  messages: AiMessage[];
}> {
  const [chatResult, messagesResult] = await Promise.all([
    supabaseAdmin
      .from("ai_chats")
      .select("*")
      .eq("id", chatId)
      .eq("clerk_id", clerkId)
      .maybeSingle(),
    supabaseAdmin
      .from("ai_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    chat:     chatResult.data as AiChat | null,
    messages: (messagesResult.data ?? []) as AiMessage[],
  };
}

// ── Build Groq message history from DB messages ───────────────────────────────
export function toGroqHistory(messages: AiMessage[]): GroqMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role:    m.role as "user" | "assistant",
      content: m.content ?? "",
    }));
}

// ── Delete a chat ─────────────────────────────────────────────────────────────
export async function deleteChat(chatId: string, clerkId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("ai_chats")
    .delete()
    .eq("id", chatId)
    .eq("clerk_id", clerkId);

  return !error;
}
