import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { getSupabaseUserIdByClerkId } from "../../../lib/db/users";
import { jsonNoStore } from "../../../lib/api-security";

// Valid interaction types we accept from the client
const ALLOWED_EDGE_TYPES = new Set([
  "card_view",
  "card_click",
  "peek_open",
  "card_long_dwell",
  "share",
]);

const EDGE_WEIGHTS: Record<string, number> = {
  card_view:       0.3,
  card_click:      0.5,
  peek_open:       0.8,
  card_long_dwell: 0.6,
  share:           2.0,
};

type InteractionPayload = {
  eventId: string;
  edgeType: string;
  dwellMs?: number;
  sessionId?: string;
};

// POST /api/interactions — fire-and-forget interaction tracking
// Returns 200 immediately; DB write is best-effort
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return jsonNoStore({ ok: true }); // silently ignore unauthenticated

  let payload: InteractionPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonNoStore({ ok: true });
  }

  const { eventId, edgeType, dwellMs, sessionId } = payload;
  if (!eventId || !edgeType || !ALLOWED_EDGE_TYPES.has(edgeType)) {
    return jsonNoStore({ ok: true });
  }

  // Resolve supabase user ID asynchronously — don't block response
  void (async () => {
    try {
      const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
      if (!supabaseUserId) return;

      await supabaseAdmin.from("graph_edges").upsert(
        {
          from_id:   supabaseUserId,
          from_type: "user",
          to_id:     eventId,
          to_type:   "event",
          edge_type: edgeType,
          weight:    EDGE_WEIGHTS[edgeType] ?? 0.3,
          is_active: true,
          dwell_ms:  dwellMs ?? null,
          session_id: sessionId ?? null,
        },
        { onConflict: "from_id,to_id,edge_type", ignoreDuplicates: false },
      );
    } catch {
      // Intentionally silent — interaction tracking is best-effort
    }
  })();

  return jsonNoStore({ ok: true });
}
