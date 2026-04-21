import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { enforceRateLimit, enforceSameOrigin, getActorKey, jsonError, jsonNoStore } from "../../../../lib/api-security";
import { getSupabaseUserIdByClerkId } from "../../../../lib/db/users";

// POST /api/events/save  { eventId }  → saves the event
// DELETE /api/events/save { eventId } → unsaves the event
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return jsonError(401, "Unauthenticated");

  const csrfResponse = enforceSameOrigin(req);
  if (csrfResponse) return csrfResponse;

  const rateLimitResponse = enforceRateLimit({
    bucket: "events-save",
    key: getActorKey(req, userId),
    limit: 60,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const { eventId } = await req.json();
  if (!eventId) return jsonError(400, "eventId required");

  const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
  if (!supabaseUserId) return jsonError(404, "User not found");

  const [saveResult] = await Promise.all([
    supabaseAdmin
      .from("saved_events")
      .upsert({ user_id: supabaseUserId, event_id: eventId }, { onConflict: "user_id,event_id" }),
    // Write graph edge so the recommendation algo sees this as a strong interest signal
    supabaseAdmin.from("graph_edges").upsert(
      { from_id: supabaseUserId, from_type: "user", to_id: eventId, to_type: "event", edge_type: "save", weight: 5.0, is_active: true },
      { onConflict: "from_id,to_id,edge_type", ignoreDuplicates: false },
    ),
  ]);

  if (saveResult.error) {
    console.error("[POST /api/events/save]", saveResult.error);
    return jsonError(500, "Could not save event");
  }

  return jsonNoStore({ saved: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return jsonError(401, "Unauthenticated");

  const csrfResponse = enforceSameOrigin(req);
  if (csrfResponse) return csrfResponse;

  const rateLimitResponse = enforceRateLimit({
    bucket: "events-unsave",
    key: getActorKey(req, userId),
    limit: 60,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const { eventId } = await req.json();
  if (!eventId) return jsonError(400, "eventId required");

  const supabaseUserId = await getSupabaseUserIdByClerkId(userId);
  if (!supabaseUserId) return jsonError(404, "User not found");

  const [deleteResult] = await Promise.all([
    supabaseAdmin.from("saved_events").delete()
      .eq("user_id", supabaseUserId).eq("event_id", eventId),
    supabaseAdmin.from("graph_edges").delete()
      .eq("from_id", supabaseUserId).eq("to_id", eventId).eq("edge_type", "save"),
  ]);

  if (deleteResult.error) {
    console.error("[DELETE /api/events/save]", deleteResult.error);
    return jsonError(500, "Could not update saved state");
  }

  return jsonNoStore({ saved: false });
}
