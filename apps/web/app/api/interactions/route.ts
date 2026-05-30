import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { getSupabaseUserIdByClerkId } from "../../../lib/db/users";
import { jsonNoStore } from "../../../lib/api-security";

const ALLOWED_EDGE_TYPES = new Set([
  // Discovery
  "card_view", "card_click", "peek_open", "card_long_dwell",
  // Hover
  "hover_exit",
  // Intent
  "ticket_intent", "price_reveal", "checkout_start",
  // Conversion
  "checkout_abandon",
  // Social
  "save", "share", "share_tap", "share_completed",
  // Deep engagement
  "image_scroll", "map_interact", "snippet_read", "organizer_tap",
]);

const EDGE_WEIGHTS: Record<string, number> = {
  card_view:         0.3,
  card_click:        0.5,
  peek_open:         0.8,
  card_long_dwell:   0.6,
  hover_exit:        0.4,
  ticket_intent:     1.2,
  price_reveal:      1.0,
  checkout_start:    1.5,
  checkout_abandon: -0.5,
  save:              1.5,
  share:             2.0,
  share_tap:         1.8,
  share_completed:   2.5,
  image_scroll:      0.7,
  map_interact:      0.9,
  snippet_read:      0.6,
  organizer_tap:     0.8,
};

type InteractionPayload = {
  eventId: string;
  edgeType: string;
  dwellMs?: number;
  sessionId?: string;
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return jsonNoStore({ ok: true });

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

  void (async () => {
    try {
      const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
      if (!supabaseUserId) return;

      await supabaseAdmin.from("graph_edges").upsert(
        {
          from_id:    supabaseUserId,
          from_type:  "user",
          to_id:      eventId,
          to_type:    "event",
          edge_type:  edgeType,
          weight:     EDGE_WEIGHTS[edgeType] ?? 0.3,
          is_active:  true,
          dwell_ms:   dwellMs ?? null,
          session_id: sessionId ?? null,
        },
        { onConflict: "from_id,to_id,edge_type", ignoreDuplicates: false },
      );
    } catch {
      // Intentionally silent
    }
  })();

  return jsonNoStore({ ok: true });
}
